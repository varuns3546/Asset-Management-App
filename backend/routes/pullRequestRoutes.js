import express from 'express';
import pullRequestController from '../controllers/pullRequestController.js';
import supabaseClient from '../config/supabaseClient.js';

const { authenticateUser } = supabaseClient;
const router = express.Router();

router.use(authenticateUser);

const {
  createPullRequest,
  getPullRequests,
  getPullRequest,
  updatePullRequestStatus,
  rejectPullRequest,
  mergePullRequest,
  getPullRequestDiff,
  addPullRequestComment,
  getPullRequestComments,
  addReview
} = pullRequestController;

// Create PR
router.post('/', createPullRequest);

// List PRs (with optional filters)
router.get('/', getPullRequests);

// Get single PR
router.get('/:id', getPullRequest);

// Update PR status
router.patch('/:id', updatePullRequestStatus);

// Merge PR
router.post('/:id/merge', mergePullRequest);

// Reject PR
router.post('/:id/reject', rejectPullRequest);

// Get PR diff
router.get('/:id/diff', getPullRequestDiff);

// Add comment
router.post('/:id/comments', addPullRequestComment);

// Get comments
router.get('/:id/comments', getPullRequestComments);

// Add review
router.post('/:id/reviews', addReview);

export default router;

