---
name: reviso-de-web-design
description: Revisão crítica de layouts, hierarquia visual, consistência, acessibilidade e qualidade geral de projetos web.
---

# Webdesign Review

> A good review finds problems early. A great review explains why they''re problems.

## Scope
Use this skill when reviewing web design mockups, evaluating design quality, providing structured feedback, or conducting pre-launch design QA.

## Review Framework

### Visual Hierarchy
- Is the most important element the most prominent?
- Are there clear primary, secondary, and tertiary levels?
- Is there only ONE primary CTA per viewport?
- Does the eye naturally flow through the design?

### Typography
- Max 2-3 typefaces?
- Is there a clear typographic scale?
- Minimum 16px body text?
- 4.5:1 contrast ratio for text?
- 45-75 character line length?

### Color
- Does the design use max 5 chromatic colors?
- 60-30-10 rule applied?
- Color is not the only way information is conveyed?
- All text passes WCAG contrast requirements?

### Layout & Spacing
- 8px baseline grid consistent throughout?
- Adequate whitespace between sections?
- Maximum content width set?
- No horizontal overflow?

### Components & States
- Do buttons have hover, active, disabled states?
- Do inputs have default, focus, error, disabled states?
- Are there loading states for all async operations?
- Are there empty states for all data views?

### Mobile
- Is the design mobile-first?
- Touch targets minimum 44x44px?
- No hover-only interactions?
- Navigation tested for mobile?

### Accessibility
- All images have alt text?
- Color contrast passes WCAG AA?
- Interactive elements are keyboard accessible?
- Focus states visible?

## Feedback Format
For each issue, provide:
1. **Location**: Where is the issue?
2. **Issue**: What specifically is wrong?
3. **Impact**: Why does it matter?
4. **Recommendation**: What should be done?
5. **Priority**: P0/P1/P2/P3

## Checklist
- [ ] Visual hierarchy: single primary CTA per viewport
- [ ] Typography: max 3 typefaces, 16px+ body
- [ ] All text passes 4.5:1 contrast (normal) or 3:1 (large)
- [ ] All components have full state coverage
- [ ] Mobile reviewed at 375px
- [ ] Accessibility basics verified
