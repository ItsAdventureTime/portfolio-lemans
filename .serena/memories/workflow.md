# Workflow and exports

- Core path: customer/vehicle → validated quotation → approved quotation → transactional job-order conversion → procurement/OPEX → DCS disbursement → completed JO → VAT-inclusive service invoice → customer collection.
- Quote creation and quote-to-job-order conversion are transactional. Identifiers include cryptographic random suffixes to avoid count-based collisions.
- Admin accounting has deterministic exports for customers, derived vendors, bills, expenses, invoices, collections, and payments. CSV adds a UTF-8 BOM and prefixes formula-like text cells with an apostrophe to prevent spreadsheet formula injection.
- Browser downloads use Next `/api/accounting/export/{csv|json}`, which proxies the internal Go `/api/accounting/exports/{csv|json}` endpoint and preserves the simulated role header.