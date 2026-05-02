import React, { useState, useEffect, useCallback } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { Upload, FileText, Trash2, Loader2, Globe, Link as LinkIcon, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Modal } from '../components/Modal';
import './KnowledgeBase.css';

interface Document {
  id: number;
  filename: string;
  created_at: string;
}

export const KnowledgeBase: React.FC = () => {
  const { activeBusiness } = useBusiness();
  console.log("[DEBUG] KnowledgeBase activeBusiness:", activeBusiness);
  const { getAccessToken } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Confirmation state
  const [confirmDelete, setConfirmDelete] = useState<{id: number, filename: string} | null>(null);
  
  // Crawler State
  const [url, setUrl] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!activeBusiness) return;
    setIsLoading(true);
    const token = await getAccessToken();
    try {
      const response = await fetch(`/api/documents/?business_id=${activeBusiness.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDocuments(data);
    } catch (err) { toast.error("Failed to load data"); }
    finally { setIsLoading(false); }
  }, [activeBusiness, getAccessToken]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !activeBusiness) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    const token = await getAccessToken();
    const loadToast = toast.loading(`Uploading ${file.name}...`);
    setIsUploading(true);
    try {
      const res = await fetch(`/api/upload/?business_id=${activeBusiness.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        await fetchDocuments();
        toast.success("Document indexed!", { id: loadToast });
      } else {
        toast.error("Upload failed", { id: loadToast });
      }
    } catch (err) { toast.error("Upload error", { id: loadToast }); }
    finally { setIsUploading(false); e.target.value = ''; }
  };

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !activeBusiness) return;
    
    setIsCrawling(true);
    const token = await getAccessToken();
    const loadToast = toast.loading(`Crawling ${url}...`);
    
    try {
      const res = await fetch('/api/crawl/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ url, business_id: activeBusiness.id })
      });
      
      if (res.ok) {
        await fetchDocuments();
        toast.success("Website indexed!", { id: loadToast });
        setUrl('');
      } else {
        const err = await res.json();
        toast.error(err.detail || "Crawl failed", { id: loadToast });
      }
    } catch (err) { toast.error("Crawl error", { id: loadToast }); }
    finally { setIsCrawling(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { id, filename } = confirmDelete;
    setConfirmDelete(null);

    const token = await getAccessToken();
    const loadToast = toast.loading(`Deleting ${filename}...`);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchDocuments();
        toast.success('Deleted successfully', { id: loadToast });
      } else {
        toast.error("Delete failed", { id: loadToast });
      }
    } catch (err) { toast.error("Error", { id: loadToast }); }
  };

  return (
    <div className="kb-container">
      <header className="kb-header">
        <div>
          <h1>Knowledge Base</h1>
          <p>Train your AI assistant for <strong>{activeBusiness?.name}</strong>.</p>
        </div>
      </header>

      <div className="kb-setup-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        {/* FILE UPLOAD */}
        <div className="upload-section" style={{ padding: 0 }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '700' }}>📄 Upload Files</h3>
          <label className={`upload-card ${isUploading ? 'uploading' : ''}`} style={{ height: '160px' }}>
            <input type="file" onChange={handleFileUpload} disabled={isUploading} accept=".pdf,.txt" hidden />
            <div className="upload-content">
              {isUploading ? <Loader2 className="spin" size={24} /> : <Upload size={24} />}
              <p style={{ fontSize: '0.9rem' }}>{isUploading ? 'Processing...' : 'Upload PDF or TXT'}</p>
            </div>
          </label>
        </div>

        {/* WEB CRAWLER */}
        <div className="crawler-section">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '700' }}>🌐 Connect Website</h3>
          <form onSubmit={handleCrawl} className="crawl-card" style={{ height: '160px', background: 'white', border: '2px dashed var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', gap: '1rem' }}>
             <div style={{ position: 'relative', width: '100%' }}>
                <LinkIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="url" 
                  placeholder="https://your-website.com" 
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                  required
                />
             </div>
             <button type="submit" disabled={isCrawling} className="primary-btn" style={{ width: '100%', justifyContent: 'center' }}>
                {isCrawling ? <Loader2 className="spin" size={18} /> : 'Index Website'}
             </button>
          </form>
        </div>
      </div>

      <section className="documents-section">
        <div className="section-header" style={{ marginBottom: '1.5rem' }}>
           <Search size={18} />
           <h2>Active Knowledge ({documents.length})</h2>
        </div>
        
        {isLoading ? (
          <div className="loading-state"><Loader2 className="spin" /></div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} opacity={0.2} />
            <p>Your Knowledge Base is currently empty.</p>
          </div>
        ) : (
          <div className="document-list">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Source Name</th>
                  <th>Indexed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="doc-name">
                        {doc.filename.startsWith('Crawl:') ? <Globe size={18} color="#3b82f6" /> : <FileText size={18} color="#10b981" />}
                        <span style={{ fontWeight: '600' }}>{doc.filename}</span>
                      </div>
                    </td>
                    <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-icon delete" onClick={() => setConfirmDelete({id: doc.id, filename: doc.filename})}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        title="Remove Knowledge Source"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ color: '#475569', marginBottom: '1.5rem' }}>
            Are you sure you want to delete <strong>{confirmDelete?.filename}</strong>? The bot will no longer be able to answer questions using this data.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button className="secondary-btn" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="primary-btn" style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }} onClick={handleDelete}>Delete Source</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
