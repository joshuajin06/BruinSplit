import { postMessage, getMessages, getConversations } from '../../src/controllers/messagesController.js';
import * as messageService from '../../src/services/messageService.js';
import { createMockRequest, createMockResponse, createMockNext } from '../helpers/testHelpers.js';

// mock the service layer to isolate controller logic
jest.mock('../../src/services/messageService.js');

describe('Messages Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
    jest.clearAllMocks();
  });

  describe('postMessage', () => {
    test('should create message with valid data', async () => {
      req.body = { ride_id: 'ride-3535', content: 'hey anish meet at ucla' };
      req.user = { id: 'user-1111' };
      const mockMessage = { id: 'msg-3535', ride_id: 'ride-3535', user_id: 'user-1111', content: 'hey anish meet at ucla' };
      messageService.createMessage.mockResolvedValue(mockMessage);

      await postMessage(req, res, next);

      expect(messageService.createMessage).toHaveBeenCalledWith('ride-3535', 'user-1111', 'hey anish meet at ucla');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should return 400 when ride_id missing', async () => {
      req.body = { content: 'test message' };
      req.user = { id: 'user-1111' };

      await postMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(messageService.createMessage).not.toHaveBeenCalled();
    });

    test('should return 400 when content missing', async () => {
      req.body = { ride_id: 'ride-3535' };
      req.user = { id: 'user-1111' };

      await postMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should handle service errors', async () => {
      req.body = { ride_id: 'ride-3535', content: 'test' };
      req.user = { id: 'user-1111' };
      const error = new Error('Not a member');
      messageService.createMessage.mockRejectedValue(error);

      await postMessage(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getMessages', () => {
    test('should get messages for ride', async () => {
      req.query = { ride_id: 'ride-3535' };
      req.user = { id: 'user-1111' };
      const mockMessages = [{ id: 'msg-3535', content: 'test' }];
      messageService.getMessagesForRide.mockResolvedValue(mockMessages);

      await getMessages(req, res, next);

      expect(messageService.getMessagesForRide).toHaveBeenCalledWith('ride-3535', 'user-1111');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 400 when ride_id missing', async () => {
      req.query = {};
      req.user = { id: 'user-1111' };

      await getMessages(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getConversations', () => {
    test('should get conversations for user', async () => {
      req.user = { id: 'user-1111' };
      const mockConversations = [{ id: 'ride-3535', origin: 'UCLA', destination: 'LAX' }];
      messageService.getConversationsForUser.mockResolvedValue(mockConversations);

      await getConversations(req, res, next);

      expect(messageService.getConversationsForUser).toHaveBeenCalledWith('user-1111');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

