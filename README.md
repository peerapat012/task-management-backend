# Task Management Backend

Express.js REST API for task management with authentication and PostgreSQL database.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: JWT with HTTP-only cookies
- **Password Hashing**: bcryptjs

## Project Structure

```
backend/
├── src/
│   ├── controllers/       # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── task.controller.ts
│   │   └── user.controller.ts
│   ├── db/
│   │   ├── index.ts       # Database connection
│   │   └── schema/
│   │       ├── app.ts     # Database schemas
│   │       └── schema.ts  # Schema exports
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── tasks.ts
│   │   └── users.ts
│   └── index.ts           # App entry point
├── drizzle/               # Migration files
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon)

### Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory with required environment variables.

### Development

```bash
npm run dev
```

Server runs on `http://localhost:8000`

### Database Migrations

```bash
# Generate migration
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema to database
npm run db:push
```

## API Endpoints

### Authentication

| Method | Endpoint     | Description       |
|--------|--------------|-------------------|
| POST   | /api/auth/signup   | Register new user |
| POST   | /api/auth/signin   | Login user        |
| POST   | /api/auth/signout  | Logout user       |

### Tasks

| Method | Endpoint        | Description           |
|--------|-----------------|-----------------------|
| GET    | /api/tasks      | Get all tasks         |
| GET    | /api/tasks/:id  | Get task by ID        |
| POST   | /api/tasks      | Create new task       |
| PUT    | /api/tasks/:id  | Update task           |
| DELETE | /api/tasks/:id  | Delete task           |

### Users

| Method | Endpoint       | Description        |
|--------|----------------|--------------------|
| GET    | /api/users     | Get all users      |
| GET    | /api/users/:id | Get user by ID     |

## Data Models

### User

| Field     | Type      | Description                |
|-----------|-----------|----------------------------|
| id        | integer   | Primary key                |
| name      | text      | User's name                |
| email     | text      | Unique email               |
| password  | text      | Hashed password            |
| token     | text      | JWT token                  |
| role      | enum      | 'user' or 'admin'          |
| createdAt | timestamp | Creation timestamp         |
| updatedAt | timestamp | Last update timestamp      |

### Task

| Field     | Type      | Description                |
|-----------|-----------|----------------------------|
| id        | integer   | Primary key                |
| userId    | integer   | Foreign key to users       |
| title     | text      | Task title                 |
| description| text     | Task description           |
| status    | enum      | 'pending', 'in_progress', 'completed' |
| priority  | enum      | 'high', 'medium', 'low'    |
| isDeleted | boolean   | Soft delete flag           |
| createdAt | timestamp | Creation updatedAt | timestamp timestamp         |
| | Last update timestamp      |

## Authentication

The API uses JWT tokens stored in HTTP-only cookies. Tokens can also be sent via the `Authorization` header:

```
Authorization: Bearer <token>
```
