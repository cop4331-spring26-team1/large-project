import { searchUniversities } from '../../src/controllers/universityController';
import University from '../../src/models/University';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../../src/models/University');

describe('University Controller', () => {
  it('should search universities by name', async () => {
    const req = { query: { search: 'UCF' } } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    
    (University.find as jest.Mock).mockReturnValue({
      limit: jest.fn().mockResolvedValue([{ name: 'University of Central Florida' }] as never)
    });

    await searchUniversities(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: { universities: [{ name: 'University of Central Florida' }] }
    }));
  });
});