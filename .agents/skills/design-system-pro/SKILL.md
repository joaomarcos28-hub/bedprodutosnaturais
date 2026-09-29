---
name: design-system-pro
description: "Gera um design system completo e justificado a partir do briefing do projeto: classifica domínio, público e mood para selecionar o padrão de layout, estilo visual, paleta de cores (tokens HSL), par tipográfico e efeitos visuais ideais. Baseado em 161 paletas, 84 estilos e 73 combinações tipográficas curadas, entrega também os anti-padrões a evitar para o perfil do projeto."
---

Generate a complete, justified design system for this project.

Analyze the project brief (domain, audience, mood, density) and produce in this exact order:

1. LAYOUT PATTERN — Select the best layout pattern for this product category (e.g., Hero + Features + CTA, Sidebar + Data Tables, Hero-Centric + Social Proof). Justify the choice.

2. VISUAL STYLE — Select a visual style (glassmorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, claymorphism, etc.). State what it is best for and confirm it does not conflict with the product domain.

3. COLOR PALETTE — Select a palette appropriate for the product. Output all 10 tokens in HSL format ready for index.css: --primary, --secondary, --accent, --background, --foreground, --card, --muted, --border, --destructive, --ring. Verify contrast: 4.5:1 for body text, 3:1 for large text and UI elements.

4. TYPOGRAPHY PAIR — Select a heading + body font pair. Provide the Google Fonts import URL and Tailwind fontFamily config. Confirm max 2-3 families and font-display: swap.

5. KEY EFFECTS — List 3-5 CSS effects/animations appropriate for the style (subtle hover states, scroll reveal, gradient animations, etc.).

6. UX GUARDRAILS — List the top 5 high-severity UX rules for this product category (navigation, forms, feedback, accessibility, performance).

7. ANTI-PATTERNS — List 5 design mistakes to avoid for this specific product type.

Format the output with clear section headers. If the brief is ambiguous, present 2 alternative directions (A and B) and ask me to choose.
