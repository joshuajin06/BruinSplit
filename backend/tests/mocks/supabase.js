// mock supabase client with chainable query builder
// this allows us to test services without hitting the real database
// look up the jest framework

export const createMockSupabaseQueryBuilder = () => {
  const builder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    then: jest.fn(function(resolve, reject) {
      return Promise.resolve(this._mockResponse).then(resolve, reject);
    })
  };

  // allow setting mock response
  builder._mockResponse = { data: null, error: null };
  builder.setResponse = function(data, error = null) {
    this._mockResponse = { data, error };
    return this;
  };

  return builder;
};

export const mockSupabase = {
  from: jest.fn(() => createMockSupabaseQueryBuilder())
};

