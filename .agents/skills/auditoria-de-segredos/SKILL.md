---
name: auditoria-de-segredos
description: Audite vazamentos de segredos, bancos abertos e exposição de dados em código client-side.
---

Audit this project for data leaks. Check the following in order of severity.

1. SECRETS IN CLIENT CODE
Search every file served to the browser for hardcoded API keys, passwords, database URLs, or tokens. Look for: OpenAI keys (sk-...), Supabase keys, Stripe keys, Firebase credentials, .env values pasted directly into code. Check if secrets are loaded from env vars or hardcoded.

2. DATABASE SECURITY
Check database configuration. If Supabase, check if Row Level Security (RLS) is enabled on every table. If RLS is off, anyone with the URL and anon key can read and write all data. If Firebase, check Firestore/RTDB security rules. Flag any table or collection where unauthenticated users can read or write.

3. DATA OVER-EXPOSURE
Check every API call and database query that returns data to the browser:
- Does it use select(''*'') or return entire rows when the UI only needs a few fields?
- Are sensitive fields (emails, phone numbers, internal IDs, metadata) sent to the client but never displayed?
List each endpoint or query that returns more data than the UI consumes.

For each finding, report:
- Number (1, 2, 3...)
- Severity: CRITICAL, HIGH, or OK
- File and line number
- What''s wrong (one sentence)
- What could happen if you don''t fix it (one sentence)
- How to fix it and what could break (one sentence each)

Sort by severity, then by how fast it could hurt you.

IMPORTANT: This is an audit only. Do NOT modify any code. Report what you find and suggest fixes, but do not apply any changes until I explicitly ask you to.
