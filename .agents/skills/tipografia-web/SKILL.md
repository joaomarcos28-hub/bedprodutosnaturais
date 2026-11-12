---
name: tipografia-web
description: Escala tipográfica, pares de fontes, hierarquia visual, legibilidade e carregamento de web fonts para projetos web.
---

# Web Typography

> Typography is 95% of web design. Get it right and everything else follows.

## Scope
Use this skill when selecting typefaces, establishing type scales, implementing web fonts, ensuring readability, or auditing typographic consistency.

## Principles
1. Readability Over Style: Decoration never trumps legibility
2. Hierarchy Through Type: Size, weight, and spacing create visual order
3. System Fonts Are Underrated: Native fonts load instantly and feel native
4. Responsive Typography Requires Fluid Scales
5. Pairing Is About Contrast and Harmony

## Rules

### Font Selection
- DO: Limit to 2 typefaces maximum (1 heading + 1 body); 3 max if adding monospace
- DO: Use system font stack for performance-critical apps: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- DO: Subsetting web fonts: include only needed characters
- DON''T: Load more than 2 font families from external CDN
- DON''T: Use more than 3 font weights per typeface

### Type Scale
- DO: Use a modular type scale (1.25 Major Third or 1.333 Perfect Fourth)
- DO: Establish: xs/sm/base/lg/xl/2xl/3xl/4xl/5xl
- DO: Implement with CSS custom properties and `clamp()`
- DON''T: Use random font sizes -- stick to the scale

### Readability
- DO: Body text: 16-18px minimum
- DO: Line height: 1.5-1.7 for body, 1.1-1.3 for headings
- DO: Line length: 45-75 characters (use `ch` units)
- DO: Paragraph spacing: 1.5× the font size
- DON''T: Set body text smaller than 14px

### Web Font Loading
- DO: `font-display: swap` for heading fonts
- DO: `font-display: optional` for body fonts
- DO: Preload critical fonts in `<head>`
- DO: Self-host fonts when possible (GDPR + performance)
- DON''T: Load fonts from Google Fonts without considering privacy regulations

### Hierarchy
- DO: 3+ distinct levels: heading, subheading, body, caption
- DO: Use weight (bold/regular) before size for subtle hierarchy
- DO: Uppercase sparingly -- max 20 characters for legibility

## Type Pairing Guide
| Heading | Body | Personality |
|---|---|---|
| Serif (Georgia) | Sans-serif (Inter) | Classic & Modern |
| Display (Fraunces) | Sans-serif (DM Sans) | Expressive |
| Geometric (Futura) | Humanist (Source Sans) | Technical |

## Checklist
- [ ] Maximum 2 typefaces
- [ ] Modular type scale defined
- [ ] Body text 16px minimum
- [ ] Line length 45-75 characters
- [ ] Line height 1.5+ for body text
- [ ] `font-display: swap` on heading fonts
- [ ] 3+ distinct hierarchy levels
