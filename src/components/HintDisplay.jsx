import React, { useState, useEffect } from "react";
import { socket } from "../utils/socket";
import "../styles/HintDisplay.css";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function HintDisplay({ roomCode, currentTurnTeam, currentPlayer, gameState }) {
  const [hint, setHint] = useState("");
  const [currentHint, setCurrentHint] = useState("");
  const [hintSubmitted, setHintSubmitted] = useState(false);

  useEffect(() => {
    console.log("🧐 HintDisplay Mounted - Fetching hint from DB...");

    // ✅ Fetch hint from the database on mount
    fetch(`${backendUrl}/api/rooms/${roomCode}/hint`)
      .then((res) => res.json())
      .then((data) => {
        console.log("📢 Hint fetched from DB:", data.currentHint);
        setCurrentHint(data.currentHint || "");
      })
      .catch((error) => console.error("⚠️ Error fetching hint:", error));

    const handleNewHint = (hint) => {
      console.log("📢 Received Hint from Backend:", hint);
      setCurrentHint(hint);
      setHintSubmitted(true);
    };

    const handleTurnSwitched = () => {
      console.log("🔄 Turn switched - Clearing hint...");
      setTimeout(() => {
        setCurrentHint("");
        setHintSubmitted(false);
      }, 1500);
    };

    socket.on("newHint", handleNewHint);
    socket.on("turnSwitched", handleTurnSwitched);

    return () => {
      socket.off("newHint", handleNewHint);
      socket.off("turnSwitched", handleTurnSwitched);
    };
  }, [roomCode, currentTurnTeam]);

  const handleHintSubmit = () => {
    if (
      hint.trim() &&
      currentPlayer.role === "Spymaster" &&
      currentPlayer.team === currentTurnTeam &&
      gameState === "active" &&
      !hintSubmitted
    ) {
      console.log("📝 Submitting hint:", hint);
      socket.emit("submitHint", { roomCode, hint, username: currentPlayer.username });
      setHint("");
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
          <h2>{currentHint}</h2>
        </div>
      )}
    </div>
  );
}

export default HintDisplay;
