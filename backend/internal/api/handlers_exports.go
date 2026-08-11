package api

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/policy"
	"github.com/jackc/pgx/v5/pgtype"
)

type accountingExportRow struct {
	ID          string `json:"id"`
	Number      string `json:"number,omitempty"`
	Name        string `json:"name,omitempty"`
	Status      string `json:"status,omitempty"`
	Date        string `json:"date,omitempty"`
	AmountCents int64  `json:"amount_cents,omitempty"`
	Reference   string `json:"reference,omitempty"`
	Notes       string `json:"notes,omitempty"`
}

type accountingExport struct {
	SchemaVersion string                `json:"schema_version"`
	Customers     []accountingExportRow `json:"customers"`
	Vendors       []accountingExportRow `json:"vendors"`
	Bills         []accountingExportRow `json:"bills"`
	Expenses      []accountingExportRow `json:"expenses"`
	Invoices      []accountingExportRow `json:"invoices"`
	Collections   []accountingExportRow `json:"collections"`
	Payments      []accountingExportRow `json:"payments"`
}

func dateValue(value pgtype.Date) string {
	if !value.Valid {
		return ""
	}
	return value.Time.Format("2006-01-02")
}

func timestampValue(value pgtype.Timestamptz) string {
	if !value.Valid {
		return ""
	}
	return value.Time.UTC().Format("2006-01-02T15:04:05Z")
}

func stringValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func csvCell(value string) string {
	trimmed := strings.TrimLeft(value, " \t\r\n")
	if trimmed == "" {
		return value
	}
	switch trimmed[0] {
	case '=', '+', '-', '@':
		return "'" + value
	default:
		return value
	}
}

func sortExportRows(rows []accountingExportRow) {
	sort.Slice(rows, func(i, j int) bool {
		left := strings.Join([]string{rows[i].Date, rows[i].Number, rows[i].Name, rows[i].ID}, "\x00")
		right := strings.Join([]string{rows[j].Date, rows[j].Number, rows[j].Name, rows[j].ID}, "\x00")
		return left < right
	})
}

func (d *deps) buildAccountingExport(r *http.Request) (accountingExport, error) {
	ctx := r.Context()
	customers, err := d.queries.ListCustomers(ctx)
	if err != nil {
		return accountingExport{}, err
	}
	bills, err := d.queries.ListSupplierInvoices(ctx)
	if err != nil {
		return accountingExport{}, err
	}
	expenses, err := d.queries.ListOpexRequests(ctx)
	if err != nil {
		return accountingExport{}, err
	}
	invoices, err := d.queries.ListServiceInvoices(ctx)
	if err != nil {
		return accountingExport{}, err
	}
	disbursements, err := d.queries.ListDisbursements(ctx)
	if err != nil {
		return accountingExport{}, err
	}

	report := accountingExport{SchemaVersion: "1.0"}
	vendors := make(map[string]accountingExportRow)
	for _, customer := range customers {
		report.Customers = append(report.Customers, accountingExportRow{
			ID: customer.ID, Number: customer.CustomerNo, Name: customer.Name,
			Reference: stringValue(customer.Tin), Notes: stringValue(customer.Address),
		})
	}
	for _, bill := range bills {
		supplier := stringValue(bill.Supplier)
		if supplier != "" {
			vendors[strings.ToLower(supplier)] = accountingExportRow{ID: strings.ToLower(supplier), Name: supplier}
		}
		report.Bills = append(report.Bills, accountingExportRow{
			ID: bill.ID, Number: bill.SiNo, Name: supplier, Status: string(bill.Status),
			Date: dateValue(bill.InvoiceDate), AmountCents: bill.TotalAmountCents,
			Reference: stringValue(bill.PurchaseOrderNo), Notes: stringValue(bill.Notes),
		})
	}
	for _, vendor := range vendors {
		report.Vendors = append(report.Vendors, vendor)
	}
	for _, expense := range expenses {
		report.Expenses = append(report.Expenses, accountingExportRow{
			ID: expense.ID, Number: expense.RequestNo, Name: expense.Category,
			Status: string(expense.Status), Date: timestampValue(expense.RequestedAt),
			AmountCents: expense.AmountCents, Reference: expense.RequestedByRole,
			Notes: stringValue(expense.Notes),
		})
	}
	for _, invoice := range invoices {
		report.Invoices = append(report.Invoices, accountingExportRow{
			ID: invoice.ID, Number: invoice.InvoiceNo, Name: invoice.CustomerName,
			Status: string(invoice.Status), Date: dateValue(invoice.IssueDate),
			AmountCents: invoice.TotalCents, Reference: stringValue(invoice.JobOrderNo),
			Notes: stringValue(invoice.Notes),
		})
		collections, err := d.queries.ListPaymentsByInvoice(ctx, invoice.ID)
		if err != nil {
			return accountingExport{}, err
		}
		for _, collection := range collections {
			report.Collections = append(report.Collections, accountingExportRow{
				ID: collection.ID, Number: invoice.InvoiceNo, Name: invoice.CustomerName,
				Date: timestampValue(collection.PaidAt), AmountCents: collection.AmountCents,
				Reference: stringValue(collection.ReferenceNo), Notes: collection.PaymentMethod,
			})
		}
	}
	for _, payment := range disbursements {
		report.Payments = append(report.Payments, accountingExportRow{
			ID: payment.ID, Number: payment.DisbursementNo, Status: string(payment.Status),
			Date: timestampValue(payment.PaidAt), AmountCents: payment.AmountCents,
			Reference: stringValue(payment.ReferenceNo), Notes: stringValue(payment.PaymentMethod),
		})
	}

	sortExportRows(report.Customers)
	sortExportRows(report.Vendors)
	sortExportRows(report.Bills)
	sortExportRows(report.Expenses)
	sortExportRows(report.Invoices)
	sortExportRows(report.Collections)
	sortExportRows(report.Payments)
	return report, nil
}

func accountingCSV(report accountingExport) ([]byte, error) {
	var buffer bytes.Buffer
	if _, err := buffer.WriteString("\ufeff"); err != nil {
		return nil, err
	}
	csvWriter := csv.NewWriter(&buffer)
	if err := csvWriter.Write([]string{"entity", "id", "number", "name", "status", "date", "amount_cents", "reference", "notes"}); err != nil {
		return nil, err
	}
	for _, group := range []struct {
		name string
		rows []accountingExportRow
	}{
		{"customers", report.Customers}, {"vendors", report.Vendors}, {"bills", report.Bills},
		{"expenses", report.Expenses}, {"invoices", report.Invoices}, {"collections", report.Collections},
		{"payments", report.Payments},
	} {
		for _, row := range group.rows {
			if err := csvWriter.Write([]string{
				csvCell(group.name), csvCell(row.ID), csvCell(row.Number), csvCell(row.Name),
				csvCell(row.Status), csvCell(row.Date), strconv.FormatInt(row.AmountCents, 10),
				csvCell(row.Reference), csvCell(row.Notes),
			}); err != nil {
				return nil, err
			}
		}
	}
	csvWriter.Flush()
	if err := csvWriter.Error(); err != nil {
		return nil, err
	}
	return buffer.Bytes(), nil
}

func writeAccountingCSV(w http.ResponseWriter, report accountingExport) error {
	payload, err := accountingCSV(report)
	if err != nil {
		return err
	}
	_, err = w.Write(payload)
	return err
}

func (d *deps) handleAccountingExport(w http.ResponseWriter, r *http.Request) {
	if err := requirePermission(r.Context(), policy.ViewAccounting); err != nil {
		respondError(w, http.StatusForbidden, err)
		return
	}
	report, err := d.buildAccountingExport(r)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err)
		return
	}

	format := idParam(r, "format")
	switch format {
	case "json":
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.Header().Set("Content-Disposition", `attachment; filename="lemans-accounting-export.json"`)
		if err := json.NewEncoder(w).Encode(report); err != nil {
			respondError(w, http.StatusInternalServerError, err)
		}
	case "csv":
		payload, err := accountingCSV(report)
		if err != nil {
			respondError(w, http.StatusInternalServerError, fmt.Errorf("encode csv: %w", err))
			return
		}
		w.Header().Set("Content-Type", "text/csv; charset=utf-8")
		w.Header().Set("Content-Disposition", `attachment; filename="lemans-accounting-export.csv"`)
		_, _ = w.Write(payload)
	default:
		respondError(w, http.StatusNotFound, fmt.Errorf("unsupported export format %q", format))
	}
}
