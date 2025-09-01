import { jest } from '@jest/globals';
import { getPartner, createPartner, updatePartner, deletePartner } from './controllerrs/partnerController.js';

// Mock dependencies
const mockDb = {
  query: jest.fn()
};

jest.unstable_mockModule('./config/db.js', () => ({
  default: mockDb
}));

describe('Partner Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, files: [] };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getPartner', () => {
    it('should return all partners', () => {
      const mockData = [{ id: 1, title: 'Test Partner', description: 'Desc' }];
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(null, { rows: mockData })
      );

      getPartner(req, res);

      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle database error', () => {
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(new Error('DB Error'), null)
      );

      getPartner(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
    });
  });

  describe('createPartner', () => {
    it('should create partners with files', () => {
      req.body = { description: 'Test desc' };
      req.files = [
        { filename: 'file1.jpg', originalname: 'partner1.jpg' },
        { filename: 'file2.jpg', originalname: 'partner2.jpg' }
      ];

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 2 })
      );

      createPartner(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Partners created successfully', 
        count: 2 
      });
    });

    it('should handle database error', () => {
      req.body = { description: 'Test desc' };
      req.files = [{ filename: 'file1.jpg', originalname: 'partner1.jpg' }];

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(new Error('DB Error'), null)
      );

      createPartner(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
    });
  });

  describe('updatePartner', () => {
    it('should update partner', () => {
      req.params = { id: '1' };
      req.body = { description: 'Updated desc' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 1 })
      );

      updatePartner(req, res);

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

      updatePartner(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Record not found' });
    });
  });

  describe('deletePartner', () => {
    it('should delete partner', () => {
      req.params = { id: '1' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 1 })
      );

      deletePartner(req, res);

      expect(res.json).toHaveBeenCalledWith({ 
        message: 'data successfully deleted' 
      });
    });

    it('should return 404 if not found', () => {
      req.params = { id: '999' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 0 })
      );

      deletePartner(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Record not found' });
    });
  });
});