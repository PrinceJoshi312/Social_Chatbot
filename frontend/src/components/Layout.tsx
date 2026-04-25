import React from 'react';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app-layout">
      <Toaster position="top-right" reverseOrder={false} />
      <Sidebar />
      <main className="main-content">
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  );
};
