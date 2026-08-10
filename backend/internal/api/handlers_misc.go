package api

import (
	"net/http"

	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/actor"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/policy"
)

func (d *deps) handleGetActor(w http.ResponseWriter, r *http.Request) {
	role := actor.FromContext(r.Context())
	respondJSON(w, http.StatusOK, map[string]any{
		"role": role.String(),
		"name": role.DisplayName(),
		"demo": d.cfg.DemoMode,
	})
}

func (d *deps) handleDashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	active, _ := d.queries.CountJobOrdersByStatus(ctx, "IN_PROGRESS")
	partsPending, _ := d.queries.CountJobOrdersByStatus(ctx, "PARTS_PENDING")
	completed, _ := d.queries.CountJobOrdersByStatus(ctx, "COMPLETED")
	draftQuotes, _ := d.queries.CountQuotationsByStatus(ctx, "DRAFT")
	approvedQuotes, _ := d.queries.CountQuotationsByStatus(ctx, "APPROVED")
	pendingPRs, _ := d.queries.CountPurchaseRequestsPending(ctx)
	pendingOpex, _ := d.queries.CountOpexRequestsPending(ctx)
	pendingDisbursements, _ := d.queries.CountSupplierInvoicesPending(ctx)
	billed, _ := d.queries.SumBilledAmount(ctx)
	actual, _ := d.queries.SumActualCosts(ctx)
	netProfit := billed - actual
	recent, _ := d.queries.ListRecentJobOrders(ctx, 5)

	respondJSON(w, http.StatusOK, map[string]any{
		"counts": map[string]int64{
			"activeJobOrders":     active,
			"partsPendingJobOrders": partsPending,
			"completedJobOrders":  completed,
			"draftQuotations":     draftQuotes,
			"approvedQuotations":  approvedQuotes,
			"pendingPurchaseRequests": pendingPRs,
			"pendingOpexRequests":     pendingOpex,
			"pendingDisbursements":  pendingDisbursements,
		},
		"financials": map[string]int64{
			"billedCents":     billed,
			"actualCostCents": actual,
			"netProfitCents":  netProfit,
		},
		"recentJobOrders": recent,
	})
}

func (d *deps) handleAccountingSummary(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.ViewAccounting); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	ctx := r.Context()
	customers, _ := d.queries.ListCustomers(ctx)
	invoices, _ := d.queries.ListServiceInvoices(ctx)
	respondJSON(w, http.StatusOK, map[string]any{
		"customers": customers,
		"invoices":  invoices,
	})
}
