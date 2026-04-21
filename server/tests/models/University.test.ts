import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import University from '../../src/models/University';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

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

describe('University Model', () => {
    it('should have a working 2dsphere index for location searches', async () => {
        // Critical: Wait for indexes to build
        await University.init();
        
        const indexes = await University.listIndexes();
        const hasSpatialIndex = indexes.some(idx => idx.key.coordinates === '2dsphere');
        
        expect(hasSpatialIndex).toBe(true);
    });

    it('should require a domain for student verification', async () => {
        const uni = new University({
            name: 'UCF',
            city: 'Orlando',
            state: 'FL',
            // domain is missing
        });

        await expect(uni.save()).rejects.toThrow();
    });
});