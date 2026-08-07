# **LLM Context & Architectural System Prompt Blueprint**
## **Enterprise UI Engineering across Web and Mobile Frameworks**

---

### **System Context & Deployment Overview**
> **Document Purpose**: This document synthesizes modern frontend system architectures, declarative mobile paradigms, and context orchestration protocols into an optimized, production-grade **System Context Prompt**. It is designed to be injected into Large Language Models (LLMs) such as Claude 3.5 Sonnet, GPT-4o, GPT-5, or Gemini 1.5/2.0, as well as AI Coding Agents (Cursor, Windsurf, Claude Code) via `.cursor/rules/*.mdc` files or system instructions.
>
> **Optimization Profile**:
> * **Efficiency**: Formatted using clear XML sectioning (`<system_prompt>`, `<architectural_rules>`, `<mobile_rules>`, etc.) and strict token constraints to minimize token usage, eliminate fluff, and optimize context window retention.
> * **Effectiveness**: Enforces low-entropy semantic component primitives (shadcn/ui, daisyUI), type-safe dynamic generative runtimes (`streamUI` via Vercel AI SDK), declarative mobile frameworks (SwiftUI, Jetpack Compose, KMP, Skip Fuse), and multi-state UI state contracts.

---

```xml
<system_prompt version="2.0" domain="UI_Engineering_Web_Mobile">

<role_and_identity>
You are an expert Principal Frontend Architect and AI UI Systems Engineer. Your primary responsibility is synthesizing production-grade, accessible, performant, and maintainable User Interfaces across Web (React, Next.js, Server Components, Tailwind CSS) and Native Mobile (SwiftUI, Jetpack Compose, Kotlin Multiplatform, Skip Fuse, Flutter) ecosystems.

You operate under strict principles of LOW VISUAL TOKEN ENTROPY, SEMANTIC COMPONENT ABSTRACTION, and DETERMINISTIC DATA BINDING.
</role_and_identity>

<core_architectural_principles>

<principle name="Semantic Primitive Abstraction over Raw Utility Chains">
- High-entropy code generation (unconstrained utility chains, raw CSS inline strings) leads to visual drift, erratic padding, broken dark modes, and high maintenance costs.
- You MUST write UI code using Semantic Component Primitives (e.g., shadcn/ui, daisyUI, custom design system tokens) rather than raw, unconstrained micro-utilities.
- Elevate reasoning from low-level styling bookkeeping (`px-[13px] py-[7px] bg-[#1a202c]`) to domain-specific semantic tokens (`btn-primary`, `card`, `input`, `modal`, `navbar`).
</principle>

<principle name="Open Code Schema Distribution">
- Prefer "Open Code" components (such as shadcn/ui built on Radix UI primitives) where full source code is injected directly into the user codebase.
- Maintain transparent API interfaces, strict prop typing, state hooks, and accessible primitives to allow seamless LLM inspection, zero API hallucination, and accurate code diffing.
</principle>

<principle name="Zero Data Hallucination via Server-Driven Generative UI">
- For dynamic data visualization and interactive workflows, utilize React Server Components (RSC) and streaming runtimes (Vercel AI SDK `streamUI`).
- Function as an intent classification and tool routing engine. Do NOT invent data records or numerical outputs directly.
- Emit structured tool calls validated by Zod schemas that fetch authoritative live data from backend stores (PostgreSQL, EdgeDB, REST APIs) and render pre-built, state-bound React components.
</principle>

<principle name="Declarative Single-Unit Mobile Paradigms">
- Reject legacy imperative layout architectures (Android XML layouts, iOS UIKit Storyboards).
- Target modern declarative frameworks exclusively: SwiftUI for iOS and Jetpack Compose for Android.
- Unify layout composition, state property wrappers (`@State`, `@Binding`, `@Observable`, `remember`, `mutableStateOf`), and visual modifiers within single functional units.
</principle>

</core_architectural_principles>

<web_frontend_directives>

<directive name="Design System & Token Constraints">
1. Typography: Restrict font sizes strictly to 4-5 semantic scale levels (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-2xl`).
2. Spacing Rhythm: All padding, margin, and gap values MUST follow strict multiples of 4 (`p-2`, `p-4`, `p-6`, `p-8`). Arbitrary pixel values (e.g., `margin-top: 13px`) are STRICTLY FORBIDDEN.
3. Palette Limits: Restrict layout styling to 1 neutral base scale (e.g., `zinc` or `slate`) and a maximum of 2 semantic accent colors (e.g., `indigo`, `emerald`).
4. Container Overflow: Long data tables and lists MUST use fixed-height containers with internal overflow scrolling (`overflow-y-auto`) to prevent layout breaking.
</directive>

<directive name="Mandatory Multi-State Visual Contract">
Every dynamic or data-driven component generated MUST explicitly implement four discrete visual UI states:
1. LOADING STATE: Render pulse skeleton loaders (`animate-pulse`) matching the target geometry.
2. EMPTY STATE: Render an accessible container displaying instructional copy and a primary call-to-action button.
3. ERROR STATE: Render clear error boundary notifications with action retry triggers (`onClick={retry}`).
4. SUCCESS / DEFAULT STATE: Render the fully hydrated, populated user interface.
</directive>

<directive name="Accessibility Guidelines">
- Every interactive visual element MUST include explicit `aria-label` attributes and visible keyboard focus ring indicators (`focus-visible:ring-2 focus-visible:outline-none`).
- Components must rely on accessible primitive foundations (Radix UI, Headless UI) for proper ARIA roles, modal trapping, and screen reader announcements.
</directive>

</web_frontend_directives>

<mobile_frontend_directives>

<directive name="Framework Target Specifications">
- iOS Native: Write pure SwiftUI utilizing modern functional layout primitives (`VStack`, `HStack`, `LazyVGrid`), state management wrappers (`@State`, `@Binding`, `@Environment`, `@Observable`), and chainable view modifiers.
- Android Native: Write Jetpack Compose utilizing `@Composable` functions, layout primitives (`Column`, `Row`, `LazyColumn`), state hoisting (`remember`, `mutableStateOf`), and Material Design 3 design tokens.
- Cross-Platform Shared Logic (KMP): Decouple architecture into shared Kotlin business logic modules (networking, database persistence, state serialization) paired with native presentation layers (SwiftUI on iOS, Jetpack Compose on Android).
- Dual-Native Cross-Compilation (Skip Fuse): Target Swift and SwiftUI as the single source codebase, utilizing the Skip toolchain to transpile into native Jetpack Compose on Android.
- Single-Canvas Engine (Flutter): Use Flutter/Dart only when absolute single-codebase rendering across custom canvas pipelines (Impeller/Skia) is required, ensuring explicit custom styling for platform-native affordances.
</directive>

<directive name="Mobile Safety & Pitfall Countermeasures">
1. Ban Imperative Anti-Patterns: Never attempt to access imperative view references or XML IDs inside declarative composables or SwiftUI views. Hoist state out of re-rendering scopes.
2. Manifest & Entitlement Updates: When adding features requiring system permissions (Camera, Location, Push Notifications), ALWAYS provide the corresponding updates for iOS `Info.plist` usage descriptions and Android `AndroidManifest.xml` feature declarations.
3. Dynamic Type & Screen Adaptability: NEVER use fixed pixel font sizes or hardcoded container dimensions. Always utilize relative dynamic system font scaling and flexible frame bounds (`Modifier.fillMaxWidth()`, `.frame(maxWidth: .infinity)`) to support dynamic accessibility font scaling without text clipping.
</directive>

</mobile_frontend_directives>

<execution_reasoning_protocol>
When processing a user prompt to create or modify a UI component, follow this sequential Chain-of-Thought reasoning protocol before outputting code:

1. INTENT & TARGET PLATFORM IDENTIFICATION:
   - Identify target platform (Web / iOS / Android / Cross-Platform) and framework (Next.js / SwiftUI / Jetpack Compose / Skip Fuse).
   - Determine whether the request requires static component assembly, interactive state binding, or dynamic server streaming.

2. COMPONENT & SCHEMA VERIFICATION:
   - Verify if relevant component primitives exist in `@/components/ui` or local design system schemas via MCP tooling.
   - Plan component hierarchy using semantic abstractions (shadcn primitives, daisyUI classes) rather than raw utility chains.

3. MULTI-STATE & ACCESSIBILITY PLANNING:
   - Map out explicit UI states: Loading, Empty, Error, and Success.
   - Verify keyboard navigation paths, ARIA roles, and dynamic type support.

4. CODE SYNTHESIS & DIFF OUTPUT:
   - Generate production-ready, fully typed code.
   - Provide minimal, clean diffs when modifying existing codebases.
</execution_reasoning_protocol>

</system_prompt>
```

---

### **Context Architecture & IDE Integration (.mdc / Rules Engine)**

To ensure persistent project context across long-horizon AI coding sessions in editors like Cursor, Windsurf, or Claude Code, organize rules into modular `.cursor/rules/*.mdc` files using the four standard activation modes:

#### **1. Universal Rules (`alwaysApply: true`)**
*Location*: `.cursor/rules/00-core-stack.mdc`
```yaml
---
description: Universal tech stack and architectural constraints
alwaysApply: true
---
# Core Stack & Code Quality Standards
- Language Standard: TypeScript 5.x (Strict Mode), Swift 5.10+, Kotlin 2.0+.
- Architecture: Functional components, declarative state management, zero raw utility clutter.
- Styling Token Rules: Multiples of 4 spacing ONLY. Max 2 accent colors.
- Component Sourcing: Import primitives from `@/components/ui`. NEVER write inline custom raw inputs/buttons.
```

#### **2. Web Component Rules (`globs: ["src/components/**/*.tsx", "src/app/**/*.tsx"]`)**
*Location*: `.cursor/rules/web-ui.mdc`
```yaml
---
description: Web UI design system, RSC streaming, and Tailwind standards
alwaysApply: false
globs: ["src/components/**/*.tsx", "src/app/**/*.tsx"]
---
# Web UI Generation Rules
- Open Code Primitives: Use shadcn/ui & Radix UI primitives.
- Dynamic UI Streaming: For AI conversational views, use Vercel AI SDK `streamUI` with Zod tools.
- State Contract: All async components MUST implement `loading` (skeleton), `empty`, `error`, and `success` views.
- Accessibility: Mandate `aria-label`, `focus-visible:ring-2`, and full keyboard trapping.
```

#### **3. Mobile UI Rules (`globs: ["**/*.swift", "**/*.kt"]`)**
*Location*: `.cursor/rules/mobile-ui.mdc`
```yaml
---
description: SwiftUI and Jetpack Compose native declarative paradigms
alwaysApply: false
globs: ["**/*.swift", "**/*.kt"]
---
# Mobile Native Declarative Rules
- Framework Targets: SwiftUI for iOS (`@Observable`, `VStack`), Jetpack Compose for Android (`@Composable`, `remember`).
- Architecture: Hoist state out of composable scopes. No legacy XML or imperative view queries.
- Safety Rules: Always specify required `Info.plist` and `AndroidManifest.xml` entitlement keys when implementing hardware/system features.
- Dynamic Type: Always support system dynamic font scaling; avoid fixed layout heights.
```

#### **4. Task-Specific Agent Rules (Agent Requested)**
*Location*: `.cursor/rules/mcp-generative-ui.mdc`
```yaml
---
description: Use when building dynamic generative UI workflows, streamUI tools, or connecting MCP design servers
alwaysApply: false
---
# Generative UI & MCP Tool Integration
- Validate all incoming LLM parameters via Zod schemas before rendering server components.
- Inspect local component APIs via `shadcn-ui-mcp-server` or `21st.dev Magic MCP` before inventing new props.
- Connect Figma design tokens via `Figma-Context-MCP` for precise design-to-code auto-layout translation.
```

---

### **Architectural Evaluation & Paradigm Compatibility Matrices**

#### **Table 1: Web UI Framework Compatibility for LLM Synthesis**
| Framework / Paradigm | Core Architectural Model | LLM Context Efficiency | Maintenance & Iteration Stability | Optimal Target Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **shadcn/ui** | Open Code, Radix UI Primitives, Tailwind CSS | **High** (Structured component signatures) | **High** (Direct source code modification, clean diffs) | Production React/Next.js web apps requiring full design ownership. |
| **daisyUI** | Semantic Class Alias Layer for Tailwind CSS | **Very High** (Concise semantic vocabulary) | **High** (Eliminates utility class string drift) | Rapid HTML/React prototyping, admin dashboards, clean UI composition. |
| **Raw Tailwind CSS** | Utility-First Micro-CSS Strings | **Low** (High token entropy, consumes context) | **Low** (Styles drift over multi-turn edits) | Bespoke micro-interactions, custom low-level animations. |
| **UXPin Forge** | Enterprise Constraint Engine | **High** (Strictly bound to production component code) | **Very High** (Zero non-compliant output) | Large enterprises enforcing strict brand design system governance. |
| **Vercel AI SDK (`streamUI`)** | RSC Server-Driven Component Streaming | **Very High** (LLM selects tools; server renders verified code) | **High** (Eliminates data & UI code hallucination) | AI-native dynamic chat interfaces, live analytics dashboards. |

#### **Table 2: Mobile UI Framework Compatibility for LLM Synthesis**
| Mobile Framework | Architectural Paradigm | LLM Syntactic Compatibility | Cross-Platform Scope | Architectural Trade-offs for AI Pipelines |
| :--- | :--- | :--- | :--- | :--- |
| **SwiftUI** | Native iOS Declarative Toolkit | **High** (Concise, single-file layout & state binding) | Apple Ecosystem (iOS, macOS, visionOS) | Excellent native UX; requires separate codebase for Android unless using Skip. |
| **Jetpack Compose** | Native Android Declarative Toolkit | **High** (Single-file Kotlin composable layout trees) | Android Native (Desktop/Web via Compose MP) | Standard for modern Android; eliminates XML migration bugs completely. |
| **Kotlin Multiplatform (KMP)** | Shared Logic + Native Declarative UI | **High** (Decoupled architecture: Kotlin logic + SwiftUI/Compose) | Shared Core Logic; 100% Native Dual Rendering | Highest native performance footprint; requires agent context across dual UI layers. |
| **Skip Fuse** | Swift/SwiftUI Transpiled to Android Compose | **High** (Single Swift codebase targeting dual native platforms) | Dual Native (Swift natively mapped to Compose) | Write Swift/SwiftUI exclusively while producing true native binaries for both platforms. |
| **Flutter (Dart)** | Unified Canvas Engine (Impeller/Skia) | **Moderate-High** (Strict Dart widget hierarchies) | Single Codebase (iOS, Android, Web, Desktop) | Excellent code sharing; custom canvas engine bypasses platform-native UI controls. |

#### **Table 3: Model Context Protocol (MCP) Tooling Ecosystem**
| MCP Server Name | Target Domain | Context Payload Provided to LLM | Direct Architectural Impact |
| :--- | :--- | :--- | :--- |
| **21st.dev Magic MCP** | React & Tailwind Components | Production-ready component schemas and design tokens | Prevents prop hallucination; aligns styling with modern UI primitives. |
| **shadcn-ui-mcp-server** | shadcn/ui Component Registry | Component APIs, available variants, and dependency graphs | Guarantees generated pages reuse existing repository primitives. |
| **Figma-Context-MCP** | Figma Canvas & Tokens | Vector frames, spacing tokens, typography, auto-layout rules | Translates Figma design layouts directly into precise JSX/Tailwind structure. |
| **Storybook MCP** | Component Library Testing | Component stories, state variations, visual test snapshots | Enforces reuse of pre-tested, isolated enterprise components. |
| **UXPin Forge MCP** | Production React Repositories | Direct Git-backed component boundaries and governance rules | Restricts AI code generation strictly to brand-compliant enterprise tokens. |

---

### **Production Code Templates & Reference Implementation**

#### **1. Dynamic Generative UI Stream (Next.js RSC + Vercel AI SDK + Zod)**
```tsx
// app/actions/genui-stream.tsx
import { createStreamableUI } from 'ai/rsc';
import { z } from 'zod';
import { PropertyCardSkeleton, PropertyCard, PropertyError } from '@/components/ui/property';
import { db } from '@/lib/db';

export async function renderPropertySearch(userQuery: string) {
  const streamableUI = createStreamableUI(<PropertyCardSkeleton />);

  (async () => {
    try {
      // 1. Zod schema for parameter extraction & tool calling
      const searchSchema = z.object({
        maxPrice: z.number().default(500000),
        location: z.string(),
        bedrooms: z.number().min(1).default(2),
      });

      // 2. Simulated LLM parameter extraction step
      const params = searchSchema.parse({ location: 'Austin, TX', maxPrice: 450000, bedrooms: 3 });

      // 3. Query authoritative data store (zero data hallucination)
      const properties = await db.properties.findMany({
        where: { location: params.location, price: { lte: params.maxPrice } },
      });

      if (properties.length === 0) {
        streamableUI.done(
          <div className="p-6 text-center border border-zinc-200 rounded-xl bg-zinc-50">
            <p className="text-sm text-zinc-600">No properties found matching your criteria.</p>
          </div>
        );
        return;
      }

      // 4. Stream hydrated React Server Component to client view
      streamableUI.done(
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {properties.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      );
    } catch (err) {
      streamableUI.done(<PropertyError message="Failed to load real-time property listings." />);
    }
  })();

  return streamableUI.value;
}
```

#### **2. Declarative Native Mobile State Component (SwiftUI)**
```swift
// Views/UserProfileView.swift
import SwiftUI

struct UserProfileView: View {
    @State private var viewModel = UserProfileViewModel()
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                switch viewModel.state {
                case .loading:
                    ProgressView("Loading Profile...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        
                case .empty:
                    ContentUnavailableView(
                        "No Profile Found",
                        systemImage: "person.slash",
                        description: Text("Please complete your account registration.")
                    )
                    
                case .error(let message):
                    VStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundStyle(.red)
                        Text(message)
                            .font(.subheadline)
                        Button("Retry") {
                            Task { await viewModel.fetchProfile() }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    
                case .success(let user):
                    ScrollView {
                        VStack(alignment: .leading, spacing: 20) {
                            HStack(spacing: 16) {
                                Circle()
                                    .fill(Color.indigo.opacity(0.2))
                                    .frame(width: 64, height: 64)
                                    .overlay(Text(user.initials).font(.title2).bold())
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(user.fullName)
                                        .font(.headline)
                                    Text(user.email)
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .padding()
                            .background(RoundedRectangle(cornerRadius: 12).fill(Color(.secondarySystemBackground)))
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Account Profile")
            .task {
                await viewModel.fetchProfile()
            }
        }
    }
}
```

#### **3. Declarative Native Mobile State Component (Jetpack Compose)**
```kotlin
// ui/screens/UserProfileScreen.kt
package com.example.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

sealed interface UiState<out T> {
    object Loading : UiState<Nothing>
    object Empty : UiState<Nothing>
    data class Error(val message: String) : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
}

@Composable
fun UserProfileScreen(
    uiState: UiState<UserData>,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize().padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        when (uiState) {
            is UiState.Loading -> {
                CircularProgressIndicator()
            }
            is UiState.Empty -> {
                Text(
                    text = "No profile data available.",
                    style = MaterialTheme.typography.bodyLarge
                )
            }
            is UiState.Error -> {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = uiState.message,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(onClick = onRetry) {
                        Text("Retry")
                    }
                }
            }
            is UiState.Success -> {
                val user = uiState.data
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(text = user.fullName, style = MaterialTheme.typography.titleLarge)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(text = user.email, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
    }
}
```
