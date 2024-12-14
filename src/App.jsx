// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";

import Home from './pages/Home';
import Unauthorized from './pages/Unauthorized';
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import StudentDashboard from "./components/Dashboard/StudentDashboard";
import FacultyDashboard from "./components/Dashboard/FacultyDashboard";
import DeanDashboard from "./components/Dashboard/DeanDashboard";

import { useAuth } from './contexts/AuthContext';  // Updated import path
import { Navigate } from 'react-router-dom';  // Import Navigate from react-router-dom

function App() {
  const { user } = useAuth();
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes */}
        <Route
          path="/student"
          element={user ? <StudentDashboard /> : <Navigate to="/unauthorized" />}
        />
        <Route
          path="/faculty"
          element={user ? <FacultyDashboard /> : <Navigate to="/unauthorized" />}
        />
        <Route
          path="/dean"
          element={user ? <DeanDashboard /> : <Navigate to="/unauthorized" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
