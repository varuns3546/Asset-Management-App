import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Frontend/default client - WITH auth options
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Admin client - NO auth options needed
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// For server-side user-context requests
const createUserClient = (token) => {
  return createClient(
    supabaseUrl, 
    supabaseAnonKey, 
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        autoRefreshToken: false, // Server-side doesn't need auto-refresh
        persistSession: false     // Server-side doesn't persist
      }
    }
  );
};

const authenticateUser = async (req, res, next) => {
  try { 
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.supabase = createUserClient(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export default { supabase, supabaseAdmin, createUserClient, authenticateUser };