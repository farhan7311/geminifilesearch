import React from 'react';

interface AnswerDisplayProps {
  answer: string;
  sources: string[];
}

const AnswerDisplay: React.FC<AnswerDisplayProps> = ({ answer, sources }) => (
  <div>
    <h3>AI Answer</h3>
    <div style={{ background: "#eee", padding: "1em", marginBottom: "1em" }}>{answer}</div>
    <h4>Supporting Context from Your Files:</h4>
    <ul>
      {sources.map((src, idx) => <li key={idx}>{src}</li>)}
    </ul>
  </div>
);

export default AnswerDisplay;
