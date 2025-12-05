# BruinSplit
<img src="BruinSplit/frontend/bruinsplit/src/assets/finalogofinal.png" alt="React" width="140">
Uber, Lyft, and Waymo rides are increasing in price, and students tend to grab a ride to the same destination at the same time while paying full price. If two students both go to LAX at 8pm after their finals, why not split the cost? 

Built to address this, Bruinsplit is a web app that helps UCLA students find other students to split the cost of a ride somewhere. It will let users create an account, create/post or join rides based on time, origin, and destination; users can also communicate with members of a ride and add other users as friends.

# Tech Stack:

<div align="center">
  <a href="https://react.dev/" target="_blank" style="margin: 0 32px; display: inline-block;">
    <img src="frontend/bruinsplit/public/reactLogo.png" alt="React" width="140">
  </a>
  <a href="https://nodejs.org/" target="_blank" style="margin: 0 32px; display: inline-block;">
    <img src="frontend/bruinsplit/public/nodeJSlogo.png" alt="Node.js" width="140">
  </a>
  <a href="https://supabase.com/" target="_blank" style="margin: 0 32px; display: inline-block;">
    <img src="frontend/bruinsplit/public/supabaseLogo.png" alt="Supabase" width="140">
  </a>
</div>

# Installation Instructions:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/joshuajin06/BruinSplit.git
   cd BruinSplit
   ```

2. **Install Node.js:**
   - Download and install [Node.js](https://nodejs.org/en/download)
   - Verify installation:
     ```bash
     node -v
     ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   npm install @supabase/supabase-js dotenv
   ```

4. **Install frontend dependencies:**
   ```bash
   cd ../frontend/bruinsplit
   npm install
   npm install react-router-dom
   ```

5. **Set up environment variables:**
   - Create a `.env` file in the `backend` directory with your Supabase credentials

# Running the Server:

Run the following commands in separate terminals:

**Terminal 1 - Backend Server:**
```bash
cd backend
node server.js
```

**Terminal 2 - Frontend Server:**
```bash
cd frontend/bruinsplit
npm run dev
```

# Diagrams:

These two diagrams display the system architecture and database schema for BruinSplit.

<div align="center">
  <img src="frontend/bruinsplit/public/systemArchdiagram.png" alt="System Architecture Diagram" width="800">
  <img src="frontend/bruinsplit/public/REdbdiagram.png" alt="Database Schema Diagram" width="800">
</div>

# API Documentation

- Swagger UI: http://localhost:8080/api/docs
- OpenAPI JSON: http://localhost:8080/api/docs-json

Run locally before using these links:
1) `cd backend`
2) `npm install`
3) `npm run start` OR `node server.js`

Your Swagger UI should look like this:

<div align="center">
  <img src="frontend/bruinsplit/public/apiDocu.png" alt="Swagger UI overview" width="800">
</div>

Example schema/details view:

<div align="center">
  <img src="frontend/bruinsplit/public/apiDocu2.png" alt="Swagger UI schema example" width="800">
</div>

# Creators 
Jaden Ho, Anish Kumar, Joshua Jin, Justin Luc
