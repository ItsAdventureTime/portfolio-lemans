# ADR 0002: Technology Stack Selection - Next.js 14+ Standalone & PostgreSQL

- **Status**: Approved
- **Deciders**: Lead Agent, Project Architect
- **Date**: 2026-08-07 (Updated)

## Context
The application requires complex relational data modeling (Job Orders, Supplier Invoices, Multi-JO Line Item Allocations, Customer Billings, QBO Exports, Accounts Receivable, Audit Trail) and exact document rendering matching client paper forms (Service Invoice RA0003973, Repair Order RA0003973, OPEX Request Budget).

## Decision
We decide to adopt **Next.js 14+ App Router (TypeScript, `output: 'standalone'`)** paired with **PostgreSQL 16** via **Prisma ORM**:
1. **Unified Stack**: Single end-to-end TypeScript codebase for UI components, Server Actions, API routes, and database models.
2. **Server-Rendered Documents**: Next.js Server Components enable generating pixel-faithful printable invoice and job order documents on the server matching client reference templates (`photo_2026-08-03_00-36-03.jpg`, `photo_2026-08-03_00-36-09.jpg`, `photo_2026-08-03_00-36-12.jpg`).
3. **Enterprise UI/UX Alignment**: Follows `llm_ui_context_prompt_framework.md` with semantic component primitives, multi-state UI visual contracts (loading skeleton, empty, error, success), and cross-platform readiness for future iOS (SwiftUI) / Android (Jetpack Compose) apps.
4. **Relational Data Integrity**: PostgreSQL provides strict ACID transactions for job cost allocations across multiple job orders.

## Consequences
- **Positive**: Rapid development, single toolchain, strict type safety from DB schema to frontend UI, simplified container packaging.
- **Negative**: Requires careful server/client component boundary management in Next.js App Router.
