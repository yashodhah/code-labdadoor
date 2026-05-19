---
name: api-design-standards
description: "Apply when designing or reviewing HTTP APIs — enforces TCP API design standards."
---

# The Cloud Plumbing Co — API Design Standards

These are **what NOT to do** rules. Each rule describes a prohibited pattern, why it matters, and shows a bad/good example.

---

## TCP-API-001 — No Verbs in REST Endpoint Paths

**Rule:** Use nouns and HTTP methods to express intent. Verbs in paths are not permitted.

**Why it matters:** Verb-based paths fracture the API surface and make routes unpredictable for consumers.

```
# ❌ Bad
POST /createOrder
GET  /fetchUser/42
POST /deleteAccount

# ✅ Good
POST   /orders
GET    /users/42
DELETE /accounts/{id}
```

---

## TCP-API-002 — No Leaking Internal Error Details

**Rule:** Never return stack traces, internal class names, or database error messages in API responses. Return a safe human-readable message and an opaque error code.

**Why it matters:** Leaked internals give attackers a map of your stack and reveal exploitable implementation details.

```
# ❌ Bad
{
  "error": "NullPointerException at com.tcp.OrderService.java:142",
  "detail": "column 'usr_id' of relation 'orders' does not exist"
}

# ✅ Good
{
  "error": {
    "code": "ORDER_CREATE_FAILED",
    "message": "Unable to create order. Please try again or contact support."
  }
}
```

---

## TCP-API-003 — No Sensitive Data in Query Parameters

**Rule:** Credentials, tokens, and PII must not be passed in query parameters. Use request headers or the request body instead.

**Why it matters:** Query parameters are logged by web servers, proxies, and CDNs, and persist in browser history — sensitive values are trivially exposed.

```
# ❌ Bad
GET /reports?api_key=sk-secret123&user_email=jane@example.com

# ✅ Good
GET /reports
Authorization: Bearer sk-secret123
# PII sent in POST body or retrieved via authenticated session
```

---

## TCP-API-004 — No Inconsistent Response Shapes

**Rule:** Every endpoint in a service must return the same response envelope. Mixing shapes across endpoints is not permitted.

**Why it matters:** Inconsistent shapes force clients to write per-endpoint parsing logic, increasing coupling and the blast radius of changes.

```
# ❌ Bad
# /orders returns:   { "order": { ... } }
# /users returns:    { "data": { ... }, "meta": { ... } }
# /products returns: [ { ... } ]

# ✅ Good — every endpoint uses the same envelope
{
  "data": { ... },      # null on error
  "error": null,        # null on success; { code, message } on error
  "meta": { ... }       # pagination, request ID, etc.
}
```

---

## TCP-API-005 — No Side Effects on GET Requests

**Rule:** GET requests must be safe and idempotent. Any operation that mutates state must use POST, PUT, PATCH, or DELETE.

**Why it matters:** Clients, proxies, and crawlers may call GET endpoints multiple times. Unintended side effects on repeat calls cause data corruption and unpredictable behaviour.

```
# ❌ Bad
GET /emails/456/markAsRead      # mutates state on read
GET /jobs/trigger?type=invoice  # triggers a background job

# ✅ Good
PATCH /emails/456        body: { "read": true }
POST  /jobs              body: { "type": "invoice" }
```

---

## When This Skill Applies

Trigger this skill when:

- **Designing new endpoints** — validate path naming, method choice, and response shape before writing code.
- **Reviewing route handlers** — check any file in `routes/`, `controllers/`, `handlers/`, or `api/` directories for violations.
- **Writing error-handling middleware** — ensure error serialisers never expose internal details.
- **Adding authentication or token-passing logic** — verify tokens are not routed through query parameters.
- **Defining shared response types or DTOs** — confirm the envelope is consistent with the rest of the service.
