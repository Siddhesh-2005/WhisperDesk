# WhisperDesk 

> **Anonymous. Raw. Unfiltered.**

WhisperDesk is a full-stack anonymous blogging platform built exclusively for college students. It lets you speak your mind freely — share confessions, rants, academic struggles, and stories — without ever revealing who you are. Sign in with your institutional Microsoft account to verify you're a student; your identity stays completely hidden from that point forward.

🔗 **Live Demo:** [whisper-desk.vercel.app](https://whisper-desk.vercel.app)  
📐 **System Design (Eraser.io):** [Planning Board](https://app.eraser.io/workspace/1uos0MOvl986dGiSH4Tm)  
🖥️ **Backend API:** [whisperdesk.onrender.com](https://whisperdesk.onrender.com)

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Database Schema](#5-database-schema)
6. [Project Structure](#6-project-structure)
7. [Anonymity Design](#7-anonymity-design)
8. [Moderation Pipeline](#8-moderation-pipeline)
9. [Getting Started](#9-getting-started)
10. [Environment Variables](#10-environment-variables)
11. [API Overview](#11-api-overview)
12. [Deployment](#12-deployment)

---

## 1. Problem Statement

Many students hesitate to express opinions or share experiences online because of:

- Fear of social judgment or academic consequences
- Permanent linkage of thoughts to real identities
- Lack of a safe, student-only space for honest expression

WhisperDesk solves this by **decoupling identity from content** — students are verified via Microsoft OAuth2 (college email only), but no identifying information is ever exposed publicly. All interactions — posts, comments, likes, and reports — appear completely anonymous to other users.

---

## 2. Features

### Authentication
- **Microsoft Azure AD OAuth2** — sign in with your institutional college email only
- Session management via JWT with Redis-backed blacklisting

### Content
- Create anonymous blog posts with a title, rich content, image upload (Cloudinary), category, and tags
- Browse and read posts from the entire student community
- Post categories: `confession`, `academics`, `career`, `relationships`, `rant`, `help`, `general`

### Engagement
- Like / unlike posts (Redis-backed with reconciliation to MongoDB)
- Comment on posts anonymously
- Report posts or comments for abuse, spam, hate speech, etc.

### Moderation Pipeline
Posts go through a multi-stage automated moderation pipeline before being published:
1. **Regex** — instant block of slurs and blacklisted patterns
2. **Perspective API** — toxicity scoring
3. **Groq / Gemini AI** — LLM-based nuanced review
4. **Human review** — escalation queue for edge cases

### Performance & Scalability
- **BullMQ** job queues (backed by Redis Cloud) for async post moderation and like reconciliation
- **Rate limiting** on auth and posting routes (Redis Upstash)
- Denormalized counters (`likesCount`, `commentsCount`, `reportsCount`) on posts for O(1) reads
- **Redis Upstash** for like state storage and fast toggling via Lua scripts

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Redux Toolkit, React Router v7, React Hook Form, Axios |
| **Backend** | Node.js, Express 5, Nodemon |
| **Primary Database** | MongoDB (Mongoose 9) |
| **Cache / Queue Store** | Redis (ioredis + redis client), BullMQ |
| **Authentication** | Azure AD OAuth2 (`@azure/msal-node`), JWT (`jsonwebtoken`) |
| **File Uploads** | Cloudinary v2 (via Multer 2) |
| **Moderation** | Google Perspective API (`googleapis`), Groq (`groq-sdk`), Gemini (`@google/generative-ai`), OpenAI-compatible (`openai`) |
| **Email** | Nodemailer, Resend |
| **HTTP Client** | Axios + axios-retry (backend outbound calls) |
| **Rate Limiting** | `rate-limiter-flexible` |
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Render |

---

## 4. System Architecture


<img width="1111" height="718" alt="image" src="https://github.com/user-attachments/assets/584e0282-619c-4737-956d-bb5025f4969f" />


**Key design decisions:**

- **Like writes go to Redis first** via an atomic Lua script (`toggleLike.lua`), then a `likeReconciliation.worker` periodically syncs the delta to MongoDB. This prevents write storms on viral posts.
- **Post moderation is fully async** — a post is queued immediately on creation and a worker processes it through the pipeline (Regex → Perspective → Groq → Human).
- **Rate limiting** is applied at the middleware level before the request reaches any business logic.

---

## 5. Database Schema

### Entity-Relationship Overview

<img width="3682" height="3122" alt="image" src="https://github.com/user-attachments/assets/87e0fe92-d6f8-499a-81e5-ff505d7281e6" />

---
```
users ──< posts         (one user can author many posts)
posts ──< comments      (one post can have many comments)
users ──< comments      (one user can author many comments)
posts ──< likes         (one post can have many likes)
users ──< likes         (one user can like many posts)
users ──< reports       (one user can file many reports)
posts ──< reports       (polymorphic: reports target posts OR comments)
comments ──< reports
```

### Collections

**`users`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | PK |
| `username` | String | Auto-generated, anonymous |
| `email` | String | Unique, used only for verification |
| `branch` | String | College branch/department |
| `displayName` | String | Generic display name |
| `azureId` | String | Unique, from Azure AD |
| `provider` | String | `"azure"` or `"local"` |
| `isActive` | Boolean | Account status |
| `emailVerification` | Boolean | Verification status |

**`posts`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | PK |
| `authorId` | ObjectId | FK → users |
| `title` | String | |
| `content` | Text | |
| `image_url` | String | Cloudinary URL |
| `image_publicId` | String | Cloudinary ID for deletion |
| `status` | String | `PENDING_MODERATION \| NEEDS_REVIEW \| PUBLISHED \| REJECTED` |
| `category` | String | `confession \| academics \| career \| relationships \| rant \| help \| general` |
| `tags` | String[] | |
| `moderation_path` | String | `REGEX \| PERSPECTIVE \| GROQ \| HUMAN` |
| `moderation_reason` | String | Why flagged |
| `moderation_scores` | Map | Toxicity scores per API |
| `moderation_reviewedByHuman` | Boolean | |
| `likesCount` | Int | Denormalized |
| `commentsCount` | Int | Denormalized |
| `reportsCount` | Int | Denormalized |
| `isDeleted` | Boolean | Soft delete |

**`comments`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | PK |
| `postId` | ObjectId | FK → posts |
| `authorId` | ObjectId | FK → users |
| `content` | Text | |
| `isHidden` | Boolean | Hidden by moderation |

**`likes`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | PK |
| `postId` | ObjectId | FK → posts |
| `userId` | ObjectId | FK → users |
| | | Unique constraint on `(postId, userId)` |

**`reports`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | PK |
| `targetType` | String | `"POST"` or `"COMMENT"` |
| `targetId` | ObjectId | Polymorphic ref → Post or Comment |
| `reporterId` | ObjectId | FK → users |
| `reason` | String | `SPAM \| ABUSE \| HATE \| OTHER` |
| `resolved` | Boolean | |
| | | Unique constraint on `(targetType, targetId, reporterId)` |

---

## 6. Project Structure

```
whisperdesk/
├── Backend/
│   ├── public/
│   │   └── temp/                    # Temporary file uploads
│   ├── src/
│   │   ├── config/
│   │   │   └── azureAd.config.js    # Azure AD OAuth2 config
│   │   ├── controllers/
│   │   │   ├── comment.controller.js
│   │   │   ├── like.controller.js
│   │   │   ├── post.controller.js
│   │   │   ├── report.controller.js
│   │   │   └── user.controller.js
│   │   ├── db/
│   │   │   ├── mongo.js             # MongoDB connection
│   │   │   ├── redis.cloud.js       # Redis Cloud (BullMQ)
│   │   │   ├── redis.ioredis.js     # ioredis client
│   │   │   └── redis.upstash.js     # Upstash (likes + rate limit)
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── auth.rateLimiter.middleware.js
│   │   │   ├── multer.middleware.js
│   │   │   └── post.rateLimiter.middleware.js
│   │   ├── models/
│   │   │   ├── comment.model.js
│   │   │   ├── like.model.js
│   │   │   ├── post.model.js
│   │   │   ├── report.model.js
│   │   │   └── user.model.js
│   │   ├── queues/
│   │   │   ├── likeReconciliation.queue.js
│   │   │   └── postModeration.queue.js
│   │   ├── routes/
│   │   │   ├── comment.route.js
│   │   │   ├── post.route.js
│   │   │   ├── report.route.js
│   │   │   └── user.route.js
│   │   ├── scripts/
│   │   │   ├── loadScripts.js       # Loads Lua scripts into Redis
│   │   │   └── toggleLike.lua       # Atomic like toggle script
│   │   ├── services/
│   │   │   ├── generateUsername.service.js
│   │   │   ├── magicToken.service.js
│   │   │   └── validateEmail.service.js
│   │   ├── utils/
│   │   │   ├── ApiError.js
│   │   │   ├── ApiResponse.js
│   │   │   ├── asyncHandler.js
│   │   │   ├── blacklist.js         # JWT blacklist (Redis)
│   │   │   ├── buildModerationText.js
│   │   │   ├── cloudinary.js
│   │   │   ├── gemini.js            # Gemini AI moderation
│   │   │   ├── groq.js              # Groq LLM moderation
│   │   │   ├── mailer.js
│   │   │   ├── mailer.api.js
│   │   │   ├── mailer.resend.js
│   │   │   └── perspective.js       # Google Perspective API
│   │   ├── workers/
│   │   │   ├── likeReconciliation.worker.js
│   │   │   ├── postModeration.worker.js
│   │   │   ├── redisRebuild.worker.js
│   │   │   └── workers.js
│   │   ├── app.js                   # Express app setup
│   │   ├── constants.js
│   │   ├── index.js                 # Entry point (server only)
│   │   └── start-combined.js        # Entry point (server + workers)
│   ├── .env.example
│   ├── .prettierrc
│   └── package.json
│
├── Frontend/
│   ├── public/
│   │   └── favicon.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── CommentsDropdown.jsx
│   │   │   ├── CreatePostForm.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Post.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── PublicRoute.jsx
│   │   │   └── Toast.jsx
│   │   ├── config/
│   │   │   └── axios.config.js      # Axios instance with interceptors
│   │   ├── hooks/
│   │   │   └── useToast.js
│   │   ├── pages/
│   │   │   ├── HomePage.jsx         # Main feed
│   │   │   ├── LandingPage.jsx      # Public landing + sign-in
│   │   │   └── MagicLinkCallback.jsx
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx
│   │   ├── services/                # API call wrappers
│   │   │   ├── auth.service.js
│   │   │   ├── comment.service.js
│   │   │   ├── like.service.js
│   │   │   ├── post.service.js
│   │   │   └── report.service.js
│   │   ├── store/
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.js
│   │   │   │   ├── commentSlice.js
│   │   │   │   ├── likeSlice.js
│   │   │   │   ├── postSlice.js
│   │   │   │   └── reportSlice.js
│   │   │   └── store.js             # Redux store
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
│
├── .gitignore
├── AZURE_OAUTH_SETUP.md
├── MIGRATION_SUMMARY.md
├── QUICK_START.md
├── README.md                        # ← you are here
└── render.yaml                      # Render deployment config
```

---

## 7. Anonymity Design

WhisperDesk is built around a strict anonymity model:

- **No public user profiles** — there is no way to view another user's profile or post history
- **Auto-generated usernames** — usernames like `fakeaim265` are randomly generated and rotated; they carry no identifying information
- **Email used only for verification** — the college email domain confirms student status but is never stored in any public-facing field
- **Internal IDs only** — `authorId` on posts and comments is an internal MongoDB ObjectId, never exposed in API responses to other users
- **Microsoft identity is isolated** — the `azureId` is stored server-side only and is never part of any response payload

---

## 8. Moderation Pipeline

Every post submission is processed asynchronously through a layered moderation system:

```
POST submitted
      │
      ▼
  [REGEX check]  ──── blocked? ──► REJECTED
      │
      ▼ (passed)
  [Perspective API]  ── high toxicity? ──► REJECTED / NEEDS_REVIEW
      │
      ▼ (passed)
  [Groq / Gemini LLM]  ── flagged? ──► NEEDS_REVIEW
      │
      ▼ (passed)
  PUBLISHED
```

- `PENDING_MODERATION` — post is queued, not yet visible
- `NEEDS_REVIEW` — escalated to human moderator
- `PUBLISHED` — visible in feed
- `REJECTED` — removed from platform

The `moderation_path`, `moderation_reason`, `moderation_scores`, and `moderation_aiMetadata` fields on each post provide a full audit trail of every moderation decision.

---

## 9. Getting Started

### Prerequisites

- Node.js v18+
- npm
- MongoDB (local or Atlas)
- Redis (local, Redis Cloud, or Upstash)
- Azure AD app registration (for OAuth2)
- Cloudinary account (for image uploads)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/whisperdesk.git
cd whisperdesk

# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

### Running Locally

**Backend — development (server only):**
```bash
cd Backend
cp .env.example .env
# Fill in your .env values (see Environment Variables below)
npm run dev
# Uses nodemon with dotenv, runs src/index.js
```

**Backend — workers only:**
```bash
cd Backend
npm run workers
# Runs BullMQ workers via src/workers/index.js
```

**Backend — production (server + workers combined):**
```bash
cd Backend
npm start
# Runs src/start-combined.js
```

**Frontend:**
```bash
cd Frontend
cp .env.example .env
npm run dev       # development server (Vite)
npm run build     # production build
npm run preview   # preview production build locally
```

---

## 10. Environment Variables

### Backend `.env`

```env
# Server
PORT=8000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://...

# Redis Cloud (BullMQ)
REDIS_CLOUD_URL=redis://...

# Redis Upstash (likes + rate limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=7d

# Azure AD
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
AZURE_TENANT_ID=...
AZURE_REDIRECT_URI=http://localhost:8000/api/v1/users/auth/azure/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Moderation
PERSPECTIVE_API_KEY=...
GROQ_API_KEY=...
GEMINI_API_KEY=...

# Email (transactional, e.g. system notifications)
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
RESEND_API_KEY=...

# Frontend URL (for CORS + redirects)
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 11. API Overview

All routes are prefixed with `/api/v1`.

### Users (`/users`)

| Method | Route | Description | Auth | Rate Limited |
|---|---|---|---|---|
| `GET` | `/users/oauth/login` | Initiate Azure AD OAuth2 login | No | Yes |
| `GET` | `/users/oauth/callback` | Azure AD OAuth2 callback | No | Yes |
| `GET` | `/users/get-user` | Get current authenticated user | Yes | No |
| `POST` | `/users/logout` | Logout and blacklist JWT | Yes | No |

### Posts (`/posts`)

| Method | Route | Description | Auth | Rate Limited |
|---|---|---|---|---|
| `GET` | `/posts` | Get all published posts | No | No |
| `POST` | `/posts/create-post` | Create a new post (with optional image) | Yes | Yes |
| `GET` | `/posts/user/posts` | Get current user's own posts | Yes | No |
| `GET` | `/posts/user/likes` | Get posts liked by current user | Yes | No |
| `GET` | `/posts/category/:category` | Get posts filtered by category | No | No |
| `GET` | `/posts/:postId` | Get a specific post | No | No |
| `PUT` | `/posts/:postId` | Update a specific post | Yes | No |
| `DELETE` | `/posts/:postId` | Delete a specific post | Yes | No |
| `POST` | `/posts/:postId/like` | Toggle like on a post | Yes | No |
| `GET` | `/posts/:postId/like` | Check like status for current user | Yes | No |
| `GET` | `/posts/:postId/likes` | Get all likes for a post | No | No |

### Comments (`/comments`)

| Method | Route | Description | Auth |
|---|---|---|---|
| `POST` | `/comments/posts/:postId` | Create a comment on a post | Yes |
| `GET` | `/comments/posts/:postId` | Get all comments for a post | No |
| `GET` | `/comments/posts/:postId/comments/count` | Get comment count for a post | No |
| `GET` | `/comments/user/comments` | Get current user's own comments | Yes |
| `GET` | `/comments/:commentId` | Get a specific comment | No |
| `PUT` | `/comments/:commentId` | Update a specific comment | Yes |
| `DELETE` | `/comments/:commentId` | Delete a specific comment | Yes |
| `PUT` | `/comments/:commentId/visibility` | Toggle comment visibility (hide/show) | Yes |

### Reports (`/reports`)

| Method | Route | Description | Auth |
|---|---|---|---|
| `POST` | `/reports/create` | File a new report | Yes |
| `GET` | `/reports` | Get all reports (admin/moderator) | Yes |
| `GET` | `/reports/stats` | Get report statistics (admin dashboard) | Yes |
| `GET` | `/reports/user/reports` | Get current user's own reports | Yes |
| `GET` | `/reports/:targetType/:targetId` | Get reports for a specific post or comment | Yes |
| `PUT` | `/reports/:reportId/resolve` | Resolve or unresolve a report (moderator) | Yes |
| `DELETE` | `/reports/:reportId` | Delete a report | Yes |

---

## 12. Deployment

### Frontend — Vercel

The frontend is configured for Vercel via `vercel.json`. All routes fall back to `index.html` for client-side routing.

```bash
cd Frontend
vercel --prod
```

### Backend — Render

The backend is configured via `render.yaml` in the project root. It runs both the Express server and BullMQ workers in a single process using `start-combined.js`.

```bash
# Render reads render.yaml automatically on push to main
git push origin main
```

See `QUICK_START.md` for a step-by-step deployment guide and `AZURE_OAUTH_SETUP.md` for setting up the Azure AD application registration.

---

## Contributing

This project was built as a college capstone project. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Open a Pull Request

---

## License

MIT — see `LICENSE` for details.
