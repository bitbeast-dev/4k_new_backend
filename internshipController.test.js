import { jest } from '@jest/globals';
import { getInternship, createInternship, updateInternship, deleteInternship } from './controllerrs/InternshipController.js';

// Mock dependencies
const mockDb = {
  query: jest.fn()
};

jest.unstable_mockModule('./config/db.js', () => ({
  default: mockDb
}));

describe('Internship Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getInternship', () => {
    it('should return all internships', () => {
      const mockData = [{ id: 1, title: 'Test Internship', description: 'Desc' }];
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(null, { rows: mockData })
      );

      getInternship(req, res);

      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle database error', () => {
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(new Error('DB Error'), null)
      );

      getInternship(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
    });
  });

  describe('createInternship', () => {
    it('should create internship', () => {
      req.body = { title: 'New Internship', description: 'Desc', requirement: 'Req', duration: '3 months' };
      
      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rows: [{ id: 1 }] })
      );

      createInternship(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ 
        id: 1, 
        title: 'New Internship', 
        description: 'Desc', 
        requirement: 'Req', 
        duration: '3 months' 
      });
    });

    it('should handle database error', () => {
      req.body = { title: 'Test', description: 'Desc', requirement: 'Req', duration: '3 months' };
      
      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(new Error('DB Error'), null)
      );

      createInternship(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
    });
  });

  describe('updateInternship', () => {
    it('should update internship', () => {
      req.params = { id: '1' };
      req.body = { icon: 'icon.png', title: 'Updated', description: 'Updated desc', requirement: 'New req', duration: '6 months' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 1 })
      );

      updateInternship(req, res);

      expect(res.json).toHaveBeenCalledWith({ 
        id: '1', 
        icon: 'icon.png',
        title: 'Updated', 
        description: 'Updated desc', 
        requirement: 'New req', 
        duration: '6 months' 
      });
    });

    it('should return 404 if not found', () => {
      req.params = { id: '999' };
      req.body = { icon: 'icon.png', title: 'Updated', description: 'Updated desc', requirement: 'New req', duration: '6 months' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 0 })
      );

      updateInternship(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Record not found' });
    });
  });

  describe('deleteInternship', () => {
    it('should delete internship', () => {
      req.params = { id: '1' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 1 })
      );

      deleteInternship(req, res);

      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Data successfully deleted' 
      });
    });

    it('should return 404 if not found', () => {
      req.params = { id: '999' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 0 })
      );

      deleteInternship(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Record not found' });
    });
  });
});