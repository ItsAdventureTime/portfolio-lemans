package api

import (
	"context"
	"math"
	"net/http"
	"time"

	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/mathx"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/repository"
	"github.com/jackc/pgx/v5/pgtype"
)

// handleSeed resets the database and inserts deterministic demo data.
func (d *deps) handleSeed(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if err := d.queries.DeleteAllData(ctx); err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}

	cust, err := d.queries.CreateCustomer(ctx, repository.CreateCustomerParams{
		CustomerNo: "C-2026-001",
		Name:       "Rivera Auto Garage",
		Tin:        strPtr("123-456-789-000"),
		Address:    strPtr("123 Main St, Manila"),
		Phone:      strPtr("09171234567"),
		Email:      strPtr("contact@riveraauto.ph"),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	var odometer int32 = 45200
	vehicle, err := d.queries.CreateVehicle(ctx, repository.CreateVehicleParams{
		CustomerID: cust.ID,
		PlateNo:    "ABC-1234",
		VinChassis: strPtr("1HGCM82633A123456"),
		EngineNo:   strPtr("ENG-987654321"),
		MakeModel:  "Toyota Hilux 4x4",
		Year:       strPtr("2022"),
		Color:      strPtr("Super White"),
		Odometer:   &odometer,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}

	quoteItems := []struct {
		Type     string
		Desc     string
		Qty      float64
		UnitCent int64
		DiscCent int64
	}{
		{"LABOR", "Engine tune-up and diagnostics", 1, 350000, 0},
		{"LABOR", "Transmission fluid replacement", 1, 180000, 0},
		{"PARTS", "OEM oil filter", 1, 45000, 0},
		{"PARTS", "Synthetic oil (5L)", 5, 12000, 0},
		{"MISC", "Shop supplies", 1, 25000, 0},
	}
	var labor, parts, total int64
	quoteNo := "SQ-2026-001"
	quote, err := d.queries.CreateSalesQuotation(ctx, repository.CreateSalesQuotationParams{
		QuoteNo:    quoteNo,
		CustomerID: cust.ID,
		VehicleID:  vehicle.ID,
		Advisor:    "Alice Sales",
		TotalLaborCents: 0,
		TotalPartsCents: 0,
		NetTotalCents:   0,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	for _, it := range quoteItems {
		net := int64(math.Round(it.Qty*float64(it.UnitCent))) - it.DiscCent
		d.queries.CreateQuotationItem(ctx, repository.CreateQuotationItemParams{
			QuoteID:        quote.ID,
			ItemType:       repository.ItemType(it.Type),
			Description:    it.Desc,
			Quantity:       it.Qty,
			UnitPriceCents: it.UnitCent,
			DiscountCents:  it.DiscCent,
			NetAmountCents: net,
		})
		if it.Type == "LABOR" {
			labor += net
		} else if it.Type == "PARTS" {
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

	quote, err = d.queries.UpdateQuotationStatus(ctx, repository.UpdateQuotationStatusParams{
		ID:     quote.ID,
		Status: repository.QuoteStatusAPPROVED,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}

	jo, err := d.queries.CreateJobOrder(ctx, repository.CreateJobOrderParams{
		JoNo:       "RA0003973",
		SqID:       &quote.ID,
		CustomerID: cust.ID,
		VehicleID:  vehicle.ID,
		Advisor:    "Alice Sales",
		TotalEstimatedLaborCents: labor,
		TotalEstimatedPartsCents: parts,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}

	for _, it := range quoteItems {
		net := int64(math.Round(it.Qty*float64(it.UnitCent))) - it.DiscCent
		d.queries.CreateJobOrderItem(ctx, repository.CreateJobOrderItemParams{
			JoID:           jo.ID,
			ItemType:       repository.ItemType(it.Type),
			Description:    it.Desc,
			Quantity:       it.Qty,
			UnitPriceCents: it.UnitCent,
			DiscountCents:  it.DiscCent,
			NetAmountCents: net,
		})
	}
	_, _ = d.queries.CreateJobOrderEvent(ctx, repository.CreateJobOrderEventParams{
		JoID:        jo.ID,
		EventType:   "CONVERTED",
		Description: "Converted from quotation SQ-2026-001",
	})

	prItems := []struct {
		Desc string
		Qty  float64
		Cost int64
	}{
		{"OEM oil filter", 1, 28000},
		{"Synthetic oil (5L)", 5, 8500},
	}
	var prTotal int64
	pr, err := d.queries.CreatePurchaseRequest(ctx, repository.CreatePurchaseRequestParams{
		PrNo:            "PR-2026-001",
		JoID:            &jo.ID,
		RequestedByRole: "ROLE_PURCH",
		Supplier:        strPtr("Manila Auto Parts Supply"),
		Notes:           strPtr("Created from job order parts estimate"),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	for _, it := range prItems {
		t := int64(math.Round(it.Qty * float64(it.Cost)))
		prTotal += t
		d.queries.CreatePurchaseRequestItem(ctx, repository.CreatePurchaseRequestItemParams{
			PrID:          pr.ID,
			Description:   it.Desc,
			Quantity:      it.Qty,
			UnitCostCents: it.Cost,
			TotalCents:    t,
		})
	}
	_, err = d.queries.CreatePurchaseOrder(ctx, repository.CreatePurchaseOrderParams{
		PoNo:       "PO-2026-001",
		PrID:       &pr.ID,
		Supplier:   strPtr("Manila Auto Parts Supply"),
		TotalCents: prTotal,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	_, err = d.queries.ApprovePurchaseRequest(ctx, repository.ApprovePurchaseRequestParams{
		ID:             pr.ID,
		ApprovedByRole: strPtr("ROLE_GM"),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}

	siTotal := int64(2 * 28000)
	si, err := d.queries.CreateSupplierInvoice(ctx, repository.CreateSupplierInvoiceParams{
		SiNo:             "SI-2026-001",
		Supplier:         strPtr("Manila Auto Parts Supply"),
		TotalAmountCents: siTotal,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	_, err = d.queries.CreateSupplierInvoiceAllocation(ctx, repository.CreateSupplierInvoiceAllocationParams{
		SiID:        si.ID,
		JoID:        jo.ID,
		AmountCents: siTotal,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	_, err = d.queries.UpdateSupplierInvoiceStatus(ctx, repository.UpdateSupplierInvoiceStatusParams{
		ID:     si.ID,
		Status: repository.SiStatusALLOCATED,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	_, err = d.queries.UpdateSupplierInvoiceStatus(ctx, repository.UpdateSupplierInvoiceStatusParams{
		ID:     si.ID,
		Status: repository.SiStatusAPPROVED,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	_, err = d.queries.UpdateJobOrderStatus(ctx, repository.UpdateJobOrderStatusParams{
		ID:     jo.ID,
		Status: repository.JoStatusCOMPLETED,
	})

	err = d.queries.UpdateJobOrderActualPartsCost(ctx, repository.UpdateJobOrderActualPartsCostParams{
		ID:                  jo.ID,
		ActualPartsCostCents: siTotal,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	_ = d.queries.UpdateJobOrderNetProfit(ctx, jo.ID)

	oreq, err := d.queries.CreateOpexRequest(ctx, repository.CreateOpexRequestParams{
		RequestNo:       "OPEX-2026-001",
		Category:        "Utilities",
		Description:     "Monthly electricity consumption - Service bay",
		AmountCents:     1250000,
		RequestedByRole: "ROLE_SVC",
		Notes:           strPtr("Urgent payment to avoid disconnection"),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	_, err = d.queries.ApproveOpexRequest(ctx, repository.ApproveOpexRequestParams{
		ID:             oreq.ID,
		ApprovedByRole: strPtr("ROLE_GM"),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	_, _ = d.queries.CreateDisbursementFromOpex(ctx, repository.CreateDisbursementFromOpexParams{
		DisbursementNo: "DISB-OPEX-2026-001",
		OpexRequestID:  &oreq.ID,
		AmountCents:    oreq.AmountCents,
	})

	_, err = d.queries.UpdateJobOrderStatus(ctx, repository.UpdateJobOrderStatusParams{
		ID:     jo.ID,
		Status: repository.JoStatusCOMPLETED,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}

	items, _ := d.queries.ListJobOrderItems(ctx, jo.ID)
	var subtotal int64
	for _, it := range items {
		subtotal += it.NetAmountCents
	}
	vat := mathx.VatFromSubtotal(subtotal)
	total = subtotal + vat
	inv, err := d.queries.CreateServiceInvoice(ctx, repository.CreateServiceInvoiceParams{
		InvoiceNo:    "INV-2026-001",
		JoID:         &jo.ID,
		CustomerID:   cust.ID,
		SubtotalCents: subtotal,
		VatAmountCents: vat,
		TotalCents:     total,
		Notes:          strPtr("THIS IS NOT AN OFFICIAL RECEIPT. NOT VALID FOR CLAIMING INPUT TAX"),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	_, err = d.queries.UpdateJobOrderBilled(ctx, repository.UpdateJobOrderBilledParams{
		ID:             jo.ID,
		BilledAmountCents: total,
		NetProfitCents:    total - jo.ActualLaborCostCents - siTotal,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}

	_, err = d.queries.CreatePayment(ctx, repository.CreatePaymentParams{
		ServiceInvoiceID: inv.ID,
		AmountCents:      total,
		PaymentMethod:    "Cash",
		ReferenceNo:      strPtr("OR-0001"),
		PaidAt:           pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
		RecordedByRole:   strPtr("ROLE_DCS"),
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}
	_, err = d.queries.UpdateServiceInvoicePaymentStatus(ctx, repository.UpdateServiceInvoicePaymentStatusParams{
		ID:              inv.ID,
		AmountPaidCents: total,
		Status:          repository.ServiceInvoiceStatusPAID,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "seeded"})
}

func countCustomers(ctx context.Context, q *repository.Queries) int64 {
	n, _ := q.CountCustomers(ctx)
	return n
}
