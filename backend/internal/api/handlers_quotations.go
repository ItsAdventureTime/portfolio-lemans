package api

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/policy"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/repository"
)

type quoteItemReq struct {
	ItemType    string  `json:"itemType"`
	Description string  `json:"description"`
	Quantity    float64 `json:"quantity"`
	UnitPrice   int64   `json:"unitPriceCents"`
	Discount    int64   `json:"discountCents"`
}

type createQuoteReq struct {
	CustomerID string         `json:"customerId"`
	VehicleID  string         `json:"vehicleID"`
	Advisor    string         `json:"advisor"`
	Items      []quoteItemReq `json:"items"`
}

func documentNumber(prefix string) (string, error) {
	bytes := make([]byte, 6)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("generate %s number: %w", prefix, err)
	}
	return fmt.Sprintf("%s-%d-%s", prefix, time.Now().Year(), strings.ToUpper(hex.EncodeToString(bytes))), nil
}

func netAmount(qty float64, unit, discount int64) int64 {
	return int64(math.Round(qty*float64(unit))) - discount
}

func validateQuoteItems(items []quoteItemReq) error {
	if len(items) == 0 {
		return fmt.Errorf("at least one quotation item is required")
	}
	for index, item := range items {
		itemType := repository.ItemType(strings.ToUpper(item.ItemType))
		if itemType != repository.ItemTypeLABOR && itemType != repository.ItemTypePARTS && itemType != repository.ItemTypeMISC {
			return fmt.Errorf("item %d has an invalid item type", index+1)
		}
		if strings.TrimSpace(item.Description) == "" {
			return fmt.Errorf("item %d requires a description", index+1)
		}
		if math.IsNaN(item.Quantity) || math.IsInf(item.Quantity, 0) || item.Quantity <= 0 {
			return fmt.Errorf("item %d requires a positive quantity", index+1)
		}
		if item.UnitPrice < 0 || item.Discount < 0 {
			return fmt.Errorf("item %d cannot have a negative amount", index+1)
		}
		if item.Discount > int64(math.Round(item.Quantity*float64(item.UnitPrice))) {
			return fmt.Errorf("item %d discount cannot exceed its gross amount", index+1)
		}
	}
	return nil
}

func (d *deps) handleListQuotations(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	quotes, err := d.queries.ListSalesQuotations(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, quotes)
}

func (d *deps) handleCreateQuotation(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.SalesQuotationCreate); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	var req createQuoteReq
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	if err := validateQuoteItems(req.Items); err != nil {
		respondError(w, http.StatusBadRequest, err)
		return
	}
	var labor, parts, total int64
	ctx := r.Context()
	quoteNo, err := documentNumber("SQ")
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	tx, err := d.pool.Begin(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	defer tx.Rollback(ctx)
	queries := d.queries.WithTx(tx)
	quote, err := queries.CreateSalesQuotation(ctx, repository.CreateSalesQuotationParams{
		QuoteNo:         quoteNo,
		CustomerID:      req.CustomerID,
		VehicleID:       req.VehicleID,
		Advisor:         req.Advisor,
		TotalLaborCents: 0,
		TotalPartsCents: 0,
		NetTotalCents:   0,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	for _, it := range req.Items {
		net := netAmount(it.Quantity, it.UnitPrice, it.Discount)
		if _, err := queries.CreateQuotationItem(ctx, repository.CreateQuotationItemParams{
			QuoteID:        quote.ID,
			ItemType:       repository.ItemType(strings.ToUpper(it.ItemType)),
			Description:    it.Description,
			Quantity:       it.Quantity,
			UnitPriceCents: it.UnitPrice,
			DiscountCents:  it.Discount,
			NetAmountCents: net,
		}); err != nil {
			respondError(w, http.StatusInternalServerError, err)
			return
		}
		switch repository.ItemType(strings.ToUpper(it.ItemType)) {
		case "LABOR":
			labor += net
		case "PARTS":
			parts += net
		}
		total += net
	}
	quote, err = queries.UpdateQuotationTotals(ctx, repository.UpdateQuotationTotalsParams{
		ID:              quote.ID,
		TotalLaborCents: labor,
		TotalPartsCents: parts,
		NetTotalCents:   total,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	if err := tx.Commit(ctx); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusCreated, quote)
}

func (d *deps) handleApproveQuotation(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.QuoteApprove); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	ctx := r.Context()
	id := idParam(r, "id")
	quote, err := d.queries.GetSalesQuotation(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	if quote.Status != repository.QuoteStatusDRAFT {
		respondError(w, http.StatusBadRequest, fmt.Errorf("quotation must be in DRAFT status"))
		return
	}
	updated, err := d.queries.UpdateQuotationStatus(ctx, repository.UpdateQuotationStatusParams{
		ID:     id,
		Status: repository.QuoteStatusAPPROVED,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, updated)
}

func (d *deps) handleRejectQuotation(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.QuoteApprove); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	ctx := r.Context()
	id := idParam(r, "id")
	quote, err := d.queries.GetSalesQuotation(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	if quote.Status != repository.QuoteStatusDRAFT {
		respondError(w, http.StatusBadRequest, fmt.Errorf("quotation must be in DRAFT status"))
		return
	}
	updated, err := d.queries.UpdateQuotationStatus(ctx, repository.UpdateQuotationStatusParams{
		ID:     id,
		Status: repository.QuoteStatusREJECTED,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusOK, updated)
}

func (d *deps) handleConvertQuotation(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.QuoteConvert); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	ctx := r.Context()
	id := idParam(r, "id")
	quote, err := d.queries.GetSalesQuotation(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err)
		return
	}
	if quote.Status != repository.QuoteStatusAPPROVED {
		respondError(w, http.StatusBadRequest, fmt.Errorf("quotation must be approved"))
		return
	}
	items, err := d.queries.ListQuotationItems(ctx, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	joNo, err := documentNumber("RA")
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	tx, err := d.pool.Begin(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	defer tx.Rollback(ctx)
	queries := d.queries.WithTx(tx)
	claim, err := tx.Exec(ctx, `
		UPDATE sales_quotations
		SET status = 'CONVERTED', updated_at = now()
		WHERE id = $1 AND status = 'APPROVED'
	`, quote.ID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	if claim.RowsAffected() != 1 {
		respondError(w, http.StatusBadRequest, fmt.Errorf("quotation is no longer available for conversion"))
		return
	}
	jo, err := queries.CreateJobOrder(ctx, repository.CreateJobOrderParams{
		JoNo:                     joNo,
		SqID:                     &quote.ID,
		CustomerID:               quote.CustomerID,
		VehicleID:                quote.VehicleID,
		Advisor:                  quote.Advisor,
		TotalEstimatedLaborCents: quote.TotalLaborCents,
		TotalEstimatedPartsCents: quote.TotalPartsCents,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	for _, it := range items {
		if _, err := queries.CreateJobOrderItem(ctx, repository.CreateJobOrderItemParams{
			JoID:           jo.ID,
			ItemType:       it.ItemType,
			Description:    it.Description,
			Quantity:       it.Quantity,
			UnitPriceCents: it.UnitPriceCents,
			DiscountCents:  it.DiscountCents,
			NetAmountCents: it.NetAmountCents,
		}); err != nil {
			respondError(w, http.StatusInternalServerError, err)
			return
		}
	}
	if _, err := queries.CreateJobOrderEvent(ctx, repository.CreateJobOrderEventParams{
		JoID:          jo.ID,
		EventType:     "CONVERTED",
		Description:   fmt.Sprintf("Converted from quotation %s", quote.QuoteNo),
		CreatedByRole: strPtr(roleString(r)),
	}); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	if err := tx.Commit(ctx); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	respondJSON(w, http.StatusCreated, jo)
}
