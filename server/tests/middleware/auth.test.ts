import { protect, adminOnly, AuthRequest } from '../../src/middleware/auth';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('Auth Middleware', () => {
    let req: Partial<AuthRequest>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = { headers: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        } as any;
        next = jest.fn();
        process.env.JWT_SECRET = 'test_secret';
    });

    describe('protect middleware', () => {
        it('should return 401 if no authorization header is present', () => {
            protect(req as AuthRequest, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
        });

        it('should return 401 if token is invalid or expired', () => {
            req.headers!.authorization = 'Bearer invalid_token';
            protect(req as AuthRequest, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
        });

        it('should call next and attach userId/role if token is valid', () => {
            const payload = { userId: 'user123', role: 'user' };
            const token = jwt.sign(payload, process.env.JWT_SECRET!);
            req.headers!.authorization = `Bearer ${token}`;

            protect(req as AuthRequest, res as Response, next);

            expect(req.userId).toBe('user123');
            expect(req.userRole).toBe('user');
            expect(next).toHaveBeenCalled();
        });
    });

    describe('adminOnly middleware', () => {
        it('should return 403 if userRole is not admin', () => {
            req.userRole = 'user';
            adminOnly(req as AuthRequest, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: admins only' });
        });

        it('should call next if userRole is admin', () => {
            req.userRole = 'admin';
            adminOnly(req as AuthRequest, res as Response, next);
            expect(next).toHaveBeenCalled();
        });
    });
});