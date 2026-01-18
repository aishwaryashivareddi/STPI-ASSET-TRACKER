import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import Login from './Login';
import Dashboard from './Dashboard';
import Assets from './Assets';
import Procurements from './Procurements';
import Maintenances from './Maintenances';
import Disposals from './Disposals';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/procurements" element={<Procurements />} />
          <Route path="/maintenances" element={<Maintenances />} />
          <Route path="/disposals" element={<Disposals />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
