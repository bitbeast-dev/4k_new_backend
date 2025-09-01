import { jest } from '@jest/globals';
import { getHome, createHome, updateHome, deleteHome, truncateHome } from './controllerrs/homeController.js';

// Mock dependencies
const mockDb = {
  query: jest.fn()
};

const mockCloudinary = {
  uploader: {
    upload: jest.fn()
  }
};

const mockFs = {
  unlinkSync: jest.fn()
};

jest.unstable_mockModule('./config/db.js', () => ({
  default: mockDb
}));

jest.unstable_mockModule('./cloudinary/cloud.js', () => ({
  default: mockCloudinary
}));

jest.unstable_mockModule('fs', () => mockFs);

describe('Home Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, files: [] };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getHome', () => {
    it('should return all home items', () => {
      const mockData = [{ id: 1, title: 'Test', description: 'Desc' }];
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(null, { rows: mockData })
      );

      getHome(req, res);

      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle database error', () => {
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(new Error('DB Error'), null)
      );

      getHome(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
    });
  });

  describe('createHome', () => {
    it('should create home items with files', async () => {
      req.body = { description: 'Test desc' };
      req.files = [
        { path: '/path/1', originalname: 'test1.jpg' },
        { path: '/path/2', originalname: 'test2.jpg' }
      ];

      mockCloudinary.uploader.upload
        .mockResolvedValueOnce({ secure_url: 'url1' })
        .mockResolvedValueOnce({ secure_url: 'url2' });

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 2 })
      );

      await createHome(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Images uploaded successfully', 
        insertedRows: 2 
      });
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(2);
    });

    it('should return error if no files', async () => {
      req.files = [];

      await createHome(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'At least one image is required' });
    });
  });

  describe('updateHome', () => {
    it('should update home item', () => {
      req.params = { id: '1' };
      req.body = { description: 'Updated desc' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 1 })
      );

      updateHome(req, res);

      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Home record updated successfully',
        id: '1', 
        description: 'Updated desc' 
      });
    });

    it('should return 404 if not found', () => {
      req.params = { id: '999' };
      req.body = { description: 'Updated desc' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 0 })
      );

      updateHome(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Record not found' });
    });
  });

  describe('deleteHome', () => {
    it('should delete home item', () => {
      req.params = { id: '1' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 1 })
      );

      deleteHome(req, res);

      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Data successfully deleted' 
      });
    });

    it('should return 404 if not found', () => {
      req.params = { id: '999' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 0 })
      );

      deleteHome(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Record not found' });
    });
  });

  describe('truncateHome', () => {
    it('should truncate home table', () => {
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(null, {})
      );

      truncateHome(req, res);

      expect(res.json).toHaveBeenCalledWith({ 
        message: 'All products successfully deleted' 
      });
    });

    it('should handle database error', () => {
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(new Error('DB Error'), null)
      );

      truncateHome(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
    });
  });
});