package mathx

import (
	"testing"
)

func TestVatFromSubtotal(t *testing.T) {
	cases := []struct {
		in   int64
		want int64
	}{
		{10000, 1200},
		{0, 0},
		{9999, 1200},
	}
	for _, c := range cases {
		got := VatFromSubtotal(c.in)
		if got != c.want {
			t.Errorf("VatFromSubtotal(%d) = %d, want %d", c.in, got, c.want)
		}
	}
}

func TestTotalFromSubtotal(t *testing.T) {
	got := TotalFromSubtotal(10000)
	if got != 11200 {
		t.Errorf("TotalFromSubtotal(10000) = %d, want 11200", got)
	}
}

func TestAllocationRemainder(t *testing.T) {
	got := AllocationRemainder(10000, []int64{3000, 4000})
	if got != 3000 {
		t.Errorf("AllocationRemainder = %d, want 3000", got)
	}
}

func TestCalculateJobCosting(t *testing.T) {
	c := CalculateJobCosting(11200, 3000, 2000, 1000)
	if c.TotalActualCostCents != 6000 {
		t.Errorf("TotalActualCostCents = %d, want 6000", c.TotalActualCostCents)
	}
	if c.NetProfitCents != 5200 {
		t.Errorf("NetProfitCents = %d, want 5200", c.NetProfitCents)
	}
	if c.VatAmountCents != 1344 {
		t.Errorf("VatAmountCents = %d, want 1344", c.VatAmountCents)
	}
}
