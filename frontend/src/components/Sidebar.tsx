import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, MessageSquare, Settings, Database } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const { businesses, activeBusiness, setActiveBusiness } = useBusiness();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <MessageSquare color="var(--primary)" size={24} />
          <span>RAG Bot Admin</span>
        </div>
      </div>

      <div className="business-selector">
        <label>Active Business</label>
        <select 
          value={activeBusiness?.id || ''} 
          onChange={(e) => {
            const b = businesses.find(biz => biz.id === parseInt(e.target.value));
            if (b) setActiveBusiness(b);
          }}
        >
          {businesses.map(biz => (
            <option key={biz.id} value={biz.id}>{biz.name}</option>
          ))}
          {businesses.length === 0 && <option value="">No businesses found</option>}
        </select>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/knowledge" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <BookOpen size={20} />
          <span>Knowledge Base</span>
        </NavLink>
        <NavLink to="/playground" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MessageSquare size={20} />
          <span>Chat Playground</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="status">
          <div className="status-indicator online"></div>
          <span>Backend Online</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
