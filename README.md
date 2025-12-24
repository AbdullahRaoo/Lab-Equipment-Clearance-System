# Equipment Clearance Management System (ECMS)

A full-stack Next.js application for managing laboratory equipment clearance with multi-database architecture.

## Tech Stack

- **Frontend & Backend**: Next.js 14+ (App Router)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Architecture

### Multi-Schema Database Design
- **Central Schema**: User management, authentication, and global audit logs
- **Lab Schemas (5)**: Individual schemas for each laboratory containing:
  - Equipment inventory (JSONB structure)
  - Issue tracking
  - Return processing

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

3. Set up the database:
Run the SQL scripts in the `database/` folder in order:
   - `01_central_schema.sql` - Creates central schema and tables
   - `02_rls_policies.sql` - Sets up Row Level Security policies

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── actions/         # Server actions (auth, etc.)
│   ├── login/          # Login page
│   ├── signup/         # Signup page
│   ├── dashboard/      # Main dashboard
│   └── page.tsx        # Landing page
├── lib/
│   └── supabase/       # Supabase client configurations
└── types/              # TypeScript type definitions

database/
├── 01_central_schema.sql    # Central database schema
└── 02_rls_policies.sql      # Row Level Security policies
```

## Features (Stage 1 - M1 Complete)

### ✅ Completed
- Next.js project setup with TypeScript
- Supabase integration (client, server, middleware)
- Central database schema with users and audit logs tables
- Row Level Security (RLS) policies
- Authentication system (sign-up, login, logout)
- Landing page, login page, signup page
- Protected dashboard with user profile

### User Roles
- **Admin**: Full system access
- **Lab Admin**: Lab-specific management
- **Student**: Equipment borrowing and clearance requests
- **Faculty**: Enhanced access privileges

## Development Team

- **M1 (Abdullah)**: Central DB & Auth ✅
- **M2**: Labs 1-2 & Inventory Logic
- **M3**: Labs 3-5 & Request Logic
- **M4**: Inter-lab System & Clearance Reports

## Database Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the scripts in `database/` folder in sequential order
4. Verify tables are created in Table Editor
5. Test RLS policies by signing up a new user

## Environment Setup

Make sure to replace the placeholder values in `.env.local` with your actual Supabase credentials:
- Get `NEXT_PUBLIC_SUPABASE_URL` from Supabase Project Settings
- Get `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase Project Settings → API
- Get `SUPABASE_SERVICE_ROLE_KEY` from Supabase Project Settings → API (keep this secret!)

## Next Steps

- **Stage 1 - M2**: Lab 1-2 schemas and inventory structure
- **Stage 1 - M3**: Lab 3-5 schemas and inventory structure
- **Stage 1 - M4**: Cross-schema query architecture


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
