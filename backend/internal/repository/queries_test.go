package repository

import (
	"strings"
	"testing"
)

func TestListJobOrdersByCustomerQueryFiltersAndOrders(t *testing.T) {
	query := strings.Join(strings.Fields(listJobOrdersByCustomer), " ")
	if !strings.Contains(query, "WHERE jo.customer_id = $1") {
		t.Fatalf("customer history query must filter by customer: %q", query)
	}
	if !strings.Contains(query, "ORDER BY jo.created_at DESC") {
		t.Fatalf("customer history query must order newest first: %q", query)
	}
}
