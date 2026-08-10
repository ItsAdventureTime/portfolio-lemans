package policy

import (
	"testing"

	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/actor"
)

func TestHasPermission(t *testing.T) {
	if !HasPermission(actor.RoleAdmin, ViewAccounting) {
		t.Error("admin should have viewAccounting")
	}
	if HasPermission(actor.RoleGM, ViewAccounting) {
		t.Error("GM should not have viewAccounting")
	}
	if !HasPermission(actor.RoleGM, ViewJobCosting) {
		t.Error("GM should have viewJobCosting")
	}
}

func TestEnsure(t *testing.T) {
	if err := Ensure(actor.RoleSales, CustomerCreate); err != nil {
		t.Errorf("sales should create customers: %v", err)
	}
	if err := Ensure(actor.RoleDCS, ViewAccounting); err == nil {
		t.Error("DCS should not view accounting")
	}
}
