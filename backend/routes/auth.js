// backend/routes/auth.js
import express from 'express';
import User from '../models/User.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, firstName, lastName, orgPassword, isPrimeConsultant } = req.body;

    // Validation
    if (!email || !username || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Create new user
    const newUser = await User.create({
      email,
      username,
      password,
      firstName,
      lastName,
      orgPassword,
      isPrimeConsultant
    });

    // Generate token
    const token = generateToken(newUser.id);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: newUser.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// POST /auth/login - User login
router.post('/login', async (req, res) => {
  try {
    console.log('req.body', req.body)
    const { username, password } = req.body; // identifier can be email or username

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'username and password are required'
      });
    }
    console.log('has usr and pwd')
    // Find user by email or username
    const user = await User.findByUsername(username);
    console.log('user', user)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('generate token')
    // Generate token
    const token = generateToken(user.id);
    console.log('token', token )
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login error',
      error: error.message
    });
  }
});

// GET /auth/me - Get current user (requires authentication)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toJSON()
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});

// POST /auth/logout - Logout user (client-side token removal)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a JWT-based system, logout is typically handled client-side
    // by removing the token from storage. 
    // Here we just confirm the logout
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout error'
    });
  }
});

// PUT /auth/profile - Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, username } = req.body;
    
    const updateData = {};
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (email) updateData.email = email;
    if (username) updateData.username = username;

    const updatedUser = await req.user.update(updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.toJSON()
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'Email or username already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

export default router;