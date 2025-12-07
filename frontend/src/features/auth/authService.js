import axios from 'axios'
console.log(process.env.REACT_APP_API_BASE_URL,'API URL')
// Create a separate axios instance for auth operations to avoid circular dependency
const authApi = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api/users/',
  headers: {
    'Content-Type': 'application/json',
  },
})

const register = async (userData) => {

  try {
    const response = await authApi.post('', userData)
  
    
    if (response.data) {
      await localStorage.setItem('user', JSON.stringify(response.data))
    }
    return response.data
  }
    catch(error){

      throw error
    }
}

// Login user
const login = async (userData) => {

  const response = await authApi.post('login', userData)

  if (response.data) {
    await localStorage.setItem('user', JSON.stringify(response.data))
    // Start token refresh timer
    scheduleTokenRefresh(response.data)
  }
  console.log('Login response:', response.data)
  return response.data
}

// Refresh token
const refresh = async () => {
  const user = localStorage.getItem('user')
  if (!user) return null

  try {
    const userData = JSON.parse(user)
    if (!userData.refreshToken) return null

    const response = await authApi.post('refresh', {
      refreshToken: userData.refreshToken
    })

    if (response.data) {
      await localStorage.setItem('user', JSON.stringify(response.data))
      // Schedule next refresh
      scheduleTokenRefresh(response.data)
      console.log('Token refreshed successfully')
    }
    return response.data
  } catch (error) {
    console.error('Token refresh failed:', error)
    // If refresh fails, logout
    await logout()
    window.location.href = '/'
    return null
  }
}

// Schedule automatic token refresh
let refreshTimer = null
const scheduleTokenRefresh = (userData) => {
  // Clear any existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }

  if (!userData.expiresAt) return

  // Calculate when to refresh (5 minutes before expiry)
  const expiresAt = userData.expiresAt * 1000 // Convert to milliseconds
  const now = Date.now()
  const refreshIn = expiresAt - now - (5 * 60 * 1000) // 5 minutes before expiry

  if (refreshIn > 0) {
    console.log(`Token refresh scheduled in ${Math.round(refreshIn / 1000 / 60)} minutes`)
    refreshTimer = setTimeout(() => {
      refresh()
    }, refreshIn)
  } else {
    // Token is about to expire or already expired, refresh now
    refresh()
  }
}

// Initialize refresh timer on page load
const initializeRefreshTimer = () => {
  const user = localStorage.getItem('user')
  if (user) {
    try {
      const userData = JSON.parse(user)
      if (userData.expiresAt) {
        scheduleTokenRefresh(userData)
      }
    } catch (error) {
      console.error('Error initializing refresh timer:', error)
    }
  }
}

// Logout user
const logout = async () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
  await localStorage.removeItem('user')
}

const authService = {
  register,
  logout,
  login,
  refresh,
  initializeRefreshTimer,
}

export default authService