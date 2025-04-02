import React, { useState, useEffect } from 'react';
import { socket } from '../utils/socket'; // Ensure WebSocket connection is centralized
import '../styles/HintDisplay.css'; // Add relevant styles

function HintDisplay({ roomCode, isSpymaster }) {
  const [hint, setHint] = useState('');
  const [currentHint, setCurrentHint] = useState('');

  useEffect(() => {
    socket.on('newHint', (hint) => {
      setCurrentHint(hint);
    });

    return () => {
      socket.off('newHint');
    };
  }, []);

  const handleHintSubmit = () => {
    if (hint.trim()) {
      socket.emit('submitHint', { roomCode, hint });
      setHint('');
    }
  };

  return (
    <div className="hint-container">
      {isSpymaster && (
        <div className="hint-input">
          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Enter your hint..."
          />
          <button onClick={handleHintSubmit}>Submit Hint</button>
        </div>
      )}
      {currentHint && <div className="hint-message">Spymaster Hint: {currentHint}</div>}
    </div>
  );
}

export default HintDisplay;
