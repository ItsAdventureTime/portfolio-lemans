# Le Mans Service Plus - Enterprise Design System & UI/UX Specification

## 1. Design Philosophy & Evidence Basis

This design system synthesizes evidence and directives from four core sources:
1. **Client Brand Identity**: Official logo for **LeMans Service Plus OPC** (`references/branding/logo.jpg`), featuring a racing-inspired shield badge with LeMans Racing Red, Crisp White, and Dark Slate.
2. **UI Architecture Inspiration**: ColdTrace Operations Dashboard (`references/design-inspiration/coldtrace-ui-mockup.webp`), showcasing a modern light interface, elevated cards, subtle borders, rounded pills, high-visibility metric displays, and data-dense tables.
3. **UI Context Prompt Directives**: Enterprise UI blueprint (`llm_ui_context_prompt_framework.md` & `llm-interface-design-context-prompt.md`), enforcing **low visual token entropy**, **semantic primitive abstractions**, strict 4-state visual contracts, and cross-platform alignment for future iOS (SwiftUI) and Android (Jetpack Compose) native releases.
4. **Printable Document Templates**: Standardized layouts matching client OPEX Budget (`photo_2026-08-03_00-36-03.jpg`), Service Invoice (`photo_2026-08-03_00-36-09.jpg`), and Repair Order (`photo_2026-08-03_00-36-12.jpg`).

---

## 2. Visual Identity & Semantic Palette

> [!IMPORTANT]
> **Prohibited Interpretation Rule**: Words like "internal", "demo", "confidential", or "not for production" MUST NOT be used to justify a harsh red danger theme across the interface. LeMans Racing Red is a **brand accent** for key primary actions, active tabs, and logo accents. Red alert/danger colors MUST be reserved strictly for real validation errors, stock shortages, system alerts, or destructive actions (e.g., voiding a JO).

### Color Token Palette

```css
:root {
  /* Brand Tokens (Derived from Logo) */
  --brand-primary: #D32F2F;       /* LeMans Racing Red */
  --brand-primary-hover: #B71C1C; /* Dark Red Hover */
  --brand-primary-light: #FFEBEE; /* Light Red Tint for Badges */
  
  /* Neutral Slate Palette (Derived from ColdTrace Inspiration) */
  --bg-app: #F8FAFC;              /* Clean Off-White Application Canvas */
  --bg-surface: #FFFFFF;          /* Pure White Elevated Card Surfaces */
  --bg-subtle: #F1F5F9;           /* Subtle Input & Secondary Backgrounds */
  
  /* Typography & Border Neutrals */
  --text-primary: #0F172A;        /* Deep Slate for Primary Headings & Data */
  --text-secondary: #475569;      /* Muted Slate for Labels & Secondary Copy */
  --text-tertiary: #94A3B8;       /* Light Slate for Placeholders & Timestamps */
  --border-subtle: #E2E8F0;       /* Fine Light Card & Table Divider Borders */
  --border-strong: #CBD5E1;       /* Interactive Control Borders */
  
  /* Semantic Status Colors (Functional Only) */
  --status-success-bg: #ECFDF5;   /* Emerald Light Tint */
  --status-success-text: #059669; /* Emerald Green (Completed, Approved, Optimal) */
  --status-warning-bg: #FFFBEB;   /* Amber Light Tint */
  --status-warning-text: #D97706; /* Amber Yellow (Pending Approval, In Progress) */
  --status-danger-bg: #FEF2F2;    /* Rose Light Tint */
  --status-danger-text: #DC2626;  /* Rose Red (Overdue AR, Rejected, Error) */
  --status-info-bg: #EFF6FF;      /* Blue Light Tint */
  --status-info-text: #2563EB;    /* Blue (Draft, Info) */

  /* Elevation Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
}
```

---

## 3. Typography Scale & Spacing Grid

### Semantic Typography Scale
- `text-2xl` (24px, bold): Main page headers and KPI metric values.
- `text-lg` (18px, semibold): Card container titles and section headings.
- `text-base` (16px, medium): Primary form input text and primary button labels.
- `text-sm` (14px, regular/medium): Table cell values, standard copy, navigation tabs.
- `text-xs` (12px, semibold): Status pills, table column headers, metadata tags.

### Spacing Grid (Multiples of 4)
All padding, margin, and gap values MUST follow strict 4px multiples (`p-2` [8px], `p-4` [16px], `p-6` [24px], `p-8` [32px]). Arbitrary pixel values (e.g., `px-[13px]`) are forbidden.

---

## 4. Mandatory Multi-State Visual UI Contract

Every dynamic component MUST explicitly implement four discrete visual UI states:
1. **LOADING STATE**: Render pulse skeleton loaders (`animate-pulse`) matching the target geometry.
2. **EMPTY STATE**: Render an accessible container displaying instructional copy, icon, and a primary call-to-action button (e.g., "Create First Job Order").
3. **ERROR STATE**: Render clear error boundary notifications with action retry triggers (`onClick={retry}`).
4. **SUCCESS / DEFAULT STATE**: Render the fully hydrated, populated user interface.

---

## 5. Accessibility & Cross-Platform Mobile Alignment

- **Accessibility**: 
  - Every interactive visual element MUST include explicit `aria-label` attributes and visible keyboard focus ring indicators (`focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none`).
  - Contrast ratios meet WCAG 2.1 AA standards (minimum 4.5:1 for body copy).
- **Mobile Cross-Platform Preparation**:
  - Web UI component states and view models map cleanly to declarative mobile paradigms (SwiftUI `@Observable` / Jetpack Compose `State`).
  - Dynamic font scaling and flexible frame bounds (`w-full`, `max-w-7xl`) are enforced to prevent text clipping across screen densities.
