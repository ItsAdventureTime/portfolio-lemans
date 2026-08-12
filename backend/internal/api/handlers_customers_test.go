package api

import (
	"testing"

	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/repository"
)

func TestNormalizeCustomerServiceHistoryReturnsEmptyArray(t *testing.T) {
	history := normalizeCustomerServiceHistory(nil)
	if history == nil {
		t.Fatal("customer service history must encode as an empty array, not null")
	}
	if len(history) != 0 {
		t.Fatalf("empty customer service history length = %d, want 0", len(history))
	}

	item := repository.ListJobOrdersByCustomerRow{JoNo: "JO-001"}
	preserved := normalizeCustomerServiceHistory([]repository.ListJobOrdersByCustomerRow{item})
	if len(preserved) != 1 || preserved[0].JoNo != item.JoNo {
		t.Fatalf("non-empty customer service history was not preserved: %+v", preserved)
	}
}
