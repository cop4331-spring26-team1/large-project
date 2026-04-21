import { sendMessage, createThread } from '../../src/controllers/threadController';
import Thread from '../../src/models/Thread';
import Message from '../../src/models/Message';
import { io, userSockets } from '../../src/lib/socket';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../../src/models/Thread');
jest.mock('../../src/models/Message');
jest.mock('../../src/lib/socket', () => ({
  io: { to: jest.fn().mockReturnThis(), emit: jest.fn() },
  userSockets: new Map()
}));

describe('Thread Controller', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = { params: { id: 'thread123' }, body: { body: 'Hello' }, userId: 'sender123' };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message and emit via socket', async () => {
      const mockThread = {
        participants: ['sender123', 'receiver456'],
        blockedBy: [],
        deletedBy: [],
        save: jest.fn()
      };
      const mockMessage = { 
        populate: jest.fn().mockResolvedValue({ body: 'Hello', sender: 'sender123' } as never) 
      };

      (Thread.findById as jest.Mock).mockResolvedValue(mockThread  as never);
      (Message.create as jest.Mock).mockResolvedValue(mockMessage  as never);
      userSockets.set('receiver456', 'socket_id_abc');

      await sendMessage(req, res);

      expect(io.to).toHaveBeenCalledWith('socket_id_abc');
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});