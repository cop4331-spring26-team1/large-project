import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
    userId?:          string;
    userRole?:        string;
    isEmailVerified?: boolean;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const token = header.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId:          string;
            role:            string;
            isEmailVerified: boolean;
        };
        req.userId          = payload.userId;
        req.userRole        = payload.role;
        req.isEmailVerified = payload.isEmailVerified;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.userRole !== 'admin') {
        res.status(403).json({ error: 'Forbidden: admins only' });
        return;
    }
    next();
};