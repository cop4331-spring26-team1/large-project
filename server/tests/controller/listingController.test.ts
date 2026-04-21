import { createListing, getById, toggleFavorite } from '../../src/controllers/listingController';
import Listing from '../../src/models/Listing';
import User from '../../src/models/User';
import { uploadImage } from '../../src/lib/cloudinary';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../../src/models/Listing');
jest.mock('../../src/models/User');
jest.mock('../../src/lib/cloudinary');

describe('Listing Controller', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = { params: {}, body: {}, userId: 'user123', files: [] };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    jest.clearAllMocks();
  });

  describe('createListing', () => {
    it('should create a listing with images', async () => {
      req.body = { title: 'House', price: '1000' };
      req.files = [{ buffer: Buffer.from('test') }];
      (uploadImage as jest.Mock).mockResolvedValue('http://image.url'  as never);
      (Listing.create as jest.Mock).mockResolvedValue({ _id: 'newListing' }  as never);

      await createListing(req, res);

      expect(uploadImage).toHaveBeenCalled();
      expect(Listing.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('toggleFavorite', () => {
    it('should add to favorites if not already favorited', async () => {
      req.params.id = 'listing123';
      const mockUser = { favorites: [], save: jest.fn() };
      const mockListing = { _id: 'listing123', favoriteCount: 0, save: jest.fn() };

      (Listing.findById as jest.Mock).mockResolvedValue(mockListing  as never);
      // Mock the dynamic import of User inside toggleFavorite
      jest.spyOn(User, 'findById').mockResolvedValue(mockUser as any);

      await toggleFavorite(req, res);

      expect(mockUser.favorites).toContain('listing123');
      expect(mockListing.favoriteCount).toBe(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});