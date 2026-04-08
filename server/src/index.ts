import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './lib/db';
import authRoutes from './routes/authRoutes';
import listingRoutes from './routes/listingRoutes';
import universityRoutes from './routes/universityRoutes';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
    res.send('Server is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

// app.use('/api/threads',      threadRoutes);
app.use('/api/universities', universityRoutes);
// app.use('/api/admin',        adminRoutes);

const start = async (): Promise<void> => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
};

start();