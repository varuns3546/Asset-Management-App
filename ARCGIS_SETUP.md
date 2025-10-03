# ArcGIS Location Platform Setup Guide

## Step 1: Install ArcGIS Maps SDK

Run this command in your frontend directory:

```bash
cd frontend
npm install @arcgis/core
```

## Step 2: Get ArcGIS API Key

1. Go to [ArcGIS for Developers](https://developers.arcgis.com/)
2. Sign up for a free account
3. Create a new API key
4. Copy your API key

## Step 3: Configure Environment Variables

Create a `.env` file in your frontend directory:

```bash
# frontend/.env
REACT_APP_ARCGIS_API_KEY=your_actual_api_key_here
```

Replace `your_actual_api_key_here` with your actual ArcGIS API key.

## Step 4: Start the Application

```bash
# Start the backend (if not already running)
cd backend
npm start

# Start the frontend
cd ../frontend
npm start
```

## Step 5: Access the Map

1. Navigate to your application
2. Select a project
3. Go to View → Map in the navigation menu
4. Create item types with "Has coordinates" enabled
5. Add hierarchy items with coordinates
6. View them on the interactive map!

## Features

- **Interactive Map**: View all assets with coordinates on an interactive map
- **Asset Markers**: Blue markers for assets, red for selected assets
- **Asset Labels**: Asset names displayed on the map
- **Click Interaction**: Click on markers to select assets
- **Form Integration**: Edit asset details in the sidebar while viewing the map
- **Responsive Design**: Works on desktop and mobile devices

## Map Controls

- **Zoom**: Use mouse wheel or zoom controls
- **Pan**: Click and drag to move around the map
- **Marker Click**: Click on any marker to select that asset
- **Auto-fit**: Map automatically fits to show all assets with coordinates

## Troubleshooting

- Make sure your ArcGIS API key is correctly set in the `.env` file
- Ensure assets have valid coordinates (latitude: -90 to 90, longitude: -180 to 180)
- Check the browser console for any error messages
- Verify that item types have "Has coordinates" enabled

## API Usage

The ArcGIS Location Platform provides:
- Free tier: 1 million basemap tiles per month
- Free tier: 20,000 geocoding requests per month
- Free tier: 5,000 routing requests per month

For production use, consider upgrading to a paid plan for higher limits.
