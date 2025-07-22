import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Don’t forget `.js` for ES modules

const router = express.Router();


// Register route
router.post('/register', async (req, res) => {
  try {
    console.log('attempting register')
    const { email, username, password, firstName, lastName, orgPassword, is_prime_consultant } = req.body;
    // Validation
    if (!email || !username || !password || !firstName || !lastName || !orgPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.FindByUsername(username) 

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      username,
      password,
      firstName,
      lastName,
      orgPassword,
      is_prime_consultant
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle Supabase unique constraint violations
    if (error.code === '23505') {
      const field = error.details?.includes('email') ? 'email' : 'username';
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    console.log('attempting login')
    const { username, password } = req.body;
    console.log(req.body)
    // Validation
    if (!username || !password) {
      console.log('!username || !password')
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user by username or email
    const user = await User.findByUsername(username);

    if (!user) {
      console.log('no user')
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('password not valid')
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`User logged in successfully`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
