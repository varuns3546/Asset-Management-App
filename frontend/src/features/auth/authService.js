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
  }
  console.log('Login response:', response.data)
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