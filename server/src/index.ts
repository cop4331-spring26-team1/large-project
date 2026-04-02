import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './lib/db';
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

// Previous Database Connection process. Not in use.
// mongoose
//   .connect(process.env.MONGO_URI || '')
//   .then(() => {
//     console.log('Connected to MongoDB Atlas');
//     app.listen(PORT, () => {
//       console.log(`Server http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) => console.error('DB Connection Error:', err));

const start = async (): Promise<void> => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost: ${PORT}`);
    })
};

start();