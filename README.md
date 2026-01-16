# WhisperDesk 

WhisperDesk is an **anonymous blogging platform for college students** that enables honest expression without exposing user identity.  
The platform is designed with a strong focus on **privacy, moderation, and scalability**, allowing users to share posts, comments, and reactions anonymously.

---

## 1. Problem Statement

Many students hesitate to express opinions or share experiences online due to:
- Fear of judgment or backlash
- Academic or social consequences
- Permanent linkage of thoughts to real identities

WhisperDesk solves this problem by **decoupling identity from content**, ensuring that users can communicate freely while maintaining accountability at the system level.

---

## 2. Objectives

- Ensure **strict anonymity** for all public interactions
- Enable **content creation and engagement**
- Prevent misuse through **moderation and rate limiting**
- Build a **scalable and performant backend architecture**

---

## 3. Features

### 3.1 Content Management
- Anonymous blog creation and publishing
- Read and explore posts without revealing author identity
- Anonymous commenting system

### 3.2 User Engagement
- Like / reaction system without identity disclosure
- Threaded discussions via comments

### 3.3 Anonymity & Privacy Model
- No public user profiles or usernames
- No personally identifiable information exposed
- Internal identifiers are used **only** for:
  - Abuse prevention
  - Rate limiting
  - Moderation actions

### 3.4 Moderation & Safety
- Basic content filtering
- Reporting mechanism for abusive content
- Rate limiting to prevent spam and misuse

### 3.5 UI & Accessibility
- Responsive UI for desktop and mobile
- Clean and minimal interface for distraction-free reading

---

## 4. Tech Stack

### Frontend
- HTML
- CSS
- JavaScript
- React

### Backend
- Node.js
- Express.js

### Database 
- MongoDB (primary datastore)
- Redis (bullmq)

### Security & Utilities
- RESTful APIs
- JWT (authentication and internal validation)


---

## 5. System Architecture (High-Level)

- **Client (React)** communicates with the backend via REST APIs
- **Express server** handles business logic and validation
- **MongoDB** stores posts, comments, and reactions
- **Redis** is used for storing queue for bullmq worker

---

## 6. Anonymity Design

- Users are never exposed via usernames or profiles
- Each request is mapped to an internal identifier
- Internal identifiers are not accessible to other users
- Moderation actions rely on internal IDs only

---

## 7. Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or cloud)
- Redis (local or cloud)

### Installation

```bash
git clone https://github.com/your-username/whisperdesk.git
cd whisperdesk
npm install
