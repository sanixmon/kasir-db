# Graph Report - kasir-db  (2026-09-05)

## Corpus Check
- 191 files · ~126,944 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1403 nodes · 2245 edges · 126 communities (81 shown, 45 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2103e2a0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.jsx
- gray
- search
- semantic
- UI Styling Skill
- Color Semantic Tokens (Primary, Muted, Destructive)
- db.js
- button
- slide_search_core.py
- spacing
- Brand Identity & Consistency Skill
- TestTailwindConfigGenerator
- html-token-validator.py
- React Rewrite Implementation Plan
- BM25
- TailwindConfigGenerator
- Slides Master Reference
- color
- generate-slide.py
- DesignSystemGenerator
- fetch-background.py
- generate_design_system
- icon/generate.py
- fontSize
- TestShadcnInstaller
- devDependencies
- extract-colors.cjs
- validate-asset.cjs
- CIP Design Reference
- destructive-foreground
- validate-tokens.cjs
- ShadcnInstaller
- .check_shadcn_config
- .generate_config_string
- inject-brand-context.cjs
- embed-tokens.cjs
- primitive
- patch
- test_tailwind_config_gen.py
- search
- dependencies
- foreground
- logo/generate.py
- generate-tokens.cjs
- ._base_config
- sync-brand-to-tokens.cjs
- _run
- BM25
- Kasir DB Rental POS System
- muted
- rentals/components/CalculateRentalModal.jsx
- design_system.py
- appsscript.json
- .oxlintrc.json
- scripts
- muted-foreground
- primary
- UX & Performance Improvements Implementation Plan
- ErrorBoundary
- Tasks
- package.json
- primary-foreground
- Design Spec: Penambahan Barang Sewa Sesi Berjalan & Penggabungan/Pemisahan Bill Akhir
- .test_add_components_no_components
- primary-hover
- @vitest/coverage-v8
- fix-css.cjs
- test_sync_brand_to_tokens.py
- main
- .__init__
- .temp_project
- Google Apps Script Backend Setup Guide
- Graphify Query & AST Update Workflow
- ring
- secondary
- secondary-foreground
- Global Constraints
- .test_init_dry_run
- fast
- Logo Design Reference
- .test_add_fonts
- .test_recommend_plugins
- .test_recommend_plugins_nextjs
- .test_init_default_typescript
- .test_generate_javascript_config
- .test_generate_config_with_colors
- .test_generate_config_with_plugins
- .test_validate_config_valid
- .test_validate_config_no_content
- .test_write_config_creates_content
- .test_write_config_invalid_path
- .test_full_configuration_typescript
- .test_default_output_path_typescript
- .test_base_config_structure
- .test_default_content_paths_react
- .test_default_content_paths_vue
- jsdom
- @testing-library/user-event
- @types/react-dom
- @vitejs/plugin-react
- Social Photos Design Guide
- Brand Visual Identity
- Bluesky Icon
- Discord Icon
- Documentation Icon
- Hero Isometric Illustration
- React Branding
- UI Styling License (Apache 2.0)
- Graphify Workflow
- PNPM Workspace Build Configuration
- Vite Logo
- .test_check_shadcn_config_exists
- .test_get_installed_components_with_files
- .test_init_default_project_root
- receiptTemplates.js
- Design Skills Task Routing Matrix
- Logo Color Psychology Reference
- .test_get_installed_components_empty
- .test_add_components_no_config
- vitest

## God Nodes (most connected - your core abstractions)
1. `TailwindConfigGenerator` - 58 edges
2. `TestTailwindConfigGenerator` - 35 edges
3. `ShadcnInstaller` - 34 edges
4. `react` - 34 edges
5. `TestShadcnInstaller` - 26 edges
6. `fmtRp()` - 26 edges
7. `getShiftDate()` - 23 edges
8. `handleAction()` - 21 edges
9. `apiCall()` - 20 edges
10. `swalWarning()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Evren House Web Entrypoint` --conceptually_related_to--> `Kasir DB Rental POS System`  [INFERRED]
  index.html → README.md
- `Social Photo HTML/CSS Canvas Rendering` --conceptually_related_to--> `Three-Layer Token Architecture (Primitive -> Semantic -> Component)`  [INFERRED]
  .agents/skills/design/references/social-photos-design.md → .agents/skills/design-system/SKILL.md
- `Logo Prompt Structure and Negative Prompting` --semantically_similar_to--> `CIP Base Prompt Structure`  [INFERRED] [semantically similar]
  .agents/skills/design/references/logo-prompt-engineering.md → .agents/skills/design/references/cip-prompt-engineering.md
- `Accessibility and Reduced Motion State Contracts` --semantically_similar_to--> `WAI-ARIA Accessibility Contracts`  [INFERRED] [semantically similar]
  .agents/skills/design-system/references/states-and-variants.md → .agents/skills/design-system/references/component-specs.md
- `TestShadcnInstaller` --uses--> `ShadcnInstaller`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_shadcn_add.py → .agents/skills/ui-styling/scripts/shadcn_add.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Brand Guidelines to Design System Token Pipeline** — _agents_skills_brand_skill_brand, _agents_skills_brand_skill_brand_sync_workflow, _agents_skills_design_system_skill_design_system, _agents_skills_design_system_skill_three_layer_tokens [EXTRACTED 1.00]
- **Corporate Identity Program (CIP) Design Pipeline** — agents_skills_design_references_cip_design_cip_workflow, agents_skills_design_references_cip_deliverable_guide_cip_deliverables_taxonomy, agents_skills_design_references_cip_design_cip_mockup_generation, agents_skills_design_references_cip_style_guide_cip_style_archetypes [EXTRACTED 1.00]
- **Google Sheets and Apps Script Data Migration Pipeline** — docs_superpowers_specs_2026_07_26_google_sheets_migration_design_spec, docs_superpowers_specs_2026_07_26_google_sheets_migration_design_gas_lock_service, docs_superpowers_specs_2026_07_26_google_sheets_migration_design_gas_cache_service, docs_superpowers_specs_2026_07_26_google_sheets_migration_design_http_polling, docs_superpowers_plans_2026_07_26_google_sheets_migration_plan [EXTRACTED 1.00]
- **EVREN HOUSE POS React Rewrite Architecture** — docs_superpowers_specs_2026_07_14_react_rewrite_design_spec, docs_superpowers_specs_2026_07_14_react_rewrite_design_component_hierarchy, docs_superpowers_plans_2026_07_14_react_rewrite_plan_plan, docs_superpowers_specs_2026_07_14_react_rewrite_design_1to1_styling [EXTRACTED 1.00]
- **Role Selection and Access Control Flow** — docs_superpowers_specs_2026_07_19_role_selection_design_spec, docs_superpowers_specs_2026_07_19_role_selection_design_two_layer_auth, docs_superpowers_specs_2026_07_19_role_selection_design_settings_access_control, docs_superpowers_plans_2026_07_19_role_selection_plan_plan [EXTRACTED 1.00]
- **Kasir DB Real-Time Rental Core Architecture** — readme_kasir_db_system, readme_overtime_engine, readme_partial_returns, readme_gas_serverless_backend, readme_shift_rollover_mgmt [EXTRACTED 1.00]
- **Strategic HTML Presentation System** — agents_skills_design_references_slides_html_template_slides_html_architecture, agents_skills_design_references_slides_layout_patterns_slide_layout_taxonomy, agents_skills_design_references_slides_copywriting_formulas_persuasion_formulas, agents_skills_design_references_slides_strategies_deck_strategies_taxonomy [EXTRACTED 1.00]
- **SVG Symbol Icons Set** — public_icons_bluesky_icon, public_icons_discord_icon, public_icons_documentation_icon, public_icons_github_icon, public_icons_social_icon, public_icons_x_icon [EXTRACTED 1.00]
- **Unified Design Meta-Skill and Subsystem Federation** — _agents_skills_design_skill_design, _agents_skills_brand_skill_brand, _agents_skills_banner_design_skill_banner_design, _agents_skills_design_system_skill_design_system, _agents_skills_design_skill_subskill_routing [EXTRACTED 1.00]
- **Slides Presentation Architecture System** — agents_skills_slides_skill, agents_skills_slides_references_html_template, agents_skills_slides_references_layout_patterns, agents_skills_slides_references_slide_strategies [INFERRED 0.85]
- **Shadcn & Tailwind UI Styling Framework** — agents_skills_ui_styling_skill, agents_skills_ui_styling_references_shadcn_components, agents_skills_ui_styling_references_shadcn_theming, agents_skills_ui_styling_references_tailwind_customization [INFERRED 0.85]
- **Google Sheets POS Backend Integration Flow** — docs_google_apps_script_readme, docs_google_apps_script_readme_sheet_schema, docs_google_apps_script_readme_webapp_deployment [INFERRED 0.95]

## Communities (126 total, 45 thin omitted)

### Community 0 - "App.jsx"
Cohesion: 0.05
Nodes (75): react, addDeletionLog(), addSession(), apiCall(), authHeaders(), authToken, backupDatabase(), changeAdminPassword() (+67 more)

### Community 1 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 2 - "search"
Cohesion: 0.07
Nodes (42): BM25, detect_domain(), get_cip_brief(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection (+34 more)

### Community 3 - "semantic"
Cohesion: 0.25
Nodes (8): $type, $value, $type, $value, semantic, spacing, component, section

### Community 4 - "UI Styling Skill"
Cohesion: 0.05
Nodes (48): Slide Copywriting Formulas, Attention-Interest-Desire-Action (AIDA) Formula, Before-After-Bridge (BAB) Formula, Slide Headline Rules, Problem-Agitate-Solve (PAS) Formula, Slides Creation Guide, HTML Slide Template Structure, Slide CSS Variable Tokens (+40 more)

### Community 5 - "Color Semantic Tokens (Primary, Muted, Destructive)"
Cohesion: 0.10
Nodes (45): Three-Layer Token Architecture (Primitive -> Semantic -> Component), Component Specifications Reference, Badge Component Specification, Button Component Specification, Card Component Specification, Dialog Modal Specification, Dropdown Menu Specification, Input Component Specification (+37 more)

### Community 6 - "db.js"
Cohesion: 0.09
Nodes (41): addDeletedTxnToDb(), addDeletionLog(), addSession(), ADMIN_ONLY_ACTIONS, backupDatabase(), changeAdminPassword(), claimSession(), clearAllTxns() (+33 more)

### Community 7 - "button"
Cohesion: 0.06
Nodes (45): $type, $value, $type, $value, bg, fg, font-size, hover-bg (+37 more)

### Community 8 - "slide_search_core.py"
Cohesion: 0.08
Nodes (36): format_context(), format_result(), main(), Format a single search result for display, Format contextual recommendations for display., BM25, calculate_pattern_break(), detect_domain() (+28 more)

### Community 9 - "spacing"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 10 - "Brand Identity & Consistency Skill"
Cohesion: 0.07
Nodes (35): 22 Art Direction Styles, Banner Safe Zones & Visual Hierarchy Rules, Banner Sizes & Art Direction Reference Guide, Banner Platform Sizes & Aspect Ratio Specs, Banner Design Multi-Format Skill, Standard (Flash) vs Pro Image Generation Selection, Banner Creation Workflow & Export Pipeline, Marketing Asset Approval Checklist (+27 more)

### Community 11 - "TestTailwindConfigGenerator"
Cohesion: 0.06
Nodes (16): Test adding colors multiple times., Test adding full color palette., Test adding custom spacing., Test adding custom breakpoints., Test TailwindConfigGenerator class., Test generating TypeScript configuration., Test validating config with empty theme extensions., Test writing configuration to file. (+8 more)

### Community 12 - "html-token-validator.py"
Cohesion: 0.13
Nodes (24): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+16 more)

### Community 13 - "React Rewrite Implementation Plan"
Cohesion: 0.09
Nodes (28): 10:59 Overtime Tolerance Rule, React Rewrite Implementation Plan, Service Worker Unregistration Pattern, Task 1: Setup HTML, Vite, and Style Integration, Task 2: Supabase Integration & State Initialization, Task 3: Login Panel & Shift Navigation Router, Task 4: Dashboard Tab Component, Task 5: Setup Tab Layout and Footer Navigation Bar (+20 more)

### Community 14 - "BM25"
Cohesion: 0.11
Nodes (19): BM25, detect_domain(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results (+11 more)

### Community 15 - "TailwindConfigGenerator"
Cohesion: 0.10
Nodes (12): main(), Add custom font families. Args: fonts: Dict of font_type: [font_names] e.g.,…, Add custom spacing values. Args: spacing: Dict of name: value e.g., {'18':…, Add custom breakpoints. Args: breakpoints: Dict of name: width e.g., {'3xl':…, Add plugin requirements. Args: plugins: List of plugin names e.g.,…, Get plugin recommendations based on configuration. Returns: List of recommended…, Generate Tailwind CSS configuration files., Validate configuration. Returns: Tuple of (valid, message) (+4 more)

### Community 16 - "Slides Master Reference"
Cohesion: 0.11
Nodes (21): Slides Master Reference, Slides Copywriting Formulas Reference, High-Impact Headline and Social Proof Patterns, Persuasive Copywriting Formulas (PAS, AIDA, FAB, Before-After), Slide Type to Copywriting Formula Mapping, Slides Create Invocation Reference, Slides Skill Task Invocation Handler, Slides HTML Template Reference (+13 more)

### Community 17 - "color"
Cohesion: 0.29
Nodes (7): $type, $value, background, destructive, $type, $value, color

### Community 18 - "generate-slide.py"
Cohesion: 0.15
Nodes (19): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+11 more)

### Community 19 - "DesignSystemGenerator"
Cohesion: 0.16
Nodes (9): DesignSystemGenerator, Find matching reasoning rule for a category., Apply reasoning rules to search results., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are…, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV. (+1 more)

### Community 20 - "fetch-background.py"
Cohesion: 0.17
Nodes (17): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+9 more)

### Community 21 - "generate_design_system"
Cohesion: 0.31
Nodes (9): generate_design_system(), persist_design_system(), Main entry point for design system generation. Args: query: Search query (e.g.,…, Slugify a name into a single safe path segment. Only [a-z0-9_-] survives; every…, Persist design system to design-system/<project>/ folder using Master +…, safe_slug(), format_output(), main() (+1 more)

### Community 22 - "icon/generate.py"
Cohesion: 0.20
Nodes (15): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+7 more)

### Community 23 - "fontSize"
Cohesion: 0.06
Nodes (47): $type, $value, $type, $value, $type, $value, $type, $value (+39 more)

### Community 24 - "TestShadcnInstaller"
Cohesion: 0.12
Nodes (9): Test adding components in dry run mode., Test ShadcnInstaller class., Test adding all components without config., Test adding all components in dry run mode., Test listing installed components without config., Test listing installed components when none exist., Test initialization with custom project root., Test checking for non-existent shadcn config. (+1 more)

### Community 25 - "devDependencies"
Cohesion: 0.13
Nodes (15): @google/clasp, oxlint, devDependencies, @google/clasp, oxlint, @playwright/test, @testing-library/jest-dom, @testing-library/react (+7 more)

### Community 26 - "extract-colors.cjs"
Cohesion: 0.22
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 27 - "validate-asset.cjs"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 28 - "CIP Design Reference"
Cohesion: 0.20
Nodes (12): CIP Deliverable Guide, 50 Corporate Identity Deliverables Taxonomy, Office and Environmental Branding System, Stationery Deliverables Package, CIP Design Reference, CIP Industry Categories Guide, AI Mockup Generation System, CIP Workflow Process (+4 more)

### Community 29 - "destructive-foreground"
Cohesion: 0.67
Nodes (3): destructive-foreground, $type, $value

### Community 30 - "validate-tokens.cjs"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 31 - "ShadcnInstaller"
Cohesion: 0.20
Nodes (7): main(), Handle shadcn/ui component installation., ShadcnInstaller, Tests for shadcn_add.py, Test adding components that are already installed., Test listing installed components when they exist., Test getting installed components without config.

### Community 32 - ".check_shadcn_config"
Cohesion: 0.21
Nodes (6): Add all available shadcn/ui components. Args: overwrite: If True, overwrite…, List installed components. Returns: Tuple of (success, message with component…, Check if shadcn is initialized in project. Returns: True if components.json…, Get list of already installed components. Returns: List of installed component…, Read shadcn version from project package.json; fall back to a pinned default., Add shadcn/ui components. Args: components: List of component names to add…

### Community 33 - ".generate_config_string"
Cohesion: 0.20
Nodes (6): Generate configuration file content. Returns: Configuration file as string, Generate TypeScript configuration., Generate JavaScript configuration., Format plugins array for config. Validates each plugin name against a strict…, Add indentation to JSON string., Write configuration to file. Returns: Tuple of (success, message)

### Community 34 - "inject-brand-context.cjs"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 35 - "embed-tokens.cjs"
Cohesion: 0.18
Nodes (8): args, fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath, wrapStyle

### Community 36 - "primitive"
Cohesion: 0.17
Nodes (11): dark, semantic, normal, slow, $type, $value, primitive, duration (+3 more)

### Community 37 - "patch"
Cohesion: 0.18
Nodes (6): Test adding components with overwrite flag., Test successful component addition., Test component addition with subprocess error., Test component addition when npx is not found., Test successful addition of all components., patch

### Community 38 - "test_tailwind_config_gen.py"
Cohesion: 0.22
Nodes (8): Tests for tailwind_config_gen.py, Reduce a generated TS/JS config to a bare assignable object so it can be handed…, Regression guard for the missing-comma bug between the ``theme`` block and…, The property preceding ``plugins`` must end with a comma (pure-Python check, so…, The emitted config parses as valid JS via ``node --check``., _strip_to_object(), TestGeneratedConfigIsValidJs, parametrize

### Community 39 - "search"
Cohesion: 0.25
Nodes (10): detect_domain(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search stack-specific guidelines, search() (+2 more)

### Community 40 - "dependencies"
Cohesion: 0.18
Nodes (11): @google/gemini-cli, dependencies, @google/gemini-cli, react, react-dom, @supabase/supabase-js, sweetalert2, react (+3 more)

### Community 41 - "foreground"
Cohesion: 0.67
Nodes (3): foreground, $type, $value

### Community 42 - "logo/generate.py"
Cohesion: 0.29
Nodes (9): enhance_prompt(), generate_batch(), generate_logo(), load_env(), main(), Enhance the logo prompt with style and industry modifiers, Generate a logo using Gemini models with image generation Args: aspect_ratio:…, Generate multiple logo variants with different styles (+1 more)

### Community 43 - "generate-tokens.cjs"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 44 - "._base_config"
Cohesion: 0.22
Nodes (6): Path, Initialize generator. Args: typescript: If True, generate .ts config, else .js…, Determine default output path., Create base configuration structure., Get default content paths for framework., Any

### Community 45 - "sync-brand-to-tokens.cjs"
Cohesion: 0.33
Nodes (8): adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale(), main(), path, updateDesignTokens()

### Community 46 - "_run"
Cohesion: 0.28
Nodes (8): Path, Regression tests for validate-tokens.cjs. The validator used to skip any line…, A hardcoded hex on the same line as a var() token is still a violation., A line that references only tokens produces no false positives., _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation(), CompletedProcess

### Community 47 - "BM25"
Cohesion: 0.28
Nodes (5): BM25, BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query

### Community 48 - "Kasir DB Rental POS System"
Cohesion: 0.25
Nodes (9): Evren House Web Entrypoint, Theme Initializer (kw_theme), Google Apps Script Serverless Backend, Kasir DB Rental POS System, Live Rental Tracking & Overtime Engine, Dynamic Partial Returns & Split Billing, QR Code Receipts & Thermal Printing, 6 AM Shift Rollover & Queue Management (+1 more)

### Community 49 - "muted"
Cohesion: 0.67
Nodes (3): muted, $type, $value

### Community 50 - "rentals/components/CalculateRentalModal.jsx"
Cohesion: 0.21
Nodes (14): SHIFT_ROLLOVER_HOUR, CalculateRentalModal(), calcOT(), calcOTCost(), calculateItemDetail(), calculatePartialReturn(), calculateRentalTotals(), formatOvertimeStrings() (+6 more)

### Community 51 - "design_system.py"
Cohesion: 0.12
Nodes (20): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md(), _generate_intelligent_overrides(), hex_to_ansi() (+12 more)

### Community 52 - "appsscript.json"
Cohesion: 0.25
Nodes (7): dependencies, exceptionLogging, runtimeVersion, timeZone, webapp, access, executeAs

### Community 53 - ".oxlintrc.json"
Cohesion: 0.25
Nodes (7): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, warn

### Community 54 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test, test:coverage, test:watch

### Community 55 - "muted-foreground"
Cohesion: 0.67
Nodes (3): muted-foreground, $type, $value

### Community 56 - "primary"
Cohesion: 0.67
Nodes (3): primary, $type, $value

### Community 57 - "UX & Performance Improvements Implementation Plan"
Cohesion: 0.47
Nodes (6): UX & Performance Improvements Implementation Plan, Task 1: Extract LiveClock Component, Task 2: Add CSS Micro-Animations, Clock Re-render Isolation Architecture, UX & Performance Improvements Design Spec, Tactile Micro-Animation Feedback System

### Community 59 - "Tasks"
Cohesion: 0.12
Nodes (16): File Structure Map, Global Constraints, Native Kotlin POS (kasir-mobile) Refactoring & Modernization Implementation Plan, Task 10: UI Layer — Payment Modal & Bluetooth Receipt Printing Handoff, Task 11: UI Layer — History Tab (Shift-Grouped) & Deletion Audit Log, Task 12: CI/CD & GitHub Actions Workflow for Android Build, Task 1: Project Scaffolding, Dependencies & Tablet Configuration, Task 2: Domain Layer — 10:59 Overtime Tolerance & Rental Pricing Engine (+8 more)

### Community 60 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 61 - "primary-foreground"
Cohesion: 0.67
Nodes (3): primary-foreground, $type, $value

### Community 62 - "Design Spec: Penambahan Barang Sewa Sesi Berjalan & Penggabungan/Pemisahan Bill Akhir"
Cohesion: 0.12
Nodes (15): 1. Problem Statement & Latar Belakang, 2.1 Skema Item dalam Sesi (`session.items`), 2.2 Normalisasi Data (`src/lib/utils.js`), 2.3 Pelestarian Metadata pada Partial Return (`src/features/rentals/domain/rentalCalculations.js`), 2. Arsitektur & Perubahan Data Model, 3.1 Kartu Sesi Aktif (`DashboardTab.jsx` / `LiveSessionTimer`), 3.2 Modal Tambah Item (`AddItemModal.jsx`), 3.3 Templat Struk Tambahan (`generateAdditionalReceiptHTML`) (+7 more)

### Community 64 - "primary-hover"
Cohesion: 0.67
Nodes (3): primary-hover, $type, $value

### Community 66 - "fix-css.cjs"
Cohesion: 0.50
Nodes (3): colorMaps, css, fs

### Community 71 - "Google Apps Script Backend Setup Guide"
Cohesion: 1.00
Nodes (3): Google Apps Script Backend Setup Guide, Google Sheets Database Schema, Apps Script Web App Deployment

### Community 73 - "ring"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 74 - "secondary"
Cohesion: 0.67
Nodes (3): secondary, $type, $value

### Community 75 - "secondary-foreground"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

### Community 76 - "Global Constraints"
Cohesion: 0.18
Nodes (10): Global Constraints, Penambahan Barang Sewa Sesi Berjalan & Penggabungan/Pemisahan Bill Akhir Implementation Plan, Self-Review Checklist, Task 1: Data Normalization & Schema Extension (`src/lib/utils.js`), Task 2: Rental Domain Calculations (`src/features/rentals/domain/rentalCalculations.js`), Task 3: Additional Order Receipt Template & Printer Hook (`src/features/receipts/`), Task 4: Rental Action Hook Extension (`useRentalActions.js`), Task 5: Add Item Modal Component (`AddItemModal.jsx`) (+2 more)

### Community 78 - "fast"
Cohesion: 0.67
Nodes (3): fast, $type, $value

### Community 79 - "Logo Design Reference"
Cohesion: 0.18
Nodes (12): Logo Design Reference, Logo Generation CLI and Search Tooling, Logo Design Workflow Process, Logo Quality and Scalability Evaluation Criteria, Logo AI Prompt Engineering Reference, Logo Prompt Structure and Negative Prompting, Prompt Modifiers for Scalability and Versatility, Style-Specific Logo Prompt Keywords (+4 more)

### Community 101 - "Social Photos Design Guide"
Cohesion: 0.22
Nodes (10): Banner Sizes and Styles Reference, Banner 22 Art Direction Styles, Banner Production QA Checklist, Banner Platform Dimensions and Aspect Ratios, Banner Layout and Safe Zone Rules, Social Photos Design Guide, Headless Chrome / Puppeteer Screenshot Export Pipeline, Social Photo HTML/CSS Canvas Rendering (+2 more)

### Community 128 - "receiptTemplates.js"
Cohesion: 0.60
Nodes (7): dateStr(), generateAdditionalReceiptHTML(), generateFinishReceiptHTML(), generateStartReceiptHTML(), getTrackUrl(), timeStr(), useReceiptPrinter()

### Community 133 - "Design Skills Task Routing Matrix"
Cohesion: 0.17
Nodes (12): Design Routing Guide, Design Skills Task Routing Matrix, Multi-Skill Workflow Orchestration, Task Dispatching Rules and Heuristics, Icon Design Reference, SVG Icon Generation Engine (Gemini 3.1 Pro), 15 Icon Styles and 10 Categories Taxonomy, SVG Icon Standards (viewBox 24x24, currentColor) (+4 more)

### Community 134 - "Logo Color Psychology Reference"
Cohesion: 0.29
Nodes (7): CIP Style Guide, CIP Color Psychology and Material Finishes, CIP Design Style Archetypes, Logo Color Psychology Reference, Color Harmony Schemes (Analogous, Complementary, Triadic), Industry Color Palette Standards, Color Psychological Meanings and Emotional Associations

## Knowledge Gaps
- **302 isolated node(s):** `fs`, `path`, `fs`, `path`, `fs` (+297 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `primitive` connect `primitive` to `gray`, `spacing`, `fontSize`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `component` connect `button` to `primitive`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `color` connect `gray` to `primitive`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `fs`, `path`, `fs` to the rest of the system?**
  _302 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.053904873752201994 - nodes in this community are weakly interconnected._
- **Should `gray` be split into smaller, more focused modules?**
  _Cohesion score 0.05370101596516691 - nodes in this community are weakly interconnected._