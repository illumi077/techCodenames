import React, { useState, useEffect } from "react";
import { socket } from "../utils/socket";
import "../styles/HintDisplay.css";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function HintDisplay({ roomCode, currentTurnTeam, currentPlayer, gameState }) {
  const [hint, setHint] = useState("");
  const [currentHint, setCurrentHint] = useState("");
  const [hintSubmitted, setHintSubmitted] = useState(false);

  // ✅ Function to fetch hint from DB
  const fetchHintFromDB = async () => {
    console.log("📡 Fetching hint from DB...");
    try {
      const response = await fetch(`${backendUrl}/api/rooms/${roomCode}/hint`);
      const data = await response.json();
      console.log("📢 Fetched Hint:", data.currentHint);
      setCurrentHint(data.currentHint || "");
    } catch (error) {
      console.error("⚠️ Error fetching hint:", error);
    }
  };

  useEffect(() => {
    console.log("🧐 HintDisplay Mounted - Initial Hint Fetch");
    fetchHintFromDB(); // ✅ Fetch hint immediately on mount

    // ✅ Set up periodic fetching every 5 seconds
    const interval = setInterval(() => {
      fetchHintFromDB();
    }, 5000);

    return () => {
      console.log("🚮 Cleaning up Hint Fetch Interval...");
      clearInterval(interval);
    };
  }, [roomCode]);

  useEffect(() => {
    console.log("📡 Setting up socket listeners...");
    
    const handleNewHint = (hint) => {
      console.log("📢 Received Hint via Socket:", hint);
      setCurrentHint(hint);
      setHintSubmitted(true);
    };

    socket.on("newHint", handleNewHint);

    return () => {
      console.log("🚮 Cleaning up socket listeners...");
      socket.off("newHint", handleNewHint);
    };
  }, []);

  const handleHintSubmit = () => {
    console.log("🔎 Checking if hint submission is valid...");
    if (
      hint.trim() &&
      currentPlayer.role === "Spymaster" &&
      currentPlayer.team === currentTurnTeam &&
      gameState === "active" &&
      !hintSubmitted
    ) {
      console.log("📝 Submitting hint:", { roomCode, hint, username: currentPlayer.username });

      socket.emit("submitHint", { roomCode, hint, username: currentPlayer.username });

      setHint("");
      setHintSubmitted(true);
      
      setTimeout(fetchHintFromDB, 1000); // ✅ Fetch hint again after submitting
    }
  };

  return (
    <div className="hint-container">
      {console.log("🔎 Rendering HintDisplay - Current Hint:", currentHint, "Hint Submitted:", hintSubmitted)}

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

      {/* ✅ Button to manually fetch hint */}
      <button className="retro-button" onClick={fetchHintFromDB}>Fetch Hint Manually</button>
    </div>
  );
}

export default HintDisplay;
