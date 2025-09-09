import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();
const supabaseURL = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
  supabaseURL, supabaseAnonKey
);

const supabaseAdmin = createClient( supabaseURL, supabaseServiceRoleKey
, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const createUserClient = (token) => {
  return createClient(
    supabaseURL, 
    supabaseAnonKey, 
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
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

    // Use the createUserClient from your config file instead
    req.supabase = createUserClient(token);
        
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};



export default {supabase, supabaseAdmin, createUserClient, authenticateUser};