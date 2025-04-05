import React, { useState, useEffect } from "react";
import { socket } from "../utils/socket";
import "../styles/HintDisplay.css";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

function HintDisplay({ roomCode, currentPlayer }) {
  const [hint, setHint] = useState("");
  const [currentHint, setCurrentHint] = useState("");

  const fetchHintFromDB = React.useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/rooms/${roomCode}/hint`);
      const data = await response.json();
      console.log("📢 Hint Fetched:", data.currentHint);
      setCurrentHint(data.currentHint || "");
    } catch (error) {
      console.error("⚠️ Error fetching hint:", error);
    }
  }, [roomCode]);

  useEffect(() => {
    fetchHintFromDB(); // ✅ Fetch immediately when mounted

    const interval = setInterval(fetchHintFromDB, 5000); // ✅ Fetch every 5 seconds
    return () => clearInterval(interval); // ✅ Clean up interval on unmount
  }, [fetchHintFromDB]);

  const handleHintSubmit = () => {
    if (hint.trim() && currentPlayer.role === "Spymaster") {
      console.log("📝 Submitting hint:", hint);
      socket.emit("submitHint", { roomCode, hint, username: currentPlayer.username });
      setHint("");
      setTimeout(fetchHintFromDB, 1000); // ✅ Fetch again right after submitting
    }
  };

  return (
    <div className="hint-container">
      {currentPlayer.role === "Spymaster" && (
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
