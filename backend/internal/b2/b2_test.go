package b2

import "testing"

func TestObjectKeyUsesProfilePrefix(t *testing.T) {
	client := &Client{keyPrefix: "lemans/demo"}
	if got := client.objectKey("attachments/dcs-payment/1/receipt.jpg"); got != "lemans/demo/attachments/dcs-payment/1/receipt.jpg" {
		t.Fatalf("object key = %q", got)
	}
}

func TestObjectKeyDoesNotDuplicateEmptyPrefix(t *testing.T) {
	client := &Client{}
	if got := client.objectKey("/attachments/file.jpg"); got != "attachments/file.jpg" {
		t.Fatalf("object key = %q", got)
	}
}
