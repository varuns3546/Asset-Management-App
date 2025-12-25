# Debugging Guide for Asset Management App

## 1. **Strategic Logging**

### Backend Logging
Add detailed logging at key points:

```javascript
// Example: Enhanced logging in getSharedProjects
const getSharedProjects = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  console.log('[getSharedProjects] Starting', { userId });

  const { data: projectUsersData, error: projectUsersError } = await req.supabase
    .from('project_users')
    .select('project_id')
    .eq('user_id', userId)
    .neq('role', 'owner');

  console.log('[getSharedProjects] project_users query result', {
    count: projectUsersData?.length || 0,
    error: projectUsersError?.message,
    data: projectUsersData
  });

  // ... rest of function
});
```

### Frontend Logging
Use console.log strategically in React components:

```javascript
useEffect(() => {
  console.log('[SharedProjectsModal] State update', {
    projects: projects?.length,
    isLoading,
    isError,
    message
  });
}, [projects, isLoading, isError, message]);
```

## 2. **Browser DevTools**

### Network Tab
- Check API requests/responses
- Verify request headers (Authorization tokens)
- Check response status codes and error messages
- Use "Preserve log" to keep requests after navigation

### Console Tab
- Look for JavaScript errors
- Check Redux DevTools for state changes
- Monitor console.warn and console.error

### React DevTools
- Inspect component props and state
- Check Redux store state
- Use Profiler to find performance issues

## 3. **Backend Debugging**

### Use Debugger
```javascript
// Add breakpoints in VS Code or use debugger statement
const getSharedProjects = asyncHandler(async (req, res) => {
  debugger; // Execution will pause here
  const userId = req.user.id;
  // ...
});
```

### Test API Endpoints Directly
```bash
# Using curl
curl -X GET http://localhost:3001/api/projects/shared \
  -H "Authorization: Bearer YOUR_TOKEN"

# Using Postman or Insomnia
# Create requests to test endpoints independently
```

### Database Queries
Test Supabase queries directly:
```javascript
// Create a test script: backend/scripts/test_query.js
import supabaseClient from '../config/supabaseClient.js';
const { supabase } = supabaseClient;

const testQuery = async () => {
  const { data, error } = await supabase
    .from('project_users')
    .select('project_id')
    .eq('user_id', 'YOUR_USER_ID')
    .neq('role', 'owner');
  
  console.log('Query result:', { data, error });
};

testQuery();
```

## 4. **Common Bug Patterns to Check**

### Null/Undefined Issues
```javascript
// Always check for null/undefined
if (!project || !project.id) {
  console.error('Invalid project:', project);
  return;
}
```

### Type Mismatches
```javascript
// UUIDs might be strings vs objects
const userId = String(req.user.id); // Ensure string
const projectOwnerId = String(project.owner_id || '');

if (userId !== projectOwnerId) {
  // ...
}
```

### Async/Await Errors
```javascript
// Always handle errors
try {
  const result = await someAsyncFunction();
} catch (error) {
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    response: error.response?.data
  });
}
```

### State Updates
```javascript
// In React, check if state updates are happening
useEffect(() => {
  console.log('State changed:', { projects, isLoading });
}, [projects, isLoading]);
```

## 5. **Systematic Debugging Process**

### Step 1: Reproduce the Bug
- Document exact steps to reproduce
- Note what should happen vs what actually happens
- Check if it happens consistently or intermittently

### Step 2: Isolate the Problem
- Check if it's frontend or backend
- Test API endpoints independently
- Check database directly

### Step 3: Add Logging
- Add logs at entry/exit points
- Log intermediate values
- Log error conditions

### Step 4: Check Data Flow
- Frontend → API request
- Backend → Database query
- Database → Backend response
- Backend → Frontend response
- Frontend → State update → UI render

### Step 5: Verify Assumptions
- Check if data exists in database
- Verify user permissions
- Check authentication/authorization
- Validate input data types and formats

## 6. **Tools & Extensions**

### VS Code Extensions
- **ESLint**: Catch syntax errors
- **Prettier**: Format code consistently
- **Thunder Client**: Test API endpoints
- **REST Client**: Test APIs from VS Code

### Browser Extensions
- **React DevTools**: Inspect React components
- **Redux DevTools**: Debug Redux state
- **Network Monitor**: Analyze network requests

### Command Line Tools
```bash
# Check for syntax errors
npm run lint

# Check TypeScript errors (if using TS)
npm run type-check

# Run tests
npm test
```

## 7. **Debugging Specific Issues**

### API 404 Errors
1. Check route definition order (specific routes before parameterized)
2. Verify route path matches exactly
3. Check if middleware is blocking request
4. Verify server is running on correct port

### Authentication Issues
1. Check token in localStorage
2. Verify token format (Bearer token)
3. Check token expiration
4. Verify user exists in database

### Database Query Issues
1. Test query in Supabase dashboard
2. Check foreign key relationships
3. Verify RLS (Row Level Security) policies
4. Check if data actually exists

### State Management Issues
1. Use Redux DevTools to inspect state
2. Check if actions are dispatched
3. Verify reducers are updating state correctly
4. Check for state mutations (should be immutable)

## 8. **Best Practices**

### Defensive Programming
```javascript
// Always validate inputs
if (!userId || typeof userId !== 'string') {
  return res.status(400).json({ error: 'Invalid user ID' });
}

// Check for null/undefined
const projects = (data || []).filter(p => p !== null);
```

### Error Handling
```javascript
// Provide detailed error messages
catch (error) {
  console.error('Operation failed:', {
    function: 'getSharedProjects',
    userId: req.user.id,
    error: error.message,
    stack: error.stack
  });
  return res.status(500).json({
    success: false,
    error: error.message
  });
}
```

### Code Review Checklist
- [ ] All async operations have error handling
- [ ] Null/undefined checks are in place
- [ ] Type conversions are explicit
- [ ] Logging is added for debugging
- [ ] Edge cases are handled

## 9. **Quick Debugging Commands**

```bash
# Backend: Check if server is running
curl http://localhost:3001/api/health

# Check database connection
# Run a simple query script

# Frontend: Clear cache and rebuild
rm -rf node_modules/.cache
npm start

# Check for console errors
# Open browser DevTools → Console tab
```

## 10. **When to Ask for Help**

After trying:
1. ✅ Added logging at key points
2. ✅ Checked browser console and network tab
3. ✅ Tested API endpoint directly
4. ✅ Verified data exists in database
5. ✅ Checked for common patterns (null, type mismatches)
6. ✅ Isolated the problem to specific function/component

Then document:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Relevant logs/error messages
- What you've already tried

