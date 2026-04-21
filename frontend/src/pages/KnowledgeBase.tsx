import React, { useState, useEffect, useCallback } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import './KnowledgeBase.css';

interface Document {
  id: number;
  filename: string;
  created_at: string;
}

export const KnowledgeBase: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!activeBusiness) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/?business_id=${activeBusiness.id}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !activeBusiness) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch(`/api/upload/?business_id=${activeBusiness.id}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      await fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="kb-container">
      <header className="kb-header">
        <div>
          <h1>Knowledge Base</h1>
          <p>Upload documents to train your chatbot for <strong>{activeBusiness?.name}</strong>.</p>
        </div>
      </header>

      <div className="upload-section">
        <label className={`upload-card ${isUploading ? 'uploading' : ''}`}>
          <input 
            type="file" 
            onChange={handleFileUpload} 
            disabled={isUploading} 
            accept=".pdf,.txt"
            hidden 
          />
          {isUploading ? (
            <div className="upload-content">
              <Loader2 className="icon spin" size={32} />
              <p>Processing and indexing document...</p>
            </div>
          ) : (
            <div className="upload-content">
              <Upload className="icon" size={32} />
              <p>Click or drag to upload knowledge files</p>
              <span>Supports PDF, TXT (Max 10MB)</span>
            </div>
          )}
        </label>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <section className="documents-section">
        <h2>Uploaded Documents</h2>
        
        {isLoading ? (
          <div className="loading-state">
            <Loader2 className="spin" />
            <span>Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="document-list">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Uploaded At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="doc-name">
                        <FileText size={18} />
                        {doc.filename}
                      </div>
                    </td>
                    <td>{new Date(doc.created_at).toLocaleString()}</td>
                    <td>
                      <span className="badge success">
                        <CheckCircle size={12} />
                        Indexed
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon delete" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
