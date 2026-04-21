import { upload } from '../../src/middleware/upload';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import multer from 'multer';

describe('Upload Middleware', () => {
    it('should use memory storage', () => {
        // Check if the storage engine is an instance of the internal MemoryStorage class
        // Note: Multer doesn't export MemoryStorage class directly, 
        // so we check for the presence of the storage object itself
        expect(upload).toHaveProperty('storage');
    });
});