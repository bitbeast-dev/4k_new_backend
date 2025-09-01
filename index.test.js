import request from 'supertest';
import { jest } from '@jest/globals';

// Mock all route modules
jest.unstable_mockModule('./routes/auth.js', () => ({
  homeCard: { use: jest.fn() },
  showcaseCard: { use: jest.fn() },
  productCard: { use: jest.fn() },
  missionCard: { use: jest.fn() },
  internshipCard: { use: jest.fn() },
  valuesCard: { use: jest.fn() },
  categoryCard: { use: jest.fn() },
  teamCard: { use: jest.fn() },
  customerCard: { use: jest.fn() },
  userAdmin: { use: jest.fn() }
}));

// Mock express router
const mockRouter = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};

jest.unstable_mockModule('express', () => ({
  default: jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    listen: jest.fn((port, callback) => callback()),
    set: jest.fn()
  })),
  Router: jest.fn(() => mockRouter)
}));

describe('Express App', () => {
  let app;

  beforeAll(async () => {
    const { default: express } = await import('express');
    app = express();
  });

  test('should create express app', () => {
    expect(app).toBeDefined();
    expect(app.use).toHaveBeenCalled();
  });

  test('should setup middleware', () => {
    expect(app.use).toHaveBeenCalledWith(expect.any(Function)); // cors
    expect(app.use).toHaveBeenCalledWith(expect.any(Function)); // express.json
  });

  test('should setup routes', () => {
    expect(app.use).toHaveBeenCalledWith('/home', expect.any(Object));
    expect(app.use).toHaveBeenCalledWith('/product', expect.any(Object));
    expect(app.use).toHaveBeenCalledWith('/show', expect.any(Object));
    expect(app.use).toHaveBeenCalledWith('/mission', expect.any(Object));
    expect(app.use).toHaveBeenCalledWith('/values', expect.any(Object));
    expect(app.use).toHaveBeenCalledWith('/team', expect.any(Object));
    expect(app.use).toHaveBeenCalledWith('/admin', expect.any(Object));
  });

  test('should setup root route', () => {
    expect(app.get).toHaveBeenCalledWith('/', expect.any(Function));
  });

  test('should start server', () => {
    expect(app.listen).toHaveBeenCalledWith(expect.any(Number), expect.any(Function));
  });
});