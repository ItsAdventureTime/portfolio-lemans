-- name: ListCustomers :many
SELECT id, customer_no, name, tin, address, phone, email, created_at, updated_at
FROM customers
ORDER BY name;

-- name: GetCustomer :one
SELECT id, customer_no, name, tin, address, phone, email, created_at, updated_at
FROM customers
WHERE id = $1;

-- name: GetCustomerByNo :one
SELECT id, customer_no, name, tin, address, phone, email, created_at, updated_at
FROM customers
WHERE customer_no = $1;

-- name: CreateCustomer :one
INSERT INTO customers (customer_no, name, tin, address, phone, email)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, customer_no, name, tin, address, phone, email, created_at, updated_at;

-- name: UpdateCustomer :one
UPDATE customers
SET name = $2, tin = $3, address = $4, phone = $5, email = $6, updated_at = now()
WHERE id = $1
RETURNING id, customer_no, name, tin, address, phone, email, created_at, updated_at;

-- name: ListVehicles :many
SELECT id, customer_id, plate_no, vin_chassis, engine_no, make_model, year, color, odometer, created_at, updated_at
FROM vehicles
ORDER BY created_at;

-- name: ListVehiclesByCustomer :many
SELECT id, customer_id, plate_no, vin_chassis, engine_no, make_model, year, color, odometer, created_at, updated_at
FROM vehicles
WHERE customer_id = $1
ORDER BY created_at;

-- name: GetVehicle :one
SELECT id, customer_id, plate_no, vin_chassis, engine_no, make_model, year, color, odometer, created_at, updated_at
FROM vehicles
WHERE id = $1;

-- name: GetVehicleByPlate :one
SELECT id, customer_id, plate_no, vin_chassis, engine_no, make_model, year, color, odometer, created_at, updated_at
FROM vehicles
WHERE plate_no = $1;

-- name: CreateVehicle :one
INSERT INTO vehicles (customer_id, plate_no, vin_chassis, engine_no, make_model, year, color, odometer)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, customer_id, plate_no, vin_chassis, engine_no, make_model, year, color, odometer, created_at, updated_at;

-- name: CountCustomers :one
SELECT count(*) FROM customers;

-- name: CountVehiclesByCustomer :one
SELECT count(*) FROM vehicles WHERE customer_id = $1;

-- name: CountQuotations :one
SELECT count(*) FROM sales_quotations;

-- name: CountJobOrders :one
SELECT count(*) FROM job_orders;

-- name: UpdateQuotationTotals :one
UPDATE sales_quotations
SET total_labor_cents = $2, total_parts_cents = $3, net_total_cents = $4, updated_at = now()
WHERE id = $1
RETURNING id, quote_no, customer_id, vehicle_id, advisor, total_labor_cents, total_parts_cents, net_total_cents, status, created_at, updated_at;

-- name: ListSalesQuotations :many
SELECT sq.id, sq.quote_no, sq.customer_id, sq.vehicle_id, sq.advisor,
       sq.total_labor_cents, sq.total_parts_cents, sq.net_total_cents, sq.status,
       c.name AS customer_name, v.plate_no AS vehicle_plate, v.make_model AS vehicle_make_model,
       sq.created_at, sq.updated_at
FROM sales_quotations sq
JOIN customers c ON c.id = sq.customer_id
JOIN vehicles v ON v.id = sq.vehicle_id
ORDER BY sq.created_at DESC;

-- name: GetSalesQuotation :one
SELECT sq.id, sq.quote_no, sq.customer_id, sq.vehicle_id, sq.advisor,
       sq.total_labor_cents, sq.total_parts_cents, sq.net_total_cents, sq.status,
       c.name AS customer_name, v.plate_no AS vehicle_plate, v.make_model AS vehicle_make_model,
       sq.created_at, sq.updated_at
FROM sales_quotations sq
JOIN customers c ON c.id = sq.customer_id
JOIN vehicles v ON v.id = sq.vehicle_id
WHERE sq.id = $1;

-- name: CreateSalesQuotation :one
INSERT INTO sales_quotations (quote_no, customer_id, vehicle_id, advisor, total_labor_cents, total_parts_cents, net_total_cents, status)
VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT')
RETURNING id, quote_no, customer_id, vehicle_id, advisor, total_labor_cents, total_parts_cents, net_total_cents, status, created_at, updated_at;

-- name: UpdateQuotationStatus :one
UPDATE sales_quotations
SET status = $2, updated_at = now()
WHERE id = $1
RETURNING id, quote_no, customer_id, vehicle_id, advisor, total_labor_cents, total_parts_cents, net_total_cents, status, created_at, updated_at;

-- name: ListQuotationItems :many
SELECT id, quote_id, item_type, description, quantity, unit_price_cents, discount_cents, net_amount_cents
FROM sales_quotation_items
WHERE quote_id = $1;

-- name: CreateQuotationItem :one
INSERT INTO sales_quotation_items (quote_id, item_type, description, quantity, unit_price_cents, discount_cents, net_amount_cents)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, quote_id, item_type, description, quantity, unit_price_cents, discount_cents, net_amount_cents;

-- name: CreateJobOrder :one
INSERT INTO job_orders (jo_no, sq_id, customer_id, vehicle_id, advisor, status,
  total_estimated_labor_cents, total_estimated_parts_cents)
VALUES ($1, $2, $3, $4, $5, 'IN_PROGRESS', $6, $7)
RETURNING id, jo_no, sq_id, customer_id, vehicle_id, advisor, technician, status,
  total_estimated_labor_cents, total_estimated_parts_cents, actual_labor_cost_cents,
  actual_parts_cost_cents, billed_amount_cents, net_profit_cents, created_at, updated_at;

-- name: CreateJobOrderItem :one
INSERT INTO job_order_items (jo_id, item_type, description, quantity, unit_price_cents, discount_cents, net_amount_cents)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, jo_id, item_type, description, quantity, unit_price_cents, discount_cents, net_amount_cents;

-- name: ListJobOrders :many
SELECT jo.id, jo.jo_no, jo.sq_id, jo.customer_id, jo.vehicle_id, jo.advisor,
       jo.technician, jo.status,
       jo.total_estimated_labor_cents, jo.total_estimated_parts_cents,
       jo.actual_labor_cost_cents, jo.actual_parts_cost_cents, jo.billed_amount_cents, jo.net_profit_cents,
       c.name AS customer_name, v.plate_no AS vehicle_plate, v.make_model AS vehicle_make_model,
       jo.created_at, jo.updated_at
FROM job_orders jo
JOIN customers c ON c.id = jo.customer_id
JOIN vehicles v ON v.id = jo.vehicle_id
ORDER BY jo.created_at DESC;

-- name: ListJobOrdersByCustomer :many
SELECT jo.id, jo.jo_no, jo.sq_id, jo.customer_id, jo.vehicle_id, jo.advisor,
       jo.technician, jo.status,
       jo.total_estimated_labor_cents, jo.total_estimated_parts_cents,
       jo.actual_labor_cost_cents, jo.actual_parts_cost_cents, jo.billed_amount_cents, jo.net_profit_cents,
       c.name AS customer_name, v.plate_no AS vehicle_plate, v.make_model AS vehicle_make_model,
       jo.created_at, jo.updated_at
FROM job_orders jo
JOIN customers c ON c.id = jo.customer_id
JOIN vehicles v ON v.id = jo.vehicle_id
WHERE jo.customer_id = $1
ORDER BY jo.created_at DESC;

-- name: GetJobOrder :one
SELECT jo.id, jo.jo_no, jo.sq_id, jo.customer_id, jo.vehicle_id, jo.advisor,
       jo.technician, jo.status,
       jo.total_estimated_labor_cents, jo.total_estimated_parts_cents,
       jo.actual_labor_cost_cents, jo.actual_parts_cost_cents, jo.billed_amount_cents, jo.net_profit_cents,
       c.name AS customer_name, v.plate_no AS vehicle_plate, v.make_model AS vehicle_make_model,
       jo.created_at, jo.updated_at
FROM job_orders jo
JOIN customers c ON c.id = jo.customer_id
JOIN vehicles v ON v.id = jo.vehicle_id
WHERE jo.id = $1;

-- name: GetJobOrderByNo :one
SELECT jo.id, jo.jo_no, jo.sq_id, jo.customer_id, jo.vehicle_id, jo.advisor,
       jo.technician, jo.status,
       jo.total_estimated_labor_cents, jo.total_estimated_parts_cents,
       jo.actual_labor_cost_cents, jo.actual_parts_cost_cents, jo.billed_amount_cents, jo.net_profit_cents,
       c.name AS customer_name, v.plate_no AS vehicle_plate, v.make_model AS vehicle_make_model,
       jo.created_at, jo.updated_at
FROM job_orders jo
JOIN customers c ON c.id = jo.customer_id
JOIN vehicles v ON v.id = jo.vehicle_id
WHERE jo.jo_no = $1;

-- name: UpdateJobOrderTechnician :one
UPDATE job_orders
SET technician = $2, updated_at = now()
WHERE id = $1
RETURNING id, jo_no, sq_id, customer_id, vehicle_id, advisor, technician, status,
  total_estimated_labor_cents, total_estimated_parts_cents, actual_labor_cost_cents,
  actual_parts_cost_cents, billed_amount_cents, net_profit_cents, created_at, updated_at;

-- name: UpdateJobOrderStatus :one
UPDATE job_orders
SET status = $2, updated_at = now()
WHERE id = $1
RETURNING id, jo_no, sq_id, customer_id, vehicle_id, advisor, technician, status,
  total_estimated_labor_cents, total_estimated_parts_cents, actual_labor_cost_cents,
  actual_parts_cost_cents, billed_amount_cents, net_profit_cents, created_at, updated_at;

-- name: ListJobOrderEvents :many
SELECT id, jo_id, event_type, description, created_by_role, created_at
FROM job_order_events
WHERE jo_id = $1
ORDER BY created_at;

-- name: CreateJobOrderEvent :one
INSERT INTO job_order_events (jo_id, event_type, description, created_by_role)
VALUES ($1, $2, $3, $4)
RETURNING id, jo_id, event_type, description, created_by_role, created_at;

-- name: ListJobOrderItems :many
SELECT id, jo_id, item_type, description, quantity, unit_price_cents, discount_cents, net_amount_cents
FROM job_order_items
WHERE jo_id = $1;

-- name: ListPurchaseRequests :many
SELECT pr.id, pr.pr_no, pr.jo_id, pr.status, pr.requested_by_role, pr.requested_at,
       pr.approved_by_role, pr.approved_at, pr.supplier, pr.notes,
       jo.jo_no AS job_order_no
FROM purchase_requests pr
LEFT JOIN job_orders jo ON jo.id = pr.jo_id
ORDER BY pr.requested_at DESC;

-- name: GetPurchaseRequest :one
SELECT pr.id, pr.pr_no, pr.jo_id, pr.status, pr.requested_by_role, pr.requested_at,
       pr.approved_by_role, pr.approved_at, pr.supplier, pr.notes,
       jo.jo_no AS job_order_no
FROM purchase_requests pr
LEFT JOIN job_orders jo ON jo.id = pr.jo_id
WHERE pr.id = $1;

-- name: ListPurchaseRequestItems :many
SELECT id, pr_id, description, quantity, unit_cost_cents, total_cents
FROM purchase_request_items
WHERE pr_id = $1;

-- name: CreatePurchaseRequest :one
INSERT INTO purchase_requests (pr_no, jo_id, status, requested_by_role, supplier, notes)
VALUES ($1, $2, 'PENDING_APPROVAL', $3, $4, $5)
RETURNING id, pr_no, jo_id, status, requested_by_role, requested_at, approved_by_role, approved_at, supplier, notes;

-- name: CreatePurchaseRequestItem :one
INSERT INTO purchase_request_items (pr_id, description, quantity, unit_cost_cents, total_cents)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, pr_id, description, quantity, unit_cost_cents, total_cents;

-- name: ApprovePurchaseRequest :one
UPDATE purchase_requests
SET status = 'APPROVED', approved_by_role = $2, approved_at = now()
WHERE id = $1
RETURNING id, pr_no, jo_id, status, requested_by_role, requested_at, approved_by_role, approved_at, supplier, notes;

-- name: CreatePurchaseOrder :one
INSERT INTO purchase_orders (po_no, pr_id, status, supplier, total_cents)
VALUES ($1, $2, 'DRAFT', $3, $4)
RETURNING id, po_no, pr_id, status, supplier, total_cents, ordered_at, received_at, notes;

-- name: CreatePurchaseOrderItem :one
INSERT INTO purchase_order_items (po_id, description, quantity, unit_cost_cents, total_cents)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, po_id, description, quantity, unit_cost_cents, total_cents, received_qty;

-- name: CountPurchaseOrders :one
SELECT count(*) FROM purchase_orders;

-- name: ListSupplierInvoices :many
SELECT si.id, si.si_no, si.po_id, si.supplier, si.invoice_date, si.due_date,
       si.total_amount_cents, si.status, si.notes,
       po.po_no AS purchase_order_no
FROM supplier_invoices si
LEFT JOIN purchase_orders po ON po.id = si.po_id
ORDER BY si.si_no DESC;

-- name: GetSupplierInvoice :one
SELECT id, si_no, po_id, supplier, invoice_date, due_date, total_amount_cents, status, notes
FROM supplier_invoices
WHERE id = $1;

-- name: ListSupplierInvoiceAllocations :many
SELECT sa.id, sa.si_id, sa.jo_id, sa.amount_cents, sa.description, sa.created_at,
       jo.jo_no AS job_order_no
FROM supplier_invoice_allocations sa
JOIN job_orders jo ON jo.id = sa.jo_id
WHERE sa.si_id = $1;

-- name: CreateSupplierInvoice :one
INSERT INTO supplier_invoices (si_no, po_id, supplier, invoice_date, due_date, total_amount_cents, status, notes)
VALUES ($1, $2, $3, $4, $5, $6, 'DRAFT', $7)
RETURNING id, si_no, po_id, supplier, invoice_date, due_date, total_amount_cents, status, notes;

-- name: DeleteSupplierInvoiceAllocations :exec
DELETE FROM supplier_invoice_allocations WHERE si_id = $1;

-- name: CreateSupplierInvoiceAllocation :one
INSERT INTO supplier_invoice_allocations (si_id, jo_id, amount_cents, description)
VALUES ($1, $2, $3, $4)
RETURNING id, si_id, jo_id, amount_cents, description, created_at;

-- name: UpdateSupplierInvoiceStatus :one
UPDATE supplier_invoices
SET status = $2
WHERE id = $1
RETURNING id, si_no, po_id, supplier, invoice_date, due_date, total_amount_cents, status, notes;

-- name: ListOpexRequests :many
SELECT id, request_no, category, description, amount_cents, requested_by_role,
       status, requested_at, approved_by_role, approved_at, notes
FROM opex_requests
ORDER BY requested_at DESC;

-- name: GetOpexRequest :one
SELECT id, request_no, category, description, amount_cents, requested_by_role,
       status, requested_at, approved_by_role, approved_at, notes
FROM opex_requests
WHERE id = $1;

-- name: CreateOpexRequest :one
INSERT INTO opex_requests (request_no, category, description, amount_cents, requested_by_role, status, notes)
VALUES ($1, $2, $3, $4, $5, 'PENDING_APPROVAL', $6)
RETURNING id, request_no, category, description, amount_cents, requested_by_role, status, requested_at, approved_by_role, approved_at, notes;

-- name: ApproveOpexRequest :one
UPDATE opex_requests
SET status = 'APPROVED', approved_by_role = $2, approved_at = now()
WHERE id = $1
RETURNING id, request_no, category, description, amount_cents, requested_by_role, status, requested_at, approved_by_role, approved_at, notes;

-- name: ListDisbursements :many
SELECT d.id, d.disbursement_no, d.opex_request_id, d.supplier_invoice_id,
       d.amount_cents, d.status, d.payment_method, d.reference_no, d.paid_at,
       d.proof_attachment_key, d.recorded_by_role, d.created_at,
       o.request_no AS opex_request_no, si.si_no AS supplier_invoice_no
FROM disbursements d
LEFT JOIN opex_requests o ON o.id = d.opex_request_id
LEFT JOIN supplier_invoices si ON si.id = d.supplier_invoice_id
ORDER BY d.created_at DESC;

-- name: GetDisbursement :one
SELECT id, disbursement_no, opex_request_id, supplier_invoice_id, amount_cents, status,
       payment_method, reference_no, paid_at, proof_attachment_key, recorded_by_role, created_at
FROM disbursements
WHERE id = $1;

-- name: CreateDisbursementFromOpex :one
INSERT INTO disbursements (disbursement_no, opex_request_id, amount_cents, status)
VALUES ($1, $2, $3, 'PENDING')
RETURNING id, disbursement_no, opex_request_id, supplier_invoice_id, amount_cents, status,
  payment_method, reference_no, paid_at, proof_attachment_key, recorded_by_role, created_at;

-- name: CreateDisbursementFromSupplierInvoice :one
INSERT INTO disbursements (disbursement_no, supplier_invoice_id, amount_cents, status)
VALUES ($1, $2, $3, 'PENDING')
RETURNING id, disbursement_no, opex_request_id, supplier_invoice_id, amount_cents, status,
  payment_method, reference_no, paid_at, proof_attachment_key, recorded_by_role, created_at;

-- name: ApproveDisbursement :one
UPDATE disbursements
SET status = 'APPROVED'
WHERE id = $1
RETURNING id, disbursement_no, opex_request_id, supplier_invoice_id, amount_cents, status,
  payment_method, reference_no, paid_at, proof_attachment_key, recorded_by_role, created_at;

-- name: RecordDisbursementPayment :one
UPDATE disbursements
SET status = 'PAID', payment_method = $2, reference_no = $3, paid_at = $4, recorded_by_role = $5
WHERE id = $1
RETURNING id, disbursement_no, opex_request_id, supplier_invoice_id, amount_cents, status,
  payment_method, reference_no, paid_at, proof_attachment_key, recorded_by_role, created_at;

-- name: UpdateDisbursementProof :exec
UPDATE disbursements SET proof_attachment_key = $2 WHERE id = $1;

-- name: ListServiceInvoices :many
SELECT si.id, si.invoice_no, si.jo_id, si.customer_id, si.issue_date,
       si.subtotal_cents, si.vat_amount_cents, si.total_cents, si.amount_paid_cents,
       si.status, si.due_date, si.notes,
       c.name AS customer_name, jo.jo_no AS job_order_no
FROM service_invoices si
JOIN customers c ON c.id = si.customer_id
LEFT JOIN job_orders jo ON jo.id = si.jo_id
ORDER BY si.issue_date DESC;

-- name: GetServiceInvoice :one
SELECT si.id, si.invoice_no, si.jo_id, si.customer_id, si.issue_date,
       si.subtotal_cents, si.vat_amount_cents, si.total_cents, si.amount_paid_cents,
       si.status, si.due_date, si.notes,
       c.name AS customer_name, jo.jo_no AS job_order_no
FROM service_invoices si
JOIN customers c ON c.id = si.customer_id
LEFT JOIN job_orders jo ON jo.id = si.jo_id
WHERE si.id = $1;

-- name: CreateServiceInvoice :one
INSERT INTO service_invoices (invoice_no, jo_id, customer_id, subtotal_cents, vat_amount_cents, total_cents, status, notes)
VALUES ($1, $2, $3, $4, $5, $6, 'SENT', $7)
RETURNING id, invoice_no, jo_id, customer_id, issue_date, subtotal_cents, vat_amount_cents,
  total_cents, amount_paid_cents, status, due_date, notes;

-- name: UpdateJobOrderBilled :one
UPDATE job_orders
SET status = 'BILLED', billed_amount_cents = $2, net_profit_cents = $3, updated_at = now()
WHERE id = $1
RETURNING id, jo_no, sq_id, customer_id, vehicle_id, advisor, technician, status,
  total_estimated_labor_cents, total_estimated_parts_cents, actual_labor_cost_cents,
  actual_parts_cost_cents, billed_amount_cents, net_profit_cents, created_at, updated_at;

-- name: CreatePayment :one
INSERT INTO payments (service_invoice_id, amount_cents, payment_method, reference_no, paid_at, recorded_by_role)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, service_invoice_id, amount_cents, payment_method, reference_no, paid_at, recorded_by_role;

-- name: ListPaymentsByInvoice :many
SELECT id, service_invoice_id, amount_cents, payment_method, reference_no, paid_at, recorded_by_role
FROM payments
WHERE service_invoice_id = $1;

-- name: UpdateServiceInvoicePaymentStatus :one
UPDATE service_invoices
SET amount_paid_cents = $2, status = $3
WHERE id = $1
RETURNING id, invoice_no, jo_id, customer_id, issue_date, subtotal_cents, vat_amount_cents,
  total_cents, amount_paid_cents, status, due_date, notes;

-- name: UpdateJobOrderActualPartsCost :exec
UPDATE job_orders SET actual_parts_cost_cents = $2, updated_at = now() WHERE id = $1;

-- name: UpdateJobOrderNetProfit :exec
UPDATE job_orders
SET net_profit_cents = billed_amount_cents - actual_labor_cost_cents - actual_parts_cost_cents,
    updated_at = now()
WHERE id = $1;

-- name: CountJobOrdersByStatus :one
SELECT count(*) FROM job_orders WHERE status = $1;

-- name: SumBilledAmount :one
SELECT COALESCE(SUM(billed_amount_cents), 0)::bigint FROM job_orders;

-- name: SumActualCosts :one
SELECT COALESCE(SUM(actual_labor_cost_cents + actual_parts_cost_cents), 0)::bigint FROM job_orders;

-- name: CountQuotationsByStatus :one
SELECT count(*) FROM sales_quotations WHERE status = $1;

-- name: ListRecentJobOrders :many
SELECT jo.id, jo.jo_no, jo.sq_id, jo.customer_id, jo.vehicle_id, jo.advisor,
       jo.technician, jo.status,
       jo.total_estimated_labor_cents, jo.total_estimated_parts_cents,
       jo.actual_labor_cost_cents, jo.actual_parts_cost_cents, jo.billed_amount_cents, jo.net_profit_cents,
       c.name AS customer_name, v.plate_no AS vehicle_plate, v.make_model AS vehicle_make_model,
       jo.created_at, jo.updated_at
FROM job_orders jo
JOIN customers c ON c.id = jo.customer_id
JOIN vehicles v ON v.id = jo.vehicle_id
ORDER BY jo.created_at DESC
LIMIT $1;

-- name: SumSupplierInvoiceAllocationsByJO :one
SELECT COALESCE(SUM(amount_cents), 0)::bigint FROM supplier_invoice_allocations WHERE jo_id = $1;

-- name: CountPurchaseRequestsPending :one
SELECT count(*) FROM purchase_requests WHERE status = 'PENDING_APPROVAL';

-- name: CountOpexRequestsPending :one
SELECT count(*) FROM opex_requests WHERE status = 'PENDING_APPROVAL';

-- name: CountSupplierInvoicesPending :one
SELECT count(*) FROM supplier_invoices WHERE status = 'APPROVED';

-- name: ListAttachments :many
SELECT id, entity_type, entity_id, file_name, content_type, size_bytes, storage_key, created_by_role, created_at
FROM attachments
WHERE entity_type = $1 AND entity_id = $2
ORDER BY created_at;

-- name: CreateAttachment :one
INSERT INTO attachments (entity_type, entity_id, file_name, content_type, size_bytes, storage_key, created_by_role)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, entity_type, entity_id, file_name, content_type, size_bytes, storage_key, created_by_role, created_at;

-- name: DeleteAllData :exec
TRUNCATE customers, vehicles, sales_quotations, sales_quotation_items, job_orders, job_order_items,
  job_order_events, attachments, purchase_requests, purchase_request_items, purchase_orders,
  purchase_order_items, supplier_invoices, supplier_invoice_allocations, opex_requests,
  disbursements, service_invoices, payments
RESTART IDENTITY CASCADE;
