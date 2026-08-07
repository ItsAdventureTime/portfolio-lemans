---
document_type: Product Requirements and Developer Handoff
language: English (US)
status: Draft
title: Construction ERP Lite Developer Handoff
version: 1.0
---

# Construction ERP Lite

## Executive Summary

The ERP Lite is an **operations management system** for a construction
company with an integrated fabrication business. **QuickBooks Online
(QBO)** remains the official accounting system of record. The ERP
captures complete operational and financial transaction details required
for bookkeeping in QBO through exports or future API integration.

## Core Principles

-   Project-centric architecture.
-   Fabrication Jobs may be standalone or linked to a Project.
-   ERP manages operations; QBO manages accounting.
-   Financial workflow:
    -   Draft
    -   Submitted
    -   GM Approval
    -   DCS for Payment
    -   Completed
-   Billing workflow:
    -   Draft
    -   GM Approval
    -   Issued to Client
    -   Collection
    -   Completed
-   Every module supports attachments, audit trail, export, and backup.

## Modules

### Dashboard

-   Active Projects
-   Active Fabrication Jobs
-   Pending Approvals
-   Collections
-   Outstanding Receivables
-   Budget vs Actual
-   Project Profitability
-   Fabrication Profitability
-   Cash Position

### Projects

-   Project Master
-   Budget
-   Costing
-   Progress
-   Documents
-   Profitability

### Fabrication

-   Estimate
-   Job Order
-   Production
-   Delivery
-   Billing
-   Profitability

### Procurement

-   Purchase Request
-   Purchase Order
-   Supplier SOA
-   Fund Request
-   GM Approval
-   DCS for Payment

### Inventory

-   Simple Inventory
-   Stock In
-   Stock Out
-   Material Issue
-   Direct-to-Project option

### Billing & Collections

-   Progress Billing
-   SOA
-   Collection Monitoring
-   Partial Payments
-   AR/OR References
-   Aging Report

### Finance Operations

-   Fund Requests
-   Reimbursements
-   Liquidations
-   Supplier Payments

### Reports

-   Project Profitability
-   Fabrication Profitability
-   Budget vs Actual
-   Collections Aging
-   Purchase Reports
-   Revenue Summary
-   Expense Summary
-   Cash Summary

## QBO Integration

QBO remains the accounting system of record.

### Export-ready

-   Customers
-   Vendors
-   Bills
-   Expenses
-   Invoices
-   Collections
-   Payments

### Future

-   API Synchronization
-   Sync Status
-   Mapping Fields

## Business Rules

-   Primary entity is Project.
-   Fabrication can exist without a Project.
-   All disbursements require GM Approval before DCS Payment.
-   Billing requires GM Approval before issuance.
-   No General Ledger inside ERP.
-   Profitability is computed operationally only.

## Non-functional Requirements

-   Responsive UI
-   Role-based permissions
-   Audit Trail
-   Export to Excel/CSV
-   Full Backup/Restore
-   Modular architecture
-   API-ready design

## Open Items

-   Progress Billing computation
-   Retention
-   Variation Orders
-   VAT/EWT implementation
-   Future configurable approval levels
