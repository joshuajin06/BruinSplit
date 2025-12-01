import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/navbar.jsx'
import Footer from './components/footer.jsx'
import './App.css'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Events from './pages/Events.jsx'
import Postings from './pages/Postings.jsx'
import MyRides from './pages/MyRides.jsx'
import Profile from './pages/Profile.jsx'

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/protectedroute.jsx'


function App() {
  
  return (
    <>
      <div className='page-container'>
        <main className='content-wrap'>
        <AuthProvider>
          <Router>
            <Navbar />
              <div className="content">
              <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/postings" element={<ProtectedRoute><Postings /></ProtectedRoute>} />
                  <Route path="/myrides" element={<ProtectedRoute><MyRides /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                </Routes>
              </div>
            </Router>
          </AuthProvider>
        </main>      
        <Footer />
      </div>
   </>
  )
}

export default App