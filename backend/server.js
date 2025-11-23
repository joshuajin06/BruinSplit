import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

<<<<<<< HEAD
//Import Routes
import authRoutes from './routes/auth.js';
import ridesRoutes from './routes/rides.js';
// import bookingsRoutes from './routes/bookings.js';
import eventsRoutes from './routes/events.js'; 
// import usersRoutes from './routes/users.js';
=======
// load environment variables
dotenv.config();


// Debug: Check if env variables are loading
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Found' : 'NOT FOUND');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'NOT FOUND');

// import routes
import authRoutes from './src/routes/authRoute.js';
import ridesRoutes from './src/routes/ridesRoute.js';
import eventsRoutes from './src/routes/eventsRoute.js';
import messagesRoutes from './src/routes/messagesRoute.js';


// import middleware
import { logger } from './src/middleware/logger.js';
import { errorHandler } from './src/middleware/errorHandler.js';
>>>>>>> e7060ec459fbaa01082fe561ee6da1182af486a8


const app = express();

// middleware (runs on every request)
app.use(cors()); // allow the frontend to access the backend
app.use(express.json()); // parse JSON request bodies
app.use(logger); // log every request


<<<<<<< HEAD
    if(error || !user) {
      return res.status(401).json({erorr: 'user not found'});
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}


// app.use('/api/rides', ridesRoutes);
// app.use('/api/messages', messagesRoutes);
console.log("Loading events routes...");
app.use('/api/events', eventsRoutes);
console.log("Events routes mounted");
// app.use('/api/users', usersRoutes);
=======
// register routes
>>>>>>> e7060ec459fbaa01082fe561ee6da1182af486a8
app.use('/api/auth', authRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/events', eventsRoutes);

<<<<<<< HEAD
/*
app.get("/api/events", async (req, res) => {
  try {
    const { data, error } = await supabase
    .from("events")
    .select('*')

    if(error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
})
  */
 
// app.post('/api/users', createUser);

// 404 handler
=======


// 404 handler - no route is found
>>>>>>> e7060ec459fbaa01082fe561ee6da1182af486a8
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