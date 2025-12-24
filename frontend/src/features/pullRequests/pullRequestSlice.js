import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import pullRequestService from './pullRequestService';

const initialState = {
  pullRequests: [],
  selectedPR: null,
  comments: [],
  diff: null,
  conflicts: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

// Create pull request
export const createPullRequest = createAsyncThunk(
  'pullRequests/create',
  async (prData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await pullRequestService.createPullRequest(prData, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.error) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get pull requests
export const getPullRequests = createAsyncThunk(
  'pullRequests/getAll',
  async (filters = {}, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await pullRequestService.getPullRequests(filters, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.error) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single pull request
export const getPullRequest = createAsyncThunk(
  'pullRequests/getOne',
  async (prId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await pullRequestService.getPullRequest(prId, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.error) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update pull request status
export const updatePullRequestStatus = createAsyncThunk(
  'pullRequests/updateStatus',
  async ({ prId, status }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await pullRequestService.updatePullRequestStatus(prId, status, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.error) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Merge pull request
export const mergePullRequest = createAsyncThunk(
  'pullRequests/merge',
  async ({ prId, resolutions = [] }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await pullRequestService.mergePullRequest(prId, resolutions, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.error) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Reject pull request
export const rejectPullRequest = createAsyncThunk(
  'pullRequests/reject',
  async (prId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await pullRequestService.rejectPullRequest(prId, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.error) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get pull request diff
export const getPullRequestDiff = createAsyncThunk(
  'pullRequests/getDiff',
  async (prId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await pullRequestService.getPullRequestDiff(prId, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.error) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Add comment
export const addPullRequestComment = createAsyncThunk(
  'pullRequests/addComment',
  async ({ prId, commentData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await pullRequestService.addPullRequestComment(prId, commentData, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.error) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get comments
export const getPullRequestComments = createAsyncThunk(
  'pullRequests/getComments',
  async (prId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await pullRequestService.getPullRequestComments(prId, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.error) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Add review
export const addReview = createAsyncThunk(
  'pullRequests/addReview',
  async ({ prId, reviewData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await pullRequestService.addReview(prId, reviewData, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.error) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const pullRequestSlice = createSlice({
  name: 'pullRequests',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    setSelectedPR: (state, action) => {
      state.selectedPR = action.payload;
    },
    clearSelectedPR: (state) => {
      state.selectedPR = null;
      state.comments = [];
      state.diff = null;
      state.conflicts = [];
    },
    clearDiff: (state) => {
      state.diff = null;
      state.conflicts = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Create PR
      .addCase(createPullRequest.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createPullRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.pullRequests.unshift(action.payload);
      })
      .addCase(createPullRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get PRs
      .addCase(getPullRequests.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPullRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.pullRequests = action.payload;
      })
      .addCase(getPullRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get PR
      .addCase(getPullRequest.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPullRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.selectedPR = action.payload;
      })
      .addCase(getPullRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update status
      .addCase(updatePullRequestStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updatePullRequestStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.pullRequests = state.pullRequests.map(pr =>
          pr.id === action.payload.id ? action.payload : pr
        );
        if (state.selectedPR && state.selectedPR.id === action.payload.id) {
          state.selectedPR = action.payload;
        }
      })
      .addCase(updatePullRequestStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Merge PR
      .addCase(mergePullRequest.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(mergePullRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.pullRequests = state.pullRequests.map(pr =>
          pr.id === action.payload.pullRequest.id ? action.payload.pullRequest : pr
        );
        if (state.selectedPR && state.selectedPR.id === action.payload.pullRequest.id) {
          state.selectedPR = action.payload.pullRequest;
        }
      })
      .addCase(mergePullRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Reject PR
      .addCase(rejectPullRequest.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(rejectPullRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.pullRequests = state.pullRequests.map(pr =>
          pr.id === action.payload.id ? action.payload : pr
        );
        if (state.selectedPR && state.selectedPR.id === action.payload.id) {
          state.selectedPR = action.payload;
        }
      })
      .addCase(rejectPullRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get diff
      .addCase(getPullRequestDiff.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPullRequestDiff.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.diff = action.payload.diff;
        state.conflicts = action.payload.conflicts || [];
      })
      .addCase(getPullRequestDiff.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Add comment
      .addCase(addPullRequestComment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addPullRequestComment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.comments.push(action.payload);
      })
      .addCase(addPullRequestComment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get comments
      .addCase(getPullRequestComments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPullRequestComments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.comments = action.payload;
      })
      .addCase(getPullRequestComments.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Add review
      .addCase(addReview.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.comments.push(action.payload);
      })
      .addCase(addReview.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset, setSelectedPR, clearSelectedPR, clearDiff } = pullRequestSlice.actions;
export default pullRequestSlice.reducer;

