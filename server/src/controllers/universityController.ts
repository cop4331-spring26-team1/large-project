import { Request, Response } from 'express';
import University from '../models/University';

export const searchUniversities = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, state } = req.query;

        const filter: any = {};
        if (state)  filter.state = state;
        if (search) filter.name  = { $regex: search, $options: 'i' };

        const universities = await University.find(filter).limit(10);
        res.status(200).json({ data: { universities } });
    } catch (err) {
        console.error('searchUniversities error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};