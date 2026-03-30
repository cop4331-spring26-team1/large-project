import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello World');
});

app.use('/api/auth', authRoutes);

mongoose
  .connect(process.env.MONGO_URI || '')
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`Server http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error('DB Connection Error:', err));