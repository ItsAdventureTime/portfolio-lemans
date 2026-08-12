package api

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/mathx"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/policy"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/repository"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func (d *deps) resolveJobOrderID(ctx context.Context, param string) (string, error) {
	if _, err := uuid.Parse(param); err == nil {
		return param, nil
	}
	jo, err := d.queries.GetJobOrderByNo(ctx, param)
	if err != nil {
		return "", err
	}
	return jo.ID, nil
}

var allowedStatusTransitions = map[repository.JoStatus][]repository.JoStatus{
	repository.JoStatusDRAFT:       {repository.JoStatusAPPROVED, repository.JoStatusINPROGRESS},
	repository.JoStatusAPPROVED:    {repository.JoStatusINPROGRESS, repository.JoStatusCOMPLETED},
	repository.JoStatusINPROGRESS:  {repository.JoStatusPARTSPENDING, repository.JoStatusCOMPLETED},
	repository.JoStatusPARTSPENDING: {repository.JoStatusINPROGRESS, repository.JoStatusCOMPLETED},
	repository.JoStatusCOMPLETED:   {repository.JoStatusBILLED, repository.JoStatusCLOSED},
	repository.JoStatusBILLED:      {repository.JoStatusCLOSED},
	repository.JoStatusCLOSED:      {},
}

func (d *deps) handleListJobOrders(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	jos, err := d.queries.ListJobOrders(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, jos)
}

func (d *deps) handleGetJobOrder(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := d.resolveJobOrderID(ctx, chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	jo, err := d.queries.GetJobOrder(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	respondJSON(w, http.StatusOK, jo)
}

func (d *deps) handleListJobOrderItems(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := d.resolveJobOrderID(ctx, chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	items, err := d.queries.ListJobOrderItems(ctx, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, items)
}

func (d *deps) handleListJobOrderEvents(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := d.resolveJobOrderID(ctx, chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	events, err := d.queries.ListJobOrderEvents(ctx, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, events)
}

func (d *deps) handleAddJobOrderEvent(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.JOChangeStatus); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req struct {
		EventType   string `json:"eventType"`
		Description string `json:"description"`
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	ctx := r.Context()
	id, err := d.resolveJobOrderID(ctx, chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	event, err := d.queries.CreateJobOrderEvent(ctx, repository.CreateJobOrderEventParams{
		JoID:          id,
		EventType:     req.EventType,
		Description:   req.Description,
		CreatedByRole: strPtr(roleString(r)),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusCreated, event)
}

func (d *deps) handleAssignTech(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.JOAssignTech); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req struct {
		Technician string `json:"technician"`
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	ctx := r.Context()
	id, err := d.resolveJobOrderID(ctx, chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	jo, err := d.queries.UpdateJobOrderTechnician(ctx, repository.UpdateJobOrderTechnicianParams{
		ID:         id,
		Technician: strPtr(req.Technician),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	_, _ = d.queries.CreateJobOrderEvent(ctx, repository.CreateJobOrderEventParams{
		JoID:          id,
		EventType:     "TECHNICIAN_ASSIGNED",
		Description:   fmt.Sprintf("Technician assigned: %s", req.Technician),
		CreatedByRole: strPtr(roleString(r)),
	})
	respondJSON(w, http.StatusOK, jo)
}

func (d *deps) handleChangeJobStatus(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.JOChangeStatus); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req struct {
		NextStatus repository.JoStatus `json:"nextStatus"`
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	ctx := r.Context()
	id, err := d.resolveJobOrderID(ctx, chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	jo, err := d.queries.GetJobOrder(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	allowed := allowedStatusTransitions[jo.Status]
	found := false
	for _, s := range allowed {
		if s == req.NextStatus {
			found = true
			break
		}
	}
	if !found {
		respondError(w, http.StatusBadRequest, fmt.Errorf("invalid transition from %s to %s", jo.Status, req.NextStatus))
		return
	}
	updated, err := d.queries.UpdateJobOrderStatus(ctx, repository.UpdateJobOrderStatusParams{
		ID:     id,
		Status: req.NextStatus,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	_, _ = d.queries.CreateJobOrderEvent(ctx, repository.CreateJobOrderEventParams{
		JoID:          id,
		EventType:     "STATUS_CHANGE",
		Description:   fmt.Sprintf("Status changed to %s", req.NextStatus),
		CreatedByRole: strPtr(roleString(r)),
	})
	respondJSON(w, http.StatusOK, updated)
}

func (d *deps) handleGetJobCosting(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.ViewJobCosting); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	ctx := r.Context()
	id, err := d.resolveJobOrderID(ctx, chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	jo, err := d.queries.GetJobOrder(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	partsAllocated, _ := d.queries.SumSupplierInvoiceAllocationsByJO(ctx, id)
	costing := mathx.CalculateJobCosting(
		jo.BilledAmountCents,
		jo.ActualLaborCostCents,
		jo.ActualPartsCostCents,
		partsAllocated,
	)
	respondJSON(w, http.StatusOK, map[string]any{
		"jobOrder":                 jo,
		"partsAllocatedCents":      partsAllocated,
		"totalEstimatedLaborCents": jo.TotalEstimatedLaborCents,
		"totalEstimatedPartsCents": jo.TotalEstimatedPartsCents,
		"actualLaborCostCents":     jo.ActualLaborCostCents,
		"actualPartsCostCents":     jo.ActualPartsCostCents,
		"billedAmountCents":        jo.BilledAmountCents,
		"totalActualCostCents":     costing.TotalActualCostCents,
		"netProfitCents":           costing.NetProfitCents,
		"profitMarginPercent":      costing.ProfitMarginPercent,
		"vatAmountCents":           costing.VatAmountCents,
	})
}

func (d *deps) handleListAttachments(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.AttachmentView); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	ctx := r.Context()
	id, err := d.resolveJobOrderID(ctx, chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	attachments, err := d.queries.ListAttachments(ctx, repository.ListAttachmentsParams{
		EntityType: "job-order",
		EntityID:   id,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, attachments)
}

func (d *deps) handleCreateAttachment(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.AttachmentUpload); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req struct {
		FileName    string `json:"fileName"`
		ContentType string `json:"contentType"`
		Size        int32  `json:"size"`
		StorageKey  string `json:"storageKey"`
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	ctx := r.Context()
	id, err := d.resolveJobOrderID(ctx, chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	att, err := d.queries.CreateAttachment(ctx, repository.CreateAttachmentParams{
		EntityType:    "job-order",
		EntityID:      id,
		FileName:      req.FileName,
		ContentType:   req.ContentType,
		SizeBytes:     req.Size,
		StorageKey:    req.StorageKey,
		CreatedByRole: strPtr(roleString(r)),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusCreated, att)
}

func joNumber(ctx context.Context, q *repository.Queries) string {
	n, _ := q.CountJobOrders(ctx)
	return fmt.Sprintf("RA%s", strconv.Itoa(1000000+int(n)+1)[1:])
}
