import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './Login';
import Dashboard from './Dashboard';
import Assets from './Assets';
import Procurements from './Procurements';
import Maintenances from './Maintenances';
import Disposals from './Disposals';
import GatewayPasses from './GatewayPasses';
import UserManagement from './UserManagement';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
            <Route path="/procurements" element={<ProtectedRoute><Procurements /></ProtectedRoute>} />
            <Route path="/maintenances" element={<ProtectedRoute><Maintenances /></ProtectedRoute>} />
            <Route path="/disposals" element={<ProtectedRoute><Disposals /></ProtectedRoute>} />
            <Route path="/gateway-passes" element={<ProtectedRoute><GatewayPasses /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}
