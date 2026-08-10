package actor

import (
	"context"
	"fmt"
	"net/http"
	"strings"
)

type ProjectRole string

const (
	RoleAdmin      ProjectRole = "ROLE_ADMIN"
	RoleGM         ProjectRole = "ROLE_GM"
	RoleSales      ProjectRole = "ROLE_SALES"
	RoleService    ProjectRole = "ROLE_SVC"
	RolePurchasing ProjectRole = "ROLE_PURCH"
	RoleDCS        ProjectRole = "ROLE_DCS"
)

const roleHeader = "X-Demo-Role"

func (r ProjectRole) IsValid() bool {
	switch r {
	case RoleAdmin, RoleGM, RoleSales, RoleService, RolePurchasing, RoleDCS:
		return true
	}
	return false
}

func FromHeader(h http.Header) ProjectRole {
	r := ProjectRole(strings.ToUpper(strings.TrimSpace(h.Get(roleHeader))))
	if r.IsValid() {
		return r
	}
	return RoleAdmin
}

func FromContext(ctx context.Context) ProjectRole {
	if r, ok := ctx.Value(roleKey{}).(ProjectRole); ok {
		return r
	}
	return RoleAdmin
}

type roleKey struct{}

func WithRole(ctx context.Context, role ProjectRole) context.Context {
	if !role.IsValid() {
		role = RoleAdmin
	}
	return context.WithValue(ctx, roleKey{}, role)
}

func (r ProjectRole) DisplayName() string {
	switch r {
	case RoleAdmin:
		return "Admin"
	case RoleGM:
		return "General Manager"
	case RoleSales:
		return "Sales Advisor"
	case RoleService:
		return "Service Advisor"
	case RolePurchasing:
		return "Purchasing"
	case RoleDCS:
		return "DCS"
	}
	return string(r)
}

func (r ProjectRole) String() string { return string(r) }

func ParseRole(s string) (ProjectRole, error) {
	r := ProjectRole(strings.ToUpper(strings.TrimSpace(s)))
	if r.IsValid() {
		return r, nil
	}
	return "", fmt.Errorf("invalid role: %s", s)
}
