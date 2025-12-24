# Version Control System Documentation

## Overview

This document describes the GitHub-like version control system implemented for the Asset Management App. The system allows projects to be marked as "master" projects, cloned by users, and changes submitted via pull requests that can be reviewed and merged.

## Table of Contents

1. [Database Schema](#database-schema)
2. [Backend API](#backend-api)
3. [Frontend Components](#frontend-components)
4. [User Workflows](#user-workflows)
5. [Key Features](#key-features)
6. [Technical Implementation](#technical-implementation)

---

## Database Schema

### Projects Table Extensions

The `projects` table has been extended with two new columns:

- **`master`** (boolean, default: false)
  - Indicates if a project is a master project
  - Only master projects can be cloned and receive pull requests

- **`parent_project_id`** (uuid, nullable, foreign key to projects.id)
  - Tracks which master project a clone originated from
  - Null for master projects and original projects
  - Used to identify cloned projects that can create pull requests

### Pull Requests Table

```sql
pull_requests
- id (uuid, primary key)
- source_project_id (uuid, foreign key to projects) - The cloned project with changes
- target_project_id (uuid, foreign key to projects) - Must be a master project
- title (text)
- description (text)
- status (enum: 'open', 'closed', 'merged', 'rejected')
- created_by (uuid, foreign key to users)
- created_at (timestamp)
- merged_at (timestamp, nullable)
- merged_by (uuid, foreign key to users, nullable)
- base_commit_hash (text, nullable) - For future version tracking
- head_commit_hash (text, nullable) - Current state of source project
```

### Pull Request Comments Table

```sql
pull_request_comments
- id (uuid, primary key)
- pull_request_id (uuid, foreign key to pull_requests)
- user_id (uuid, foreign key to users)
- comment (text)
- created_at (timestamp)
- is_review_comment (boolean) - Distinguishes general comments from review decisions
- review_action (enum: 'approve', 'request_changes', 'comment', nullable)
```

### Pull Request Changes Table

```sql
pull_request_changes
- id (uuid, primary key)
- pull_request_id (uuid, foreign key to pull_requests)
- change_type (enum: 'added', 'modified', 'deleted')
- entity_type (text) - 'project', 'hierarchy', 'asset_type', 'gis_layer', etc.
- entity_id (uuid) - ID of the changed entity
- old_data (jsonb) - Snapshot of old state
- new_data (jsonb) - Snapshot of new state
- created_at (timestamp)
```

---

## Backend API

### Project Endpoints

#### Clone a Master Project
```
POST /api/projects/:id/clone
Body: {
  title: string (required),
  description: string (optional)
}
Response: {
  id: uuid,
  title: string,
  description: string,
  parent_project_id: uuid,
  master: false,
  ...
}
```

#### Get Master Projects
```
GET /api/projects/masters
Response: [
  {
    id: uuid,
    title: string,
    description: string,
    master: true,
    owner_id: uuid,
    ...
  },
  ...
]
```

#### Set Project as Master
```
PATCH /api/projects/:id/master
Body: {
  master: boolean
}
Response: {
  id: uuid,
  master: boolean,
  ...
}
```

### Pull Request Endpoints

#### Create Pull Request
```
POST /api/pull-requests
Body: {
  sourceProjectId: uuid (required),
  targetProjectId: uuid (required, must be master),
  title: string (required),
  description: string (optional)
}
Response: {
  id: uuid,
  source_project_id: uuid,
  target_project_id: uuid,
  title: string,
  description: string,
  status: 'open',
  created_by: uuid,
  created_at: timestamp,
  ...
}
```

#### Get Pull Requests
```
GET /api/pull-requests?projectId=uuid&status=open
Query Parameters:
  - projectId: Filter by source or target project
  - status: Filter by status (open, merged, closed, rejected)
Response: [
  {
    id: uuid,
    title: string,
    status: string,
    source_project: {...},
    target_project: {...},
    creator: {...},
    ...
  },
  ...
]
```

#### Get Single Pull Request
```
GET /api/pull-requests/:id
Response: {
  id: uuid,
  title: string,
  description: string,
  status: string,
  source_project: {...},
  target_project: {...},
  creator: {...},
  merger: {...},
  created_at: timestamp,
  merged_at: timestamp,
  ...
}
```

#### Get Pull Request Diff
```
GET /api/pull-requests/:id/diff
Response: {
  project: [
    {
      changeType: 'added' | 'modified' | 'deleted',
      entityId: uuid,
      oldData: {...},
      newData: {...}
    },
    ...
  ],
  hierarchy: [...],
  assetTypes: [...],
  gisLayers: [...],
  conflicts: [
    {
      entityType: string,
      entityId: uuid,
      conflictType: string,
      sourceData: {...},
      targetData: {...}
    },
    ...
  ]
}
```

#### Add Comment
```
POST /api/pull-requests/:id/comments
Body: {
  comment: string (required),
  isReviewComment: boolean (default: false)
}
Response: {
  id: uuid,
  pull_request_id: uuid,
  user_id: uuid,
  comment: string,
  created_at: timestamp,
  ...
}
```

#### Add Review
```
POST /api/pull-requests/:id/reviews
Body: {
  reviewAction: 'approve' | 'request_changes' | 'comment' (required),
  comment: string (required)
}
Response: {
  id: uuid,
  pull_request_id: uuid,
  user_id: uuid,
  comment: string,
  review_action: string,
  is_review_comment: true,
  created_at: timestamp,
  ...
}
```

#### Get Comments
```
GET /api/pull-requests/:id/comments
Response: [
  {
    id: uuid,
    comment: string,
    user: {...},
    review_action: string | null,
    is_review_comment: boolean,
    created_at: timestamp,
    ...
  },
  ...
]
```

#### Merge Pull Request
```
POST /api/pull-requests/:id/merge
Body: {
  resolutions: [
    {
      entityType: string,
      entityId: uuid,
      action: 'keep_source' | 'keep_target',
      data: {...} (optional)
    },
    ...
  ] (required if conflicts exist, empty array if no conflicts)
}
Response: {
  id: uuid,
  status: 'merged',
  merged_at: timestamp,
  merged_by: uuid,
  ...
}
```

#### Reject Pull Request
```
POST /api/pull-requests/:id/reject
Response: {
  id: uuid,
  status: 'rejected',
  ...
}
```

#### Update Pull Request Status
```
PATCH /api/pull-requests/:id
Body: {
  status: 'open' | 'closed' | 'merged' | 'rejected'
}
Response: {
  id: uuid,
  status: string,
  ...
}
```

---

## Frontend Components

### Redux State Management

#### Pull Request Slice (`pullRequestSlice.js`)
- **State:**
  - `pullRequests`: Array of all pull requests
  - `selectedPR`: Currently selected pull request
  - `comments`: Comments for selected PR
  - `diff`: Diff data for selected PR
  - `conflicts`: Array of conflicts detected
  - `isLoading`: Loading state
  - `isError`: Error state
  - `message`: Error message

- **Actions:**
  - `createPullRequest`: Create a new PR
  - `getPullRequests`: Fetch list of PRs
  - `getPullRequest`: Fetch single PR details
  - `getPullRequestDiff`: Calculate and fetch diff
  - `getPullRequestComments`: Fetch comments
  - `addPullRequestComment`: Add a comment
  - `addReview`: Add a review (approve/request changes)
  - `mergePullRequest`: Merge a PR
  - `rejectPullRequest`: Reject a PR
  - `updatePullRequestStatus`: Update PR status

#### Project Slice Extensions
- **New Actions:**
  - `cloneProject`: Clone a master project
  - `getMasterProjects`: Fetch all master projects
  - `setProjectAsMaster`: Mark/unmark project as master

- **New State:**
  - `masterProjects`: Array of master projects

### Components

#### PullRequestList
- Displays list of all pull requests
- Filtering by status (All, Open, Merged, Closed)
- Filtering by project
- Click to navigate to PR detail

#### PullRequestCard
- Displays single PR in list view
- Shows: title, author, source/target projects, status badge, dates
- Clickable to navigate to detail view

#### PullRequestDetail
- Full PR view with:
  - PR header (title, description, status, metadata)
  - Merge/reject buttons (for owner)
  - Review actions (approve, request changes)
  - Diff visualization
  - Comments section
  - Comment input form

#### PullRequestDiff
- Visualizes changes between source and target
- Shows changes by entity type:
  - Project metadata
  - Hierarchy changes
  - Asset type changes
  - GIS layer changes
- Displays conflicts with warnings
- Color-coded changes (green=added, yellow=modified, red=deleted)

#### PullRequestComment
- Displays individual comment
- Shows author, timestamp, review action badge
- Supports review comments (approve, request changes, comment)

#### CreatePullRequestModal
- Form to create new pull request
- Select target master project
- Enter title and description
- Validates that source project is a clone

#### ConflictResolutionModal
- Displays all conflicts when merging
- Shows source vs target data side-by-side
- Allows selection of resolution for each conflict:
  - Keep Source (your changes)
  - Keep Target (master)
- Validates all conflicts are resolved before merging

### Screens

#### PullRequestScreen
- Main screen for PR management
- Shows list of pull requests
- "New Pull Request" button (only enabled for cloned projects)
- Filters and search functionality

### Updated Components

#### MyProjectsModal
- **New Features:**
  - "Clone from Master Project" button
  - Clone modal for selecting master and entering clone details
  - Master project indicator badge (purple "MASTER" badge)
  - Cloned project indicator badge (blue "CLONE" badge)
  - Shows parent project relationship

#### Navbar
- Added "Pull Requests" navigation button

---

## User Workflows

### 1. Creating a Master Project

1. User creates or selects a project
2. Project owner sets project as master (via API or future UI)
3. Project is marked with `master: true`
4. Project appears in master projects list

### 2. Cloning a Master Project

1. User opens "My Projects" modal
2. Clicks "Clone from Master Project"
3. Selects a master project from dropdown
4. Enters title and optional description for clone
5. System creates new project with:
   - `parent_project_id` set to master project ID
   - `master: false`
   - All data copied from master project
6. Clone appears in user's projects with "CLONE" badge

### 3. Creating a Pull Request

1. User selects a cloned project (has `parent_project_id`)
2. Makes changes to the cloned project
3. Navigates to Pull Requests screen
4. Clicks "New Pull Request"
5. Selects target master project (defaults to parent)
6. Enters title and description
7. System calculates diff and creates PR
8. PR appears in list with "open" status

### 4. Reviewing a Pull Request

1. PR owner or collaborator opens PR detail view
2. Views diff to see all changes
3. Can add general comments
4. Can add review:
   - Approve: Indicates approval
   - Request Changes: Requests modifications
   - Comment: General review comment
5. Comments appear in chronological order

### 5. Merging a Pull Request

1. Master project owner opens PR detail
2. Reviews changes and comments
3. If conflicts exist:
   - System detects conflicts automatically
   - Conflict resolution modal appears
   - Owner resolves each conflict
4. Clicks "Merge Pull Request"
5. System merges changes:
   - Applies all non-conflicting changes
   - Applies conflict resolutions
   - Updates master project
6. PR status changes to "merged"
7. Merged timestamp and merger recorded

### 6. Rejecting a Pull Request

1. Master project owner opens PR detail
2. Reviews changes
3. Clicks "Reject"
4. Confirms rejection
5. PR status changes to "rejected"
6. Source project remains unchanged

### 7. Closing a Pull Request

1. PR creator opens PR detail
2. Clicks "Close Pull Request"
3. PR status changes to "closed"
4. Can be reopened later if needed

---

## Key Features

### 1. Master Projects
- Projects can be marked as master
- Only master projects can be cloned
- Only master projects can receive pull requests
- Master projects serve as the "source of truth"

### 2. Project Cloning
- Deep copy of all project data:
  - Project metadata
  - Hierarchy structure
  - Asset types
  - GIS layers and features
  - All related entities
- Maintains parent relationship
- Clone is independent (can be modified freely)

### 3. Pull Requests
- Created from cloned projects to master
- Tracks all changes between source and target
- Supports multiple change types:
  - Added entities
  - Modified entities
  - Deleted entities

### 4. Diff Calculation
- Compares source and target projects
- Identifies changes by entity type
- Stores snapshots of old and new data
- Efficient comparison algorithm

### 5. Conflict Detection
- Automatically detects conflicts when:
  - Same entity modified in both source and target
  - Entity deleted in one but modified in other
- Provides detailed conflict information
- Shows both versions side-by-side

### 6. Conflict Resolution
- Manual resolution required for conflicts
- Options:
  - Keep source (clone) changes
  - Keep target (master) changes
- All conflicts must be resolved before merge
- Resolution applied atomically

### 7. Comments and Reviews
- General comments for discussion
- Review comments with actions:
  - Approve
  - Request Changes
  - Comment
- Chronological comment thread
- User attribution for all comments

### 8. Merge Process
- Atomic merge operation
- Applies all non-conflicting changes
- Applies conflict resolutions
- Updates master project
- Records merge metadata (timestamp, user)

### 9. Status Management
- PR statuses:
  - `open`: Active PR awaiting review/merge
  - `merged`: Successfully merged
  - `rejected`: Rejected by owner
  - `closed`: Closed by creator
- Status transitions are tracked
- Historical status information preserved

---

## Technical Implementation

### Backend Architecture

#### Controllers
- **projectController.js**: Extended with clone and master project functions
- **pullRequestController.js**: Handles all PR operations

#### Services
- **mergeService.js**: Core merge logic
  - `calculateDiff()`: Compares projects and identifies changes
  - `detectConflicts()`: Finds conflicts between source and target
  - `mergeProjectData()`: Merges project metadata
  - `mergeHierarchy()`: Merges hierarchy with conflict handling
  - `mergeAssetTypes()`: Merges asset types
  - `mergeGisLayers()`: Merges GIS layers and features
  - `resolveConflict()`: Applies conflict resolution

#### Database Queries
- Efficient queries using direct `project_id` filters
- Joins for related data (projects, users, comments)
- Transaction support for atomic operations

### Frontend Architecture

#### State Management
- Redux for global state
- Separate slices for projects and pull requests
- Async thunks for API calls
- Optimistic updates where appropriate

#### Component Structure
- Reusable form components (FormField, ButtonGroup, ErrorMessage)
- Modal system for dialogs
- Routing with React Router
- Responsive design considerations

#### Data Flow
1. User action triggers Redux action
2. Async thunk makes API call
3. Response updates Redux state
4. Components re-render with new data
5. UI reflects current state

### Security Considerations

- **Authentication**: All endpoints require valid JWT token
- **Authorization**: 
  - Only master project owner can merge/reject PRs
  - Only users with access to master can create PRs
  - Users can only comment on PRs they have access to
- **Validation**: 
  - Source project must be a clone (has parent_project_id)
  - Target project must be a master
  - All required fields validated

### Performance Optimizations

- **Diff Calculation**: Efficient comparison algorithms
- **Lazy Loading**: Comments and diff loaded on demand
- **Caching**: Master projects list cached
- **Pagination**: Future enhancement for large PR lists
- **Indexing**: Database indexes on frequently queried columns

### Error Handling

- **Backend**: Comprehensive error messages
- **Frontend**: User-friendly error displays
- **Validation**: Client and server-side validation
- **Conflict Handling**: Clear conflict resolution UI

---

## Future Enhancements

1. **Commit History**: Track individual commits within projects
2. **Branching**: Support multiple branches per project
3. **Notifications**: Notify users of PR activity
4. **File-level Diffs**: More granular diff visualization
5. **Merge Previews**: Preview merge result before applying
6. **Automated Testing**: Run tests before allowing merge
7. **Code Review Assignments**: Assign reviewers to PRs
8. **PR Templates**: Standardized PR creation forms
9. **Webhooks**: Integrate with external systems
10. **Audit Log**: Track all PR-related actions

---

## Migration Notes

### Running Migrations

1. **Migration 001**: Adds `project_id` columns to related tables
   ```bash
   # Run migration 001_add_project_id_to_tables.sql
   ```

2. **Migration 002**: Adds version control schema
   ```bash
   # Run migration 002_add_version_control_schema.sql
   ```

### Data Migration

- Existing projects will have `master: false` and `parent_project_id: null`
- No data loss during migration
- All existing functionality remains intact

### Backward Compatibility

- All existing API endpoints continue to work
- Existing projects unaffected
- New features are opt-in (projects must be explicitly marked as master)

---

## Testing Checklist

- [ ] Clone master project
- [ ] Create pull request from clone
- [ ] View PR diff
- [ ] Add comments to PR
- [ ] Add review (approve/request changes)
- [ ] Merge PR without conflicts
- [ ] Merge PR with conflicts (resolve conflicts)
- [ ] Reject PR
- [ ] Close PR
- [ ] Filter PRs by status
- [ ] Filter PRs by project
- [ ] Set project as master
- [ ] View master projects list
- [ ] Error handling (invalid PR, permissions, etc.)

---

## Support and Troubleshooting

### Common Issues

1. **Cannot create PR**: Ensure source project is a clone (has parent_project_id)
2. **Cannot merge PR**: Ensure you are the master project owner
3. **Conflicts not detected**: Check that both projects have modified the same entities
4. **Clone fails**: Verify master project exists and is accessible

### Debug Information

- Check browser console for frontend errors
- Check backend logs for API errors
- Verify database migrations have run
- Confirm user has proper permissions

---

## Conclusion

The version control system provides a robust, GitHub-like workflow for managing project changes through pull requests. It supports collaboration, review processes, and safe merging of changes while maintaining data integrity and providing clear conflict resolution mechanisms.

