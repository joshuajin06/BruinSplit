import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'BruinSplit API', version: '1.0.0' },
    servers: [{ url: 'http://localhost:8080/api' }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas: {
        Error: {
          type: 'object',
          properties: { error: { type: 'string' } },
          required: ['error'],
        },
        Ride: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            origin: { type: 'string' },
            destination: { type: 'string' },
            datetime: { type: 'string', format: 'date-time' },
            seats: { type: 'integer' },
            notes: { type: 'string' },
            status: { type: 'string', enum: ['OPEN', 'FULL', 'CANCELLED'] },
            ownerId: { type: 'string' },
          },
          required: ['id', 'title', 'origin', 'destination', 'datetime', 'ownerId'],
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            rideId: { type: 'string' },
            senderId: { type: 'string' },
            content: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'rideId', 'senderId', 'content', 'createdAt'],
        },
        Profile: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            bio: { type: 'string' },
            phone: { type: 'string' },
            avatarUrl: { type: 'string' },
          },
          required: ['id', 'name'],
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth' },
      { name: 'Rides' },
      { name: 'Messages' },
      { name: 'Profile' },
      { name: 'Friends' },
      { name: 'Calls' },
    ],
  },
  apis: ['./src/routes/*.js'], // pick up JSDoc on routes
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;