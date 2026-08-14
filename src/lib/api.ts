import { getApiUrl } from './api-url';

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return getApiUrl('/api/proxy');
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL;
  if (process.env.NODE_ENV === 'production') {
    // Inside the Next.js container, the Go API is reachable by its container name.
    return 'http://lemans-demo-go:8080';
  }
  return 'http://127.0.0.1:8080';
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

async function apiFetch(path: string, options: RequestInit = {}, role?: string) {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (role) headers.set('X-Demo-Role', role);
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(res.status, body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiGet(path: string, role?: string) {
  return apiFetch(path, { method: 'GET' }, role);
}

export async function apiPost(path: string, body: unknown, role?: string) {
  return apiFetch(path, { method: 'POST', body: JSON.stringify(body) }, role);
}

export { formatPeso, formatPesoAmount, parsePesoToCents, pesoToCents, centsToPeso } from './money';

export async function listCustomers(role?: string) {
  return apiGet('/api/customers/', role);
}

export async function getCustomer(id: string, role?: string) {
  return apiGet(`/api/customers/${id}`, role);
}

export async function createCustomerAndVehicle(input: unknown, role?: string) {
  return apiPost('/api/customers/', input, role);
}

export async function listVehiclesByCustomer(customerId: string, role?: string) {
  return apiGet(`/api/customers/${customerId}/vehicles`, role);
}

export async function listCustomerServiceHistory(customerId: string, role?: string) {
  return apiGet(`/api/customers/${customerId}/service-history`, role);
}

export async function listVehicles(role?: string) {
  return apiGet('/api/vehicles', role);
}

export async function listQuotations(role?: string) {
  return apiGet('/api/quotations/', role);
}

export async function createSalesQuotation(input: unknown, role?: string) {
  return apiPost('/api/quotations/', input, role);
}

export async function approveQuotation(id: string, role?: string) {
  return apiPost(`/api/quotations/${id}/approve`, {}, role);
}

export async function rejectQuotation(id: string, role?: string) {
  return apiPost(`/api/quotations/${id}/reject`, {}, role);
}

export async function convertQuotation(id: string, role?: string) {
  return apiPost(`/api/quotations/${id}/convert`, {}, role);
}

export async function listJobOrders(role?: string) {
  return apiGet('/api/job-orders/', role);
}

export async function getJobOrder(id: string, role?: string) {
  return apiGet(`/api/job-orders/${id}`, role);
}

export async function listJobOrderItems(id: string, role?: string) {
  return apiGet(`/api/job-orders/${id}/items`, role);
}

export async function listJobOrderEvents(id: string, role?: string) {
  return apiGet(`/api/job-orders/${id}/events`, role);
}

export async function addJobOrderEvent(id: string, body: unknown, role?: string) {
  return apiPost(`/api/job-orders/${id}/events`, body, role);
}

export async function assignTechnician(id: string, technician: string, role?: string) {
  return apiPost(`/api/job-orders/${id}/assign-tech`, { technician }, role);
}

export async function changeJobOrderStatus(id: string, nextStatus: string, role?: string) {
  return apiPost(`/api/job-orders/${id}/change-status`, { nextStatus }, role);
}

export async function getJobCosting(id: string, role?: string) {
  return apiGet(`/api/job-orders/${id}/costing`, role);
}

export async function listAttachments(entityId: string, role?: string) {
  return apiGet(`/api/job-orders/${entityId}/attachments`, role);
}

export async function registerAttachment(entityId: string, body: unknown, role?: string) {
  return apiPost(`/api/job-orders/${entityId}/attachments`, body, role);
}

export async function listPurchaseRequests(role?: string) {
  return apiGet('/api/purchase-requests/', role);
}

export async function createPurchaseRequest(input: unknown, role?: string) {
  return apiPost('/api/purchase-requests/', input, role);
}

export async function createPurchaseRequestFromJO(joId: string, input: unknown, role?: string) {
  return apiPost(`/api/purchase-requests/from-job-order/${joId}`, input, role);
}

export async function approvePurchaseRequest(id: string, role?: string) {
  return apiPost(`/api/purchase-requests/${id}/approve`, {}, role);
}

export async function listSupplierInvoices(role?: string) {
  return apiGet('/api/supplier-invoices/', role);
}

export async function createSupplierInvoice(input: unknown, role?: string) {
  return apiPost('/api/supplier-invoices/', input, role);
}

export async function allocateSupplierInvoice(id: string, allocations: unknown[], role?: string) {
  return apiPost(`/api/supplier-invoices/${id}/allocate`, { allocations }, role);
}

export async function approveSupplierInvoice(id: string, role?: string) {
  return apiPost(`/api/supplier-invoices/${id}/approve`, {}, role);
}

export async function listOpexRequests(role?: string) {
  return apiGet('/api/opex-requests/', role);
}

export async function createOpexRequest(input: unknown, role?: string) {
  return apiPost('/api/opex-requests/', input, role);
}

export async function approveOpexRequest(id: string, role?: string) {
  return apiPost(`/api/opex-requests/${id}/approve`, {}, role);
}

export async function listDisbursements(role?: string) {
  return apiGet('/api/disbursements/', role);
}

export async function approveDisbursement(id: string, role?: string) {
  return apiPost(`/api/disbursements/${id}/approve`, {}, role);
}

export async function recordDisbursementPayment(id: string, body: unknown, role?: string) {
  return apiPost(`/api/disbursements/${id}/pay`, body, role);
}

export async function getProofUploadUrl(
  id: string,
  fileName: string,
  contentType: string,
  role?: string
) {
  return apiGet(
    `/api/disbursements/${id}/proof-upload-url?fileName=${encodeURIComponent(fileName)}&contentType=${encodeURIComponent(contentType)}`,
    role
  );
}

export async function getProofDownloadUrl(id: string, role?: string) {
  return apiGet(`/api/disbursements/${id}/proof-download-url`, role);
}

export async function attachProofOfPayment(id: string, storageKey: string, role?: string) {
  return apiPost(`/api/disbursements/${id}/attach-proof`, { storageKey }, role);
}

export async function listInvoices(role?: string) {
  return apiGet('/api/invoices/', role);
}

export async function getInvoice(id: string, role?: string) {
  return apiGet(`/api/invoices/${id}`, role);
}

export async function createInvoiceFromJO(joId: string, notes: string, role?: string) {
  return apiPost(`/api/invoices/from-job-order/${joId}`, { notes }, role);
}

export async function recordInvoicePayment(id: string, body: unknown, role?: string) {
  return apiPost(`/api/invoices/${id}/payments`, body, role);
}

export async function getDashboard(role?: string) {
  return apiGet('/api/dashboard', role);
}

export async function getActor(role?: string) {
  return apiGet('/api/actor', role);
}

export async function seedDatabase(role?: string) {
  return apiPost('/admin/seed', {}, role);
}

export async function getAccountingSummary(role?: string) {
  return apiGet('/api/accounting/summary', role);
}
