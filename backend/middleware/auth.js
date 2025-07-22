// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to authenticate JWT tokens (REQUIRED authentication)
export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header (Bearer TOKEN format)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token after "Bearer "

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }

    // Attach user to request object
    req.user = user;
    next(); // Continue to next middleware/route handler
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid token format.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        success: false, 
        message: 'Token has expired.' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error.' 
    });
  }
};

// Optional authentication (user can be null)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    req.user = user;
    
  } catch (error) {
    // If there's an error, just set user to null (optional auth)
    req.user = null;
  }

  next();
};

// Middleware to check if user is prime consultant
export const requirePrimeConsultant = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (!req.user.isPrimeConsultant) {
    return res.status(403).json({
      success: false,
      message: 'Prime consultant access required.'
    });
  }

  next();
};

// Utility function to generate JWT token
export const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Utility function to generate refresh token (optional, for better security)
export const generateRefreshToken = (userId) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  }
  
  return jwt.sign(
    { userId }, 
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};