import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/navbar.jsx'
import Footer from './components/footer.jsx'
import './App.css'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'

function App() {
  
  return (
    <>
      <div className='page-container'>
        <main className='content-wrap'>
        <Router>
          <Navbar />
            <div className="content">
             <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </div>
          </Router>
        </main>      
        <Footer />
      </div>
   </>
  )
}

export default App
