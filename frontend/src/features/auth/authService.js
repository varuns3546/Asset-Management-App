import axios from 'axios'

const API_URL = `http://localhost:3001/api/users/`
// Register user
const register = async (userData) => {

  try {
    const response = await axios.post(API_URL, userData)
  
    
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

  const response = await axios.post(API_URL + 'login', userData)

  if (response.data) {
    await localStorage.setItem('user', JSON.stringify(response.data))
  }

  return response.data
}

// Logout user
const logout = async () => {
    await localStorage.removeItem('user')
}

const authService = {
  register,
  logout,
  login,
}

export default authService