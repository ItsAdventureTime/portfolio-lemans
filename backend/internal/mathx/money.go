package mathx

const vatNumerator int64 = 12
const vatDenominator int64 = 100

func VatFromSubtotal(subtotalCents int64) int64 {
	if subtotalCents < 0 {
		return -VatFromSubtotal(-subtotalCents)
	}
	return (subtotalCents*vatNumerator + vatDenominator/2) / vatDenominator
}

func TotalFromSubtotal(subtotalCents int64) int64 {
	return subtotalCents + VatFromSubtotal(subtotalCents)
}

func AllocationRemainder(invoiceTotalCents int64, allocatedCents []int64) int64 {
	var sum int64
	for _, a := range allocatedCents {
		sum += a
	}
	return invoiceTotalCents - sum
}

type JobCosting struct {
	TotalActualCostCents  int64
	NetProfitCents        int64
	ProfitMarginPercent   float64
	VatAmountCents        int64
}

func CalculateJobCosting(billedCents, actualLaborCents, actualPartsCents, allocatedExpensesCents int64) JobCosting {
	totalCost := actualLaborCents + actualPartsCents + allocatedExpensesCents
	netProfit := billedCents - totalCost
	var margin float64
	if billedCents > 0 {
		margin = (float64(netProfit) / float64(billedCents)) * 100
	}
	return JobCosting{
		TotalActualCostCents: totalCost,
		NetProfitCents:       netProfit,
		ProfitMarginPercent:  margin,
		VatAmountCents:       VatFromSubtotal(billedCents),
	}
}
