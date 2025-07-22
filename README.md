# Auth App - Expo Frontend + Express Backend

A full-stack authentication app with an Expo (React Native) frontend and Express.js backend.

## Features

- **Login Page**: Username/email and password authentication
- **Registration Page**: Complete user registration with email, username, password, first name, and last name
- **JWT Authentication**: Secure token-based authentication
- **MongoDB Integration**: User data storage with password hashing
- **Modern UI**: Clean and responsive design with React Native

## Project Structure

```
├── backend/                 # Express.js server
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── index.js            # Server entry point
│   └── package.json        # Backend dependencies
├── frontend/               # Expo React Native app
│   ├── src/
│   │   ├── screens/        # App screens (Login, Register)
│   │   └── services/       # API service layer
│   ├── App.js              # Main app component
│   └── package.json        # Frontend dependencies
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (for iOS development) or Android Studio (for Android development)

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - The `.env` file is already created with default values
   - Update `MONGODB_URI` if using a different MongoDB connection
   - Change `JWT_SECRET` to a secure random string for production

4. Start MongoDB:
   - **Local MongoDB**: Make sure MongoDB is running on your system
   - **MongoDB Atlas**: Update the `MONGODB_URI` in `.env` with your Atlas connection string

5. Start the backend server:
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Or production mode
   npm start
   ```

   The server will run on `http://localhost:3001`

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update API URL (if needed):
   - Open `src/services/api.js`
   - Update `BASE_URL` if your backend is running on a different port or host

4. Start the Expo development server:
   ```bash
   npm start
   ```

5. Run on your preferred platform:
   - **iOS Simulator**: Press `i` in the terminal or scan QR code with Expo Go app
   - **Android Emulator**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

## API Endpoints

### Authentication Routes

- **POST** `/api/auth/register` - User registration
  ```json
  {
    "email": "user@example.com",
    "username": "username",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```

- **POST** `/api/auth/login` - User login
  ```json
  {
    "username": "username", // Can be username or email
    "password": "password123"
  }
  ```

- **GET** `/api/health` - Health check endpoint

## Usage

1. **Registration**: 
   - Open the app and tap "Sign Up"
   - Fill in all required fields (email, username, password, first name, last name)
   - Tap "Create Account"

2. **Login**:
   - Enter your username/email and password
   - Tap "Sign In"

3. **Authentication**:
   - Upon successful login/registration, a JWT token is stored locally
   - The token is automatically included in subsequent API requests

## Development Notes

- **Password Security**: Passwords are hashed using bcryptjs before storage
- **JWT Tokens**: Tokens expire after 7 days
- **Input Validation**: Both client-side and server-side validation
- **Error Handling**: Comprehensive error messages and user feedback
- **Responsive Design**: Works on various screen sizes

## Troubleshooting

### Backend Issues

1. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Check the `MONGODB_URI` in `.env`
   - For Atlas, ensure your IP is whitelisted

2. **Port Already in Use**:
   - Change the `PORT` in `.env` to a different value
   - Update the frontend API URL accordingly

### Frontend Issues

1. **Network Error**:
   - Ensure the backend server is running
   - Check the API URL in `src/services/api.js`
   - For physical devices, use your computer's IP instead of `localhost`

2. **Expo Issues**:
   - Clear Expo cache: `expo start -c`
   - Restart the Metro bundler

## Next Steps

To extend this app, consider adding:

- Dashboard/Home screen after login
- User profile management
- Password reset functionality
- Social login integration
- Push notifications
- User session management
- Logout functionality

## License

This project is open source and available under the [MIT License](LICENSE).