import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService from './authService'
import { isUserTokenValid } from '../../utils/jwtUtils'

const initialState = {
    user: null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
}

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, thunkAPI) => {
    try {
      const user = await localStorage.getItem('user')
      const parsedUser = user ? JSON.parse(user) : null
      
      // If no user data, return null
      if (!parsedUser) {
        return null
      }
      
      // Validate JWT token
      const isTokenValid = isUserTokenValid(parsedUser)
      
      if (!isTokenValid) {
        // Token is expired or invalid, clear localStorage
        localStorage.removeItem('user')
        localStorage.removeItem('selectedProject')
        return null
      }
      
      return parsedUser
    } catch (error) {
      // If there's any error parsing or validating, clear localStorage and return null
      localStorage.removeItem('user')
      localStorage.removeItem('selectedProject')
      return null
    }
  }
)
// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (user, thunkAPI) => {
    try {
      return await authService.register(user)
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString()
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Login user
export const login = createAsyncThunk('auth/login', async (user, thunkAPI) => {
    try {
    return await authService.login(user)
  } catch (error) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString()
    return thunkAPI.rejectWithValue(message)
  }
})

export const logout = createAsyncThunk('auth/logout', async () => {
  console.log('Logging out')
  localStorage.removeItem('user')
  await authService.logout()
})

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false
      state.isSuccess = false
      state.isError = false
      state.message = ''
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.user = action.payload
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
        state.user = null
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.user = action.payload
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
        state.user = null
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
      })
  },
})

export const { reset } = authSlice.actions
export default authSlice.reducer