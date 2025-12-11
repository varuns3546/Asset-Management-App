# 🎯 Using Official Supabase Usage Metrics

## Why Use Official Metrics?

The Supabase Management API provides **exact** usage data from your project's Usage page:
- ✅ **100% accurate** - Same data you see in Supabase dashboard
- ✅ **No estimates** - Real measurements from Supabase
- ✅ **All resources** - Includes everything automatically
- ✅ **Official source** - Directly from Supabase

---

## 📊 Metrics Display Overview

The application now displays **three levels of metrics**:

1. **Selected Project Metrics** - Data for the currently selected project only
2. **All Projects Combined** - Aggregated metrics across all your app projects
3. **Supabase Account Total** - Official metrics from Supabase API (entire account)

---

## 📋 Setup Instructions

### Step 1: Get Your Project Reference ID

1. Go to your Supabase Dashboard
2. Click on **Project Settings** (gear icon)
3. Go to **General** tab
4. Find **Reference ID** (looks like: `abcdefghijklmnop`)
5. Copy this value

**Example:**
```
Reference ID: xyzabcdefghijk
```

---

### Step 2: Generate Management API Token

1. Go to [Supabase Account Settings](https://supabase.com/dashboard/account/tokens)
2. Click **Generate New Token**
3. Give it a name: `Metrics API Token`
4. ℹ️ **Note:** Scope selection may not be visible in current Supabase UI. The token will automatically have the necessary permissions (`read:projects` and `read:usage`)
5. Click **Generate Token**
6. **⚠️ IMPORTANT:** Copy the token immediately - it won't be shown again!

**Token looks like:**
```
sbp_1234567890abcdef1234567890abcdef
```

---

### Step 3: Add to Backend Environment Variables

Add these to your `backend/.env` file:

```env
# Existing variables...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NEW: Add these for official metrics
SUPABASE_PROJECT_REF=xyzabcdefghijk
SUPABASE_MANAGEMENT_TOKEN=sbp_1234567890abcdef1234567890abcdef
```

---

### Step 4: Restart Backend Server

```bash
cd backend
npm start
```

---

### Step 5: Test It Works

1. Open your app
2. Navigate to Home screen
3. Click "🔄 Refresh"
4. Check browser console - should see:
   ```
   ✓ Using official Supabase usage metrics
   ```

---

## 🔍 How It Works

### Data Source Priority

The system tries multiple sources in order:

```
1. Official Supabase API ✓ (if configured)
   ↓
2. SQL Function (if created)
   ↓
3. Estimated Calculation (fallback)
```

### What Gets Tracked

When using official metrics, you get exact data for:

**Database:**
- Total database size (all tables)
- Indexes and relationships
- Extensions and functions
- Exactly what Supabase counts toward limits

**Storage:**
- All buckets combined
- All files across project
- Exact byte counts
- What Supabase bills for

---

## 📊 Visual Indicators

### With Official Metrics

**Database Card:**
```
┌─────────────────────────────┐
│ Database ✓                  │  ← No "~" = official data
│ ✓ Healthy                   │
│                             │
│ 45 MB / 500 MB              │
│ ████░░░░░░░░░░░░░░          │
│ 9% used                     │  ← No "(estimated)"
└─────────────────────────────┘
```

**Storage Card:**
```
┌─────────────────────────────┐
│ File Storage ✓              │  ← Shows official data
│ ✓ Healthy                   │
│                             │
│ 120 MB / 1 GB               │
│ ████░░░░░░░░░░░░░░          │
│ 11.7% used                  │
└─────────────────────────────┘
```

### Backend Console Output

```bash
✓ Using official Supabase usage metrics
Using official database size: 47.2 MB
Using official storage size: 125.8 MB
```

---

## 🔐 Security Best Practices

### DO ✅
- Store token in `.env` file
- Add `.env` to `.gitignore`
- Use read-only scopes
- Rotate tokens periodically
- Keep token secret

### DON'T ❌
- Commit token to git
- Share token publicly
- Use in frontend code
- Give unnecessary scopes
- Hardcode in source

---

## 🐛 Troubleshooting

### "Official metrics unavailable"

**Check:**
1. ✅ `SUPABASE_PROJECT_REF` is set in `.env`
2. ✅ `SUPABASE_MANAGEMENT_TOKEN` is set in `.env`
3. ✅ Token has correct scopes
4. ✅ Token is valid (not expired/revoked)
5. ✅ Project reference ID is correct
6. ✅ Backend server was restarted after adding env vars

**Test manually:**
```bash
curl -X GET "https://api.supabase.com/v1/projects/YOUR_REF/usage" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### "401 Unauthorized"

**Problem:** Invalid or expired token

**Solution:**
1. Go to Supabase Account Settings
2. Revoke old token
3. Generate new token with correct scopes
4. Update `.env` file
5. Restart backend

### "404 Not Found"

**Problem:** Wrong project reference ID

**Solution:**
1. Check Project Settings → General → Reference ID
2. Update `SUPABASE_PROJECT_REF` in `.env`
3. Restart backend

### Still shows estimates

**Problem:** Fallback mode is being used

**Solution:**
1. Check backend console logs for error messages
2. Verify both env vars are set
3. Test API endpoint manually (see above)
4. Check token scopes include `read:usage`

---

## 📈 API Response Format

### Official Metrics Response

```json
{
  "success": true,
  "data": {
    "database": {
      "size": 49545216,
      "sizeFormatted": "47.2 MB",
      "percentage": 9.45,
      "warning": false,
      "isEstimate": false,
      "dataSource": "official"  // ← Shows source
    },
    "storage": {
      "size": 131876044,
      "sizeFormatted": "125.8 MB",
      "percentage": 12.28,
      "warning": false,
      "dataSource": "official"  // ← Shows source
    },
    "usingOfficialMetrics": true  // ← Overall indicator
  }
}
```

### Fallback Response (No Official Metrics)

```json
{
  "success": true,
  "data": {
    "database": {
      "size": 47185920,
      "sizeFormatted": "45 MB",
      "percentage": 9.0,
      "warning": false,
      "isEstimate": true,
      "dataSource": "estimate"  // ← Shows fallback
    },
    "storage": {
      "size": 125829120,
      "sizeFormatted": "120 MB",
      "percentage": 11.7,
      "warning": false,
      "dataSource": "calculated"  // ← Shows calculation
    },
    "usingOfficialMetrics": false  // ← No official data
  }
}
```

---

## 🎯 Benefits of Official Metrics

### Accuracy
- ✅ Exact byte counts (not estimates)
- ✅ Includes all database objects
- ✅ Matches Supabase billing
- ✅ Real-time updates

### Completeness
- ✅ All tables automatically included
- ✅ All buckets automatically included
- ✅ Indexes and extensions counted
- ✅ Nothing is missed

### Reliability
- ✅ Official Supabase API
- ✅ Same as dashboard shows
- ✅ Proven and tested
- ✅ Updated by Supabase

### Simplicity
- ✅ No SQL functions needed
- ✅ No manual calculations
- ✅ Works immediately
- ✅ Set and forget

---

## 📝 Quick Setup Checklist

- [ ] Get Project Reference ID from Supabase Settings
- [ ] Generate Management API Token with `read:usage` scope
- [ ] Add `SUPABASE_PROJECT_REF` to `backend/.env`
- [ ] Add `SUPABASE_MANAGEMENT_TOKEN` to `backend/.env`
- [ ] Add `.env` to `.gitignore` (if not already)
- [ ] Restart backend server
- [ ] Test by refreshing Home screen
- [ ] Verify console shows "Using official metrics"
- [ ] Check UI shows no estimate indicators

---

## 🎉 Success!

When properly configured, you'll have:
- 🎯 **100% accurate** metrics from Supabase
- 📊 **Real-time** usage data
- 🔒 **Secure** token-based authentication
- 🚀 **Automatic** updates as project grows

Your storage monitoring system now uses the **exact same data** that Supabase uses for billing and limits! 

---

## 📊 Understanding the Three-Tiered Metrics Display

### 1. Selected Project Metrics (Top Section)

**What it shows:**
- Metrics for the **currently selected project only**
- Assets, files, responses, and types for that specific project
- Storage used by files in that project's folder

**Data Source:**
- Per-project database queries
- Project-specific file sizes
- Official Supabase metrics if configured (shows account total, not per-project)

**Use this for:**
- Monitoring individual project growth
- Understanding specific project resource usage
- Exporting individual project data

---

### 2. All Projects Combined (Middle Section)

**What it shows:**
- **Aggregated totals** across ALL projects in your `projects` table
- Total count of all projects
- Sum of all assets, responses, files, and asset types
- Combined storage usage from all project files

**Data Source:**
- Database queries across all projects (no filters)
- Calculated totals and estimates
- Does NOT include system tables or non-project data

**Use this for:**
- Understanding your app's total resource consumption
- Comparing individual project vs. total usage
- Planning capacity across all projects

---

### 3. Supabase Account Total (Bottom Section - Official)

**What it shows:**
- **Official metrics from Supabase Management API**
- ENTIRE Supabase project usage (what Supabase sees and bills)
- Includes ALL tables, system tables, indexes, extensions, etc.
- Includes ALL storage buckets and files

**Data Source:**
- Direct from Supabase Management API
- 100% accurate, official measurements
- Same numbers shown in your Supabase dashboard

**Use this for:**
- Understanding actual Supabase billing
- Seeing total account usage vs. free tier limits
- Identifying overhead from system tables and indexes

**Important Note:**
The Account Total will typically be **larger** than "All Projects Combined" because it includes:
- System tables and metadata
- Database indexes and extensions
- Auth and system-related data
- Any data outside your app's project structure

---

## 🔗 Useful Links

- [Supabase Management API Docs](https://supabase.com/docs/reference/management-api)
- [Generate API Tokens](https://supabase.com/dashboard/account/tokens)
- [Project Settings](https://supabase.com/dashboard/project/_/settings/general)
- [API Reference](https://supabase.com/docs/reference/management-api/usage)

---

**Need help?** Check the troubleshooting section or review the backend console logs for detailed error messages.

