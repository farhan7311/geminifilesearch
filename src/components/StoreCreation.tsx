import React from 'react';
import axios from 'axios';

interface StoreCreationProps {
  onStoreCreated: (storeId: string) => void;
}

const StoreCreation: React.FC<StoreCreationProps> = ({ onStoreCreated }) => {
  const handleCreateStore = async () => {
    const res = await axios.post('http://localhost:8000/api/create-store');
    onStoreCreated(res.data.store_id);
  };

  return (
    <div>
      <button onClick={handleCreateStore}>Create Store</button>
    </div>
  );
};

export default StoreCreation;
