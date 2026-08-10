package api

import (
	"context"
	"fmt"
	"math"
	"net/http"
	"strconv"
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

func quoteNumber(ctx context.Context, q *repository.Queries) string {
	n, _ := q.CountQuotations(ctx)
	return fmt.Sprintf("SQ-%d-%s", time.Now().Year(), strconv.Itoa(1000+int(n)+1)[1:])
}

func netAmount(qty float64, unit, discount int64) int64 {
	return int64(math.Round(qty*float64(unit))) - discount
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
	var labor, parts, total int64
	ctx := r.Context()
	quoteNo := quoteNumber(ctx, d.queries)
	quote, err := d.queries.CreateSalesQuotation(ctx, repository.CreateSalesQuotationParams{
		QuoteNo:    quoteNo,
		CustomerID: req.CustomerID,
		VehicleID:  req.VehicleID,
		Advisor:    req.Advisor,
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
		_, _ = d.queries.CreateQuotationItem(ctx, repository.CreateQuotationItemParams{
			QuoteID:        quote.ID,
			ItemType:       repository.ItemType(strings.ToUpper(it.ItemType)),
			Description:    it.Description,
			Quantity:       it.Quantity,
			UnitPriceCents: it.UnitPrice,
			DiscountCents:  it.Discount,
			NetAmountCents: net,
		})
		switch repository.ItemType(strings.ToUpper(it.ItemType)) {
		case "LABOR":
			labor += net
		case "PARTS":
			parts += net
		}
		total += net
	}
	quote, err = d.queries.UpdateQuotationTotals(ctx, repository.UpdateQuotationTotalsParams{
		ID:              quote.ID,
		TotalLaborCents: labor,
		TotalPartsCents: parts,
		NetTotalCents:   total,
	})
	if err != nil {
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
	count, _ := d.queries.CountJobOrders(ctx)
	joNo := fmt.Sprintf("RA%s", strconv.Itoa(1000000+int(count)+1)[1:])
	jo, err := d.queries.CreateJobOrder(ctx, repository.CreateJobOrderParams{
		JoNo:       joNo,
		SqID:       &quote.ID,
		CustomerID: quote.CustomerID,
		VehicleID:  quote.VehicleID,
		Advisor:    quote.Advisor,
		TotalEstimatedLaborCents: quote.TotalLaborCents,
		TotalEstimatedPartsCents: quote.TotalPartsCents,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	for _, it := range items {
		_, _ = d.queries.CreateJobOrderItem(ctx, repository.CreateJobOrderItemParams{
			JoID:           jo.ID,
			ItemType:       it.ItemType,
			Description:    it.Description,
			Quantity:       it.Quantity,
			UnitPriceCents: it.UnitPriceCents,
			DiscountCents:  it.DiscountCents,
			NetAmountCents: it.NetAmountCents,
		})
	}
	_, _ = d.queries.UpdateQuotationStatus(ctx, repository.UpdateQuotationStatusParams{
		ID:     quote.ID,
		Status: repository.QuoteStatusCONVERTED,
	})
	_, _ = d.queries.CreateJobOrderEvent(ctx, repository.CreateJobOrderEventParams{
		JoID:          jo.ID,
		EventType:     "CONVERTED",
		Description:   fmt.Sprintf("Converted from quotation %s", quote.QuoteNo),
		CreatedByRole: strPtr(roleString(r)),
	})
	respondJSON(w, http.StatusCreated, jo)
}
