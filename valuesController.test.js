import { jest } from '@jest/globals';
import { getValues, createValues, updateValues, deleteValues } from './controllerrs/valuesController.js';

const mockDb = {
  query: jest.fn()
};

const mockCloudinary = {
  uploader: {
    upload: jest.fn()
  }
};

jest.unstable_mockModule('./config/db.js', () => ({ default: mockDb }));
jest.unstable_mockModule('./cloudinary/cloud.js', () => ({ default: mockCloudinary }));

describe('Values Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, files: [] };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getValues', () => {
    test('should return all values', () => {
      const mockResult = [{ id: 1, description: 'Test', image: 'test.jpg' }];
      mockDb.query.mockImplementation((sql, callback) => callback(null, mockResult));

      getValues(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    test('should handle error', () => {
      mockDb.query.mockImplementation((sql, callback) => callback(new Error('DB Error')));

      getValues(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createValues', () => {
    test('should create values with files', async () => {
      req.body = { description: 'Test desc' };
      req.files = [{ path: '/path', originalname: 'test.jpg' }];
      
      mockCloudinary.uploader.upload.mockResolvedValue({ secure_url: 'https://test.com/image.jpg' });
      mockDb.query.mockImplementation((sql, values, callback) => callback(null, { affectedRows: 1 }));

      await createValues(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should return 400 if no files', async () => {
      req.body = { description: 'Test' };
      req.files = [];

      await createValues(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No files uploaded' });
    });

    test('should return 400 if no description', async () => {
      req.files = [{ path: '/path' }];

      await createValues(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Description is required' });
    });
  });

  describe('updateValues', () => {
    test('should update values', () => {
      req.params = { id: '1' };
      req.body = { image: 'new.jpg', description: 'Updated' };
      mockDb.query.mockImplementation((sql, values, callback) => callback(null, { affectedRows: 1 }));

      updateValues(req, res);

      expect(res.json).toHaveBeenCalledWith({ id: '1', image: 'new.jpg', description: 'Updated' });
    });

    test('should return 404 if not found', () => {
      req.params = { id: '999' };
      mockDb.query.mockImplementation((sql, values, callback) => callback(null, { affectedRows: 0 }));

      updateValues(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteValues', () => {
    test('should delete values', () => {
      req.params = { id: '1' };
      mockDb.query.mockImplementation((sql, values, callback) => callback(null, { affectedRows: 1 }));

      deleteValues(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'data successfully deleted' });
    });

    test('should return 404 if not found', () => {
      req.params = { id: '999' };
      mockDb.query.mockImplementation((sql, values, callback) => callback(null, { affectedRows: 0 }));

      deleteValues(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});