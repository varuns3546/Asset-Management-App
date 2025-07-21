import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import {supabase} from './config/supabase.js'


import authRoutes from './routes/auth.js'
import entriesRoutes from './routes/entries.js'

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', entriesRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Test Supabase connection
const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error.message);
      return false;
    }
    console.log('Connected to Supabase successfully');
    return true;
  } catch (error) {
    console.error('Supabase configuration error:', error.message);
    return false;
  }
};

// Start server
const startServer = async () => {
  try {
    // Test Supabase connection
    const isConnected = await testSupabaseConnection();
    
    if (!isConnected) {
      console.warn('Warning: Supabase connection failed, but server will start anyway');
    }
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});