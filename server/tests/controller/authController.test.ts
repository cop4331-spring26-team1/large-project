import { 
  registerUser, 
  loginUser, 
  getMe, 
  verifyEmail, 
  forgotPassword, 
  resetPassword 
} from '../../src/controllers/authController';
import User from '../../src/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../src/lib/mailer';
import { Request, Response } from 'express';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AuthRequest } from '../../src/middleware/auth';

// 1. Mock the dependencies
jest.mock('../../src/models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/lib/mailer');

describe('Auth Controller - Unit Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    // Chaining support: res.status(200).json(...)
    statusMock = jest.fn().mockReturnThis();
    
    req = { 
      body: {}, 
      params: {},
      userId: '123' // Default for AuthRequest tests
    } as never;

    res = {
      status: statusMock as never,
      json: jsonMock as never,
    };
    
    process.env.JWT_SECRET = 'test_secret';
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should return 400 if fields are missing', async () => {
      req.body = { email: 'test@ucf.edu' };
      await registerUser(req as Request, res as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 409 if user already exists', async () => {
      req.body = { name: 'Knightro', email: 'knightro@ucf.edu', password: 'password123' };
      // Use jest.mocked for type safety
      jest.mocked(User.findOne).mockResolvedValue({ email: 'knightro@ucf.edu' } as never);
      
      await registerUser(req as Request, res as Response);
      expect(statusMock).toHaveBeenCalledWith(409);
    });

    it('should create user and send email on success', async () => {
      req.body = { name: 'Knightro', email: 'knightro@ucf.edu', password: 'password123' };
      
      jest.mocked(User.findOne).mockResolvedValue(null);
      jest.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      jest.mocked(User.create).mockResolvedValue({
        email: 'knightro@ucf.edu',
        name: 'Knightro',
      } as never);

      await registerUser(req as Request, res as Response);
      expect(sendVerificationEmail).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe('loginUser', () => {
    it('should login successfully with valid credentials', async () => {
      req.body = { email: 'test@test.com', password: 'password' };
      const mockUser = { 
        _id: '123', 
        email: 'test@test.com', 
        hashedPassword: 'hash', 
        role: 'user',
        isBlocked: false 
      };
      
      jest.mocked(User.findOne).mockResolvedValue(mockUser as never);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
      jest.mocked(jwt.sign).mockReturnValue('mock_token' as never);

      await loginUser(req as Request, res as Response);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: 'Login successful' }));
    });
  });

  describe('getMe', () => {
    it('should return user data for a valid ID', async () => {
      const mockUser = { name: 'Knightro', email: 'knightro@ucf.edu' };
      
      jest.mocked(User.findById).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser as never)
      } as never);

      await getMe(req as AuthRequest, res as Response);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: mockUser });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      req.params = { token: 'valid_token' };
      const mockUser = { 
        _id: '123', 
        save: jest.fn().mockResolvedValue(true as never),
        isEmailVerified: false 
      };

      jest.mocked(User.findOne).mockResolvedValue(mockUser as never);
      jest.mocked(jwt.sign).mockReturnValue('new_token' as never);

      await verifyEmail(req as Request, res as Response);
      expect(mockUser.isEmailVerified).toBe(true);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email if user exists', async () => {
      req.body = { email: 'test@test.com' };
      const mockUser = { 
        email: 'test@test.com', 
        name: 'User', 
        save: jest.fn().mockResolvedValue(true as never) 
      };
      
      jest.mocked(User.findOne).mockResolvedValue(mockUser as never);

      await forgotPassword(req as Request, res as Response);
      expect(sendPasswordResetEmail).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('resetPassword', () => {
    it('should update password and clear tokens', async () => {
      req.params = { token: 'reset_token' };
      req.body = { password: 'newPassword123' };
      const mockUser = { save: jest.fn().mockResolvedValue(true as never) };

      jest.mocked(User.findOne).mockResolvedValue(mockUser as never);
      jest.mocked(bcrypt.hash).mockResolvedValue('new_hash' as never);

      await resetPassword(req as Request, res as Response);
      expect(mockUser.save).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });
});