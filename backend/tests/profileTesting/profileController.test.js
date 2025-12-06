import { createMockRequest, createMockResponse, createMockNext } from '../helpers/testHelpers.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// use unstable_mockModule with absolute path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const profileServicePath = resolve(__dirname, '../../src/services/profileService.js');

// create mock functions that will be used as test doubles
// these mocks isolate the controller from the service layer
const mockProfileService = {
  getProfileService: jest.fn(),
  getProfileByIdService: jest.fn(),
  updateProfileService: jest.fn()
};

await jest.unstable_mockModule(profileServicePath, () => mockProfileService);

const { getProfile, getProfileById, updateProfile } = await import('../../src/controllers/profileController.js');
const profileService = await import(profileServicePath);

describe('Profile Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    test('should get own profile', async () => {
      req.user = { id: 'user-1111' };
      const mockProfile = { id: 'user-1111', username: 'anish_kumar', first_name: 'Anish', last_name: 'Kumar' };
      profileService.getProfileService.mockResolvedValue(mockProfile);

      await getProfile(req, res, next);

      expect(profileService.getProfileService).toHaveBeenCalledWith('user-1111');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ profile: mockProfile });
    });
  });

  describe('getProfileById', () => {
    test('should get profile by ID', async () => {
      req.params = { userId: 'user-1111' };
      const mockProfile = { id: 'user-1111', username: 'anish_kumar', first_name: 'Anish' };
      profileService.getProfileByIdService.mockResolvedValue(mockProfile);

      await getProfileById(req, res, next);

      expect(profileService.getProfileByIdService).toHaveBeenCalledWith('user-1111');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 400 when userId missing', async () => {
      req.params = {};

      await getProfileById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(profileService.getProfileByIdService).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    test('should update profile with valid data', async () => {
      req.user = { id: 'user-1111' };
      req.body = { first_name: 'Anish', last_name: 'Kumar', username: 'anish_kumar' };
      const mockUpdated = { id: 'user-1111', ...req.body };
      profileService.updateProfileService.mockResolvedValue(mockUpdated);

      await updateProfile(req, res, next);

      expect(profileService.updateProfileService).toHaveBeenCalledWith('user-1111', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 400 for invalid username length', async () => {
      req.user = { id: 'user-1111' };
      req.body = { username: 'ab' };

      await updateProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(profileService.updateProfileService).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid username characters', async () => {
      req.user = { id: 'user-1111' };
      req.body = { username: 'anish-kumar!' };

      await updateProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 400 when no fields provided', async () => {
      req.user = { id: 'user-1111' };
      req.body = {};

      await updateProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should handle service errors', async () => {
      req.user = { id: 'user-1111' };
      req.body = { username: 'anish_kumar' };
      const error = new Error('Username already taken');
      profileService.updateProfileService.mockRejectedValue(error);

      await updateProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

