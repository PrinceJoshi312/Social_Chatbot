import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { MessageSquare, Database, Zap, Activity, Clock, FileText } from 'lucide-react';
import './Dashboard.css';

interface Stats {
  message_volume_7d: number;
  document_count: number;
  tool_usage: Record<string, number>;
  recent_activity: Array<{
    type: string;
    data: any;
    timestamp: string;
  }>;
}

export const Dashboard: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeBusiness) {
      fetch(`/api/analytics/stats/${activeBusiness.id}`)
        .then(res => res.json())
        .then(data => {
          setStats(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch stats", err);
          setLoading(false);
        });
    }
  }, [activeBusiness]);

  if (loading) return <div className="loading-container">Loading analytics...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Insights for <strong>{activeBusiness?.name}</strong></p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><MessageSquare size={24} /></div>
          <div className="stat-info">
            <h3>{stats?.message_volume_7d || 0}</h3>
            <span>Messages (7d)</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FileText size={24} /></div>
          <div className="stat-info">
            <h3>{stats?.document_count || 0}</h3>
            <span>Knowledge Files</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Zap size={24} /></div>
          <div className="stat-info">
            <h3>{Object.values(stats?.tool_usage || {}).reduce((a, b) => a + b, 0)}</h3>
            <span>Tool Executions</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-section">
          <h2>Tool Usage</h2>
          <div className="tool-stats">
            {stats && Object.keys(stats.tool_usage).length > 0 ? (
              Object.entries(stats.tool_usage).map(([name, count]) => (
                <div key={name} className="tool-row">
                  <span>{name}</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(100, count * 10)}%` }}></div>
                  </div>
                  <span className="count">{count}</span>
                </div>
              ))
            ) : (
              <p className="empty-msg">No tools used yet.</p>
            )}
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-feed">
            {stats?.recent_activity.map((event, idx) => (
              <div key={idx} className="activity-item">
                <div className="activity-icon">
                  <Activity size={16} />
                </div>
                <div className="activity-text">
                  <p><strong>{event.type}</strong>: {event.type === 'tool_call' ? `Executed ${event.data.tool}` : 'New RAG query received'}</p>
                  <span>{new Date(event.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {(!stats?.recent_activity || stats.recent_activity.length === 0) && (
              <p className="empty-msg">No recent activity.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
