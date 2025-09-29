import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Import pages
import Dashboard from './pages/Dashboard';
import TaxCalculator from './pages/TaxCalculator';
import CIBILAdvisor from './pages/CIBILAdvisor';
import FileUpload from './pages/FileUpload';
import Login from './pages/Login';
import Register from './pages/Register';
import DebtDashboard from './pages/DebtDashboard';
import CapitalGainsAnalyzer from './pages/CapitalGainsAnalyzer.jsx';
import HelpSupport from './pages/HelpSupport.jsx';
import Landing from './pages/Landing';
import Analysis from './pages/Analysis.jsx';
import Reports from './pages/Reports.jsx';

// Import components
import MainLayout from './components/MainLayout';

function App() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/landing" element={<Landing />} />
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<FileUpload />} />
        <Route path="/tax" element={<TaxCalculator />} />
        <Route path="/cibil" element={<CIBILAdvisor />} />
        <Route path="/debt" element={<DebtDashboard />} />
        <Route path="/capital-gains" element={<CapitalGainsAnalyzer />} />
        <Route path="/analysis" element={<Analysis user={currentUser} />} />
        <Route path="/reports" element={<Reports user={currentUser} />} />
        <Route path="/help" element={<HelpSupport />} />
      </Route>
      <Route path="/" element={<Navigate to="/landing" />} />
      <Route path="*" element={<Navigate to="/landing" />} />
    </Routes>
  );
}

const AppWrapper = () => {
  return (
    <Router>
      <App />
    </Router>
  )
}

export default AppWrapper;
