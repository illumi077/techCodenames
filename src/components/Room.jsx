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
  const [timer, setTimer] = useState(50);
  const navigate = useNavigate();

  // **Timer expiration logic**
  useEffect(() => {
    if (timer > 0 && roomData?.gameState === "active") {
      const countdown = setTimeout(() => setTimer((prev) => prev - 1), 999);
      return () => clearTimeout(countdown);
    } else if (timer === 0 && roomData?.gameState === "active") {
      socket.emit("timerExpired", { roomCode });
    }
  }, [timer, roomData, roomCode]);

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
        setError("An error occurred while fetching room details.",err);
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
      setTimer(50); //  Reset timer on game resume
    });

    socket.on("gameStarted", ({ currentTurnTeam, timerStartTime }) => {
      setRoomData((prevData) => ({
        ...prevData,
        currentTurnTeam,
        timerStartTime,
        gameState: "active",
      }));
      setTimer(50);
    });

    socket.on("turnSwitched", ({ currentTurnTeam, timerStartTime }) => {
      console.log(`Turn switched to ${currentTurnTeam}, Timer reset at: ${timerStartTime}`);

      setRoomData((prevData) => ({
        ...prevData,
        currentTurnTeam,
        timerStartTime,
      }));

      setTimer(50); //  Ensure the timer properly resets when turns switch
    });

    socket.on("gameEnded", ({ result }) => {
      alert(result);
      setRoomData((prevData) => ({
        ...prevData,
        gameState: "ended",
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
      roomData.currentTurnTeam === currentPlayer.team &&
      !roomData.revealedTiles[index] &&
      currentPlayer.role !== "Spymaster"
    ) {
      setRoomData((prevData) => {
        const updatedRevealedTiles = [...prevData.revealedTiles];
        updatedRevealedTiles[index] = true;
        return {
          ...prevData,
          revealedTiles: updatedRevealedTiles,
        };
      });

      socket.emit("tileClicked", { roomCode, index });
    }
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
        <h2 className="player-name">{currentPlayer?.username || "Unknown Player"}</h2>
        <p className="player-role">{currentPlayer?.role || "Role Unavailable"}</p>
        <p className="player-team">{currentPlayer?.team || "Team Unavailable"} Team</p>
      </div>

      {roomData.gameState === "waiting" &&
        currentPlayer.role === "Spymaster" && (
          <button className="retro-button" onClick={handleStartGame}>
            Start Game
          </button>
        )}

      <div className="game-info">
        {roomData.gameState === "active" && (
          <>
            <h3>Current Turn: {roomData.currentTurnTeam} Team</h3>
            <h3>Time Remaining: {timer}s</h3>
          </>
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
            <div key={index} className={`tile ${tileClass}`} onClick={() => handleTileClick(index)}>
              {roomData.revealedTiles[index] ? "" : word}
            </div>
          );
        })}
      </div>

      <HintDisplay
        roomCode={roomCode}
        currentTurnTeam={roomData.currentTurnTeam}
        currentPlayer={currentPlayer}
      />

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

      <button className="retro-button" onClick={handleLeaveRoom}>Leave Room</button>
    </div>
  );
}

export default Room;
