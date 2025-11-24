import React, { useState } from 'react';
import StoreCreation from './components/StoreCreation';
import FileUploader from './components/FileUploader';
import QueryInput from './components/QueryInput';
import AnswerDisplay from './components/AnswerDisplay';

const App: React.FC = () => {
  const [storeId, setStoreId] = useState<string>('');
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string>('');
  const [sources, setSources] = useState<string[]>([]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Gemini File Search</h1>
      {!storeId && <StoreCreation onStoreCreated={setStoreId} />}
      {storeId && (
        <>
          <h4>Store ID: {storeId}</h4>
          <FileUploader storeId={storeId} onUploadComplete={setUploaded} />
          {uploaded.length > 0 && (
            <div>Uploaded: {uploaded.join(', ')}</div>
          )}
          <QueryInput
            storeId={storeId}
            onResults={(ans, ctx) => {
              setAnswer(ans);
              setSources(ctx);
            }}
          />
          {(answer || sources.length > 0) && (
            <AnswerDisplay answer={answer} sources={sources} />
          )}
        </>
      )}
    </div>
  );
};

export default App;
