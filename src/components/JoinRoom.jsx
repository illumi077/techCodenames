import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/JoinRoom.css'; // Import styling for JoinRoom
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
import Header from "./Header"

function JoinRoom() {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('Agent'); // Default role
  const [team, setTeam] = useState('Red'); // Default team
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = async () => {
    setErrorMessage('');
    if (!roomCode || !username) {
      setErrorMessage('Room code and username are required!');
      return;
    }

    setLoading(true);
    try {
      // Fetch the current room details to check for an existing Spymaster
      const roomResponse = await fetch(`${backendUrl}/api/rooms/${roomCode}`);
      const roomData = await roomResponse.json();

      if (!roomResponse.ok) {
        setErrorMessage(roomData.error || 'Room not found.');
        setLoading(false);
        return;
      }

      // Restrict Spymaster role if one already exists for the selected team
      if (role === 'Spymaster') {
        const existingSpymaster = roomData.players.find(
          (player) => player.role === 'Spymaster' && player.team === team
        );
        if (existingSpymaster) {
          setErrorMessage(`A Spymaster already exists for the ${team} team!`);
          setLoading(false);
          return;
        }
      }

      // Proceed with joining the room
      const joinResponse = await fetch(`${backendUrl}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          username,
          role,
          team,
        }),
      });

      const joinData = await joinResponse.json();
      if (joinResponse.ok) {
        sessionStorage.setItem('username', username); // Store the player's username in sessionStorage
        navigate(`/room/${roomCode}`); // Redirect to the room
      } else {
        setErrorMessage(joinData.error || 'Failed to join the room.');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      console.error('Join Room Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="join-room-container">
        <h2 className="join-title">Join a Room</h2>
        <input
          type="text"
          placeholder="Enter Room Code"
          className="retro-input"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter Your Name"
          value={username}
          className="retro-input"
          onChange={(e) => setUsername(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="Agent">Agent</option>
          <option value="Spymaster">Spymaster</option>
        </select>
        <select value={team} onChange={(e) => setTeam(e.target.value)}>
          <option value="Red">Red Team</option>
          <option value="Blue">Blue Team</option>
        </select>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button onClick={handleJoinRoom} disabled={loading} className="retro-button">
          {loading ? 'Joining...' : 'Join Room'}
        </button>
      </div>
    </>
  );
}

export default JoinRoom;
