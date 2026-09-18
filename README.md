# Ephemeral — Anonymous Real-Time Temporary Chat

> Create a private room. Share a link. Chat. Walk away — everything disappears.

No accounts. No permanent messages. No email required.

---

## Features

- 🔒 **Fully anonymous** — temporary display names only, no accounts
- ⚡ **Real-time** — Socket.IO for instant messages, typing indicators, presence
- 📎 **Media sharing** — images & videos uploaded directly to Cloudflare R2
- 🗑️ **True ephemeral** — all messages, media & metadata deleted on session end
- 🔑 **Optional PIN** — protect rooms with a bcrypt-hashed PIN
- 👥 **Participant limits** — server-enforced, atomic concurrency-safe join
- ⏱️ **Expiration** — sessions auto-destroy with background cleanup job
- 🔁 **Reconnection** — 30-second grace period before eviction
- 🛡️ **Security** — Helmet, CORS, rate limiting, signed URLs, input validation

---

## Architecture

```
React (Vite + Tailwind)  ←→  Node/Express + Socket.IO
        ↓ HTTPS + WebSocket             ↓
                          MongoDB Atlas  +  Cloudflare R2
```

**Deployment:**
- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas (free tier)
- Media storage → Cloudflare R2

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v3, Socket.IO Client |
| Backend | Node.js, Express 4, Socket.IO 4, Mongoose |
| Database | MongoDB Atlas |
| Storage | Cloudflare R2 (S3-compatible) |
| Auth | SHA-256 participant tokens, bcrypt PIN hashing |

---

## Local Setup

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (free tier is fine)
- A Cloudflare account with R2 enabled

### 1. Clone

```bash
git clone https://github.com/yourname/ephemeral-chat.git
cd ephemeral-chat
```

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Configure environment

```bash
cp server/.env.example server/.env
```

Fill in `server/.env` — see [Environment Variables](#environment-variables).

### 4. Run locally

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## Environment Variables

Create `server/.env` from `server/.env.example`:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token key ID |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` |
| `CLIENT_URL` | Frontend URL (for CORS) |
| `SESSION_TOKEN_SECRET` | Random secret string |
| `PARTICIPANT_TOKEN_SECRET` | Random secret string |
| `RECONNECT_GRACE_PERIOD_MS` | Grace period before eviction (default: 30000) |
| `MAX_IMAGE_SIZE_MB` | Image upload limit (default: 10) |
| `MAX_VIDEO_SIZE_MB` | Video upload limit (default: 100) |
| `CLEANUP_INTERVAL_MS` | Background cleanup frequency (default: 60000) |

---

## MongoDB Atlas Setup

1. Create a free cluster at https://cloud.mongodb.com
2. Create a database user
3. Whitelist your IP (or `0.0.0.0/0` for Render)
4. Copy the connection string into `MONGODB_URI`

---

## Cloudflare R2 Setup

1. Enable R2 in your Cloudflare dashboard
2. Create a bucket
3. Create an API token with **Object Read & Write** permissions
4. Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
5. Set `R2_ENDPOINT` to `https://<account_id>.r2.cloudflarestorage.com`

> **CORS on R2 bucket**: Add a CORS rule allowing `PUT` from your frontend domain so browsers can upload directly.

Example R2 CORS config:
```json
[
  {
    "AllowedOrigins": ["https://your-frontend.vercel.app", "http://localhost:5173"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Development Commands

```bash
# Run both client and server in dev mode
npm run dev

# Run only server
npm run dev:server

# Run only client
npm run dev:client

# Run backend tests
cd server && npm test

# Build frontend for production
npm run build
```

---

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set build command: `cd client && npm install && npm run build`
4. Set output directory: `client/dist`
5. Set env var: `VITE_BACKEND_URL=https://your-backend.onrender.com`

### Backend → Render

1. Create a new Web Service pointing to `server/`
2. Build command: `npm install`
3. Start command: `node server.js`
4. Add all environment variables from `.env.example`

---

## API Overview

### Sessions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/sessions` | None | Create session |
| `GET` | `/api/sessions/:token` | None | Get session info |
| `POST` | `/api/sessions/:token/join` | None | Join session |
| `POST` | `/api/sessions/:token/leave` | Participant | Leave session |
| `POST` | `/api/sessions/:token/end` | Creator | Destroy session |

### Media

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/media/upload-url` | Participant | Get presigned PUT URL |
| `POST` | `/api/media/:id/confirm` | Participant | Confirm upload complete |
| `GET` | `/api/media/:id/download-url` | Participant | Get presigned GET URL |

### Health

```
GET /health  →  { "status": "ok" }
```

---

## Socket Events

### Client → Server

| Event | Description |
|---|---|
| `message:send` | Send a text/media message |
| `typing:start` | Started typing |
| `typing:stop` | Stopped typing |
| `session:destroy` | Creator ends session |
| `presence:reconnected` | Client reconnected |

### Server → Client

| Event | Description |
|---|---|
| `session:state` | Full session state (participants + messages) |
| `session:destroyed` | Session ended — all clients disconnect |
| `message:new` | New message broadcast |
| `participant:joined` | Someone joined |
| `participant:left` | Someone left |
| `presence:update` | Online/offline status change |
| `typing:start` | Someone started typing |
| `typing:stop` | Someone stopped typing |
| `force:disconnect` | Server forcibly disconnecting client |

---

## Security

- **No accounts** — temporary participant tokens only
- **Token entropy** — 32-byte `crypto.randomBytes` (256-bit)
- **PIN hashing** — bcrypt with cost factor 10
- **Server-authoritative** — all limits, roles, and permissions enforced server-side
- **Signed URLs** — R2 media accessed via short-lived presigned URLs only
- **Rate limiting** — per-IP limits on all endpoints
- **Helmet** — HTTP security headers
- **CORS** — restricted to `CLIENT_URL` origin only
- **Input validation** — express-validator on all routes
- **File validation** — MIME type, extension, and size checked before generating upload URL

---

## Data Deletion Behavior

When a session ends (manually or via expiration):

1. ✅ All messages deleted from MongoDB
2. ✅ All media metadata deleted from MongoDB
3. ✅ All media files deleted from Cloudflare R2
4. ✅ Session record status set to `destroyed`
5. ✅ Invite URL becomes permanently invalid

> **Important**: If a participant downloaded a file to their device before the session ended, that local copy **cannot be remotely deleted**. Only server-side copies are erased.

---

## Privacy Limitations

- The application itself does not permanently store message content or media
- Hosting providers (Render, Vercel, Cloudflare) may retain their own infrastructure logs
- Downloaded files on participant devices are outside server control
- Use this service accordingly — do not share content you would not want potentially retained in third-party infrastructure logs

---

## Testing

```bash
cd server && npm test
```

Test suites cover:
- Token generator uniqueness and format
- Session creation and join validation
- Participant limit enforcement
- Expired/destroyed session rejection
- Message validation
- Cleanup idempotency

---

## License

MIT
