package api

import (
	"regexp"
	"testing"
)

func TestValidateQuoteItems(t *testing.T) {
	valid := []quoteItemReq{{
		ItemType:    "LABOR",
		Description: "Wheel alignment",
		Quantity:    1,
		UnitPrice:   150000,
		Discount:    0,
	}}

	if err := validateQuoteItems(valid); err != nil {
		t.Fatalf("validate valid item: %v", err)
	}

	for name, items := range map[string][]quoteItemReq{
		"empty":           nil,
		"unknown type":    {{ItemType: "OTHER", Description: "x", Quantity: 1, UnitPrice: 1}},
		"blank text":      {{ItemType: "LABOR", Quantity: 1, UnitPrice: 1}},
		"zero quantity":   {{ItemType: "LABOR", Description: "x", UnitPrice: 1}},
		"negative amount": {{ItemType: "LABOR", Description: "x", Quantity: 1, UnitPrice: -1}},
		"excess discount": {{ItemType: "LABOR", Description: "x", Quantity: 1, UnitPrice: 100, Discount: 101}},
	} {
		t.Run(name, func(t *testing.T) {
			if err := validateQuoteItems(items); err == nil {
				t.Fatal("expected validation error")
			}
		})
	}
}

func TestDocumentNumberIsUniqueAndReadable(t *testing.T) {
	first, err := documentNumber("SQ")
	if err != nil {
		t.Fatalf("first document number: %v", err)
	}
	second, err := documentNumber("SQ")
	if err != nil {
		t.Fatalf("second document number: %v", err)
	}
	if first == second {
		t.Fatal("document numbers must not collide")
	}
	if !regexp.MustCompile(`^SQ-\d{4}-[0-9A-F]{12}$`).MatchString(first) {
		t.Fatalf("unexpected document number format: %q", first)
	}
}
