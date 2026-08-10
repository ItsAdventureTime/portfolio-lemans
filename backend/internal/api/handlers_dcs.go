package api

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/b2"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/policy"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/repository"
	"github.com/jackc/pgx/v5/pgtype"
)

type opexReq struct {
	Category    string `json:"category"`
	Description string `json:"description"`
	AmountCents int64  `json:"amountCents"`
	Notes       string `json:"notes"`
}

func (d *deps) handleListOpexRequests(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	requests, err := d.queries.ListOpexRequests(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, requests)
}

func (d *deps) handleCreateOpexRequest(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.OpexCreate); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req opexReq
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	ctx := r.Context()
	reqNo := fmt.Sprintf("OPEX-%d-%s", time.Now().Year(), fmt.Sprintf("%03d", countPlaceholder(ctx, d.queries)))
	orex, err := d.queries.CreateOpexRequest(ctx, repository.CreateOpexRequestParams{
		RequestNo:       reqNo,
		Category:        req.Category,
		Description:     req.Description,
		AmountCents:     req.AmountCents,
		RequestedByRole: roleString(r),
		Notes:           strPtr(req.Notes),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusCreated, orex)
}

func (d *deps) handleApproveOpexRequest(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.OpexApprove); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	ctx := r.Context()
	id := idParam(r, "id")
	orex, err := d.queries.GetOpexRequest(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	orex, err = d.queries.ApproveOpexRequest(ctx, repository.ApproveOpexRequestParams{
		ID:             id,
		ApprovedByRole: strPtr(roleString(r)),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	dnNo := fmt.Sprintf("DISB-OPEX-%d-%s", time.Now().Year(), fmt.Sprintf("%03d", countPlaceholder(ctx, d.queries)))
	_, _ = d.queries.CreateDisbursementFromOpex(ctx, repository.CreateDisbursementFromOpexParams{
		DisbursementNo: dnNo,
		OpexRequestID:  &orex.ID,
		AmountCents:    orex.AmountCents,
	})
	respondJSON(w, http.StatusOK, orex)
}

func (d *deps) handleListDisbursements(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	disbursements, err := d.queries.ListDisbursements(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, disbursements)
}

func (d *deps) handleApproveDisbursement(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.DisburseApprove); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	ctx := r.Context()
	id := idParam(r, "id")
	db, err := d.queries.ApproveDisbursement(ctx, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, db)
}

func (d *deps) handleRecordPayment(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.DisburseRecordPayment); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req struct {
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
	db, err := d.queries.GetDisbursement(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	if db.Status != repository.DisbursementStatusAPPROVED {
		respondError(w, http.StatusBadRequest, fmt.Errorf("disbursement must be approved before payment"))
		return
	}
	db, err = d.queries.RecordDisbursementPayment(ctx, repository.RecordDisbursementPaymentParams{
		ID:             id,
		PaymentMethod:  strPtr(req.PaymentMethod),
		ReferenceNo:    strPtr(req.ReferenceNo),
		PaidAt:         pgtype.Timestamptz{Time: req.PaidAt, Valid: true},
		RecordedByRole: strPtr(roleString(r)),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, db)
}

func (d *deps) b2Client() *b2.Client {
	return b2.New(d.cfg.B2Endpoint, d.cfg.B2Region, d.cfg.B2AccessKeyID, d.cfg.B2SecretAccessKey, d.cfg.B2BucketName)
}

func (d *deps) handleProofUploadURL(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.DisburseRecordPayment); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	id := idParam(r, "id")
	fileName := r.URL.Query().Get("fileName")
	contentType := r.URL.Query().Get("contentType")
	key := fmt.Sprintf("attachments/dcs-payment/%s/%d-%s", id, time.Now().Unix(), fileName)
	url, err := d.b2Client().GenerateUploadURL(r.Context(), key, contentType)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"key": key, "url": url})
}

func (d *deps) handleProofDownloadURL(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.DisburseRecordPayment); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	ctx := r.Context()
	id := idParam(r, "id")
	db, err := d.queries.GetDisbursement(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	if db.ProofAttachmentKey == nil || *db.ProofAttachmentKey == "" {
		respondJSON(w, http.StatusOK, map[string]any{"url": nil})
		return
	}
	url, err := d.b2Client().GenerateDownloadURL(ctx, *db.ProofAttachmentKey)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"url": url})
}

func (d *deps) handleAttachProof(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.DisburseRecordPayment); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req struct {
		StorageKey string `json:"storageKey"`
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	ctx := r.Context()
	id := idParam(r, "id")
	if err := d.queries.UpdateDisbursementProof(ctx, repository.UpdateDisbursementProofParams{
		ID:                 id,
		ProofAttachmentKey: &req.StorageKey,
	}); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func countPlaceholder(ctx context.Context, q *repository.Queries) int64 {
	n, _ := q.CountCustomers(ctx)
	return n
}
