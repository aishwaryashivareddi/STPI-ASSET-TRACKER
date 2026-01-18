import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assets, maintenances } from './api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [maintenanceStats, setMaintenanceStats] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!token || !userData) {
      localStorage.clear();
      navigate('/');
      return;
    }
    setUser(userData);
    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    try {
      const [assetRes, maintenanceRes] = await Promise.all([
        assets.getStats(),
        maintenances.getStats()
      ]);
      setStats(assetRes.data.data);
      setMaintenanceStats(maintenanceRes.data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (!user || !stats) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>STPI Asset Tracker</h1>
        <div className="user-info">
          <span>{user.username} ({user.role})</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button onClick={() => navigate('/assets')}>Assets</button>
        <button onClick={() => navigate('/procurements')}>Procurement</button>
        <button onClick={() => navigate('/maintenances')}>Maintenance</button>
        <button onClick={() => navigate('/disposals')}>Disposal</button>
      </nav>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Assets</h3>
          <p className="stat-value">{stats.totalAssets}</p>
        </div>
        <div className="stat-card success">
          <h3>Working</h3>
          <p className="stat-value">{stats.workingAssets}</p>
        </div>
        <div className="stat-card warning">
          <h3>Not Working</h3>
          <p className="stat-value">{stats.notWorkingAssets}</p>
        </div>
        <div className="stat-card danger">
          <h3>Obsolete</h3>
          <p className="stat-value">{stats.obsoleteAssets}</p>
        </div>
        <div className="stat-card info">
          <h3>Pending Testing</h3>
          <p className="stat-value">{stats.pendingTesting}</p>
        </div>
        <div className="stat-card">
          <h3>Total Maintenances</h3>
          <p className="stat-value">{maintenanceStats?.totalMaintenances || 0}</p>
        </div>
      </div>

      <div className="asset-types">
        <h2>Assets by Type</h2>
        <div className="type-grid">
          {stats.byType?.map((type) => (
            <div key={type.asset_type} className="type-card">
              <h4>{type.asset_type}</h4>
              <p>{type.count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
