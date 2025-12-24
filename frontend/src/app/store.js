import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import projectReducer from '../features/projects/projectSlice'
import pullRequestReducer from '../features/pullRequests/pullRequestSlice'
export const store = configureStore({
    reducer: {
        auth: authReducer,  
        projects: projectReducer,
        pullRequests: pullRequestReducer,
    },
})

export default store