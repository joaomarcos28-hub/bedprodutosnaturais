---
name: auditoria-de-qualidade-de-cdigo
description: Audite o código-fonte para identificar problemas de manutenibilidade, segurança e performance antes de ir a produção.
---

Audit this project for code quality issues. Check the following in order of severity.

1. SECURITY VULNERABILITIES IN CODE
Scan for common security issues that appear in code:
- SQL injection: raw string concatenation in database queries
- XSS: unescaped user input rendered as HTML (innerHTML, dangerouslySetInnerHTML)
- Command injection: user input passed to exec(), system(), or similar
- Path traversal: user-controlled file paths without sanitization
- Insecure deserialization: eval() on user data, JSON.parse without validation

2. CRITICAL BUGS
Look for code patterns that will cause runtime failures:
- Null/undefined access without guards (especially after async operations)
- Missing error handling on async/await (try/catch or .catch())
- Race conditions in concurrent operations
- Off-by-one errors in array operations
- Type coercion bugs (using == instead of ===)

3. PERFORMANCE ISSUES
Identify code that will cause performance problems at scale:
- N+1 query patterns (database queries inside loops)
- Missing database indexes on frequently queried columns
- Synchronous operations blocking the event loop
- Memory leaks (event listeners not removed, closures holding references)
- Unnecessary re-renders (missing memoization in React)

4. MAINTAINABILITY ISSUES
Flag patterns that make the code hard to maintain:
- Functions longer than 50 lines (single responsibility)
- Deeply nested callbacks (callback hell)
- Magic numbers without constants
- Dead code (unreachable, unused variables/imports)
- Hardcoded configuration values that should be environment variables

For each finding, report:
- Number (1, 2, 3...)
- Severity: CRITICAL, HIGH, or OK
- File and line number
- What''s wrong (one sentence)
- What could happen if you don''t fix it (one sentence)
- How to fix it and what could break (one sentence each)

Sort by severity, then by how fast it could hurt you.

IMPORTANT: This is an audit only. Do NOT modify any code. Report what you find and suggest fixes, but do not apply any changes until I explicitly ask you to.
