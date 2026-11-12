---
name: auditoria-de-website
description: Avaliação abrangente de UX, performance, SEO, acessibilidade e conteúdo para identificar e priorizar melhorias.
---

# Website Audit

> An audit without prioritized actions is just a list of complaints.

## Scope
Use this skill when conducting a comprehensive website audit across UX, performance, SEO, accessibility, and content dimensions. Use to identify issues and create a prioritized improvement roadmap.

## Principles
1. Measure First, Then Optimize: Use data, not opinions
2. Prioritize by Impact and Effort: Fix high-impact, low-effort issues first
3. Audit with User Goals in Mind: Does the site help users accomplish their goals?
4. Performance Is a Feature: Slow sites lose users and rankings
5. Accessibility Is Legal Compliance: Not optional

## Audit Dimensions

### 1. UX & Conversion Audit
- Navigation: Is critical content reachable in 3 clicks?
- CTA placement: Is there a clear primary action above the fold?
- Form friction: Count required fields; each reduces conversion
- Mobile experience: Thumb-friendly? No horizontal scroll?
- Trust signals: Social proof, security badges, contact info visible?

### 2. Performance Audit
- Run Google PageSpeed Insights (target: 90+ on mobile)
- Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1
- Image optimization: WebP format? Lazy loading? srcset?
- JavaScript: Unused JS? Code splitting? Critical path optimized?

### 3. SEO Audit
- Title tags: Unique, 50-60 characters, keyword-first?
- Meta descriptions: Unique, 120-155 characters, compelling?
- H1: One per page, contains primary keyword?
- Internal linking: Clear site architecture? No orphan pages?
- Core Web Vitals: Pass all three?

### 4. Accessibility Audit
- Run axe DevTools or WAVE
- Color contrast: 4.5:1 for normal text?
- Images: All meaningful images have alt text?
- Forms: All inputs labeled?
- Keyboard navigation: All interactive elements reachable?

### 5. Content Audit
- Is the value proposition clear in under 5 seconds?
- Is content written for the target audience?
- Is there a clear content hierarchy?
- Are there broken links or outdated information?

## Prioritization Matrix
| Priority | Criteria |
|---|---|
| P0 (Critical) | Breaks core functionality or legal requirement |
| P1 (High) | Directly impacts conversion or accessibility |
| P2 (Medium) | Improves UX or SEO significantly |
| P3 (Low) | Nice-to-have improvements |

## Deliverable Format
Report each issue: Dimension | Issue | Impact | Effort | Priority | Recommendation

## Checklist
- [ ] PageSpeed score measured (mobile + desktop)
- [ ] Core Web Vitals checked
- [ ] axe/WAVE accessibility scan run
- [ ] Mobile UX manually tested
- [ ] All pages have unique title + meta description
- [ ] Issues prioritized by P0-P3
