package policy

import (
	"fmt"

	"github.com/ItsAdventureTime/bridge-lemans/backend/internal/actor"
)

type Action string

const (
	CustomerCreate          Action = "customerCreate"
	QuoteApprove            Action = "quoteApprove"
	QuoteConvert            Action = "quoteConvert"
	SalesQuotationCreate    Action = "salesQuotationCreate"
	JOAssignTech            Action = "joAssignTech"
	JOChangeStatus          Action = "joChangeStatus"
	AttachmentView          Action = "attachmentView"
	AttachmentUpload        Action = "attachmentUpload"
	PRCreate                Action = "prCreate"
	PRApprove               Action = "prApprove"
	POCreate                Action = "poCreate"
	SupplierInvoiceCreate   Action = "supplierInvoiceCreate"
	SupplierInvoiceAllocate Action = "supplierInvoiceAllocate"
	SupplierInvoiceApprove  Action = "supplierInvoiceApprove"
	OpexCreate              Action = "opexCreate"
	OpexApprove             Action = "opexApprove"
	DisburseApprove         Action = "disburseApprove"
	DisburseRecordPayment   Action = "disburseRecordPayment"
	InvoiceCreate           Action = "invoiceCreate"
	InvoiceRecordPayment    Action = "invoiceRecordPayment"
	ViewAccounting          Action = "viewAccounting"
	ViewJobCosting          Action = "viewJobCosting"
)

var permissions = map[Action][]actor.ProjectRole{
	CustomerCreate:          {actor.RoleAdmin, actor.RoleSales, actor.RoleService},
	QuoteApprove:            {actor.RoleAdmin, actor.RoleSales, actor.RoleGM},
	QuoteConvert:            {actor.RoleAdmin, actor.RoleSales, actor.RoleService, actor.RoleGM},
	SalesQuotationCreate:    {actor.RoleAdmin, actor.RoleSales, actor.RoleService, actor.RoleGM},
	JOAssignTech:            {actor.RoleAdmin, actor.RoleService, actor.RoleGM},
	JOChangeStatus:          {actor.RoleAdmin, actor.RoleService, actor.RoleGM},
	AttachmentView:          {actor.RoleAdmin, actor.RoleService, actor.RoleGM, actor.RoleDCS},
	AttachmentUpload:        {actor.RoleAdmin, actor.RoleService, actor.RoleDCS},
	PRCreate:                {actor.RoleAdmin, actor.RolePurchasing, actor.RoleGM},
	PRApprove:               {actor.RoleAdmin, actor.RoleGM},
	POCreate:                {actor.RoleAdmin, actor.RoleGM},
	SupplierInvoiceCreate:   {actor.RoleAdmin, actor.RolePurchasing, actor.RoleGM},
	SupplierInvoiceAllocate: {actor.RoleAdmin, actor.RolePurchasing, actor.RoleGM},
	SupplierInvoiceApprove:  {actor.RoleAdmin, actor.RoleGM},
	OpexCreate:              {actor.RoleAdmin, actor.RoleSales, actor.RoleService, actor.RolePurchasing, actor.RoleGM},
	OpexApprove:             {actor.RoleAdmin, actor.RoleGM},
	DisburseApprove:         {actor.RoleAdmin, actor.RoleGM},
	DisburseRecordPayment:   {actor.RoleAdmin, actor.RoleDCS},
	InvoiceCreate:           {actor.RoleAdmin, actor.RoleSales},
	InvoiceRecordPayment:    {actor.RoleAdmin, actor.RoleSales, actor.RoleDCS},
	ViewAccounting:          {actor.RoleAdmin},
	ViewJobCosting:          {actor.RoleAdmin, actor.RoleGM},
}

func HasPermission(role actor.ProjectRole, action Action) bool {
	allowed, ok := permissions[action]
	if !ok {
		return false
	}
	for _, r := range allowed {
		if r == role {
			return true
		}
	}
	return false
}

func Ensure(role actor.ProjectRole, action Action) error {
	if !HasPermission(role, action) {
		return fmt.Errorf("forbidden: role %s lacks permission %s", role, action)
	}
	return nil
}
