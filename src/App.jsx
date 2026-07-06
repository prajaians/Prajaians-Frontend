import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'

// Public Screens
import LandingScreen from './screens/LandingScreen'
import LoginScreen from './screens/LoginScreen'

// Staff Screens
import StaffDashboard from './screens/StaffDashboard'
import ManagerEntry from './screens/ManagerEntry'
import AdminPanel from './screens/AdminPanel'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path='/' element={<LandingScreen />} />
          <Route path='/login' element={<LoginScreen />} />

          {/* Staff Routes */}
          <Route path='/staffPanel/*' element={<StaffDashboard />} />

          {/* Manager Routes */}
          <Route path='/managerPanel/*' element={<ManagerEntry />} />

          {/* Admin Routes */}
          <Route path="/adminPanel" element={<AdminPanel />} />



          {/* 404 - Not Found */}
          <Route path='*' element={<h1 className="text-center text-4xl text-gold-primary mt-20">404 - Page Not Found</h1>} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App