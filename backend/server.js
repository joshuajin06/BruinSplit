import { supabase } from "./src/lib/supabase.js"
import cors from 'cors';

import express from 'express';

//Import Routes
import authRoutes from './routes/auth.js';
import ridesRoutes from './routes/rides.js';
import bookingsRoutes from './routes/bookings.js';
import eventsRoutes from './routes/events.js';
import usersRoutes from './routes/users.js';


const app = express();

app.use(cors());

app.use(express.json()); // Middleware

app.use((req, res, next) => {
  console.log(`${new Date().toISOString} - ${req.method} ${req.path}`);
})

// Authentication Middleware
export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}


app.use('/api/rides', ridesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/users', usersRoutes);


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

app.post('/api/users', createUser);

// 404 handler
app.use((req, res) => {
  res.status(400).json({ error: 'Route not Found'});
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});


//Run server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
})