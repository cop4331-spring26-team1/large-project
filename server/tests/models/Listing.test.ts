import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Listing from '../../src/models/Listing';
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
    await Listing.deleteMany({});
});

describe('Listing Model', () => {
    it('should fail if price is negative', async () => {
        const listing = new Listing({
            owner: new mongoose.Types.ObjectId(),
            title: 'Cheap Room',
            description: 'A room',
            price: -100, // Validation check
            bedrooms: 1,
            address: '4000 Central Florida Blvd',
            city: 'Orlando',
            state: 'FL',
            university: 'UCF',
            expiresAt: new Date(Date.now() + 100000)
        });

        await expect(listing.save()).rejects.toThrow();
    });

    it('should successfully save valid GeoJSON coordinates', async () => {
        const listing = new Listing({
            owner: new mongoose.Types.ObjectId(),
            title: 'The Marquee',
            description: 'Student housing',
            price: 900,
            bedrooms: 4,
            address: '12101 High Tech Ave',
            city: 'Orlando',
            state: 'FL',
            university: 'UCF',
            expiresAt: new Date(Date.now() + 100000),
            coordinates: {
                type: 'Point',
                coordinates: [-81.2001, 28.5911] // [longitude, latitude]
            }
        });

        const savedListing = await listing.save();
        expect(savedListing.coordinates.coordinates).toEqual([-81.2001, 28.5911]);
    });
});