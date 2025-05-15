import fs from 'fs';
import path from 'path';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn().mockReturnValue({ write: jest.fn() })
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/'))
}));

jest.mock('winston', () => {
  const mockFormat = {
    timestamp: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    combine: jest.fn().mockReturnValue('combined format')
  };
  
  return {
    createLogger: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    }),
    format: mockFormat,
    transports: {
      Console: jest.fn(),
      File: jest.fn()
    }
  };
});

jest.mock('morgan', () => {
  const mockMorgan = jest.fn().mockImplementation((formatter, options) => {
    if (typeof formatter === 'function') {
      const mockTokens = {
        method: jest.fn().mockReturnValue('GET'),
        url: jest.fn().mockReturnValue('/test'),
        status: jest.fn().mockReturnValue('200'),
        'response-time': jest.fn().mockReturnValue('10'),
        timestamp: jest.fn().mockReturnValue('2023-01-01T00:00:00.000Z')
      };
      formatter(mockTokens, {}, {});
    }
    return 'morgan middleware';
  });
  
  mockMorgan.token = jest.fn().mockImplementation((name, fn) => {
    if (name === 'timestamp' && typeof fn === 'function') {
      fn({}, {});
    }
  });
  
  return mockMorgan;
});

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('creates logs directory if it does not exist', () => {
    fs.existsSync.mockReturnValue(false);
    
    jest.isolateModules(() => {
      require('../../../src/utils/logger');
    });
    
    expect(fs.existsSync).toHaveBeenCalledWith('logs');
    expect(fs.mkdirSync).toHaveBeenCalledWith('logs');
  });
  
  test('does not create logs directory if it already exists', () => {
    fs.existsSync.mockReturnValue(true);
    
    jest.isolateModules(() => {
      require('../../../src/utils/logger');
    });
    
    expect(fs.existsSync).toHaveBeenCalledWith('logs');
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });
  
  test('creates winston logger with Console transport', () => {
    const winston = require('winston');
    
    jest.isolateModules(() => {
      require('../../../src/utils/logger');
    });
    
    expect(winston.createLogger).toHaveBeenCalled();
    expect(winston.transports.File).toHaveBeenCalledWith({
      filename: 'logs/application.log'
    });
    expect(winston.transports.Console).toHaveBeenCalled();
  });
  
  test('creates morgan request logger with timestamp token', () => {
    const morgan = require('morgan');
    
    jest.isolateModules(() => {
      require('../../../src/utils/logger');
    });
    
    expect(morgan.token).toHaveBeenCalledWith('timestamp', expect.any(Function));
    expect(morgan).toHaveBeenCalled();
    expect(fs.createWriteStream).toHaveBeenCalledWith('logs/requests.log', { flags: 'a' });
  });
  
  test('morgan formatter function creates proper JSON log entries', () => {
    const morgan = require('morgan');
    
    jest.isolateModules(() => {
      require('../../../src/utils/logger');
    });
    
    expect(morgan).toHaveBeenCalled();
    expect(morgan.mock.calls[0][0]).toBeInstanceOf(Function);
    
    const formatterFn = morgan.mock.calls[0][0];
    const mockTokens = {
      method: jest.fn().mockReturnValue('GET'),
      url: jest.fn().mockReturnValue('/test'),
      status: jest.fn().mockReturnValue('200'),
      'response-time': jest.fn().mockReturnValue('10'),
      timestamp: jest.fn().mockReturnValue('2023-01-01T00:00:00.000Z')
    };
    
    const result = formatterFn(mockTokens, {}, {});
    
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('timestamp');
    expect(parsed).toHaveProperty('method', 'GET');
    expect(parsed).toHaveProperty('url', '/test');
    expect(parsed).toHaveProperty('status', 200);
    expect(parsed).toHaveProperty('responseTime', 10);
  });
  
  test('morgan formatter handles undefined status and response-time', () => {
    const morgan = require('morgan');
    
    jest.isolateModules(() => {
      require('../../../src/utils/logger');
    });
    
    const formatterFn = morgan.mock.calls[0][0];
    
    const mockTokens = {
      method: jest.fn().mockReturnValue('GET'),
      url: jest.fn().mockReturnValue('/test'),
      status: jest.fn().mockReturnValue(undefined),
      'response-time': jest.fn().mockReturnValue(undefined),
      timestamp: jest.fn().mockReturnValue('2023-01-01T00:00:00.000Z')
    };
    
    const result = formatterFn(mockTokens, {}, {});
    
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe(0);
    expect(parsed.responseTime).toBe(0);
  });
  
  test('morgan formatter handles falsy values for status and response-time', () => {
    const morgan = require('morgan');
    
    jest.isolateModules(() => {
      require('../../../src/utils/logger');
    });
    
    const formatterFn = morgan.mock.calls[0][0];
    
    const mockTokens = {
      method: jest.fn().mockReturnValue('GET'),
      url: jest.fn().mockReturnValue('/test'),
      status: jest.fn().mockReturnValue(''),
      'response-time': jest.fn().mockReturnValue(''),
      timestamp: jest.fn().mockReturnValue('2023-01-01T00:00:00.000Z')
    };
    
    const result = formatterFn(mockTokens, {}, {});
    
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe(0);
    expect(parsed.responseTime).toBe(0);
  });
});
