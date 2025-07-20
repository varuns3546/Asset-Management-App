# MongoDB to Supabase Migration Guide

This guide explains how to complete the migration from MongoDB to Supabase.

## What's Changed

### Dependencies
- Removed: `mongoose`
- Added: `@supabase/supabase-js`

### File Structure
- `config/supabase.js` - Supabase client configuration
- `database/schema.sql` - SQL schema for creating the users table
- `models/User.js` - Replaced Mongoose model with Supabase-based service
- `routes/auth.js` - Updated to work with new User model
- `index.js` - Removed MongoDB connection, added Supabase connection test

## Setup Instructions

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Create a new project
4. Wait for the project to be set up

### 2. Set up the Database
1. In your Supabase dashboard, go to the SQL Editor
2. Copy and paste the contents of `database/schema.sql`
3. Run the SQL script to create the users table

### 3. Configure Environment Variables
1. Copy `.env.example` to `.env`
2. In your Supabase project dashboard, go to Settings > API
3. Copy your Project URL and anon key
4. Update your `.env` file:
   ```
   SUPABASE_URL=your-project-url-here
   SUPABASE_ANON_KEY=your-anon-key-here
   JWT_SECRET=your-jwt-secret-here
   ```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start the Server
```bash
npm run dev
```

## Database Schema Comparison

### MongoDB (Mongoose)
```javascript
{
  _id: ObjectId,
  email: String,
  username: String,
  password: String,
  firstName: String,
  lastName: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Supabase (PostgreSQL)
```sql
{
  id: UUID,
  email: VARCHAR(255),
  username: VARCHAR(30),
  password: VARCHAR(255),
  first_name: VARCHAR(255),
  last_name: VARCHAR(255),
  created_at: TIMESTAMP WITH TIME ZONE,
  updated_at: TIMESTAMP WITH TIME ZONE
}
```

## API Endpoints

The API endpoints remain the same:
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/health` - Health check

## Key Differences

1. **IDs**: MongoDB ObjectIds are replaced with PostgreSQL UUIDs
2. **Field Names**: Snake_case in database, camelCase in JavaScript
3. **Error Handling**: Different error codes and structures
4. **Constraints**: Database-level constraints instead of Mongoose validators

## Testing

Test the migration by:
1. Registering a new user
2. Logging in with the created user
3. Checking the Supabase dashboard to see the user in the database

## Troubleshooting

### Common Issues:
1. **Connection Error**: Check your SUPABASE_URL and SUPABASE_ANON_KEY
2. **Table Not Found**: Make sure you ran the schema.sql script
3. **Constraint Violations**: Check that email/username are unique

### Useful Supabase Features:
- Real-time subscriptions
- Row Level Security (RLS)
- Built-in authentication
- Auto-generated REST API
- GraphQL API