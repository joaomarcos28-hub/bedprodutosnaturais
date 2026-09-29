---
name: responsive-design
description: "Design responsivo mobile-first partindo de 320px: grid fluido, breakpoints baseados no conteúdo (não em dispositivos), otimização de toque com alvos de 44×44px e progressive enhancement. Usa CSS Grid e Flexbox para layouts que se adaptam naturalmente a qualquer tela, do smartwatch ao ultrawide, sem media queries artificiais."
---

Review and improve the responsive design of this project using mobile-first principles.

1. MOBILE-FIRST AUDIT — Test the layout at 320px width. Does everything fit without horizontal scrolling? Are tap targets at least 44×44px? Is text at least 16px (no zooming required on mobile)? Is the font size set in rem/em (not px)?

2. BREAKPOINTS — Are breakpoints based on content needs (not just device sizes)? Recommended: 375px (small mobile), 640px (large mobile), 768px (tablet), 1024px (laptop), 1280px (desktop). Flag any components that break between these breakpoints.

3. FLUID LAYOUTS — Are CSS Grid and Flexbox used for layout (not floats or fixed positioning)? Are column counts responsive (e.g., grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)? Are images set to max-width: 100%?

4. FLUID TYPOGRAPHY — Is typography responsive? Implement clamp() for key headings: e.g., font-size: clamp(1.5rem, 4vw, 3rem). Are line lengths controlled (max-width: 65-75ch for body text)?

5. NAVIGATION — Does the navigation collapse to a hamburger menu on mobile? Is the mobile menu accessible (keyboard navigation, focus trap, close on Esc)?

6. CONTENT CHOREOGRAPHY — On mobile, is content prioritized correctly? Important content should come first in the DOM order. Decorative/secondary content can be hidden or moved.

For each issue: the component name, the specific breakpoint where it breaks, and the corrected CSS/Tailwind classes.
