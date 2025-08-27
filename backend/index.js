import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from 'body-parser'
import userRoutes from "./routes/userRoutes.js";
import entryRoutes from './routes/entryRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import mapRoutes from './routes/mapRoutes.js'
import geopackageRoutes from './routes/geopackageRoutes.js'

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded forms

app.use("/api/users", userRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/uploads', uploadRoutes)
app.use('/api/maps', mapRoutes)
app.use('/api/geopackage', geopackageRoutes)

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