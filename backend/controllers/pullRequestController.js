import asyncHandler from 'express-async-handler';
import * as mergeService from '../services/mergeService.js';

// Create a pull request from clone to master
const createPullRequest = asyncHandler(async (req, res) => {
  const { sourceProjectId, targetProjectId, title, description } = req.body;

  if (!sourceProjectId || !targetProjectId || !title) {
    return res.status(400).json({
      success: false,
      error: 'Source project ID, target project ID, and title are required'
    });
  }

  // Verify source project exists and user owns it
  const { data: sourceProject, error: sourceError } = await req.supabase
    .from('projects')
    .select('id, owner_id, parent_project_id')
    .eq('id', sourceProjectId)
    .single();

  if (sourceError || !sourceProject) {
    return res.status(404).json({
      success: false,
      error: 'Source project not found'
    });
  }

  // Verify user owns the source project
  const { data: sourceAccess } = await req.supabase
    .from('project_users')
    .select('role')
    .eq('project_id', sourceProjectId)
    .eq('user_id', req.user.id)
    .single();

  if (!sourceAccess && sourceProject.owner_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'You must own the source project to create a pull request'
    });
  }

  // Verify target project exists and is a master project
  const { data: targetProject, error: targetError } = await req.supabase
    .from('projects')
    .select('id, master, owner_id')
    .eq('id', targetProjectId)
    .single();

  if (targetError || !targetProject) {
    return res.status(404).json({
      success: false,
      error: 'Target project not found'
    });
  }

  if (!targetProject.master) {
    return res.status(400).json({
      success: false,
      error: 'Target project must be a master project'
    });
  }

  // Verify source project is a clone of the target (or allow any clone to create PR)
  if (sourceProject.parent_project_id !== targetProjectId) {
    return res.status(400).json({
      success: false,
      error: 'Source project must be a clone of the target master project'
    });
  }

  // Check if there's already an open PR from this source to this target
  const { data: existingPR } = await req.supabase
    .from('pull_requests')
    .select('id')
    .eq('source_project_id', sourceProjectId)
    .eq('target_project_id', targetProjectId)
    .eq('status', 'open')
    .single();

  if (existingPR) {
    return res.status(400).json({
      success: false,
      error: 'An open pull request already exists from this project to the target'
    });
  }

  // Create the pull request
  const { data: pullRequest, error: prError } = await req.supabase
    .from('pull_requests')
    .insert({
      source_project_id: sourceProjectId,
      target_project_id: targetProjectId,
      title: title.trim(),
      description: description || '',
      created_by: req.user.id,
      status: 'open'
    })
    .select()
    .single();

  if (prError) {
    console.error('Error creating pull request:', prError);
    return res.status(400).json({
      success: false,
      error: prError.message
    });
  }

  res.status(201).json(pullRequest);
});

// Get pull requests (filtered by project or user)
const getPullRequests = asyncHandler(async (req, res) => {
  const { projectId, status, userId } = req.query;

  let query = req.supabase
    .from('pull_requests')
    .select(`
      *,
      source_project:projects!pull_requests_source_project_id_fkey(id, title),
      target_project:projects!pull_requests_target_project_id_fkey(id, title),
      creator:auth.users!pull_requests_created_by_fkey(id, email, user_metadata)
    `)
    .order('created_at', { ascending: false });

  // Filter by source or target project
  if (projectId) {
    query = query.or(`source_project_id.eq.${projectId},target_project_id.eq.${projectId}`);
  }

  // Filter by status
  if (status) {
    query = query.eq('status', status);
  }

  // Filter by creator
  if (userId) {
    query = query.eq('created_by', userId);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  res.status(200).json(data || []);
});

// Get single pull request with details
const getPullRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Pull request ID is required'
    });
  }

  const { data: pullRequest, error } = await req.supabase
    .from('pull_requests')
    .select(`
      *,
      source_project:projects!pull_requests_source_project_id_fkey(*),
      target_project:projects!pull_requests_target_project_id_fkey(*),
      creator:auth.users!pull_requests_created_by_fkey(id, email, user_metadata),
      merger:auth.users!pull_requests_merged_by_fkey(id, email, user_metadata)
    `)
    .eq('id', id)
    .single();

  if (error || !pullRequest) {
    return res.status(404).json({
      success: false,
      error: 'Pull request not found'
    });
  }

  res.status(200).json(pullRequest);
});

// Update pull request status
const updatePullRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Pull request ID is required'
    });
  }

  if (!status || !['open', 'closed'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Valid status (open or closed) is required'
    });
  }

  // Get the pull request
  const { data: pullRequest, error: prError } = await req.supabase
    .from('pull_requests')
    .select('*, target_project:projects!pull_requests_target_project_id_fkey(owner_id)')
    .eq('id', id)
    .single();

  if (prError || !pullRequest) {
    return res.status(404).json({
      success: false,
      error: 'Pull request not found'
    });
  }

  // Only creator or target project owner can update status
  const canUpdate = pullRequest.created_by === req.user.id || 
                   pullRequest.target_project.owner_id === req.user.id;

  if (!canUpdate) {
    return res.status(403).json({
      success: false,
      error: 'You do not have permission to update this pull request'
    });
  }

  // Update status
  const { data: updatedPR, error: updateError } = await req.supabase
    .from('pull_requests')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return res.status(400).json({
      success: false,
      error: updateError.message
    });
  }

  res.status(200).json(updatedPR);
});

// Reject a pull request
const rejectPullRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Pull request ID is required'
    });
  }

  // Get the pull request
  const { data: pullRequest, error: prError } = await req.supabase
    .from('pull_requests')
    .select('*, target_project:projects!pull_requests_target_project_id_fkey(owner_id)')
    .eq('id', id)
    .single();

  if (prError || !pullRequest) {
    return res.status(404).json({
      success: false,
      error: 'Pull request not found'
    });
  }

  // Only target project owner can reject
  if (pullRequest.target_project.owner_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'Only the master project owner can reject pull requests'
    });
  }

  if (pullRequest.status !== 'open') {
    return res.status(400).json({
      success: false,
      error: 'Can only reject open pull requests'
    });
  }

  // Update status to rejected
  const { data: updatedPR, error: updateError } = await req.supabase
    .from('pull_requests')
    .update({ status: 'rejected' })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return res.status(400).json({
      success: false,
      error: updateError.message
    });
  }

  res.status(200).json(updatedPR);
});

// Add comment to pull request
const addPullRequestComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comment, isReviewComment = false, reviewAction = null } = req.body;

  if (!id || !comment) {
    return res.status(400).json({
      success: false,
      error: 'Pull request ID and comment are required'
    });
  }

  // Verify pull request exists
  const { data: pullRequest, error: prError } = await req.supabase
    .from('pull_requests')
    .select('id, status')
    .eq('id', id)
    .single();

  if (prError || !pullRequest) {
    return res.status(404).json({
      success: false,
      error: 'Pull request not found'
    });
  }

  // Validate review action if it's a review comment
  if (isReviewComment && reviewAction && !['approve', 'request_changes', 'comment'].includes(reviewAction)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid review action'
    });
  }

  // Create comment
  const { data: newComment, error: commentError } = await req.supabase
    .from('pull_request_comments')
    .insert({
      pull_request_id: id,
      user_id: req.user.id,
      comment: comment.trim(),
      is_review_comment: isReviewComment,
      review_action: reviewAction
    })
    .select(`
      *,
      user:auth.users!pull_request_comments_user_id_fkey(id, email, user_metadata)
    `)
    .single();

  if (commentError) {
    return res.status(400).json({
      success: false,
      error: commentError.message
    });
  }

  res.status(201).json(newComment);
});

// Get comments for a pull request
const getPullRequestComments = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Pull request ID is required'
    });
  }

  const { data: comments, error } = await req.supabase
    .from('pull_request_comments')
    .select(`
      *,
      user:auth.users!pull_request_comments_user_id_fkey(id, email, user_metadata)
    `)
    .eq('pull_request_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  res.status(200).json(comments || []);
});

// Add review (approve/request changes)
const addReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reviewAction, comment } = req.body;

  if (!id || !reviewAction) {
    return res.status(400).json({
      success: false,
      error: 'Pull request ID and review action are required'
    });
  }

  if (!['approve', 'request_changes', 'comment'].includes(reviewAction)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid review action. Must be: approve, request_changes, or comment'
    });
  }

  // Get the pull request
  const { data: pullRequest, error: prError } = await req.supabase
    .from('pull_requests')
    .select('*, target_project:projects!pull_requests_target_project_id_fkey(owner_id)')
    .eq('id', id)
    .single();

  if (prError || !pullRequest) {
    return res.status(404).json({
      success: false,
      error: 'Pull request not found'
    });
  }

  // Only target project owner can review
  if (pullRequest.target_project.owner_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'Only the master project owner can review pull requests'
    });
  }

  // Create review comment
  const { data: reviewComment, error: commentError } = await req.supabase
    .from('pull_request_comments')
    .insert({
      pull_request_id: id,
      user_id: req.user.id,
      comment: comment || '',
      is_review_comment: true,
      review_action: reviewAction
    })
    .select(`
      *,
      user:auth.users!pull_request_comments_user_id_fkey(id, email, user_metadata)
    `)
    .single();

  if (commentError) {
    return res.status(400).json({
      success: false,
      error: commentError.message
    });
  }

  res.status(201).json(reviewComment);
});

// Get pull request diff
const getPullRequestDiff = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Pull request ID is required'
    });
  }

  // Get the pull request
  const { data: pullRequest, error: prError } = await req.supabase
    .from('pull_requests')
    .select('source_project_id, target_project_id')
    .eq('id', id)
    .single();

  if (prError || !pullRequest) {
    return res.status(404).json({
      success: false,
      error: 'Pull request not found'
    });
  }

  try {
    // Calculate diff
    const diff = await mergeService.calculateDiff(
      req.supabase,
      pullRequest.source_project_id,
      pullRequest.target_project_id
    );

    // Detect conflicts
    const conflicts = await mergeService.detectConflicts(
      req.supabase,
      pullRequest.source_project_id,
      pullRequest.target_project_id
    );

    // Store changes in pull_request_changes table (for history)
    const allChanges = [
      ...diff.project.map(c => ({ ...c, entityType: 'project' })),
      ...diff.hierarchy.map(c => ({ ...c, entityType: 'hierarchy' })),
      ...diff.assetTypes.map(c => ({ ...c, entityType: 'asset_type' })),
      ...diff.gisLayers.map(c => ({ ...c, entityType: 'gis_layer' }))
    ];

    // Insert changes into database
    if (allChanges.length > 0) {
      const changesToInsert = allChanges.map(change => ({
        pull_request_id: id,
        change_type: change.changeType,
        entity_type: change.entityType,
        entity_id: change.entityId,
        old_data: change.oldData,
        new_data: change.newData
      }));

      await req.supabase
        .from('pull_request_changes')
        .insert(changesToInsert);
    }

    res.status(200).json({
      success: true,
      diff,
      conflicts,
      hasConflicts: conflicts.length > 0
    });
  } catch (error) {
    console.error('Error calculating diff:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate diff'
    });
  }
});

// Merge pull request
const mergePullRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolutions = [] } = req.body; // Array of conflict resolutions

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Pull request ID is required'
    });
  }

  // Get the pull request
  const { data: pullRequest, error: prError } = await req.supabase
    .from('pull_requests')
    .select('*, target_project:projects!pull_requests_target_project_id_fkey(owner_id, id)')
    .eq('id', id)
    .single();

  if (prError || !pullRequest) {
    return res.status(404).json({
      success: false,
      error: 'Pull request not found'
    });
  }

  // Only target project owner can merge
  if (pullRequest.target_project.owner_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'Only the master project owner can merge pull requests'
    });
  }

  if (pullRequest.status !== 'open') {
    return res.status(400).json({
      success: false,
      error: 'Can only merge open pull requests'
    });
  }

  try {
    // Detect conflicts first
    const conflicts = await mergeService.detectConflicts(
      req.supabase,
      pullRequest.source_project_id,
      pullRequest.target_project_id
    );

    // If there are conflicts and no resolutions provided, return conflicts
    if (conflicts.length > 0 && resolutions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Conflicts detected. Resolutions required.',
        conflicts
      });
    }

    // Start transaction-like operations
    // Merge project metadata
    await mergeService.mergeProjectData(
      req.supabase,
      pullRequest.source_project_id,
      pullRequest.target_project_id,
      resolutions.find(r => r.entityType === 'project')
    );

    // Merge hierarchy
    await mergeService.mergeHierarchy(
      req.supabase,
      pullRequest.source_project_id,
      pullRequest.target_project_id,
      resolutions.filter(r => r.entityType === 'hierarchy')
    );

    // Merge asset types
    await mergeService.mergeAssetTypes(
      req.supabase,
      pullRequest.source_project_id,
      pullRequest.target_project_id
    );

    // Merge GIS layers
    await mergeService.mergeGisLayers(
      req.supabase,
      pullRequest.source_project_id,
      pullRequest.target_project_id
    );

    // Update pull request status to merged
    const { data: updatedPR, error: updateError } = await req.supabase
      .from('pull_requests')
      .update({
        status: 'merged',
        merged_at: new Date().toISOString(),
        merged_by: req.user.id
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: updateError.message
      });
    }

    res.status(200).json({
      success: true,
      pullRequest: updatedPR,
      message: 'Pull request merged successfully'
    });
  } catch (error) {
    console.error('Error merging pull request:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to merge pull request: ' + error.message
    });
  }
});

export default {
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
};

