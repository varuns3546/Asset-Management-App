import {createSlice, createAsyncThunk} from '@reduxjs/toolkit'
import mapService from './mapService'

const initialState = {
    maps: [],
    locations: [],
    isMapError: false,
    isMapSuccess: false,
    isLocationError: false,
    isLocationSuccess: false,
    isMapLoading: false,
    isLocationLoading: false,
    mapMessage: '',
    locationMessage: '',
}

export const createMap = createAsyncThunk(
    'maps/create',
    async (mapData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await mapService.createMap(mapData, token)
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

export const createLocation = createAsyncThunk(
    'maps/createLocation',
    async (locationData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await mapService.createLocation(locationData, token)
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

export const getMaps = createAsyncThunk(
    'maps/getMaps',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await mapService.getMaps(token)
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

export const getLocations = createAsyncThunk(
    'maps/getLocations',
    async (map_id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await mapService.getLocations(map_id, token)
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

export const mapSlice = createSlice({
    name: 'map',
    initialState,
    reducers: {
        reset: (state) => initialState,
    },
    extraReducers: (builder) => {
        builder
        .addCase(createMap.pending, (state) => {
            state.isMapLoading = true
        })
        .addCase(createMap.fulfilled, (state, action) => {
            state.isMapLoading = false
            state.isMapSuccess = true
            state.maps.push(action.payload)
        })
        .addCase(createMap.rejected, (state, action) => {
            state.isMapLoading = false
            state.isMapError = true
            state.mapMessage = action.payload
        })
        .addCase(createLocation.pending, (state) => {
            state.isLocationLoading = true
        })
        .addCase(createLocation.fulfilled, (state, action) => {
            state.isLocationLoading = false
            state.isLocationSuccess = true
            state.locations.push(action.payload)
        })
        .addCase(createLocation.rejected, (state, action) => {
            state.isLocationLoading = false
            state.isLocationError = true
            state.locationMessage = action.payload
        })
        .addCase(getMaps.pending, (state) => {
            state.isMapLoading = true
        })
        .addCase(getMaps.fulfilled, (state, action) => {
            state.isMapLoading = false
            state.isMapSuccess = true
            state.maps = action.payload
        })
        .addCase(getMaps.rejected, (state, action) => {
            state.isMapLoading = false
            state.isMapError = true
            state.mapMessage = action.payload
        })
        .addCase(getLocations.pending, (state) => {
            state.isLocationLoading = true
        })
        .addCase(getLocations.fulfilled, (state, action) => {
            state.isLocationLoading = false
            state.isLocationSuccess = true
            state.locations = action.payload
        })
        .addCase(getLocations.rejected, (state, action) => {
            state.isLocationLoading = false
            state.isLocationError = true
            state.locationMessage = action.payload
        })
    }
})

export const {reset} = mapSlice.actions
export default mapSlice.reducer