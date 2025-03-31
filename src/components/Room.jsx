import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import '../styles/Room.css';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'; // Fallback to localhost if undefined
const socket = io(backendUrl, {
  transports: ['websocket'], // Enforce WebSocket-only transport
});

function Room() {
  const { roomCode } = useParams(); // Access roomCode from the URL
  const [roomData, setRoomData] = useState(null); // Store room data
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(''); // Error state
  const [timer, setTimer] = useState(45); // Timer for the current turn
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit('joinRoom', roomCode);

    const fetchRoomData = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/rooms/${roomCode}`);
        const data = await response.json();
    
        if (response.ok && data.players?.length > 0) {
          // Ensure the backend response contains valid room data
          console.log('Fetched Room Data:', data);
          setRoomData(data); // Update room data
          setError(''); // Clear any previous errors
        } else {
          console.error('Error fetching room details:', data.error);
          setError(data.error || 'Room not found.');
          // Delay navigation slightly to allow error messages to display
          setTimeout(() => navigate('/'), 1000);
        }
      } catch (err) {
        console.error('Fetch Room Data Error:', err);
        setError('An error occurred while fetching room details.');
        // Allow retries or display error feedback
        setTimeout(() => navigate('/'), 1000);
      } finally {
        setLoading(false); // Stop loading state
      }
    };
    

    // Fetch data immediately on mount
    fetchRoomData();

    // Set up periodic polling every 2 seconds
    const interval = setInterval(fetchRoomData, 2000);

    // Socket.IO listeners for real-time updates
    socket.on('updatePlayers', (updatedPlayers) => {
      setRoomData((prevRoomData) => ({
        ...prevRoomData,
        players: updatedPlayers,
      }));
    });

    socket.on('updateTile', ({ index }) => {
      setRoomData((prevData) => {
        const updatedRevealedTiles = [...prevData.revealedTiles];
        updatedRevealedTiles[index] = true;
        return {
          ...prevData,
          revealedTiles: updatedRevealedTiles,
        };
      });
    });

    socket.on('gameStarted', ({ currentTurnTeam, timerStartTime }) => {
      setRoomData((prevData) => ({
        ...prevData,
        currentTurnTeam,
        timerStartTime,
        gameState: 'active',
      }));
      setTimer(45); // Reset timer when the game starts
    });

    socket.on('turnSwitched', ({ currentTurnTeam, timerStartTime }) => {
      setRoomData((prevData) => ({
        ...prevData,
        currentTurnTeam,
        timerStartTime,
      }));
      setTimer(45); // Reset timer when the turn switches
    });

    socket.on('gameEnded', ({ result }) => {
      alert(result); // Notify players of the game result
      setRoomData((prevData) => ({
        ...prevData,
        gameState: 'ended',
      }));
    });

    // Cleanup listeners and interval on component unmount
    return () => {
      socket.off('updatePlayers');
      socket.off('updateTile');
      socket.off('gameStarted');
      socket.off('turnSwitched');
      socket.off('gameEnded');
      clearInterval(interval); // Stop periodic fetching
    };
  }, [roomCode, navigate]);

  const handleEndTurn = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/rooms/endTurn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to end turn.');
      }
    } catch (error) {
      console.error('Error ending turn:', error);
    }
  }, [roomCode]);

  useEffect(() => {
    // Timer countdown logic
    if (timer > 0 && roomData?.gameState === 'active') {
      const countdown = setTimeout(() => setTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(countdown);
    } else if (timer === 0) {
      handleEndTurn(); // Automatically end the turn when the timer runs out
    }
  }, [timer, roomData, handleEndTurn]);

  const handleStartGame = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/rooms/startGame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to start the game.');
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleTileClick = (index) => {
    if (
      roomData.currentTurnTeam === currentPlayer.team &&
      !roomData.revealedTiles[index] &&
      currentPlayer.role !== 'Spymaster'
    ) {
      setRoomData((prevData) => {
        const updatedRevealedTiles = [...prevData.revealedTiles];
        updatedRevealedTiles[index] = true;
        return {
          ...prevData,
          revealedTiles: updatedRevealedTiles,
        };
      });

      socket.emit('tileRevealed', { roomCode, index });
    }
  };

  const handleLeaveRoom = async () => {
    const username = sessionStorage.getItem('username');
    try {
      const response = await fetch(`${backendUrl}/api/rooms/leave`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, username }),
      });

      const data = await response.json();
      if (response.status === 200) {
        socket.emit('playerLeft', { roomCode, players: data.players });
        sessionStorage.removeItem('username');
        navigate('/');
      } else {
        alert(data.error || 'Failed to leave the room.');
      }
    } catch (error) {
      console.error('Error leaving the room:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading room details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const currentPlayer = roomData.players.find(
    (player) => player.username === sessionStorage.getItem('username')
  );

  const isSpymaster = currentPlayer?.role === 'Spymaster';

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
        currentPlayer.team === "Red" &&
        currentPlayer.role === "Agent" && (
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

      <div className="grid">
        {roomData.wordSet.map((word, index) => {
          const tileClass = isSpymaster
            ? roomData.patterns[index]
            : roomData.revealedTiles[index]
            ? roomData.patterns[index]
            : "";

          return (
            <div
              key={index}
              className={`tile ${tileClass} ${
                roomData.currentTurnTeam !== currentPlayer.team ? "frozen" : ""
              }`}
              onClick={() => handleTileClick(index)}
            >
              {word}
            </div>
          );
        })}
      </div>

      {roomData.gameState === "active" &&
        roomData.currentTurnTeam === currentPlayer.team &&
        currentPlayer.role === "Agent" && (
          <button className="retro-button" onClick={handleEndTurn}>
            End Turn
          </button>
        )}

      <div className="player-list">
        <h3>Players in the Room:</h3>
        <ul>
          {roomData.players.map((player, index) => (
            <li key={index} className="player-item">
              <strong>{player.username}</strong>
              <span>
                {" "}
                - {player.role} ({player.team} Team)
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button className="retro-button" onClick={handleLeaveRoom}>
        Leave Room
      </button>
    </div>
  );
}

export default Room;
