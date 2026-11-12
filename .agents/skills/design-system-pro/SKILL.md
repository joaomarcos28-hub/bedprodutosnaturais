---
name: design-system-pro
description: Crie e mantenha um design system profissional com tokens, componentes documentados, Storybook e governança para equipes de produto.
---

# Design System Pro

> A design system is a product that serves other products. Treat it accordingly.

## Scope
Use this skill when creating a new design system, auditing an existing one, planning component documentation, setting up Storybook, or establishing design system governance.

## Principles
1. The Design System Serves Teams -- Not the Other Way Around
2. Documentation Is the Product: Undocumented components don''t exist
3. Token-First Architecture: Everything derives from tokens
4. Version Everything: Breaking changes need major versions
5. Adoption Requires Champions: Technical quality alone is not enough

## Architecture

### Layer 1: Design Tokens
```
tokens/
├── primitive.css      # Raw values: --blue-500: #3B82F6
├── semantic.css       # Purpose: --color-primary: var(--blue-500)
└── component.css      # Component-specific: --button-bg: var(--color-primary)
```

### Layer 2: Base Components
Atomic components with no business logic:
- Button (primary, secondary, ghost, destructive + all sizes)
- Input (text, email, password, search, textarea)
- Select, Checkbox, Radio, Toggle
- Badge, Tag, Avatar
- Icon (wrapper for icon library)

### Layer 3: Composite Components
Built from base components:
- Form (with validation)
- Card (header, body, footer)
- Modal, Drawer, Tooltip, Popover
- DataTable (with pagination, sorting)
- Navigation (header, sidebar, breadcrumb)

### Layer 4: Patterns
Full UI patterns using composite components:
- Authentication forms
- Dashboard layouts
- Empty states
- Error pages

## Component API Standards
Every component must have:
- TypeScript props interface (fully typed)
- Default props for optional params
- `className` prop for style extension
- `data-testid` support
- ARIA compliance built-in
- Storybook story with all variants

## Documentation Requirements
Each component in Storybook must include:
1. Description: What it is and when to use it
2. Props table: All props, types, defaults, description
3. Stories: Default, all variants, all states
4. Do''s and Don''ts: 2-3 each
5. Accessibility notes
6. Code example (copy-pasteable)

## Versioning & Governance
- Semantic versioning: major.minor.patch
- Breaking changes: major version + migration guide
- RFC process for new components (request for comments)
- Design + Engineering review for all additions
- Changelog maintained for every release

## Checklist
- [ ] Token architecture: primitive + semantic + component
- [ ] All components have TypeScript interfaces
- [ ] Storybook configured with all variants
- [ ] Dark mode supported via CSS Custom Properties
- [ ] Accessibility tested (axe-core in Storybook)
- [ ] Changelog and versioning in place
- [ ] Contributing guidelines documented
