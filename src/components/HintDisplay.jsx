import React, { useState, useEffect } from "react";
import { socket } from "../utils/socket";
import "../styles/HintDisplay.css";

function HintDisplay({ roomCode, currentTurnTeam, currentPlayer, gameState }) {
  const [hint, setHint] = useState("");
  const [currentHint, setCurrentHint] = useState("");

  useEffect(() => {
    const handleNewHint = (hint) => {
      if (hint !== "") {
        setCurrentHint(hint); // Set new hint only if it's valid
      }
    };

    const handleTurnSwitched = () => {
      setTimeout(() => setCurrentHint(""), 500); // Ensures smooth turn transition before clearing
    };

    const handleGamePaused = () => {
      setCurrentHint("Game is paused. Waiting for players...");
    };

    const handleGameResumed = () => {
      setCurrentHint(""); // Clear paused message when game resumes
    };

    socket.on("newHint", handleNewHint);
    socket.on("turnSwitched", handleTurnSwitched);
    socket.on("gamePaused", handleGamePaused);
    socket.on("gameResumed", handleGameResumed);

    return () => {
      socket.off("newHint", handleNewHint);
      socket.off("turnSwitched", handleTurnSwitched);
      socket.off("gamePaused", handleGamePaused);
      socket.off("gameResumed", handleGameResumed);
    };
  }, []);

  const handleHintSubmit = () => {
    if (
      hint.trim() &&
      currentPlayer.role === "Spymaster" &&
      currentPlayer.team === currentTurnTeam &&
      gameState === "active"
    ) {
      console.log("Submitting hint:", {
        roomCode,
        hint,
        username: currentPlayer.username,
      });
      socket.emit("submitHint", {
        roomCode,
        hint,
        username: currentPlayer.username,
      });
      setHint("");
    }
  };

  return (
    <div className="hint-container">
      {currentPlayer.role === "Spymaster" &&
        currentPlayer.team === currentTurnTeam &&
        gameState === "active" && (
          <div className="retro-input">
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Enter your hint..."
            />
            <button className="retro-button" onClick={handleHintSubmit}>
              Submit Hint
            </button>
          </div>
        )}
      {currentHint && <div className="hint-message">{currentHint}</div>}
    </div>
  );
}

export default HintDisplay;
