# API Design Standards (v3.0)

## 1. Architectural Style
We utilize a **Pragmatic REST** approach.
- Resources are nouns (`/lessons`, `/profile`).
- Actions using standard HTTP verbs (GET, POST, PUT, DELETE).
- JSON Envelope: `{ success: true, data: ..., error: null }`.

## 2. Versioning Policy
- **Strategy**: URL Path Versioning (`/api/v1/...`).
- **Deprecation**: Old versions supported for 6 months.
- **Header**: Clients can check `X-API-Version`.

## 3. Rate Limiting (Security)
To prevent abuse and ensure QoS, we implement a Token Bucket algorithm.
- **Limit**: 20 requests / minute per IP.
- **Headers**:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
- **Response**: 429 Too Many Requests.

## 4. Error Handling
Errors adhere to the `APIWrapper` standard:
```json
{
  "success": false,
  "error": "Human readable message",
  "code": "ERROR_CODE",
  "meta": { ...context }
}
```

## 5. Middleware Layer
Req -> [RateLimit] -> [Auth Check] -> [Zod Validation] -> [Service Layer] -> Res
