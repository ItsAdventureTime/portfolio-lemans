package api

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/actor"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/config"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/policy"
	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/repository"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(pool *pgxpool.Pool, cfg config.Config, log *slog.Logger) http.Handler {
	queries := repository.New(pool)
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "X-Demo-Role"},
	}))
	r.Use(demoRoleMiddleware)

	deps := &deps{pool: pool, queries: queries, cfg: cfg, log: log}

	r.Get("/health", handleHealth)
	r.Get("/api/actor", deps.handleGetActor)

	r.Route("/api/customers", func(cr chi.Router) {
		cr.Get("/", deps.handleListCustomers)
		cr.Post("/", deps.handleCreateCustomer)
		cr.Get("/{id}", deps.handleGetCustomer)
		cr.Put("/{id}", deps.handleUpdateCustomer)
		cr.Get("/{id}/vehicles", deps.handleListVehiclesByCustomer)
		cr.Post("/{id}/vehicles", deps.handleCreateVehicle)
	})
	r.Get("/api/vehicles", deps.handleListVehicles)
	r.Get("/api/vehicles/{id}", deps.handleGetVehicle)

	r.Route("/api/quotations", func(qr chi.Router) {
		qr.Get("/", deps.handleListQuotations)
		qr.Post("/", deps.handleCreateQuotation)
		qr.Post("/{id}/approve", deps.handleApproveQuotation)
		qr.Post("/{id}/reject", deps.handleRejectQuotation)
		qr.Post("/{id}/convert", deps.handleConvertQuotation)
	})

	r.Route("/api/job-orders", func(jr chi.Router) {
		jr.Get("/", deps.handleListJobOrders)
		jr.Get("/{id}", deps.handleGetJobOrder)
		jr.Get("/{id}/items", deps.handleListJobOrderItems)
		jr.Get("/{id}/events", deps.handleListJobOrderEvents)
		jr.Post("/{id}/events", deps.handleAddJobOrderEvent)
		jr.Post("/{id}/assign-tech", deps.handleAssignTech)
		jr.Post("/{id}/change-status", deps.handleChangeJobStatus)
		jr.Get("/{id}/costing", deps.handleGetJobCosting)
		jr.Get("/{id}/attachments", deps.handleListAttachments)
		jr.Post("/{id}/attachments", deps.handleCreateAttachment)
	})

	r.Route("/api/purchase-requests", func(pr chi.Router) {
		pr.Get("/", deps.handleListPurchaseRequests)
		pr.Post("/", deps.handleCreatePurchaseRequest)
		pr.Post("/from-job-order/{joId}", deps.handleCreatePRFromJO)
		pr.Post("/{id}/approve", deps.handleApprovePurchaseRequest)
	})

	r.Route("/api/supplier-invoices", func(sr chi.Router) {
		sr.Get("/", deps.handleListSupplierInvoices)
		sr.Post("/", deps.handleCreateSupplierInvoice)
		sr.Post("/{id}/allocate", deps.handleAllocateSupplierInvoice)
		sr.Post("/{id}/approve", deps.handleApproveSupplierInvoice)
	})

	r.Route("/api/opex-requests", func(or chi.Router) {
		or.Get("/", deps.handleListOpexRequests)
		or.Post("/", deps.handleCreateOpexRequest)
		or.Post("/{id}/approve", deps.handleApproveOpexRequest)
	})

	r.Route("/api/disbursements", func(dr chi.Router) {
		dr.Get("/", deps.handleListDisbursements)
		dr.Post("/{id}/approve", deps.handleApproveDisbursement)
		dr.Post("/{id}/pay", deps.handleRecordPayment)
		dr.Get("/{id}/proof-upload-url", deps.handleProofUploadURL)
		dr.Get("/{id}/proof-download-url", deps.handleProofDownloadURL)
		dr.Post("/{id}/attach-proof", deps.handleAttachProof)
	})

	r.Route("/api/invoices", func(ir chi.Router) {
		ir.Get("/", deps.handleListInvoices)
		ir.Get("/{id}", deps.handleGetInvoice)
		ir.Post("/from-job-order/{joId}", deps.handleCreateInvoiceFromJO)
		ir.Post("/{id}/payments", deps.handleRecordInvoicePayment)
	})

	r.Get("/api/accounting/summary", deps.handleAccountingSummary)
	r.Get("/api/accounting/exports/{format}", deps.handleAccountingExport)
	r.Get("/api/dashboard", deps.handleDashboard)

	if cfg.DemoMode {
		r.Post("/admin/seed", deps.handleSeed)
	}

	return r
}

type deps struct {
	pool    *pgxpool.Pool
	queries *repository.Queries
	cfg     config.Config
	log     *slog.Logger
}

func demoRoleMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role := actor.FromHeader(r.Header)
		ctx := actor.WithRole(r.Context(), role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func requirePermission(ctx context.Context, action policy.Action) error {
	return policy.Ensure(actor.FromContext(ctx), action)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func respondJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func respondError(w http.ResponseWriter, status int, err error) {
	respondJSON(w, status, map[string]any{"error": err.Error()})
}

func decodeJSON(r *http.Request, dst any) error {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		return fmt.Errorf("decode json: %w", err)
	}
	return nil
}

func idParam(r *http.Request, name string) string {
	return chi.URLParam(r, name)
}

func roleString(r *http.Request) string {
	return actor.FromContext(r.Context()).String()
}

func roleContext(r *http.Request) actor.ProjectRole {
	return actor.FromContext(r.Context())
}
