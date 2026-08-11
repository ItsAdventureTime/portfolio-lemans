package api

import (
	"context"
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/policy"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/repository"
	"github.com/jackc/pgx/v5/pgtype"
)

type prItemReq struct {
	Description string  `json:"description"`
	Quantity    float64 `json:"quantity"`
	UnitCost    int64   `json:"unitCostCents"`
}

type createPRReq struct {
	Supplier string      `json:"supplier"`
	Notes    string      `json:"notes"`
	Items    []prItemReq `json:"items"`
}

func prNumber(ctx context.Context, q *repository.Queries) string {
	return fmt.Sprintf("PR-%d-%d", time.Now().Year(), time.Now().UnixNano())
}

func (d *deps) handleListPurchaseRequests(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	prs, err := d.queries.ListPurchaseRequests(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, prs)
}

func (d *deps) handleCreatePurchaseRequest(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.PRCreate); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req createPRReq
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	ctx := r.Context()
	prNo := prNumber(ctx, d.queries)
	tx, err := d.pool.Begin(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	defer tx.Rollback(ctx)
	queries := d.queries.WithTx(tx)
	pr, err := queries.CreatePurchaseRequest(ctx, repository.CreatePurchaseRequestParams{
		PrNo:            prNo,
		RequestedByRole: roleString(r),
		Supplier:        strPtr(req.Supplier),
		Notes:           strPtr(req.Notes),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	var total int64
	for _, it := range req.Items {
		total += int64(math.Round(it.Quantity * float64(it.UnitCost)))
		if _, err := queries.CreatePurchaseRequestItem(ctx, repository.CreatePurchaseRequestItemParams{
			PrID:          pr.ID,
			Description:   it.Description,
			Quantity:      it.Quantity,
			UnitCostCents: it.UnitCost,
			TotalCents:    int64(math.Round(it.Quantity * float64(it.UnitCost))),
		}); err != nil {
			respondError(w, http.StatusInternalServerError, err)
			return
		}
	}
	poNo := fmt.Sprintf("PO-%d-%d", time.Now().Year(), time.Now().UnixNano())
	if _, err := queries.CreatePurchaseOrder(ctx, repository.CreatePurchaseOrderParams{
		PoNo:       poNo,
		PrID:       &pr.ID,
		Supplier:   strPtr(req.Supplier),
		TotalCents: total,
	}); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	if err := tx.Commit(ctx); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusCreated, pr)
}

func (d *deps) handleCreatePRFromJO(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.PRCreate); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req createPRReq
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	ctx := r.Context()
	joID := idParam(r, "joId")
	prNo := prNumber(ctx, d.queries)
	tx, err := d.pool.Begin(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	defer tx.Rollback(ctx)
	queries := d.queries.WithTx(tx)
	pr, err := queries.CreatePurchaseRequest(ctx, repository.CreatePurchaseRequestParams{
		PrNo:            prNo,
		JoID:            &joID,
		RequestedByRole: roleString(r),
		Supplier:        strPtr(req.Supplier),
		Notes:           strPtr("Created from job order parts estimate"),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	var total int64
	for _, it := range req.Items {
		t := int64(math.Round(it.Quantity * float64(it.UnitCost)))
		total += t
		if _, err := queries.CreatePurchaseRequestItem(ctx, repository.CreatePurchaseRequestItemParams{
			PrID:          pr.ID,
			Description:   it.Description,
			Quantity:      it.Quantity,
			UnitCostCents: it.UnitCost,
			TotalCents:    t,
		}); err != nil {
			respondError(w, http.StatusInternalServerError, err)
			return
		}
	}
	poNo := fmt.Sprintf("PO-%d-%d", time.Now().Year(), time.Now().UnixNano())
	if _, err := queries.CreatePurchaseOrder(ctx, repository.CreatePurchaseOrderParams{
		PoNo:       poNo,
		PrID:       &pr.ID,
		Supplier:   strPtr(req.Supplier),
		TotalCents: total,
	}); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	if err := tx.Commit(ctx); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusCreated, pr)
}

func (d *deps) handleApprovePurchaseRequest(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.PRApprove); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	ctx := r.Context()
	id := idParam(r, "id")
	pr, err := d.queries.ApprovePurchaseRequest(ctx, repository.ApprovePurchaseRequestParams{
		ID:             id,
		ApprovedByRole: strPtr(roleString(r)),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, pr)
}

func (d *deps) handleListSupplierInvoices(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	sis, err := d.queries.ListSupplierInvoices(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, sis)
}

func (d *deps) handleCreateSupplierInvoice(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.SupplierInvoiceCreate); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req struct {
		PoID        *string         `json:"poId"`
		Supplier    string          `json:"supplier"`
		TotalAmount int64           `json:"totalAmountCents"`
		InvoiceDate string          `json:"invoiceDate"`
		DueDate     string          `json:"dueDate"`
		Notes       string          `json:"notes"`
		Allocations []allocationReq `json:"allocations"`
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	ctx := r.Context()
	var allocated int64
	for _, allocation := range req.Allocations {
		if allocation.JoID == "" || allocation.AmountCents <= 0 {
			respondError(w, http.StatusBadRequest, fmt.Errorf("each allocation requires a job order and positive amount"))
			return
		}
		allocated += allocation.AmountCents
	}
	if len(req.Allocations) > 0 && abs(allocated-req.TotalAmount) > 1 {
		respondError(w, http.StatusBadRequest, fmt.Errorf("allocations must equal invoice total"))
		return
	}
	siNo := fmt.Sprintf("SI-%d-%d", time.Now().Year(), time.Now().UnixNano())
	var invoiceDate, dueDate pgtype.Date
	if req.InvoiceDate != "" {
		t, err := time.Parse("2006-01-02", req.InvoiceDate)
		if err != nil {
			respondError(w, http.StatusBadRequest, fmt.Errorf("invalid invoice date: %w", err))
			return
		}
		invoiceDate = pgtype.Date{Time: t, Valid: true}
	}
	if req.DueDate != "" {
		t, err := time.Parse("2006-01-02", req.DueDate)
		if err != nil {
			respondError(w, http.StatusBadRequest, fmt.Errorf("invalid due date: %w", err))
			return
		}
		dueDate = pgtype.Date{Time: t, Valid: true}
	}
	var poID *string
	if req.PoID != nil && *req.PoID != "" {
		poID = req.PoID
	}
	params := repository.CreateSupplierInvoiceParams{
		SiNo:             siNo,
		Supplier:         strPtr(req.Supplier),
		TotalAmountCents: req.TotalAmount,
		Notes:            strPtr(req.Notes),
	}
	if poID != nil {
		params.PoID = poID
	}
	params.InvoiceDate = invoiceDate
	params.DueDate = dueDate
	tx, err := d.pool.Begin(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	defer tx.Rollback(ctx)
	queries := d.queries.WithTx(tx)
	si, err := queries.CreateSupplierInvoice(ctx, params)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	if len(req.Allocations) > 0 {
		touchedJobOrders := make(map[string]struct{})
		for _, allocation := range req.Allocations {
			if _, err := queries.CreateSupplierInvoiceAllocation(ctx, repository.CreateSupplierInvoiceAllocationParams{
				SiID:        si.ID,
				JoID:        allocation.JoID,
				AmountCents: allocation.AmountCents,
				Description: strPtr(allocation.Description),
			}); err != nil {
				respondError(w, http.StatusInternalServerError, err)
				return
			}
			touchedJobOrders[allocation.JoID] = struct{}{}
		}
		for joID := range touchedJobOrders {
			cost, err := queries.SumSupplierInvoiceAllocationsByJO(ctx, joID)
			if err != nil {
				respondError(w, http.StatusInternalServerError, err)
				return
			}
			if err := queries.UpdateJobOrderActualPartsCost(ctx, repository.UpdateJobOrderActualPartsCostParams{
				ID:                   joID,
				ActualPartsCostCents: cost,
			}); err != nil {
				respondError(w, http.StatusInternalServerError, err)
				return
			}
			if err := queries.UpdateJobOrderNetProfit(ctx, joID); err != nil {
				respondError(w, http.StatusInternalServerError, err)
				return
			}
		}
		si, err = queries.UpdateSupplierInvoiceStatus(ctx, repository.UpdateSupplierInvoiceStatusParams{
			ID:     si.ID,
			Status: repository.SiStatusALLOCATED,
		})
		if err != nil {
			respondError(w, http.StatusInternalServerError, err)
			return
		}
	}
	if err := tx.Commit(ctx); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusCreated, si)
}

type allocationReq struct {
	JoID        string `json:"joId"`
	AmountCents int64  `json:"amountCents"`
	Description string `json:"description"`
}

func (d *deps) handleAllocateSupplierInvoice(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.SupplierInvoiceAllocate); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req struct {
		Allocations []allocationReq `json:"allocations"`
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	ctx := r.Context()
	id := idParam(r, "id")
	tx, err := d.pool.Begin(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	defer tx.Rollback(ctx)
	queries := d.queries.WithTx(tx)
	si, err := queries.GetSupplierInvoice(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	var allocated int64
	touchedJobOrders := make(map[string]struct{})
	for _, a := range req.Allocations {
		if a.JoID == "" || a.AmountCents <= 0 {
			respondError(w, http.StatusBadRequest, fmt.Errorf("each allocation requires a job order and positive amount"))
			return
		}
		allocated += a.AmountCents
		touchedJobOrders[a.JoID] = struct{}{}
	}
	if abs(allocated-si.TotalAmountCents) > 1 {
		respondError(w, http.StatusBadRequest, fmt.Errorf("allocations must equal invoice total"))
		return
	}
	existing, err := queries.ListSupplierInvoiceAllocations(ctx, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	if err := queries.DeleteSupplierInvoiceAllocations(ctx, id); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	for _, a := range req.Allocations {
		_, err := queries.CreateSupplierInvoiceAllocation(ctx, repository.CreateSupplierInvoiceAllocationParams{
			SiID:        id,
			JoID:        a.JoID,
			AmountCents: a.AmountCents,
			Description: strPtr(a.Description),
		})
		if err != nil {
			respondError(w, http.StatusInternalServerError, err)
			return
		}
	}
	for _, a := range existing {
		touchedJobOrders[a.JoID] = struct{}{}
	}
	for joID := range touchedJobOrders {
		cost, err := queries.SumSupplierInvoiceAllocationsByJO(ctx, joID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err)
			return
		}
		if err := queries.UpdateJobOrderActualPartsCost(ctx, repository.UpdateJobOrderActualPartsCostParams{
			ID:                   joID,
			ActualPartsCostCents: cost,
		}); err != nil {
			respondError(w, http.StatusInternalServerError, err)
			return
		}
		if err := queries.UpdateJobOrderNetProfit(ctx, joID); err != nil {
			respondError(w, http.StatusInternalServerError, err)
			return
		}
	}
	si, err = queries.UpdateSupplierInvoiceStatus(ctx, repository.UpdateSupplierInvoiceStatusParams{
		ID:     id,
		Status: repository.SiStatusALLOCATED,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	if err := tx.Commit(ctx); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, si)
}

func (d *deps) handleApproveSupplierInvoice(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.SupplierInvoiceApprove); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	ctx := r.Context()
	id := idParam(r, "id")
	si, err := d.queries.GetSupplierInvoice(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	if si.Status != repository.SiStatusALLOCATED {
		respondError(w, http.StatusBadRequest, fmt.Errorf("invoice must be allocated before approval"))
		return
	}
	tx, err := d.pool.Begin(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	defer tx.Rollback(ctx)
	queries := d.queries.WithTx(tx)
	// Create pending disbursement for supplier invoice.
	dnNo := fmt.Sprintf("DISB-SI-%d-%d", time.Now().Year(), time.Now().UnixNano())
	if _, err := queries.CreateDisbursementFromSupplierInvoice(ctx, repository.CreateDisbursementFromSupplierInvoiceParams{
		DisbursementNo:    dnNo,
		SupplierInvoiceID: &si.ID,
		AmountCents:       si.TotalAmountCents,
	}); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	si, err = queries.UpdateSupplierInvoiceStatus(ctx, repository.UpdateSupplierInvoiceStatusParams{
		ID:     id,
		Status: repository.SiStatusAPPROVED,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	if err := tx.Commit(ctx); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, si)
}

func abs(a int64) int64 {
	if a < 0 {
		return -a
	}
	return a
}
