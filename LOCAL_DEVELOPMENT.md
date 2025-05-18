# Local Development Setup

This guide will help you set up the Herschell CRM project for local development outside of Replit.

## Prerequisites

- Node.js (v20 or later)
- npm (v9 or later)
- PostgreSQL (v16 recommended, but v13+ should work)

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd herschell-crm
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content (adjust as needed):
   ```
   # Server configuration
   PORT=5000
   NODE_ENV=development

   # Database configuration - update these with your actual database details
   DATABASE_URL=postgresql://user:password@localhost:5432/herschell_crm

   # Session secret - change this in production
   SESSION_SECRET=your-development-secret

   # Email configuration (if using SendGrid)
   SENDGRID_API_KEY=your-sendgrid-api-key
   EMAIL_FROM=admin@example.com

   # File uploads configuration
   UPLOAD_DIR=uploads
   ```

4. Set up your PostgreSQL database:
   ```bash
   # Create database
   createdb herschell_crm
   
   # Push schema to database
   npm run db:push
   ```

## Development

You can run the application in different ways:

### Full Stack Development (Recommended)

This runs both the server and client in development mode with hot reloading:

```bash
npm run dev:local
```

The application will be available at:
- Frontend: http://localhost:5173
- API: http://localhost:5000/api

### Server Only

If you want to run just the backend server:

```bash
npm run dev:server
```

The server will run on http://localhost:5000.

### Client Only

If you want to run just the frontend Vite dev server:

```bash
npm run dev:client
```

The client will run on http://localhost:5173.

## Building for Production

To build the application for production:

```bash
npm run build
```

This will create a `dist` directory with the compiled application.

To start the production server:

```bash
npm run start
```

## Project Structure

- `client/` - Frontend React application with TypeScript
- `server/` - Backend Express API
- `prisma/` - Database schema and migrations
- `shared/` - Shared types and utilities

## Differences from Replit Environment

When running locally:

1. The frontend runs on port 5173 (Vite dev server) and the backend on port 5000
2. You need to manually set up and configure your database
3. File uploads go to the local `uploads/` directory
4. Some Replit-specific features may not be available 