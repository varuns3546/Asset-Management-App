-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(30) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add constraints
ALTER TABLE users ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}

-- Enable RLS (Row Level Security) for custom users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = current_setting('app.current_user_id')::UUID);

-- Create policies for entries table
CREATE POLICY "Users can view own entries" ON entries
  FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can insert own entries" ON entries
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can update own entries" ON entries
  FOR UPDATE USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can delete own entries" ON entries
  FOR DELETE USING (user_id = current_setting('app.current_user_id')::UUID);

-- Create storage bucket for images (run this in Supabase Storage section or via dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Storage policies (uncomment and run these after creating the images bucket)
-- CREATE POLICY "Users can upload images" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'images' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Images are publicly viewable" ON storage.objects
--   FOR SELECT USING (bucket_id = 'images');

-- CREATE POLICY "Users can delete own images" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'images' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   ););
ALTER TABLE users ADD CONSTRAINT check_username_length CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 30);
ALTER TABLE users ADD CONSTRAINT check_password_length CHECK (LENGTH(password) >= 6);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ language 'plpgsql';

-- Create trigger to automatically update updated_at for users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create entries table
CREATE TABLE entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for entries
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);

-- Create trigger for entries updated_at
CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own entries
CREATE POLICY "Users can view own entries" ON entries
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own entries
CREATE POLICY "Users can insert own entries" ON entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own entries
CREATE POLICY "Users can update own entries" ON entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to delete their own entries
CREATE POLICY "Users can delete own entries" ON entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for images (run this in Supabase Storage section)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Create policy for image uploads
-- CREATE POLICY "Users can upload images" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for viewing images
-- CREATE POLICY "Images are publicly viewable" ON storage.objects
--   FOR SELECT USING (bucket_id = 'images');

-- Create policy for deleting own images
-- CREATE POLICY "Users can delete own images" ON storage.objects
--   FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);