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
	payments, _ := d.queries.ListPaymentsByInvoice(ctx, id)
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
	_ = decodeJSON(r, &req)
	ctx := r.Context()
	joID := idParam(r, "joId")
	jo, err := d.queries.GetJobOrder(ctx, joID)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	if jo.Status != repository.JoStatusCOMPLETED {
		respondError(w, http.StatusBadRequest, fmt.Errorf("job order must be completed"))
		return
	}
	items, err := d.queries.ListJobOrderItems(ctx, joID)
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
	invoiceNo := fmt.Sprintf("INV-%d-%s", time.Now().Year(), fmt.Sprintf("%03d", countPlaceholder(ctx, d.queries)))
	inv, err := d.queries.CreateServiceInvoice(ctx, repository.CreateServiceInvoiceParams{
		InvoiceNo:      invoiceNo,
		JoID:           &joID,
		CustomerID:     jo.CustomerID,
		SubtotalCents:  subtotal,
		VatAmountCents: vat,
		TotalCents:     total,
		Notes:          strPtr(req.Notes),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	_, _ = d.queries.UpdateJobOrderBilled(ctx, repository.UpdateJobOrderBilledParams{
		ID:                joID,
		BilledAmountCents: total,
		NetProfitCents:    total - jo.ActualLaborCostCents - jo.ActualPartsCostCents,
	})
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
	payments, _ := d.queries.ListPaymentsByInvoice(ctx, id)
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
	_, err = d.queries.CreatePayment(ctx, repository.CreatePaymentParams{
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
	updated, err := d.queries.UpdateServiceInvoicePaymentStatus(ctx, repository.UpdateServiceInvoicePaymentStatusParams{
		ID:              id,
		AmountPaidCents: newPaid,
		Status:          status,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, updated)
}
