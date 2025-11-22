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

import { AuthProvider } from './context/AuthContext';


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
                  <Route path="/events" element={<Events />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/postings" element={<Postings />} />
                  <Route path="/myrides" element={<MyRides />} />
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
