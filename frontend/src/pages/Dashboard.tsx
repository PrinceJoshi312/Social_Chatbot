import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Zap, Activity, Clock, FileText, Loader2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

interface DashboardStats {
  message_volume_7d: number;
  document_count: number;
  tool_usage: Record<string, number>;
  chart_data: any[];
  recent_activity: any[];
}

export const Dashboard: React.FC = () => {
  const { activeBusiness, loading: contextLoading } = useBusiness();
  const { getAccessToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeBusiness) {
      setIsLoading(false);
      return;
    }
    
    const fetchStats = async () => {
        setIsLoading(true);
        const token = await getAccessToken();
        fetch(`/api/analytics/stats/${activeBusiness.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            setStats(data);
            setIsLoading(false);
          })
          .catch(() => setIsLoading(false));
    };
    fetchStats();
  }, [activeBusiness, getAccessToken]);

  // If the context is still loading businesses, show loading
  if (contextLoading) return <div className="loading-state"><Loader2 className="spin" /> <span>Syncing Organization...</span></div>;

  // If no bot exists yet
  if (!activeBusiness && !isLoading) return (
    <div className="dashboard-container">
      <div className="empty-dashboard" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <Zap size={64} color="var(--primary)" style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
        <h2>Your Platform is Ready</h2>
        <p style={{ color: '#64748b', maxWidth: '400px', margin: '1rem auto' }}>
          You don't have any active bots yet. Start by choosing a plan and naming your first assistant.
        </p>
        <button className="primary-btn" onClick={() => window.location.href='/billing'} style={{ margin: '0 auto' }}>
          Activate My First Bot
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>{activeBusiness?.name} Dashboard</h1>
          <p>Real-time analytics for your bot.</p>
        </div>
      </header>

      {isLoading ? (
        <div className="loading-state"><Loader2 className="spin" /> <span>Fetching insights...</span></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue"><MessageSquare size={24} /></div>
              <div className="stat-info"><h3>{stats?.message_volume_7d || 0}</h3><span>Messages</span></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><FileText size={24} /></div>
              <div className="stat-info"><h3>{stats?.document_count || 0}</h3><span>Docs</span></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange"><Activity size={24} /></div>
              <div className="stat-info"><h3>99%</h3><span>AI Health</span></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><Zap size={24} /></div>
              <div className="stat-info"><h3>{Object.keys(stats?.tool_usage || {}).length}</h3><span>Tools</span></div>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="dashboard-section chart-box" style={{ gridColumn: 'span 2' }}>
              <div className="section-header">
                <BarChart3 size={18} />
                <h3>Volume Trend</h3>
              </div>
              <div style={{ width: '100%', height: 250, marginTop: '1rem' }}>
                <ResponsiveContainer>
                  <BarChart data={stats?.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} />
                    <YAxis tick={{fontSize: 12}} axisLine={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="messages" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="dashboard-section recent-activity" style={{ gridColumn: 'span 2' }}>
              <div className="section-header">
                <Clock size={18} />
                <h3>Activity Log</h3>
              </div>
              <div className="activity-list">
                {stats?.recent_activity.map((activity, idx) => (
                  <div key={idx} className="activity-item">
                    <div className={`activity-dot ${activity.type}`}></div>
                    <div className="activity-details">
                      <p>{activity.type === 'query' ? `User: "${activity.data.query}"` : `Tool: ${activity.data.tool}`}</p>
                      <span>{new Date(activity.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {(!stats?.recent_activity || stats.recent_activity.length === 0) && (
                  <p className="empty-msg">No activity recorded yet.</p>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};
