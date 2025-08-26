import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import uploadService from './uploadService'
const initialState = {
    photos: [],
    documents: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    isLoadingPhotos: false,
    isLoadingDocuments: false,
    message: '',
}

export const getPhotos = createAsyncThunk(
    'uploads/getPhotos',
    async (_, thunkAPI) => {
        try {
            const user = thunkAPI.getState().auth.user
            if (!user || !user.token) {
                throw new Error('No authentication token available')
            }
            return await uploadService.getPhotos(user.token)
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
// Get all documents
export const getDocuments = createAsyncThunk(
    'uploads/getDocuments',
    async (_, thunkAPI) => {
        try {
            const user = thunkAPI.getState().auth.user
            if (!user || !user.token) {
                throw new Error('No authentication token available')
            }
            return await uploadService.getDocuments(user.token)
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
// Get specific document by filename
export const getDocument = createAsyncThunk(
    'uploads/getDocument',
    async (fileName, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await uploadService.getDocument(fileName, token)
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
// Get specific photo by filename
export const getPhoto = createAsyncThunk(
    'uploads/getPhoto',
    async (fileName, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await uploadService.getPhoto(fileName, token)
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
// Upload document
export const uploadDocuments = createAsyncThunk(
    'uploads/uploadDocuments',
    async (documentData, thunkAPI) => {
        try {
            const user = thunkAPI.getState().auth.user
            if (!user || !user.token) {
                throw new Error('No authentication token available')
            }
            return await uploadService.uploadDocuments(documentData, user.token)
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

export const uploadPhotos = createAsyncThunk(
    'uploads/uploadPhotos',
    async (photoData, thunkAPI) => {
        try {
            const user = thunkAPI.getState().auth.user
            if (!user || !user.token) {
                throw new Error('No authentication token available')
            }
            return await uploadService.uploadPhotos(photoData, user.token)
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

// Delete document
export const deleteDocument = createAsyncThunk(
    'uploads/deleteDocument',
    async (fileName, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await uploadService.deleteDocument(fileName, token)
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

export const deletePhoto = createAsyncThunk(
    'uploads/deletePhoto',
    async (fileName, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token
            return await uploadService.deletePhoto(fileName, token)
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

export const uploadSlice = createSlice({
    name: 'uploads',
    initialState,
    reducers: {
        reset: (state) => initialState,
    },
    extraReducers: (builder) => {
        builder
        .addCase(getPhotos.pending, (state) => {
            state.isLoadingPhotos = true
        })
        .addCase(getPhotos.fulfilled, (state, action) => {
            state.isLoadingPhotos = false
            state.isSuccess = true
            state.photos = action.payload
        })
        .addCase(getPhotos.rejected, (state, action) => {
            state.isLoadingPhotos = false
            state.isError = true
            state.message = action.payload
        })
        .addCase(getDocuments.pending, (state) => {
            state.isLoadingDocuments = true
        })
        .addCase(getDocuments.fulfilled, (state, action) => {
            state.isLoadingDocuments = false
            state.isSuccess = true
            state.documents = action.payload
        })
        .addCase(getDocuments.rejected, (state, action) => {
            state.isLoadingDocuments = false
            state.isError = true
            state.message = action.payload
        })
        .addCase(getDocument.pending, (state) => {
            state.isLoadingDocuments = true
        }) 
        .addCase(getDocument.fulfilled, (state, action) => {
            state.isLoadingDocuments = false
            state.isSuccess = true
            state.documents.push(action.payload)
        })
        .addCase(getDocument.rejected, (state, action) => {
            state.isLoadingDocuments = false
            state.isError = true
            state.message = action.payload
        })
        .addCase(uploadDocuments.pending, (state) => {
            state.isLoadingDocuments = true
        })
        .addCase(uploadDocuments.fulfilled, (state, action) => {
            state.isLoadingDocuments = false
            state.isSuccess = true
            // Handle both single file and multiple files response
            if (Array.isArray(action.payload)) {
                // Multiple files uploaded
                state.documents = [...state.documents, ...action.payload]
            } else {
                // Single file uploaded (backward compatibility)
                state.documents.push(action.payload)
            }
        })
        .addCase(uploadDocuments.rejected, (state, action) => {
            state.isLoadingDocuments = false
            state.isError = true
            state.message = action.payload
        })
        .addCase(uploadPhotos.pending, (state) => {
            state.isLoadingPhotos = true
        })
        .addCase(uploadPhotos.fulfilled, (state, action) => {
            state.isLoadingPhotos = false
            state.isSuccess = true
            // Handle both single file and multiple files response
            if (Array.isArray(action.payload)) {
                // Multiple files uploaded
                state.photos = [...state.photos, ...action.payload]
            } else {
                // Single file uploaded (backward compatibility)
                state.photos.push(action.payload)
            }
        })
        .addCase(uploadPhotos.rejected, (state, action) => {
            state.isLoadingPhotos = false
            state.isError = true
            state.message = action.payload
        })
        .addCase(deleteDocument.pending, (state) => {
            state.isLoadingDocuments = true
        })
        .addCase(deleteDocument.fulfilled, (state, action) => {
            state.isLoadingDocuments = false
            state.isSuccess = true
            state.documents = state.documents.filter(document => document.name !== action.payload.deletedFile)
        })
        .addCase(deleteDocument.rejected, (state, action) => {
            state.isLoadingDocuments = false
            state.isError = true
            state.message = action.payload
        })
        .addCase(deletePhoto.pending, (state) => {
            state.isLoadingPhotos = true
        })
        .addCase(deletePhoto.fulfilled, (state, action) => {
            state.isLoadingPhotos = false
            state.isSuccess = true
            state.photos = state.photos.filter(photo => photo.name !== action.payload.deletedFile)
        })
        .addCase(deletePhoto.rejected, (state, action) => {
            state.isLoadingPhotos = false
            state.isError = true
            state.message = action.payload
        })
    }
})

export const { reset } = uploadSlice.actions
export default uploadSlice.reducer
