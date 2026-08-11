package api

import (
	"encoding/csv"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestWriteAccountingCSVIsDeterministicAndExcelCompatible(t *testing.T) {
	report := accountingExport{
		SchemaVersion: "1.0",
		Customers:     []accountingExportRow{{ID: "customer-1", Number: "C-001", Name: "Ana, Inc."}},
		Invoices:      []accountingExportRow{{ID: "invoice-1", Number: "INV-001", AmountCents: 12500}},
	}
	response := httptest.NewRecorder()
	if err := writeAccountingCSV(response, report); err != nil {
		t.Fatalf("write CSV: %v", err)
	}
	output := response.Body.String()
	if !strings.HasPrefix(output, "\ufeffentity,id,number,name,status,date,amount_cents,reference,notes") {
		t.Fatalf("missing UTF-8 BOM or header: %q", output)
	}
	if !strings.Contains(output, "customers,customer-1,C-001,\"Ana, Inc.\"") {
		t.Fatalf("customer row was not correctly escaped: %q", output)
	}
	if !strings.Contains(output, "invoices,invoice-1,INV-001,,,,12500") {
		t.Fatalf("invoice row missing: %q", output)
	}
}

func TestAccountingCSVNeutralizesSpreadsheetFormulas(t *testing.T) {
	report := accountingExport{
		Customers: []accountingExportRow{{
			ID: "customer-1", Name: "=HYPERLINK(\"https://example.test\",\"click\")", Notes: " \t+1+1",
		}},
	}
	payload, err := accountingCSV(report)
	if err != nil {
		t.Fatalf("encode CSV: %v", err)
	}
	records, err := csv.NewReader(strings.NewReader(strings.TrimPrefix(string(payload), "\ufeff"))).ReadAll()
	if err != nil {
		t.Fatalf("read CSV: %v", err)
	}
	if got, want := records[1][3], "'=HYPERLINK(\"https://example.test\",\"click\")"; got != want {
		t.Errorf("formula cell = %q, want %q", got, want)
	}
	if got, want := records[1][8], "' \t+1+1"; got != want {
		t.Errorf("leading-whitespace formula cell = %q, want %q", got, want)
	}
}
