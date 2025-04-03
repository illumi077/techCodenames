import React, { useState, useEffect } from "react";
import { socket } from "../utils/socket"; // Shared WebSocket instance
import "../styles/HintDisplay.css";

function HintDisplay({ roomCode, currentTurnTeam, currentPlayer }) {
  const [hint, setHint] = useState("");
  const [currentHint, setCurrentHint] = useState("");

  useEffect(() => {
    socket.on("newHint", (hint) => {
      setCurrentHint(hint);
    });

    return () => {
      socket.off("newHint");
    };
  }, []);

  const handleHintSubmit = () => {
    if (hint.trim() && currentPlayer.role === "Spymaster" && currentPlayer.team === currentTurnTeam) {
      console.log("Submitting hint:", { roomCode, hint, username: currentPlayer.username });
      socket.emit("submitHint", { roomCode, hint, username: currentPlayer.username });
      setHint("");
    }
  };

  return (
    <div className="hint-container">
      {currentPlayer.role === "Spymaster" && currentPlayer.team === currentTurnTeam && (
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
      {currentHint && <div className="hint-message">{currentHint}</div>}
    </div>
  );
}

export default HintDisplay;
