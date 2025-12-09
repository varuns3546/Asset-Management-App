# Asset Management App

A full-stack web application for managing assets with GIS capabilities, hierarchical structures, and project-based organization. Built with React, Node.js, and Supabase with PostGIS for spatial data management.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-18.x-green.svg)
![React](https://img.shields.io/badge/react-19.1.1-blue.svg)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [GIS Features](#gis-features)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Functionality
- **User Authentication** - Secure registration and login system with JWT
- **Project Management** - Create, open, and manage multiple projects
- **Asset Hierarchy** - Define and manage complex asset hierarchies
- **Asset Types** - Categorize assets with custom types and attributes
- **Questionnaires** - Data collection and assessment forms

### GIS & Mapping
- **Interactive Maps** - Leaflet-based mapping interface
- **Custom Layers** - Create and manage GIS layers (points, lines, polygons)
- **Feature Management** - Add, edit, and visualize geographic features
- **PostGIS Integration** - Spatial indexing and advanced geometric operations
- **Layer Styling** - Customize layer appearance and visibility
- **Spatial Queries** - Bounding box and proximity searches

### Data Management
- **File Upload** - Support for various file formats including Excel
- **Hierarchy Import** - Import asset hierarchies from spreadsheets
- **Data Validation** - Column matching and preview before import
- **Export Capabilities** - Export data in various formats

## 🛠 Tech Stack

### Frontend
- **React** 19.1.1 - UI framework
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Leaflet** - Interactive maps
- **Leaflet Draw** - Drawing tools for map features
- **Axios** - HTTP client
- **ArcGIS Core** - Advanced GIS capabilities

### Backend
- **Node.js** - Runtime environment
- **Express** 5.x - Web framework
- **Supabase** - Backend-as-a-Service (PostgreSQL + PostGIS)
- **Multer** - File upload handling
- **XLSX** - Excel file processing
- **JWT** - Authentication tokens

### Database
- **PostgreSQL** - Relational database
- **PostGIS** - Spatial and geographic objects extension
- **Row Level Security (RLS)** - Data security policies

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **Supabase account** - [Sign up here](https://supabase.com)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/asset-management-app.git
cd asset-management-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
PORT=5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=http://localhost:5000
```

### 4. Database Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select an existing one
3. Navigate to **SQL Editor**
4. Run the migration files (if available) or set up your tables according to the schema

For PostGIS features, ensure PostGIS extension is enabled:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Refer to `SETUP_INSTRUCTIONS.md` for detailed GIS layer setup.

## ⚙️ Configuration

### Supabase Configuration

1. **Authentication**: Enable Email/Password authentication in Supabase Dashboard
2. **Storage**: Set up storage buckets for file uploads
3. **Row Level Security**: Configure RLS policies for data protection
4. **PostGIS**: Enable PostGIS extension for spatial features

### Environment Variables

#### Backend (.env)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anonymous key
- `PORT` - Backend server port (default: 5000)

#### Frontend (.env)
- `REACT_APP_SUPABASE_URL` - Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:5000)

## 🎯 Usage

### Starting the Application

#### 1. Start Backend Server

```bash
cd backend
npm start
```

The backend will run on `http://localhost:5000`

#### 2. Start Frontend Development Server

```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000`

### Using the Application

1. **Register/Login** - Create an account or log in
2. **Create Project** - Start a new asset management project
3. **Define Hierarchy** - Set up your asset hierarchy structure
4. **Add Asset Types** - Create custom asset types with attributes
5. **Import Data** - Upload Excel files with asset data
6. **View on Map** - Visualize assets geographically
7. **Create Layers** - Add custom GIS layers
8. **Add Features** - Draw points, lines, or polygons on the map

## 📁 Project Structure

```
Asset-Management-App/
├── backend/
│   ├── config/
│   │   └── supabaseClient.js       # Supabase configuration
│   ├── controllers/
│   │   ├── assetController.js      # Asset management logic
│   │   ├── fileController.js       # File upload handling
│   │   ├── gisController.js        # GIS operations
│   │   ├── leafletShapesController.js
│   │   ├── projectController.js    # Project CRUD operations
│   │   └── userController.js       # User authentication
│   ├── routes/
│   │   ├── fileRoutes.js
│   │   ├── gisRoutes.js
│   │   ├── leafletShapesRoutes.js
│   │   ├── projectRoutes.js
│   │   └── userRoutes.js
│   ├── index.js                    # Express app entry point
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   └── store.js            # Redux store configuration
│   │   ├── components/
│   │   │   ├── map/                # Map-related components
│   │   │   │   ├── AddFeatureModal.js
│   │   │   │   ├── CreateLayerModal.js
│   │   │   │   ├── LayerPanel.js
│   │   │   │   ├── Map.js
│   │   │   │   └── MapNavbar.js
│   │   │   ├── structure/          # Hierarchy components
│   │   │   │   ├── AssetTypeForm.js
│   │   │   │   ├── AssetTypeTree.js
│   │   │   │   ├── HierarchyForm.js
│   │   │   │   └── HierarchyTree.js
│   │   │   ├── CreateProjectModal.js
│   │   │   ├── FileUploadModal.js
│   │   │   ├── Navbar.js
│   │   │   └── Modal.js
│   │   ├── features/
│   │   │   ├── auth/               # Authentication slice
│   │   │   └── projects/           # Projects slice
│   │   ├── screens/
│   │   │   ├── AssetTypeScreen.js
│   │   │   ├── HierarchyScreen.js
│   │   │   ├── HomeScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   ├── MapScreen.js
│   │   │   ├── QuestionnaireScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── services/
│   │   │   ├── fileService.js
│   │   │   ├── gisLayerService.js
│   │   │   └── leafletShapesService.js
│   │   ├── styles/                 # CSS files
│   │   ├── utils/
│   │   │   ├── axiosInterceptor.js
│   │   │   ├── columnMatcher.js
│   │   │   └── jwtUtils.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── GIS_LAYERS_IMPLEMENTATION_SUMMARY.md
├── HIERARCHY_IMPORT_GUIDE.md
├── SETUP_INSTRUCTIONS.md
└── README.md
```

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Endpoints

#### User Routes
- `POST /users/register` - Register new user
- `POST /users/login` - User login

#### Project Routes
- `GET /projects` - Get all user projects
- `POST /projects` - Create new project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

#### GIS Routes
- `GET /gis/:projectId/layers` - Get all layers
- `POST /gis/:projectId/layers` - Create layer
- `PUT /gis/:projectId/layers/:layerId` - Update layer
- `DELETE /gis/:projectId/layers/:layerId` - Delete layer
- `GET /gis/:projectId/layers/:layerId/features` - Get features
- `POST /gis/:projectId/layers/:layerId/features` - Add feature
- `DELETE /gis/:projectId/layers/:layerId/features/:featureId` - Delete feature

#### File Routes
- `POST /files/upload` - Upload file
- `GET /files/:id` - Download file

## 🗺️ GIS Features

### PostGIS Integration

The application leverages PostGIS for advanced spatial capabilities:

- **Spatial Indexing** - GIST indexes for fast queries on large datasets
- **Geometry Types** - Support for Point, LineString, and Polygon
- **Coordinate System** - WGS84 (SRID 4326)
- **Spatial Queries** - Bounding box and proximity searches

### Layer Management

1. **Create Layers** - Define custom GIS layers with specific geometry types
2. **Add Features** - Draw or import geographic features
3. **Style Customization** - Control colors, weights, and opacity
4. **Visibility Toggle** - Show/hide layers dynamically
5. **Feature Attributes** - Attach custom properties to features

### Supported Operations

- Distance calculations
- Bounding box queries
- Radius searches
- Geometry intersections
- Buffer zones

For detailed GIS implementation, see:
- `GIS_LAYERS_IMPLEMENTATION_SUMMARY.md`
- `SETUP_INSTRUCTIONS.md`

## 📊 Data Import

### Hierarchy Import

Import asset hierarchies from Excel files:

1. Navigate to **Hierarchy Screen**
2. Click **Import from File**
3. Select Excel file with hierarchy data
4. Match columns to hierarchy fields
5. Preview and confirm import

See `HIERARCHY_IMPORT_GUIDE.md` for detailed instructions.

### Supported File Formats

- Excel (.xlsx, .xls)
- CSV (planned)
- GeoJSON (for GIS data)
- KML (for GIS data)

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Integration Tests

```bash
npm run test:integration
```

## 🔧 Development

### Code Style

- ESLint configuration for JavaScript
- Prettier for code formatting
- Follow React best practices

### Git Workflow

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit pull request

### Debugging

- Backend: Use `console.log` or debugging tools
- Frontend: React DevTools and Redux DevTools
- Database: Supabase Dashboard SQL Editor

## 🚢 Deployment

### Backend Deployment

1. **Environment Variables**: Set production environment variables
2. **Database**: Ensure Supabase project is in production mode
3. **Server**: Deploy to services like Heroku, Railway, or AWS

### Frontend Deployment

```bash
cd frontend
npm run build
```

Deploy the `build` folder to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

### Database Migration

Ensure all SQL migrations are run in production Supabase instance.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Supabase team for the amazing BaaS platform
- Leaflet for mapping capabilities
- React and Redux communities
- PostGIS developers

## 📞 Support

For support, email your-email@example.com or open an issue on GitHub.

## 🗺️ Roadmap

- [ ] Mobile responsive design improvements
- [ ] Real-time collaboration features
- [ ] Advanced spatial analysis tools
- [ ] Offline support
- [ ] Multi-language support
- [ ] Export to various GIS formats (Shapefile, GeoJSON)
- [ ] Integration with external GIS services
- [ ] Advanced reporting and analytics
- [ ] Role-based access control (RBAC)
- [ ] Audit logging

## 📚 Additional Documentation

- [GIS Layers Implementation Summary](GIS_LAYERS_IMPLEMENTATION_SUMMARY.md)
- [Hierarchy Import Guide](HIERARCHY_IMPORT_GUIDE.md)
- [Setup Instructions](SETUP_INSTRUCTIONS.md)

---

Made with ❤️ for better asset management

