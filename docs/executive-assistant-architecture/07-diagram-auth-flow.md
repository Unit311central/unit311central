# 07 - Diagram: Auth Flow

Mermaid source: /architecture/executive-assistant/diagrams/05-auth-flow.mmd

`mermaid
sequenceDiagram
  participant B as Browser
  participant MW as Middleware
  participant LOGIN as /api/auth/login
  participant API as EA API routes
  participant S as getPlatformSession
  participant CTX as buildBusinessContext
  participant ACT as Action permissions

  B->>LOGIN: username/password
  LOGIN-->>B: Set-Cookie dc_platform_session (HMAC)
  B->>API: Request + Cookie
  MW->>MW: Edge verify token (optional gate)
  API->>S: read cookie via Web Crypto HMAC
  S-->>API: PlatformSession | null
  alt No session
    API-->>B: 401
  else Authenticated
    API->>CTX: session + activeView + selection
    CTX-->>API: AssistantBusinessContext
    API->>ACT: requiredPermissions check
    ACT-->>API: allow / deny
  end
`
