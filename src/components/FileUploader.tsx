import React, { useState, useRef } from 'react';
import axios from 'axios';

interface FileUploaderProps {
  storeId: string;
  onUploadComplete: (filenames: string[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ storeId, onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files first');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));
    formData.append('store_id', storeId);

    try {
      const res = await axios.post('http://localhost:8000/api/upload', formData);
      if (res.data.success) {
        setSuccess(`Successfully uploaded: ${res.data.files.join(', ')}`);
        onUploadComplete(res.data.files || []);
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setError(res.data.error || 'Upload failed');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Upload failed';
      setError(errorMsg);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileSelect}
      />
      <button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
        {uploading ? 'Uploading...' : 'Upload Files'}
      </button>
      {selectedFiles.length > 0 && !success && (
        <div style={{ color: 'blue' }}>
          Selected: {selectedFiles.map(f => f.name).join(', ')}
        </div>
      )}
      {success && <div style={{ color: 'green', fontWeight: 'bold' }}>{success}</div>}
      {error && <div style={{ color: 'red', fontWeight: 'bold' }}>Error: {error}</div>}
    </div>
  );
};

export default FileUploader;
