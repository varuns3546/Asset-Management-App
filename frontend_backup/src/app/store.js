import { configureStore } from '@reduxjs/toolkit'
import hierarchyReducer from '../features/hierarchies/hierarchySlice'
import authReducer from '../features/auth/authSlice'
import projectReducer from '../features/projects/projectSlice'
export const store = configureStore({
    reducer: {
        hierarchies: hierarchyReducer,
        auth: authReducer,  
        projects: projectReducer,
    },
})

export default store