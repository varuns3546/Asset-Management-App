import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import geopackageService from './geopackageService'

const initialState = {
  exportStats: null,
  isExporting: false,
  isExportSuccess: false,
  isExportError: false,
  exportMessage: '',
  isStatsLoading: false,
  isStatsSuccess: false,
  isStatsError: false,
  statsMessage: '',
}

// Export data as GeoPackage
export const exportGeoPackage = createAsyncThunk(
  'geopackage/export',
  async (_, thunkAPI) => {
    try {
      console.log('Export thunk started');
      const token = thunkAPI.getState().auth.user.token
      console.log('Token available:', !!token);
      const result = await geopackageService.exportGeoPackage(token)
      console.log('Export completed:', result);
      return result
    } catch (error) {
      console.error('Export error:', error);
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

// Get export statistics
export const getExportStats = createAsyncThunk(
  'geopackage/getStats',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token
      return await geopackageService.getExportStats(token)
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

export const geopackageSlice = createSlice({
  name: 'geopackage',
  initialState,
  reducers: {
    reset: (state) => initialState,
    resetExport: (state) => {
      state.isExporting = false
      state.isExportSuccess = false
      state.isExportError = false
      state.exportMessage = ''
    },
    resetStats: (state) => {
      state.isStatsLoading = false
      state.isStatsSuccess = false
      state.isStatsError = false
      state.statsMessage = ''
    },
  },
  extraReducers: (builder) => {
    builder
      // Export GeoPackage
      .addCase(exportGeoPackage.pending, (state) => {
        state.isExporting = true
      })
      .addCase(exportGeoPackage.fulfilled, (state, action) => {
        state.isExporting = false
        state.isExportSuccess = true
      })
      .addCase(exportGeoPackage.rejected, (state, action) => {
        state.isExporting = false
        state.isExportError = true
        state.exportMessage = action.payload
      })
      // Get Export Stats
      .addCase(getExportStats.pending, (state) => {
        state.isStatsLoading = true
      })
      .addCase(getExportStats.fulfilled, (state, action) => {
        state.isStatsLoading = false
        state.isStatsSuccess = true
        state.exportStats = action.payload.data
      })
      .addCase(getExportStats.rejected, (state, action) => {
        state.isStatsLoading = false
        state.isStatsError = true
        state.statsMessage = action.payload
      })
  },
})

export const { reset, resetExport, resetStats } = geopackageSlice.actions
export default geopackageSlice.reducer
