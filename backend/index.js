import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from 'body-parser'

import userRoutes from './routes/userRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import pullRequestRoutes from './routes/pullRequestRoutes.js'
import leafletShapesRoutes from './routes/leafletShapesRoutes.js'
import gisRoutes from './routes/gisRoutes.js'
import fileRoutes from './routes/fileRoutes.js'
import questionnaireRoutes from './routes/questionnaireRoutes.js'
import visualizationRoutes from './routes/visualizationRoutes.js'
import reportRoutes from './routes/reportRoutes.js'

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded forms

app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/pull-requests', pullRequestRoutes);
app.use('/api/leaflet-shapes', leafletShapesRoutes);
app.use('/api/gis', gisRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/questionnaire', questionnaireRoutes);
app.use('/api/visualization', visualizationRoutes);
app.use('/api/reports', reportRoutes);
app.get("/", (req, res) => {
  res.send("API is running");
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

  