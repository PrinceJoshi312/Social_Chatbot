import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  MessageSquare, 
  Activity, 
  Search,
  ArrowUpRight,
  TrendingUp,
  Globe,
  Loader2
} from 'lucide-react';
import './Dashboard.css';

interface PlatformStats {
  total_businesses: number;
  total_users: number;
  total_messages: number;
  total_documents: number;
  active_last_24h: number;
  recent_businesses: any[];
}

export const SuperAdminPage: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/analytics/system-wide')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 className="spin" />
        <span>Loading Platform Data...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Platform Overview</h1>
          <p>Global view of all bots and system performance.</p>
        </div>
        <div className="header-actions">
          <button className="primary-btn" onClick={() => navigate('/admin/businesses')}>
            <Building2 size={18} />
            Manage Clients
          </button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Building2 size={24} /></div>
          <div className="stat-info">
            <h3>{stats?.total_businesses || 0}</h3>
            <span>Total Businesses</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><MessageSquare size={24} /></div>
          <div className="stat-info">
            <h3>{stats?.total_messages || 0}</h3>
            <span>Total Messages</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple"><Activity size={24} /></div>
          <div className="stat-info">
            <h3>{stats?.active_last_24h || 0}</h3>
            <span>Active Bots (24h)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange"><Globe size={24} /></div>
          <div className="stat-info">
            <h3>{stats?.total_documents || 0}</h3>
            <span>Knowledge Files</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid admin-grid">
        <section className="dashboard-section recent-activity">
          <div className="section-header">
            <h3>Recent Businesses</h3>
            <button className="text-btn" onClick={() => navigate('/admin/businesses')}>View All</button>
          </div>
          <div className="business-list-table">
             <table>
               <thead>
                 <tr>
                   <th>Business Name</th>
                   <th>Created At</th>
                   <th>Status</th>
                   <th>Action</th>
                 </tr>
               </thead>
               <tbody>
                 {stats?.recent_businesses.map((biz: any) => (
                   <tr key={biz.id}>
                     <td><strong>{biz.name}</strong></td>
                     <td>{new Date(biz.created_at).toLocaleDateString()}</td>
                     <td><span className="badge success">Active</span></td>
                     <td>
                        <button className="btn-icon" onClick={() => navigate('/admin/businesses')}>
                          <ArrowUpRight size={16} />
                        </button>
                     </td>
                   </tr>
                 ))}
                 {(!stats?.recent_businesses || stats.recent_businesses.length === 0) && (
                   <tr><td colSpan={4}>No businesses registered yet.</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        </section>
      </div>
    </div>
  );
};
