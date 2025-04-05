import React, { useState, useEffect } from "react";
import { socket } from "../utils/socket";
import "../styles/HintDisplay.css";

function HintDisplay({ roomCode, currentTurnTeam, currentPlayer, gameState }) {
  const [hint, setHint] = useState("");
  const [currentHint, setCurrentHint] = useState("");
  const [hintSubmitted, setHintSubmitted] = useState(false);

  useEffect(() => {
    console.log("🧐 HintDisplay Mounted, Props Received:", { roomCode, currentTurnTeam, currentPlayer, gameState });

    const handleNewHint = (hint) => {
      console.log("📢 Received Hint from Backend:", hint);
      setCurrentHint(hint);
      setHintSubmitted(true);
    };

    const handleTurnSwitched = () => {
      setTimeout(() => {
        if (currentHint) {
          console.log("🔄 Clearing hint after turn switch...");
          setCurrentHint("");
          setHintSubmitted(false);
        }
      }, 1500);
    };

    const handleGamePaused = () => {
      console.log("⏸️ Game Paused: Blocking hints...");
      setCurrentHint("Game is paused. Waiting for players...");
    };

    const handleGameResumed = () => {
      console.log("▶️ Game Resumed: Resetting hint...");
      setCurrentHint("");
      setHintSubmitted(false);
    };

    socket.on("newHint", handleNewHint);
    socket.on("turnSwitched", handleTurnSwitched);
    socket.on("gamePaused", handleGamePaused);
    socket.on("gameResumed", handleGameResumed);

    return () => {
      console.log("🚮 Cleaning up HintDisplay listeners...");
      socket.off("newHint", handleNewHint);
      socket.off("turnSwitched", handleTurnSwitched);
      socket.off("gamePaused", handleGamePaused);
      socket.off("gameResumed", handleGameResumed);
    };
  }, [roomCode, currentTurnTeam, gameState]);

  useEffect(() => {
    socket.on("hintRejected", ({ message }) => {
      console.log("🚫 Hint Rejected:", message);
      alert(message);
    });

    return () => {
      socket.off("hintRejected");
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
      console.log("📝 Submitting hint:", {
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
    } else {
      console.log("🚫 Hint submission blocked due to conditions.");
    }
  };

  return (
    <div className="hint-container">
      {currentPlayer.role === "Spymaster" &&
        currentPlayer.team === currentTurnTeam &&
        gameState === "active" &&
        !hintSubmitted && (
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

      {currentHint && (
        <div className="hint-message">
          {console.log("🖥️ Rendering Hint Message:", currentHint)}
          <h2>{currentHint}</h2>
        </div>
      )}
    </div>
  );
}

export default HintDisplay;
