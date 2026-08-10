package api

import (
	"context"
	"fmt"
	"math"
	"net/http"
	"strconv"
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
	n, _ := q.CountCustomers(ctx)
	return fmt.Sprintf("PR-%d-%s", time.Now().Year(), strconv.Itoa(1000+int(n)+1)[1:])
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
	pr, err := d.queries.CreatePurchaseRequest(ctx, repository.CreatePurchaseRequestParams{
		PrNo:           prNo,
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
		d.queries.CreatePurchaseRequestItem(ctx, repository.CreatePurchaseRequestItemParams{
			PrID:        pr.ID,
			Description: it.Description,
			Quantity:    it.Quantity,
			UnitCostCents: it.UnitCost,
			TotalCents:    int64(math.Round(it.Quantity * float64(it.UnitCost))),
		})
	}
	poNo := fmt.Sprintf("PO-%d-%s", time.Now().Year(), strconv.Itoa(1000+int(total/100)+1)[1:])
	_, _ = d.queries.CreatePurchaseOrder(ctx, repository.CreatePurchaseOrderParams{
		PoNo:     poNo,
		PrID:     &pr.ID,
		Supplier: strPtr(req.Supplier),
		TotalCents: total,
	})
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
	pr, err := d.queries.CreatePurchaseRequest(ctx, repository.CreatePurchaseRequestParams{
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
		d.queries.CreatePurchaseRequestItem(ctx, repository.CreatePurchaseRequestItemParams{
			PrID:          pr.ID,
			Description:   it.Description,
			Quantity:      it.Quantity,
			UnitCostCents: it.UnitCost,
			TotalCents:    t,
		})
	}
	poNo := fmt.Sprintf("PO-%d-%s", time.Now().Year(), strconv.Itoa(1000+int(total/100)+1)[1:])
	_, _ = d.queries.CreatePurchaseOrder(ctx, repository.CreatePurchaseOrderParams{
		PoNo:       poNo,
		PrID:       &pr.ID,
		Supplier:   strPtr(req.Supplier),
		TotalCents: total,
	})
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
		ID:            id,
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
		PoID        *string `json:"poId"`
		Supplier    string  `json:"supplier"`
		TotalAmount int64   `json:"totalAmountCents"`
		InvoiceDate string  `json:"invoiceDate"`
		DueDate     string  `json:"dueDate"`
		Notes       string  `json:"notes"`
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	ctx := r.Context()
	siNo := fmt.Sprintf("SI-%d-%s", time.Now().Year(), strconv.Itoa(1000+int(req.TotalAmount/100)+1)[1:])
	var invoiceDate, dueDate interface{}
	if req.InvoiceDate != "" {
		t, _ := time.Parse("2006-01-02", req.InvoiceDate)
		invoiceDate = &t
	}
	if req.DueDate != "" {
		t, _ := time.Parse("2006-01-02", req.DueDate)
		dueDate = &t
	}
	var poID *string
	if req.PoID != nil && *req.PoID != "" {
		poID = req.PoID
	}
	params := repository.CreateSupplierInvoiceParams{
		SiNo:          siNo,
		Supplier:      strPtr(req.Supplier),
		TotalAmountCents: req.TotalAmount,
		Notes:         strPtr(req.Notes),
	}
	if poID != nil {
		params.PoID = poID
	}
	if invoiceDate != nil {
		params.InvoiceDate = pgtype.Date{Time: *invoiceDate.(*time.Time), Valid: true}
	}
	if dueDate != nil {
		params.DueDate = pgtype.Date{Time: *dueDate.(*time.Time), Valid: true}
	}
	si, err := d.queries.CreateSupplierInvoice(ctx, params)
	if err != nil {
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
	si, err := d.queries.GetSupplierInvoice(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	var allocated int64
	for _, a := range req.Allocations {
		allocated += a.AmountCents
	}
	if abs(allocated-si.TotalAmountCents) > 1 {
		respondError(w, http.StatusBadRequest, fmt.Errorf("allocations must equal invoice total"))
		return
	}
	if err := d.queries.DeleteSupplierInvoiceAllocations(ctx, id); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	for _, a := range req.Allocations {
		_, err := d.queries.CreateSupplierInvoiceAllocation(ctx, repository.CreateSupplierInvoiceAllocationParams{
			SiID:        id,
			JoID:        a.JoID,
			AmountCents: a.AmountCents,
			Description: strPtr(a.Description),
		})
		if err != nil {
			respondError(w, http.StatusInternalServerError, err)
			return
		}
		_ = d.queries.UpdateJobOrderActualPartsCost(ctx, repository.UpdateJobOrderActualPartsCostParams{
			ID:                  a.JoID,
			ActualPartsCostCents: a.AmountCents,
		})
		_ = d.queries.UpdateJobOrderNetProfit(ctx, a.JoID)
	}
	si, err = d.queries.UpdateSupplierInvoiceStatus(ctx, repository.UpdateSupplierInvoiceStatusParams{
		ID:     id,
		Status: repository.SiStatusALLOCATED,
	})
	if err != nil {
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
	// create pending disbursement for supplier invoice
	dnNo := fmt.Sprintf("DISB-SI-%d-%s", time.Now().Year(), strconv.Itoa(1000+int(si.TotalAmountCents/100)+1)[1:])
	_, _ = d.queries.CreateDisbursementFromSupplierInvoice(ctx, repository.CreateDisbursementFromSupplierInvoiceParams{
		DisbursementNo:    dnNo,
		SupplierInvoiceID: &si.ID,
		AmountCents:       si.TotalAmountCents,
	})
	si, err = d.queries.UpdateSupplierInvoiceStatus(ctx, repository.UpdateSupplierInvoiceStatusParams{
		ID:     id,
		Status: repository.SiStatusAPPROVED,
	})
	if err != nil {
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
