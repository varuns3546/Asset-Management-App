import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from 'body-parser'

import userRoutes from './routes/userRoutes.js'
import hierarchyRoutes from './routes/hierarchyRoutes.js'
import projectRoutes from './routes/projectRoutes.js'

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded forms

app.use('/api/users', userRoutes);
app.use('/api/hierarchies', hierarchyRoutes);
app.use('/api/projects', projectRoutes);
app.get("/", (req, res) => {
  res.send("API is running");
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});