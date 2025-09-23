import api from '../../utils/axiosInterceptor'

const API_URL = 'http://localhost:3001/api/users/'
const register = async (userData) => {

  try {
    const response = await api.post(API_URL, userData)
  
    
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

  const response = await api.post(API_URL + 'login', userData)

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