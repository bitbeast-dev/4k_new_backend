import { jest } from '@jest/globals';
import { getProducts, createProducts, updateProducts, deleteProducts, truncateProducts } from './controllerrs/productControllers.js';

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

describe('Product Controllers', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, files: [] };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return all products', () => {
      const mockData = [{ id: 1, title: 'Test Product', price: 100 }];
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(null, { rows: mockData })
      );

      getProducts(req, res);

      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle database error', () => {
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(new Error('DB Error'), null)
      );

      getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
    });
  });

  describe('createProducts', () => {
    it('should create products with files', async () => {
      req.body = { description: 'Test desc', price: 100, features: 'Feature', style: 'Style', quantity: 10, category: 'Cat' };
      req.files = [
        { path: '/path/1', originalname: 'product1.jpg' },
        { path: '/path/2', originalname: 'product2.jpg' }
      ];

      mockCloudinary.uploader.upload
        .mockResolvedValueOnce({ secure_url: 'url1' })
        .mockResolvedValueOnce({ secure_url: 'url2' });

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 2 })
      );

      await createProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Products uploaded successfully', 
        insertedRows: 2 
      });
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(2);
    });

    it('should return error if no files', async () => {
      req.files = [];

      await createProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'At least one image is required' });
    });

    it('should handle cloudinary error', async () => {
      req.files = [{ path: '/path/1', originalname: 'test.jpg' }];
      mockCloudinary.uploader.upload.mockRejectedValue(new Error('Upload failed'));

      await createProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to upload images' });
      expect(mockFs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('updateProducts', () => {
    it('should update product', () => {
      req.params = { id: '1' };
      req.body = { description: 'Updated desc', price: 200, category: 'New Cat' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 1 })
      );

      updateProducts(req, res);

      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Product updated successfully',
        id: '1', 
        description: 'Updated desc', 
        price: 200, 
        category: 'New Cat' 
      });
    });

    it('should return 404 if not found', () => {
      req.params = { id: '999' };
      req.body = { description: 'Updated desc', price: 200, category: 'New Cat' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 0 })
      );

      updateProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Record not found' });
    });
  });

  describe('deleteProducts', () => {
    it('should delete product', () => {
      req.params = { id: '1' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 1 })
      );

      deleteProducts(req, res);

      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Product successfully deleted' 
      });
    });

    it('should return 404 if not found', () => {
      req.params = { id: '999' };

      mockDb.query.mockImplementationOnce((sql, params, callback) => 
        callback(null, { rowCount: 0 })
      );

      deleteProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Record not found' });
    });
  });

  describe('truncateProducts', () => {
    it('should truncate products table', () => {
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(null, {})
      );

      truncateProducts(req, res);

      expect(res.json).toHaveBeenCalledWith({ 
        message: 'All products successfully deleted' 
      });
    });

    it('should handle database error', () => {
      mockDb.query.mockImplementationOnce((sql, callback) => 
        callback(new Error('DB Error'), null)
      );

      truncateProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
    });
  });
});