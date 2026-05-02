import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import { Building2, Search, ExternalLink, Trash2, Mail, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Modal } from '../components/Modal';
import './KnowledgeBase.css';

export const AllBusinessesPage: React.FC = () => {
  const { businesses, refreshBusinesses, setActiveBusiness } = useBusiness();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{id: number, name: string} | null>(null);

  // Auto-refresh when page loads
  useEffect(() => {
    refreshBusinesses();
  }, [refreshBusinesses]);

  // BULLETPROOF FILTERING
  const filteredBusinesses = businesses.filter(b => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = b.name?.toLowerCase().includes(searchLower);
    const emailMatch = b.owner_email?.toLowerCase().includes(searchLower);
    return nameMatch || emailMatch;
  });

  const handleDeleteBusiness = async () => {
    if (!confirmDelete) return;
    const { id, name } = confirmDelete;
    setConfirmDelete(null);
    
    const token = localStorage.getItem('token');
    const loadingToast = toast.loading(`Removing ${name}...`);
    try {
      const response = await fetch(`/api/businesses/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await refreshBusinesses();
        toast.success(`Client removed.`, { id: loadingToast });
      } else {
        toast.error("Failed to delete", { id: loadingToast });
      }
    } catch (err) { toast.error("Error", { id: loadingToast }); }
  };

  const handleSwitchToBot = (biz: any) => {
    setActiveBusiness(biz);
    toast.success(`Managing ${biz.owner_email}`, { icon: '🤖' });
    navigate('/dashboard');
  };

  return (
    <div className="kb-container">
      <header className="kb-header">
        <div>
          <h1>Platform Clients</h1>
          <p>You have <strong>{businesses.length}</strong> active clients in the system.</p>
        </div>
      </header>

      <div className="upload-section" style={{ border: 'none', background: 'none', padding: 0 }}>
        <div className="search-bar-container" style={{ width: '100%' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#667781' }} />
            <input 
              type="text" 
              placeholder="Search by email or bot name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', border: '1.5px solid var(--border)', fontSize: '1rem', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      <section className="documents-section" style={{ marginTop: '2rem' }}>
        <div className="document-list">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Client Details</th>
                <th>Bot Name</th>
                <th>Subscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((biz: any) => (
                <tr key={biz.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Mail size={14} color="#64748b" />
                      </div>
                      <span style={{ fontSize: '0.9rem' }}>{biz.owner_email}</span>
                    </div>
                  </td>
                  <td>
                    <div className="doc-name">
                      <Building2 size={16} color="var(--primary-dark)" />
                      {biz.name}
                    </div>
                  </td>
                  <td>
                    {biz.has_plan ? (
                      <span className="badge success">
                        <CreditCard size={12} /> {biz.plan_name}
                      </span>
                    ) : (
                      <span className="badge warning">No Plan</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-icon" title="View Console" onClick={() => handleSwitchToBot(biz)}>
                        <ExternalLink size={16} />
                      </button>
                      <button className="btn-icon delete" title="Delete" onClick={() => setConfirmDelete({id: biz.id, name: biz.name})}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBusinesses.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        title="Confirm Deletion"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ color: '#475569', marginBottom: '1.5rem' }}>
            Are you sure you want to delete <strong>{confirmDelete?.name}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button className="secondary-btn" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="primary-btn" style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }} onClick={handleDeleteBusiness}>Delete Account</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
