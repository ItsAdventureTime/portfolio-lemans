package api

import (
	"net/http"

	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/actor"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/policy"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/repository"
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
	role := actor.FromContext(ctx)
	canViewJobOrders := policy.HasPermission(role, policy.JOChangeStatus)
	canViewQuotations := policy.HasPermission(role, policy.SalesQuotationCreate) ||
		policy.HasPermission(role, policy.QuoteApprove) ||
		policy.HasPermission(role, policy.QuoteConvert)
	canViewPurchasing := policy.HasPermission(role, policy.PRCreate)
	canViewExpenses := policy.HasPermission(role, policy.OpexCreate) ||
		policy.HasPermission(role, policy.OpexApprove)
	canViewDisbursements := policy.HasPermission(role, policy.DisburseRecordPayment) ||
		policy.HasPermission(role, policy.DisburseApprove)
	canViewCosting := policy.HasPermission(role, policy.ViewJobCosting)
	canViewBilling := policy.HasPermission(role, policy.InvoiceRecordPayment) || canViewCosting

	var active, partsPending, completed, billedJobOrders, pendingPRs int64
	if canViewJobOrders {
		active, _ = d.queries.CountJobOrdersByStatus(ctx, "IN_PROGRESS")
		partsPending, _ = d.queries.CountJobOrdersByStatus(ctx, "PARTS_PENDING")
	}
	if canViewJobOrders || canViewBilling {
		completed, _ = d.queries.CountJobOrdersByStatus(ctx, "COMPLETED")
	}
	if canViewBilling {
		billedJobOrders, _ = d.queries.CountJobOrdersByStatus(ctx, "BILLED")
	}
	if canViewPurchasing {
		pendingPRs, _ = d.queries.CountPurchaseRequestsPending(ctx)
	}
	var draftQuotes, approvedQuotes, pendingOpex, pendingDisbursements int64
	if canViewQuotations {
		draftQuotes, _ = d.queries.CountQuotationsByStatus(ctx, "DRAFT")
		approvedQuotes, _ = d.queries.CountQuotationsByStatus(ctx, "APPROVED")
	}
	if canViewExpenses {
		pendingOpex, _ = d.queries.CountOpexRequestsPending(ctx)
	}
	if canViewDisbursements {
		pendingDisbursements, _ = d.queries.CountSupplierInvoicesPending(ctx)
	}
	var billed, actual int64
	if canViewBilling || canViewCosting {
		billed, _ = d.queries.SumBilledAmount(ctx)
	}
	if canViewCosting {
		actual, _ = d.queries.SumActualCosts(ctx)
	}
	netProfit := int64(0)
	if canViewCosting {
		netProfit = billed - actual
	}
	recent := make([]repository.ListRecentJobOrdersRow, 0)
	if canViewJobOrders {
		recent, _ = d.queries.ListRecentJobOrders(ctx, 5)
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"counts": map[string]int64{
			"activeJobOrders":         active,
			"partsPendingJobOrders":   partsPending,
			"completedJobOrders":      completed,
			"billedJobOrders":         billedJobOrders,
			"draftQuotations":         draftQuotes,
			"approvedQuotations":      approvedQuotes,
			"pendingPurchaseRequests": pendingPRs,
			"pendingOpexRequests":     pendingOpex,
			"pendingDisbursements":    pendingDisbursements,
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
