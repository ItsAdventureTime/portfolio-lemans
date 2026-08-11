package api

import (
	"fmt"
	"net/http"
	"time"

	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/mathx"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/policy"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/repository"
	"github.com/jackc/pgx/v5/pgtype"
)

func (d *deps) handleListInvoices(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	invoices, err := d.queries.ListServiceInvoices(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, invoices)
}

func (d *deps) handleGetInvoice(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := idParam(r, "id")
	inv, err := d.queries.GetServiceInvoice(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	payments, err := d.queries.ListPaymentsByInvoice(ctx, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, map[string]any{
		"invoice":  inv,
		"payments": payments,
	})
}

func (d *deps) handleCreateInvoiceFromJO(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.InvoiceCreate); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req struct {
		Notes string `json:"notes"`
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	ctx := r.Context()
	jobOrderRef := idParam(r, "joId")
	joID := jobOrderRef
	var joStatus repository.JoStatus
	var customerID string
	var actualLaborCostCents, actualPartsCostCents int64
	jo, err := d.queries.GetJobOrder(ctx, jobOrderRef)
	if err != nil {
		byNo, noErr := d.queries.GetJobOrderByNo(ctx, jobOrderRef)
		if noErr != nil {
			respondError(w, http.StatusNotFound, noErr)
			return
		}
		joID = byNo.ID
		joStatus = byNo.Status
		customerID = byNo.CustomerID
		actualLaborCostCents = byNo.ActualLaborCostCents
		actualPartsCostCents = byNo.ActualPartsCostCents
	} else {
		joStatus = jo.Status
		customerID = jo.CustomerID
		actualLaborCostCents = jo.ActualLaborCostCents
		actualPartsCostCents = jo.ActualPartsCostCents
	}
	if joStatus != repository.JoStatusCOMPLETED {
		respondError(w, http.StatusBadRequest, fmt.Errorf("job order must be completed"))
		return
	}
	tx, err := d.pool.Begin(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	defer tx.Rollback(ctx)
	queries := d.queries.WithTx(tx)
	items, err := queries.ListJobOrderItems(ctx, joID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	var subtotal int64
	for _, it := range items {
		subtotal += it.NetAmountCents
	}
	vat := mathx.VatFromSubtotal(subtotal)
	total := subtotal + vat
	invoiceNo := fmt.Sprintf("INV-%d-%d", time.Now().Year(), time.Now().UnixNano())
	inv, err := queries.CreateServiceInvoice(ctx, repository.CreateServiceInvoiceParams{
		InvoiceNo:      invoiceNo,
		JoID:           &joID,
		CustomerID:     customerID,
		SubtotalCents:  subtotal,
		VatAmountCents: vat,
		TotalCents:     total,
		Notes:          strPtr(req.Notes),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	if _, err := queries.UpdateJobOrderBilled(ctx, repository.UpdateJobOrderBilledParams{
		ID:                joID,
		BilledAmountCents: total,
		NetProfitCents:    total - actualLaborCostCents - actualPartsCostCents,
	}); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	if err := tx.Commit(ctx); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusCreated, inv)
}

func (d *deps) handleRecordInvoicePayment(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.InvoiceRecordPayment); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req struct {
		AmountCents   int64     `json:"amountCents"`
		PaymentMethod string    `json:"paymentMethod"`
		ReferenceNo   string    `json:"referenceNo"`
		PaidAt        time.Time `json:"paidAt"`
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	ctx := r.Context()
	id := idParam(r, "id")
	inv, err := d.queries.GetServiceInvoice(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	payments, err := d.queries.ListPaymentsByInvoice(ctx, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	var paidSoFar int64
	for _, p := range payments {
		paidSoFar += p.AmountCents
	}
	newPaid := paidSoFar + req.AmountCents
	if req.AmountCents <= 0 {
		respondError(w, http.StatusBadRequest, fmt.Errorf("payment amount must be positive"))
		return
	}
	if newPaid > inv.TotalCents {
		respondError(w, http.StatusBadRequest, fmt.Errorf("payment exceeds invoice total"))
		return
	}
	var status repository.ServiceInvoiceStatus
	switch {
	case newPaid >= inv.TotalCents:
		status = repository.ServiceInvoiceStatusPAID
	case newPaid > 0:
		status = repository.ServiceInvoiceStatusPARTIAL
	default:
		status = inv.Status
	}
	tx, err := d.pool.Begin(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	defer tx.Rollback(ctx)
	queries := d.queries.WithTx(tx)
	_, err = queries.CreatePayment(ctx, repository.CreatePaymentParams{
		ServiceInvoiceID: id,
		AmountCents:      req.AmountCents,
		PaymentMethod:    req.PaymentMethod,
		ReferenceNo:      strPtr(req.ReferenceNo),
		PaidAt:           pgtype.Timestamptz{Time: req.PaidAt, Valid: true},
		RecordedByRole:   strPtr(roleString(r)),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	updated, err := queries.UpdateServiceInvoicePaymentStatus(ctx, repository.UpdateServiceInvoicePaymentStatusParams{
		ID:              id,
		AmountPaidCents: newPaid,
		Status:          status,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	if err := tx.Commit(ctx); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, updated)
}
