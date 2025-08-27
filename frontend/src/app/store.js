import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import entryReducer from '../features/entries/entrySlice'
import uploadReducer from '../features/uploads/uploadSlice'
import mapReducer from '../features/maps/mapSlice'
import geopackageReducer from '../features/geopackage/geopackageSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        entries: entryReducer,
        uploads: uploadReducer,
        maps: mapReducer,
        geopackage: geopackageReducer,
    },
})

export default store