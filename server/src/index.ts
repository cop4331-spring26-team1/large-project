import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { User } from './schema'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello World');
});

app.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body; 
    const newUser = new User({ username, password, email });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration Error:', error); 
    res.status(500).json({ message: 'Server error' });
   }
});

// MongoDB
mongoose.connect(process.env.MONGO_URI || '')
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`Server http://localhost:${PORT}`));
  })
  .catch((err) => console.error('DB Connection Error:', err));