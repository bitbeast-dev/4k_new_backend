import { jest } from '@jest/globals';
import { getMission, createMission, updateMission, deleteMission } from './controllerrs/missionController.js';

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

describe('Mission Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, files: [] };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getMission', () => {
    it('should return all missions', () => {
      const mockData = [{ id: 1, title_of_section: 'Test Mission', description: 'Desc' }];
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(null, { rows: mockData })
      );

      getMission(req, res);

      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle database error', () => {
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(new Error('DB Error'), null)
      );

      getMission(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
    });
  });

  describe('createMission', () => {
    it('should create mission with files', async () => {
      req.body = { title: 'Test Mission', description: 'Test desc' };
      req.files = [
        { path: '/path/1', originalname: 'mission1.jpg' },
        { path: '/path/2', originalname: 'mission2.jpg' }
      ];

      mockCloudinary.uploader.upload
        .mockResolvedValueOnce({ secure_url: 'url1' })
        .mockResolvedValueOnce({ secure_url: 'url2' });

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 2 })
      );

      await createMission(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Mission created successfully', 
        count: 2 
      });
    });

    it('should return error if no files', async () => {
      req.files = [];

      await createMission(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Image is required' });
    });

    it('should handle cloudinary error', async () => {
      req.files = [{ path: '/path/1', originalname: 'test.jpg' }];
      mockCloudinary.uploader.upload.mockRejectedValue(new Error('Upload failed'));

      await createMission(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Upload failed', 
        error: 'Upload failed' 
      });
    });
  });

  describe('updateMission', () => {
    it('should update mission', () => {
      req.params = { id: '1' };
      req.body = { image: 'new-image.jpg', description: 'Updated desc' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 1 })
      );

      updateMission(req, res);

      expect(res.json).toHaveBeenCalledWith({ 
        id: '1', 
        image: 'new-image.jpg', 
        description: 'Updated desc' 
      });
    });

    it('should return 404 if not found', () => {
      req.params = { id: '999' };
      req.body = { image: 'image.jpg', description: 'Updated desc' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 0 })
      );

      updateMission(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Record not found' });
    });
  });

  describe('deleteMission', () => {
    it('should delete mission', () => {
      req.params = { id: '1' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 1 })
      );

      deleteMission(req, res);

      expect(res.json).toHaveBeenCalledWith({ 
        message: 'data successfully deleted' 
      });
    });

    it('should return 404 if not found', () => {
      req.params = { id: '999' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 0 })
      );

      deleteMission(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Record not found' });
    });
  });
});