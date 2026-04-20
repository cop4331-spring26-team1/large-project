import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../src/models/User';
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';

let mongoServer: MongoMemoryServer;

jest.setTimeout(30000);

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
});

describe('User Model', () => {
    it('should correctly handle student verification defaults', async () => {
        const user = new User({
            name: 'Knightro',
            email: 'knightro@ucf.edu',
            hashedPassword: 'password123'
        });

        const savedUser = await user.save();
        expect(savedUser.isVerifiedStudent).toBe(false);
        expect(savedUser.role).toBe('user');
    });

    it('should lowercase emails automatically', async () => {
        const user = new User({
            name: 'Test',
            email: 'CAPS@UCF.EDU',
            hashedPassword: 'password123'
        });

        const savedUser = await user.save();
        expect(savedUser.email).toBe('caps@ucf.edu');
    });
});