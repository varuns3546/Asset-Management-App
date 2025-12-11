# 📊 Storage Metrics & Monitoring System

## 🎯 Overview

A complete storage monitoring and warning system for tracking Supabase free tier usage, with real-time metrics, visual warnings, and data export capabilities.

---

## ✨ Features at a Glance

### 🏠 Home Dashboard
- Real-time database and storage metrics
- Beautiful visual progress bars
- Color-coded warning system
- Project statistics overview
- One-click data export
- Manual refresh capability

### ⚠️ Warning System
- **Yellow Warning**: Appears at 80% capacity
- **Red Critical Alert**: Appears at 90% capacity with pulse animation
- Dismissible banner
- Prominent action buttons

### 📥 Data Export
- Complete project backup as JSON
- All entities included (assets, responses, files, users)
- Instant browser download
- Timestamped filenames

---

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd backend
npm start
```

### 2. Start the Frontend
```bash
cd frontend
npm start
```

### 3. Navigate to Home
- Log in to your account
- Select a project
- Click the **"🏠 Home"** button in the navbar

### 4. View Your Metrics
You'll see:
- Database usage (% of 500 MB)
- Storage usage (% of 1 GB)
- Asset, response, file, and type counts
- Warning banner (if > 80%)

---

## 📋 API Endpoints

### Get Project Metrics
```http
GET /api/projects/:projectId/metrics
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "database": {
      "size": 12582912,
      "sizeFormatted": "12 MB",
      "limit": 524288000,
      "limitFormatted": "500 MB",
      "percentage": 2.4,
      "warning": false
    },
    "storage": {
      "size": 5242880,
      "sizeFormatted": "5 MB",
      "limit": 1073741824,
      "limitFormatted": "1 GB",
      "percentage": 0.49,
      "warning": false
    },
    "counts": {
      "assets": 150,
      "responses": 320,
      "files": 25,
      "assetTypes": 12
    },
    "overallWarning": false,
    "criticalWarning": false
  }
}
```

### Export Project Data
```http
GET /api/projects/:projectId/export
Authorization: Bearer {token}
```

**Response:** Downloads a JSON file containing all project data.

---

## 🎨 User Interface

### Home Dashboard Components

1. **Header Section**
   - Project name display
   - Refresh button

2. **Warning Banner** (conditional)
   - Shows when usage > 80%
   - Yellow (80-90%) or Red (>90%)
   - Export and dismiss buttons

3. **Storage Metrics**
   - Database usage card
   - Storage usage card
   - Visual progress bars
   - Status badges (Healthy/Warning)

4. **Statistics Cards**
   - Assets count (purple gradient)
   - Responses count (pink gradient)
   - Files count (blue gradient)
   - Asset Types count (green gradient)

5. **Actions Section**
   - Export button (purple)
   - Free tier info card (gray)

---

## 🔧 Technical Details

### Backend Architecture

```
backend/
├── controllers/
│   ├── metricsController.js    # Calculates usage metrics
│   └── exportController.js     # Handles data export
├── routes/
│   └── projectRoutes.js        # Added /metrics and /export routes
```

### Frontend Architecture

```
frontend/
├── services/
│   └── metricsService.js       # API calls for metrics/export
├── components/
│   ├── Navbar.js               # Added Home button
│   └── StorageWarningBanner.js # Warning banner component
├── screens/
│   └── HomeScreen.js           # Main dashboard screen
└── styles/
    ├── homeScreen.css          # Dashboard styling
    └── storageWarning.css      # Banner styling
```

### Metrics Calculation

**Database Size:**
```javascript
estimatedDbSize = (
  (assets × 2KB) +
  (responses × 4KB) +
  (files × 1KB) +
  (assetTypes × 512B)
)
```

**Storage Size:**
```javascript
totalStorage = 
  sum(project_files.file_size) +
  sum(questionnaire-photos file sizes)
```

---

## ⚙️ Configuration

### Free Tier Limits

Edit in `backend/controllers/metricsController.js`:

```javascript
const FREE_TIER_DB_LIMIT = 500 * 1024 * 1024; // 500 MB
const FREE_TIER_STORAGE_LIMIT = 1024 * 1024 * 1024; // 1 GB
```

### Warning Thresholds

Default thresholds:
- **Warning**: 80%
- **Critical**: 90%

Search codebase for `> 80` and `> 90` to customize.

---

## 🎯 Usage Scenarios

### Scenario 1: Normal Usage
```
Database: 45 MB / 500 MB (9%)
Storage: 120 MB / 1 GB (11.7%)
Status: ✓ Healthy - No warnings
```

### Scenario 2: Warning Level
```
Database: 420 MB / 500 MB (84%)
Storage: 750 MB / 1 GB (73.2%)
Status: ⚠️ Warning - Yellow banner appears
Action: Consider exporting and cleaning up
```

### Scenario 3: Critical Level
```
Database: 465 MB / 500 MB (93%)
Storage: 980 MB / 1 GB (95.7%)
Status: 🚨 Critical - Red pulsing banner
Action: Export immediately and delete old data
```

---

## 💾 Export File Structure

```json
{
  "exportDate": "2025-12-11T10:30:00.000Z",
  "projectId": "abc-123-def",
  "project": { /* project data */ },
  "assets": [ /* all assets */ ],
  "assetTypes": [ /* all asset types */ ],
  "attributes": [ /* all attributes */ ],
  "responses": [ /* all responses */ ],
  "files": [ /* all file records */ ],
  "projectUsers": [ /* all users */ ],
  "metadata": {
    "totalAssets": 150,
    "totalResponses": 320,
    "totalFiles": 25,
    "totalAssetTypes": 12,
    "totalUsers": 5
  }
}
```

---

## 🔍 Monitoring Best Practices

### Weekly Checks
- Review metrics every week
- Track growth trends
- Plan ahead for capacity

### Regular Exports
- Export monthly as backup
- Store exports securely
- Test restore process

### Cleanup Strategy
- Delete old questionnaire responses
- Remove duplicate/unused files
- Archive old photos
- Optimize asset structure

### Capacity Planning
- Monitor growth rate
- Predict when limits will be hit
- Plan migration before 90%
- Consider upgrading if needed

---

## 🐛 Troubleshooting

### Metrics Not Displaying

**Problem:** Home screen shows "Unable to load project metrics"

**Solutions:**
1. Check backend is running (`npm start` in backend/)
2. Verify Supabase connection
3. Check browser console for errors
4. Confirm project is selected
5. Try clicking "🔄 Refresh"

### Export Not Working

**Problem:** Export button doesn't download file

**Solutions:**
1. Check network tab for errors
2. Verify authentication token is valid
3. Check backend logs for errors
4. Ensure pop-up blocker isn't blocking download
5. Try different browser

### Warning Banner Not Showing

**Problem:** No warning despite high usage

**Solutions:**
1. Verify actual usage is > 80%
2. Check `overallWarning` flag in API response
3. Clear browser cache
4. Refresh metrics
5. Check if banner was dismissed

### Inaccurate Metrics

**Problem:** Metrics seem wrong

**Solutions:**
1. Metrics are estimates, not exact
2. Click refresh to update
3. Check Supabase dashboard for actual usage
4. Verify all buckets are included in calculation
5. Review calculation logic in `metricsController.js`

---

## 📚 Related Documentation

- **[SUPABASE_SETUP_INSTRUCTIONS.md](SUPABASE_SETUP_INSTRUCTIONS.md)** - Initial setup guide
- **[METRICS_IMPLEMENTATION_SUMMARY.md](METRICS_IMPLEMENTATION_SUMMARY.md)** - Technical implementation details

---

## 🎉 Success Checklist

- [ ] Backend server running
- [ ] Frontend server running
- [ ] Logged in and project selected
- [ ] "🏠 Home" button visible in navbar
- [ ] Home dashboard loads successfully
- [ ] Metrics display correctly
- [ ] Progress bars show usage
- [ ] Statistics cards show counts
- [ ] Export button downloads JSON
- [ ] Warning banner shows (if > 80%)
- [ ] Refresh button works
- [ ] Responsive on mobile

---

## 💡 Tips & Tricks

### Performance
- Metrics are cached briefly - refresh if stale
- Export is async - large projects may take time
- Progress bars animate smoothly

### UX
- Warning banner is dismissible per session
- Color coding helps identify issues quickly
- Statistics provide context for usage

### Data Management
- Export before major changes
- Keep multiple backup versions
- Test restore process periodically

---

## 🚀 Future Enhancements

Potential improvements:
- Auto-refresh metrics every 5 minutes
- Historical usage graphs
- Email alerts at thresholds
- Bulk data cleanup tools
- Storage optimization suggestions
- Cost calculator for upgrades

---

## 📞 Support

If you encounter issues:
1. Check this README
2. Review error messages in console
3. Check backend logs
4. Verify Supabase connection
5. Restart both servers

---

**Happy monitoring! 🎊**

