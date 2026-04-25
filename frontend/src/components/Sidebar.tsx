import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  MessageSquare, 
  Settings, 
  Building2, 
  ShieldCheck, 
  Plus,
  BarChart3,
  ShieldAlert,
  LogOut,
  CreditCard,
  HelpCircle
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const { businesses, activeBusiness, setActiveBusiness } = useBusiness();
  const { isAdmin, logout, user } = useAuth();

  const handleLogout = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(() => { logout(); resolve(true); }, 800)),
      {
        loading: 'Signing out...',
        success: 'Goodbye!',
        error: 'Failed to sign out',
      }
    );
  };

  return (
    <aside className="sidebar">
      <div className="user-profile-mini">
        <div className="profile-avatar">{user?.email[0].toUpperCase()}</div>
        <div className="profile-info">
          <span className="profile-email">{user?.email}</span>
          <span className={`role-tag ${isAdmin ? 'admin' : 'user'}`}>
            {isAdmin ? 'Super Admin' : 'Business Owner'}
          </span>
        </div>
      </div>

      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <MessageSquare color="white" size={24} fill="white" />
          </div>
          <div className="logo-text">
            <h2>RAG SaaS</h2>
            <span>Enterprise</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {isAdmin ? (
          <>
            <label className="section-label">Platform HQ</label>
            <NavLink to="/admin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <BarChart3 size={18} />
              <span>Global Analytics</span>
            </NavLink>
            <NavLink to="/admin/businesses" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Building2 size={18} />
              <span>Manage Clients</span>
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <ShieldCheck size={18} />
              <span>Platform Security</span>
            </NavLink>
          </>
        ) : (
          <>
            <div className="sidebar-section">
              <div className="business-selector-wrapper">
                <Building2 size={16} className="selector-icon" />
                <select 
                  className="business-select"
                  value={activeBusiness?.id || ''} 
                  onChange={(e) => {
                    const b = businesses.find(biz => biz.id === parseInt(e.target.value));
                    if (b) setActiveBusiness(b);
                  }}
                >
                  {businesses.map(biz => (
                    <option key={biz.id} value={biz.id}>{biz.name}</option>
                  ))}
                  {businesses.length === 0 && <option value="">No bots yet</option>}
                </select>
              </div>
            </div>

            <label className="section-label">Bot Operations</label>
            <NavLink to="/dashboard" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/knowledge" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <BookOpen size={18} />
              <span>Knowledge Base</span>
            </NavLink>
            <NavLink to="/playground" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <MessageSquare size={18} />
              <span>Chat Simulator</span>
            </NavLink>
            <NavLink to="/billing" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <CreditCard size={18} />
              <span>Billing & Plan</span>
            </NavLink>
            <NavLink to="/help" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <HelpCircle size={18} />
              <span>Help & FAQs</span>
            </NavLink>
            
            <label className="section-label">Configuration</label>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Settings size={18} />
              <span>Bot Settings</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-spacer"></div>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn-modern" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
