import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import leaveRoutes from './routes/leaveRoutes.js';
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/leaves', leaveRoutes);
const PORT = process.env.PORT || 5000;
connectDB().then(() => app.listen(PORT, () => console.log(`API running on port ${PORT}`))).catch((error) => {
  console.error('MongoDB connection failed:', error.message);
  process.exit(1);
});
