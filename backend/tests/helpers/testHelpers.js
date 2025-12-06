// test helpers for creating mock request/response/next objects

export function createMockRequest(options = {}) {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    user: options.user || { id: 'user-1111', email: 'test@example.com' },
    headers: options.headers || {},
    file: options.file || null,
    ...options
  };
}

export function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
}

export function createMockNext() {
  return jest.fn();
}

