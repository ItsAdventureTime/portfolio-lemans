export interface Customer {
  id: string;
  customer_no: string;
  name: string;
  tin?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  plate_no: string;
  make_model: string;
  vin_chassis?: string;
  engine_no?: string;
  year?: string;
  color?: string;
  odometer?: number;
}

export interface Quote {
  id: string;
  quote_no: string;
  customer_id: string;
  customer_name: string;
  vehicle_id: string;
  vehicle_plate: string;
  net_total_cents: number;
  status: string;
}

export interface QuoteItemInput {
  itemType: 'LABOR' | 'PARTS' | 'MISC';
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
}

export interface JobOrder {
  id: string;
  jo_no: string;
  customer_id: string;
  customer_name: string;
  vehicle_id: string;
  vehicle_plate: string;
  vehicle_make_model?: string;
  advisor?: string;
  technician?: string;
  status: string;
  total_estimated_labor_cents?: number;
  total_estimated_parts_cents?: number;
  actual_labor_cost_cents?: number;
  actual_parts_cost_cents?: number;
  billed_amount_cents?: number;
  net_profit_cents?: number;
  created_at?: string;
}

export interface JobOrderItem {
  id: string;
  job_order_id: string;
  item_type: string;
  description: string;
  quantity: number;
  net_amount_cents: number;
}

export interface JobOrderEvent {
  id: string;
  job_order_id: string;
  event_type: string;
  description?: string;
  created_at: string;
}

export interface PurchaseRequest {
  id: string;
  pr_no: string;
  supplier?: string;
  status: string;
}

export interface PurchaseRequestItemInput {
  description: string;
  quantity: number;
  unitCostCents: number;
}

export interface SupplierInvoice {
  id: string;
  si_no: string;
  supplier?: string;
  total_amount_cents: number;
  status: string;
}

export interface OpexRequest {
  id: string;
  request_no: string;
  category: string;
  description: string;
  amount_cents: number;
  status: string;
}

export interface Disbursement {
  id: string;
  disbursement_no: string;
  opex_request_no?: string;
  supplier_invoice_no?: string;
  amount_cents: number;
  status: string;
  proof_attachment_key?: string;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  customer_id: string;
  customer_name: string;
  subtotal_cents: number;
  vat_amount_cents: number;
  total_cents: number;
  amount_paid_cents: number;
  status: string;
  notes?: string;
}

export interface Payment {
  id: string;
  invoice_id?: string;
  disbursement_id?: string;
  payment_method: string;
  reference_no?: string;
  amount_cents: number;
  paid_at: string;
}

export interface JobCostingSummary {
  jobOrder: JobOrder;
  totalEstimatedLaborCents: number;
  totalEstimatedPartsCents: number;
  actualLaborCostCents: number;
  actualPartsCostCents: number;
  partsAllocatedCents: number;
  totalActualCostCents: number;
  billedAmountCents: number;
  netProfitCents: number;
  profitMarginPercent: number;
}

export interface DashboardSummary {
  counts: {
    activeJobOrders: number;
    partsPendingJobOrders: number;
    completedJobOrders: number;
    pendingPurchaseRequests: number;
  };
  financials: {
    billedCents: number;
    actualCostCents: number;
    netProfitCents: number;
  };
  recentJobOrders: JobOrder[];
}

export interface AccountingSummary {
  customers: Customer[];
  invoices: Invoice[];
}
