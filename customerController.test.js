import { jest } from '@jest/globals';
import { getcustomer, createcustomer, updatecustomer, deletecustomer } from './controllerrs/customerController.js';

// Mock dependencies
const mockDb = {
  query: jest.fn()
};

const mockCloudinary = {
  uploader: {
    upload: jest.fn()
  }
};

jest.unstable_mockModule('./config/db.js', () => ({
  default: mockDb
}));

jest.unstable_mockModule('./cloudinary/cloud.js', () => ({
  default: mockCloudinary
}));

describe('Customer Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, files: [] };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getcustomer', () => {
    it('should return all partners', () => {
      const mockData = [{ id: 1, title_name: 'Test', description: 'Desc' }];
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(null, { rows: mockData })
      );

      getcustomer(req, res);

      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle database error', () => {
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(new Error('DB Error'), null)
      );

      getcustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
    });
  });

  describe('createcustomer', () => {
    it('should create partners with files', async () => {
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

      await createcustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Partners created successfully', 
        count: 2 
      });
    });
  });

  describe('updatecustomer', () => {
    it('should update partner', () => {
      req.params = { id: '1' };
      req.body = { description: 'Updated desc' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 1 })
      );

      updatecustomer(req, res);

      expect(res.json).toHaveBeenCalledWith({ 
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

      updatecustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Record not found' });
    });
  });

  describe('deletecustomer', () => {
    it('should delete partner', () => {
      req.params = { id: '1' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 1 })
      );

      deletecustomer(req, res);

      expect(res.json).toHaveBeenCalledWith({ 
        message: 'data successfully deleted' 
      });
    });

    it('should return 404 if not found', () => {
      req.params = { id: '999' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 0 })
      );

      deletecustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Record not found' });
    });
  });
});