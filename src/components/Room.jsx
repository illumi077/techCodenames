import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../utils/socket";
import "../styles/Room.css";
import HintDisplay from "./HintDisplay";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function Room() {
  const { roomCode } = useParams();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);
  const navigate = useNavigate();

  // **Global Timer Sync Logic**
  useEffect(() => {
    if (roomData?.gameState === "active" && roomData?.timerStartTime) {
      const interval = setInterval(() => {
        const timeElapsed =
          Date.now() - new Date(roomData.timerStartTime).getTime();
        const remainingTime = Math.max(61 - Math.floor(timeElapsed / 1000), 0);

        setTimer(remainingTime);

        // ✅ Ensure a brief delay before triggering timerExpired
        if (remainingTime <= 0) {
          setTimeout(() => {
            console.log("⏳ Timer expired, switching turn...");
            socket.emit("timerExpired", { roomCode });
            clearInterval(interval); // ✅ Prevent unnecessary emissions
          }, 200); // ✅ Small buffer delay (200ms) ensures the check stabilizes
        }
      }, 1000);

      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [roomData?.timerStartTime, roomData?.gameState, roomCode]);

  // **Game start failure notification**
  useEffect(() => {
    socket.on("gameStartFailed", ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off("gameStartFailed");
    };
  }, []);

  // **Set up game state listeners**
  useEffect(() => {
    socket.emit("joinRoom", roomCode);

    const fetchRoomData = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/rooms/${roomCode}`);
        const data = await response.json();

        if (response.ok && data.players?.length > 0) {
          setRoomData(data);
          setError("");
        } else {
          setError(data.error || "Room not found.");
          setTimeout(() => navigate("/"), 1000);
        }
      } catch (err) {
        setError("An error occurred while fetching room details.", err);
        setTimeout(() => navigate("/"), 1000);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
    const interval = setInterval(fetchRoomData, 2000);

    socket.on("updatePlayers", (updatedPlayers) => {
      setRoomData((prevData) => ({
        ...prevData,
        players: updatedPlayers,
      }));
    });

    socket.on("updateTile", ({ index }) => {
      setRoomData((prevData) => {
        const updatedRevealedTiles = [...prevData.revealedTiles];
        updatedRevealedTiles[index] = true;
        return {
          ...prevData,
          revealedTiles: updatedRevealedTiles,
        };
      });
    });

    // **Handle game pause & resume**
    socket.on("gamePaused", ({ message }) => {
      alert(message);
      setRoomData((prevData) => ({
        ...prevData,
        gameState: "paused",
      }));
    });

    socket.on("gameResumed", ({ message }) => {
      alert(message);
      setRoomData((prevData) => ({
        ...prevData,
        gameState: "active",
      }));
    });

    socket.on("gameStarted", ({ currentTurnTeam, timerStartTime }) => {
      setRoomData((prevData) => ({
        ...prevData,
        currentTurnTeam,
        timerStartTime,
        gameState: "active",
      }));
    });

    // ✅ Ensuring Timer Syncs on Turn Switch
    socket.on("turnSwitched", ({ currentTurnTeam, timerStartTime }) => {
      console.log(
        `🔄 Turn switched to ${currentTurnTeam}, Timer reset at: ${timerStartTime}`
      );

      setTimeout(() => {
        setRoomData((prevData) => ({
          ...prevData,
          currentTurnTeam,
          timerStartTime,
        }));
      }, 200); // ✅ Add buffer delay to stabilize turn switching
    });

    socket.on("gameEnded", ({ result }) => {
      console.log("🏁 Game Ended:", result); // ✅ Debugging log

      setRoomData((prevData) => ({
        ...prevData,
        gameState: "ended",
        endMessage: result, // ✅ Store message properly in UI
      }));
    });

    return () => {
      socket.off("updatePlayers");
      socket.off("updateTile");
      socket.off("gamePaused");
      socket.off("gameResumed");
      socket.off("gameStarted");
      socket.off("turnSwitched");
      socket.off("gameEnded");
      clearInterval(interval);
    };
  }, [roomCode, navigate]);

  const handleTileClick = (index) => {
    if (
      roomData.gameState === "ended" || // ✅ Prevent clicks after game ends
      roomData.currentTurnTeam !== currentPlayer.team ||
      roomData.revealedTiles[index] ||
      currentPlayer.role === "Spymaster"
    ) {
      return;
    }

    // ✅ Keep existing method while improving stability
    setTimeout(() => {
      setRoomData((prevData) => {
        const updatedRevealedTiles = [...prevData.revealedTiles];
        updatedRevealedTiles[index] = true;
        return {
          ...prevData,
          revealedTiles: updatedRevealedTiles,
        };
      });

      socket.emit("tileClicked", { roomCode, index });
    }, 200); // ✅ Buffer delay improves responsiveness
  };

  const handleStartGame = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/rooms/startGame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to start the game.");
      }
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  const handleLeaveRoom = async () => {
    const username = sessionStorage.getItem("username");
    try {
      const response = await fetch(`${backendUrl}/api/rooms/leave`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, username }),
      });

      const data = await response.json();
      if (response.status === 200) {
        socket.emit("playerLeft", { roomCode, players: data.players });
        sessionStorage.removeItem("username");
        navigate("/");
      } else {
        alert(data.error || "Failed to leave the room.");
      }
    } catch (error) {
      console.error("Error leaving the room:", error);
    }
  };

  if (loading) return <div className="loading">Loading room details...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const currentPlayer = roomData.players.find(
    (player) => player.username === sessionStorage.getItem("username")
  );

  const isSpymaster = currentPlayer?.role === "Spymaster";

  return (
    <div className="room-container">
      <div className="player-info">
        <h2 className="player-name">
          {currentPlayer?.username || "Unknown Player"}
        </h2>
        <p className="player-role">
          {currentPlayer?.role || "Role Unavailable"}
        </p>
        <p className="player-team">
          {currentPlayer?.team || "Team Unavailable"} Team
        </p>
      </div>

      {roomData.gameState === "waiting" &&
        currentPlayer.role === "Spymaster" &&
        currentPlayer.team === "Red" &&
        roomData.players.filter((p) => p.team === "Red" && p.role === "Agent")
          .length > 0 &&
        roomData.players.filter((p) => p.team === "Blue" && p.role === "Agent")
          .length > 0 &&
        roomData.players.some(
          (p) => p.team === "Blue" && p.role === "Spymaster"
        ) && (
          <button className="retro-button start-btn" onClick={handleStartGame}>
            Start Game
          </button>
        )}

      <div className="game-info">
        {roomData.gameState === "active" && roomData?.timerStartTime && (
          <>
            <h3>Current Turn: {roomData.currentTurnTeam} Team</h3>
            <h3>Time Remaining: {timer}s</h3>
          </>
        )}
        {roomData.gameState === "ended" && roomData.endMessage && (
          <div className="end-game-message">
            <h2>{roomData.endMessage}</h2>
          </div>
        )}
      </div>

      {/* ✅ Grid Rendering */}
      <div className="grid">
        {roomData.wordSet.map((word, index) => {
          const tileClass = roomData.revealedTiles[index]
            ? `revealed ${roomData.patterns[index]}`
            : isSpymaster
            ? roomData.patterns[index]
            : "";

          return (
            <div
              key={index}
              className={`tile ${tileClass}`}
              onClick={() => handleTileClick(index)}
            >
              {roomData.revealedTiles[index] ? "" : word}
            </div>
          );
        })}
      </div>

      <div className="player-list">
        <h3>Players in the Room:</h3>
        <ul>
          {roomData.players.map((player, index) => (
            <li key={index} className="player-item">
              <strong>{player.username}</strong> - {player.role} ({player.team}{" "}
              Team)
            </li>
          ))}
        </ul>
      </div>

      <HintDisplay
        roomCode={roomCode}
        currentTurnTeam={roomData.currentTurnTeam}
        currentPlayer={currentPlayer}
      />

      <button className="retro-button" onClick={handleLeaveRoom}>
        Leave Room
      </button>
    </div>
  );
}

export default Room;
