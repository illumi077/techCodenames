import React, { useState, useEffect, useCallback } from "react";
import { socket } from "../utils/socket";
import "../styles/HintDisplay.css";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function HintDisplay({ roomCode, currentTurnTeam, currentPlayer, gameState }) {
  const [hint, setHint] = useState("");
  const [currentHint, setCurrentHint] = useState("");
  const [hintSubmitted, setHintSubmitted] = useState(false);

  // ✅ Function to fetch hint from DB
  const fetchHintFromDB = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/rooms/${roomCode}/hint`);
      const data = await response.json();
      setCurrentHint(data.currentHint || "");
    } catch (error) {
      console.error("Error fetching hint:", error);
    }
  }, [roomCode]);

  useEffect(() => {
    fetchHintFromDB(); // ✅ Fetch hint immediately on mount

    const interval = setInterval(() => {
      fetchHintFromDB();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchHintFromDB]);

  useEffect(() => {
    const handleNewHint = (hint) => {
      setCurrentHint(hint);
      setHintSubmitted(true);
    };

    socket.on("newHint", handleNewHint);

    return () => {
      socket.off("newHint", handleNewHint);
    };
  }, []);

  const handleHintSubmit = () => {
    if (
      hint.trim() &&
      currentPlayer.role === "Spymaster" &&
      currentPlayer.team === currentTurnTeam &&
      gameState === "active" &&
      !hintSubmitted
    ) {
      socket.emit("submitHint", { roomCode, hint, username: currentPlayer.username });

      setHint("");
      setHintSubmitted(true);

      setTimeout(fetchHintFromDB, 1000); // ✅ Fetch hint again after submitting
    }
  };

  return (
    <div className="hint-container">
      {currentPlayer.role === "Spymaster" &&
        currentPlayer.team === currentTurnTeam &&
        gameState === "active" &&
        !hintSubmitted && (
          <div className="retro-input">
            <input type="text" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="Enter your hint..." />
            <button className="retro-button" onClick={handleHintSubmit}>Submit Hint</button>
          </div>
        )}

      {currentHint && (
        <div className="hint-message">
          <h2>{currentTurnTeam} Spymaster's Hint: {currentHint}</h2>
        </div>
      )}
    </div>
  );
}

export default HintDisplay;
