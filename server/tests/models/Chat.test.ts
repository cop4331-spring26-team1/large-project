import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Thread from '../../src/models/Thread';
import Message from '../../src/models/Message';
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';

let mongoServer: MongoMemoryServer;

// Increase global timeout for this file to handle slow binary downloads
jest.setTimeout(30000);

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    // Clean collections between tests to ensure isolation
    await Thread.deleteMany({});
    await Message.deleteMany({});
});

describe('Chat Models', () => {
    it('should create a thread with a listing snapshot', async () => {
        const thread = new Thread({
            listing: new mongoose.Types.ObjectId(),
            participants: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
            listingSnapshot: {
                title: 'Test Listing',
                mainImage: 'http://test.com/img.jpg', // Added to match your Schema
                price: 500,
                status: 'active'
            }
        });

        const savedThread = await thread.save();
        expect(savedThread._id).toBeDefined();
        expect(savedThread.listingSnapshot.title).toBe('Test Listing');
        expect(savedThread.lastMessage).toBe(''); // Default value check
    });

    it('should link a message to a thread', async () => {
        const threadId = new mongoose.Types.ObjectId();
        const message = new Message({
            thread: threadId,
            sender: new mongoose.Types.ObjectId(),
            body: 'Is this available?'
        });

        const savedMessage = await message.save();
        expect(savedMessage.thread).toEqual(threadId);
        expect(savedMessage.body).toBe('Is this available?');
        expect(savedMessage.readBy).toHaveLength(0); // Default array check
    });
});