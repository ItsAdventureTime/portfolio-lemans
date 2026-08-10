-- +goose Up
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Money columns are stored as integer bigint cents to avoid floating-point arithmetic.

CREATE TABLE customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_no text NOT NULL UNIQUE,
    name text NOT NULL,
    tin text,
    address text,
    phone text,
    email text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    plate_no text NOT NULL UNIQUE,
    vin_chassis text,
    engine_no text,
    make_model text NOT NULL,
    year text,
    color text,
    odometer integer,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE quote_status AS ENUM ('DRAFT', 'APPROVED', 'CONVERTED', 'REJECTED');
CREATE TYPE item_type AS ENUM ('LABOR', 'PARTS', 'MISC');
CREATE TYPE jo_status AS ENUM ('DRAFT', 'APPROVED', 'IN_PROGRESS', 'PARTS_PENDING', 'COMPLETED', 'BILLED', 'CLOSED');
CREATE TYPE pr_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONVERTED_TO_PO');
CREATE TYPE po_status AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'RECEIVED', 'CLOSED');
CREATE TYPE si_status AS ENUM ('DRAFT', 'ALLOCATED', 'APPROVED', 'PAID', 'CANCELLED');
CREATE TYPE opex_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'DISBURSED');
CREATE TYPE disbursement_status AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');
CREATE TYPE service_invoice_status AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'PAID', 'CANCELLED');

CREATE TABLE sales_quotations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_no text NOT NULL UNIQUE,
    customer_id uuid NOT NULL REFERENCES customers(id),
    vehicle_id uuid NOT NULL REFERENCES vehicles(id),
    advisor text NOT NULL,
    total_labor_cents bigint NOT NULL DEFAULT 0,
    total_parts_cents bigint NOT NULL DEFAULT 0,
    net_total_cents bigint NOT NULL DEFAULT 0,
    status quote_status NOT NULL DEFAULT 'DRAFT',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sales_quotation_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id uuid NOT NULL REFERENCES sales_quotations(id) ON DELETE CASCADE,
    item_type item_type NOT NULL,
    description text NOT NULL,
    quantity numeric(12,4) NOT NULL DEFAULT 1,
    unit_price_cents bigint NOT NULL DEFAULT 0,
    discount_cents bigint NOT NULL DEFAULT 0,
    net_amount_cents bigint NOT NULL DEFAULT 0,
    CHECK (quantity >= 0)
);

CREATE TABLE job_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    jo_no text NOT NULL UNIQUE,
    sq_id uuid REFERENCES sales_quotations(id),
    customer_id uuid NOT NULL REFERENCES customers(id),
    vehicle_id uuid NOT NULL REFERENCES vehicles(id),
    advisor text NOT NULL,
    technician text,
    cube_topper_no text,
    promised_date timestamptz,
    payment_mode text,
    insurer_loa text,
    status jo_status NOT NULL DEFAULT 'IN_PROGRESS',
    total_estimated_labor_cents bigint NOT NULL DEFAULT 0,
    total_estimated_parts_cents bigint NOT NULL DEFAULT 0,
    actual_labor_cost_cents bigint NOT NULL DEFAULT 0,
    actual_parts_cost_cents bigint NOT NULL DEFAULT 0,
    billed_amount_cents bigint NOT NULL DEFAULT 0,
    net_profit_cents bigint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE job_order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    jo_id uuid NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
    item_type item_type NOT NULL,
    description text NOT NULL,
    quantity numeric(12,4) NOT NULL DEFAULT 1,
    unit_price_cents bigint NOT NULL DEFAULT 0,
    discount_cents bigint NOT NULL DEFAULT 0,
    net_amount_cents bigint NOT NULL DEFAULT 0,
    CHECK (quantity >= 0)
);

CREATE TABLE job_order_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    jo_id uuid NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    description text NOT NULL,
    created_by_role text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_order_events_jo_id ON job_order_events(jo_id);

CREATE TABLE attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    file_name text NOT NULL,
    content_type text NOT NULL,
    size_bytes integer NOT NULL,
    storage_key text NOT NULL UNIQUE,
    created_by_role text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);

CREATE TABLE purchase_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_no text NOT NULL UNIQUE,
    jo_id uuid REFERENCES job_orders(id),
    status pr_status NOT NULL DEFAULT 'DRAFT',
    requested_by_role text NOT NULL,
    requested_at timestamptz NOT NULL DEFAULT now(),
    approved_by_role text,
    approved_at timestamptz,
    supplier text,
    notes text
);

CREATE TABLE purchase_request_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_id uuid NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
    description text NOT NULL,
    quantity numeric(12,4) NOT NULL DEFAULT 1,
    unit_cost_cents bigint NOT NULL DEFAULT 0,
    total_cents bigint NOT NULL DEFAULT 0,
    CHECK (quantity >= 0)
);

CREATE TABLE purchase_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    po_no text NOT NULL UNIQUE,
    pr_id uuid UNIQUE REFERENCES purchase_requests(id),
    status po_status NOT NULL DEFAULT 'DRAFT',
    supplier text,
    total_cents bigint NOT NULL DEFAULT 0,
    ordered_at timestamptz,
    received_at timestamptz,
    notes text
);

CREATE TABLE purchase_order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    description text NOT NULL,
    quantity numeric(12,4) NOT NULL DEFAULT 1,
    unit_cost_cents bigint NOT NULL DEFAULT 0,
    total_cents bigint NOT NULL DEFAULT 0,
    received_qty numeric(12,4) NOT NULL DEFAULT 0,
    CHECK (quantity >= 0)
);

CREATE TABLE supplier_invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    si_no text NOT NULL UNIQUE,
    po_id uuid REFERENCES purchase_orders(id),
    supplier text,
    invoice_date date,
    due_date date,
    total_amount_cents bigint NOT NULL DEFAULT 0,
    status si_status NOT NULL DEFAULT 'DRAFT',
    notes text
);

CREATE TABLE supplier_invoice_allocations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    si_id uuid NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
    jo_id uuid NOT NULL REFERENCES job_orders(id),
    amount_cents bigint NOT NULL DEFAULT 0,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(si_id, jo_id)
);

CREATE INDEX idx_si_allocations_si_id ON supplier_invoice_allocations(si_id);
CREATE INDEX idx_si_allocations_jo_id ON supplier_invoice_allocations(jo_id);

CREATE TABLE opex_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_no text NOT NULL UNIQUE,
    category text NOT NULL,
    description text NOT NULL,
    amount_cents bigint NOT NULL DEFAULT 0,
    requested_by_role text NOT NULL,
    status opex_status NOT NULL DEFAULT 'DRAFT',
    requested_at timestamptz NOT NULL DEFAULT now(),
    approved_by_role text,
    approved_at timestamptz,
    notes text
);

CREATE TABLE disbursements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    disbursement_no text NOT NULL UNIQUE,
    opex_request_id uuid UNIQUE REFERENCES opex_requests(id),
    supplier_invoice_id uuid UNIQUE REFERENCES supplier_invoices(id),
    amount_cents bigint NOT NULL DEFAULT 0,
    status disbursement_status NOT NULL DEFAULT 'PENDING',
    payment_method text,
    reference_no text,
    paid_at timestamptz,
    proof_attachment_key text,
    recorded_by_role text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE service_invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no text NOT NULL UNIQUE,
    jo_id uuid UNIQUE REFERENCES job_orders(id),
    customer_id uuid NOT NULL REFERENCES customers(id),
    issue_date date NOT NULL DEFAULT current_date,
    subtotal_cents bigint NOT NULL DEFAULT 0,
    vat_amount_cents bigint NOT NULL DEFAULT 0,
    total_cents bigint NOT NULL DEFAULT 0,
    amount_paid_cents bigint NOT NULL DEFAULT 0,
    status service_invoice_status NOT NULL DEFAULT 'DRAFT',
    due_date date,
    notes text
);

CREATE TABLE payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_invoice_id uuid NOT NULL REFERENCES service_invoices(id) ON DELETE CASCADE,
    amount_cents bigint NOT NULL DEFAULT 0,
    payment_method text NOT NULL,
    reference_no text,
    paid_at timestamptz NOT NULL DEFAULT now(),
    recorded_by_role text
);

CREATE INDEX idx_payments_invoice_id ON payments(service_invoice_id);
