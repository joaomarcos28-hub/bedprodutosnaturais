---
name: Agent UI Design
description: Padrões de interface para aplicações de agentes e chat: layout três painéis (threads / chat / contexto), renderização de texto em streaming com indicador de cursor, cards de execução de ferramentas com estados de loading, visualização de sandbox e histórico de conversas. Inclui os padrões de interação usados pelas principais interfaces de IA do mercado.
---

Apply agent UI design patterns to this project.

Analyze the current chat/AI interface and provide improvements based on these patterns:

1. MESSAGE ARCHITECTURE — Are messages clearly typed? User messages (right-aligned, brand color bubble), assistant messages (left-aligned, neutral), system/tool messages (distinct visual treatment, e.g., gray box with monospace font). Add distinct visual treatments if missing.

2. STREAMING UI — Is text streamed token-by-token with a blinking cursor indicator? Is there a "thinking" state shown before the first token arrives? If not, implement: a pulsing animation on the assistant avatar, a typing indicator (3 animated dots), and smooth text reveal as tokens stream in.

3. TOOL EXECUTION CARDS — When the AI uses tools (search, code execution, file read, etc.), are they shown as distinct cards with: tool name + icon, input parameters, status (running/complete/error), and collapsible output? If not, design these cards.

4. THREE-PANEL LAYOUT — For agent apps: Left panel (conversation history, collapsible), Center panel (active chat, full height), Right panel (context/artifacts/tools, resizable). Implement if the layout would benefit from this structure.

5. ERROR & RETRY STATES — Are there clear visual states for: network error (with retry button), rate limit hit (with countdown timer), and model error (with fallback message)?

6. INPUT AREA — Does the chat input support: multi-line expansion (auto-resize textarea), file/image attachment, voice input indicator, and keyboard shortcut hints (Enter to send, Shift+Enter for new line)?

Provide component code for any pattern that is missing.
