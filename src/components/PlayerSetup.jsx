import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/PlayerSetup.css';

function PlayerSetup() {
  const { roomCode } = useParams(); // Access the roomCode from the URL
  const [name, setName] = useState('');
  const [team, setTeam] = useState('Red'); // Default team
  const [role, setRole] = useState('Agent'); // Default role
  const navigate = useNavigate();

  const handleJoinRoom = async () => {
    if (!name) {
      alert('Please enter your name!');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomCode, username: name, team, role }),
      });

      const data = await response.json();
      if (response.ok) {
        navigate(`/room/${roomCode}`); // Redirect to the game room grid
      } else {
        alert(data.error || 'Failed to join room.');
      }
    } catch (error) {
      alert('An error occurred while joining the room. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="player-setup-container">
      <h2>Set Up Your Details</h2>
      <input
        type="text"
        placeholder="Enter Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select value={team} onChange={(e) => setTeam(e.target.value)}>
        <option value="Red">Red Team</option>
        <option value="Blue">Blue Team</option>
      </select>
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="Agent">Agent</option>
        <option value="Spymaster">Spymaster</option>
      </select>
      <button onClick={handleJoinRoom}>Join Room</button>
    </div>
  );
}

export default PlayerSetup;
