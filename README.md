# CareWave Server - Social Development Events API

A high-performance, secure backend REST API built with Express.js, TypeScript, MongoDB, and JSON Web Token (JWT) authentication for **CareWave**, the community-driven social service event management platform.

## 🚀 Overview

The CareWave backend powers community initiatives, donation campaigns, clean-up drives, and health camps. It provides secure user management, role-based event authoring, validation, real-time participation tracking, and statistical analytics.

## ✨ Features

- **JWT Authentication & Authorization**: Secure token generation, verification, and route protection for sensitive actions.
- **Strict Input Validation**: Backend validation ensuring passwords meet complexity requirements (uppercase, lowercase, 6+ characters) and event dates are strictly in the future.
- **Role & Ownership Protection**: Strict checks ensuring only event creators can edit or delete their own events.
- **Event Participation Tracking**: Atomic joining and leaving of community events with volunteer roster management.
- **Dual-Mode Persistence Engine**: Seamless support for production MongoDB Atlas with automated seeding and graceful in-memory fallback.
- **RESTful Endpoints**: Clean API structure following REST principles with proper HTTP status codes.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Official `mongodb` driver)
- **Security & Auth**: JSON Web Tokens (`jsonwebtoken`), Bcrypt (`bcryptjs`), CORS
- **Configuration**: Dotenv

## 📂 Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── db.ts             # MongoDB client connection & fallback store
│   ├── controllers/
│   │   ├── authController.ts # User auth, login, register, profile
│   │   └── eventController.ts# Event CRUD, limit(6), joins
│   ├── data/
│   │   └── seedData.ts       # Realistic seed events
│   ├── middleware/
│   │   └── auth.ts           # JWT verification middleware
│   ├── routes/
│   │   ├── authRoutes.ts     # /api/auth routes
│   │   ├── eventRoutes.ts    # /api/events routes
│   │   └── statsRoutes.ts    # /api/stats routes
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces & types
│   └── index.ts              # Express application entry point
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## ⚙️ Environment Variables

Create a `.env` file in the root of the server directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
DB_NAME=carewave_db
JWT_SECRET=carewave_super_secret_jwt_key_2026_secure
CLIENT_URL=http://localhost:3000
```

## 📦 Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run in Development Mode**:
   ```bash
   npm run dev
   ```

3. **Build & Run in Production Mode**:
   ```bash
   npm run build
   npm start
   ```

## 📡 API Reference

### Auth Endpoints
- `POST /api/auth/register` - Create a new user account (enforces uppercase, lowercase, 6+ chars).
- `POST /api/auth/login` - Authenticate existing user and return JWT.
- `POST /api/auth/google` - One-click Google / OAuth user authentication.
- `GET /api/auth/me` - Fetch authenticated user profile (`Bearer <token>`).
- `PUT /api/auth/profile` - Update display name and avatar photo URL (`Bearer <token>`).

### Events Endpoints
- `GET /api/events/recent` - Fetch 6 recent upcoming events (`.limit(6)`).
- `GET /api/events` - Fetch all upcoming events (supports `?search=`, `?type=`, `?sort=`).
- `GET /api/events/:id` - Fetch details for a specific event (public).
- `POST /api/events` - Create a new event (protected, date must be in future).
- `PUT /api/events/:id` - Update existing event (protected, owner only).
- `DELETE /api/events/:id` - Delete an event (protected, owner only).
- `GET /api/events/user/created` - Fetch events created by the logged-in user with volunteers list.
- `POST /api/events/:id/join` - Join an event as a volunteer (protected).
- `DELETE /api/events/:id/join` - Cancel attendance from an event (protected).
- `GET /api/events/user/joined` - Fetch all events joined by current user, sorted by date.

### Stats Endpoint
- `GET /api/stats` - Platform-wide statistics (events, volunteers, impact metrics).
