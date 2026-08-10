package actor

import (
	"net/http"
	"testing"
)

func TestFromHeader(t *testing.T) {
	h := http.Header{}
	if FromHeader(h) != RoleAdmin {
		t.Error("empty header should default to admin")
	}
	h.Set(roleHeader, "ROLE_SALES")
	if FromHeader(h) != RoleSales {
		t.Errorf("expected sales, got %s", FromHeader(h))
	}
	h.Set(roleHeader, "role_sales")
	if FromHeader(h) != RoleSales {
		t.Errorf("expected sales after lower-case trim, got %s", FromHeader(h))
	}
	h.Set(roleHeader, "unknown")
	if FromHeader(h) != RoleAdmin {
		t.Error("unknown role should default to admin")
	}
}

func TestParseRole(t *testing.T) {
	r, err := ParseRole("ROLE_GM")
	if err != nil || r != RoleGM {
		t.Errorf("ParseRole(ROLE_GM) = %v, %v", r, err)
	}
	if _, err := ParseRole("bad"); err == nil {
		t.Error("ParseRole(bad) should error")
	}
}

func TestDisplayName(t *testing.T) {
	if RoleDCS.DisplayName() != "DCS" {
		t.Errorf("DisplayName = %s", RoleDCS.DisplayName())
	}
}
