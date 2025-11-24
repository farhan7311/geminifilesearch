import React, { useState } from 'react';
import axios from 'axios';

interface QueryInputProps {
  storeId: string;
  onResults: (answer: string, sources: string[]) => void;
}

const QueryInput: React.FC<QueryInputProps> = ({ storeId, onResults }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('query', query);
    formData.append('store_id', storeId);

    try {
      const res = await axios.post('http://localhost:8000/api/query', formData);
      onResults(res.data.llm_answer, res.data.supporting_chunks);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Query failed';
      setError(errorMsg);
      console.error('Query error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <input
        type="text"
        placeholder="Ask a question about your files"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        style={{ width: '300px', padding: '0.5rem' }}
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      {error && <div style={{ color: 'red', marginTop: '0.5rem' }}>{error}</div>}
    </div>
  );
};

export default QueryInput;
