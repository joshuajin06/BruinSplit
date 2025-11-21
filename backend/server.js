import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// load environment variables
dotenv.config();



// import routes
import authRoutes from './src/routes/authRoute.js';
import ridesRoutes from './src/routes/ridesRoute.js';
import eventsRoutes from './src/routes/eventsRoute.js';
import messagesRoutes from './src/routes/messagesRoute.js';


// import middleware
import { logger } from './src/middleware/logger.js';
import { errorHandler } from './src/middleware/errorHandler.js';


const app = express();

// middleware (runs on every request)
app.use(cors()); // allow the frontend to access the backend
app.use(express.json()); // parse JSON request bodies
app.use(logger); // log every request


// register routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/events', eventsRoutes);



// 404 handler - no route is found
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
})

// Error handler - cathces all errors
app.use(errorHandler);


//start and run server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
})