import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "./Header"
import '../styles/CreateRoom.css'; // Ensure your styles are imported correctly
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
function CreateRoom() {
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');
  const [team, setTeam] = useState('Red'); // Default team
  const [role, setRole] = useState('Agent'); // Default role
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const validateRoomCode = (code) => /^[a-zA-Z0-9]{4,}$/.test(code);

  const handleCreateRoom = async () => {
    setErrorMessage(''); // Clear previous error messages
    if (!roomCode || !name) {
      setErrorMessage('Room code and name cannot be empty!');
      return;
    }

    if (!validateRoomCode(roomCode)) {
      setErrorMessage('Room code must be at least 4 alphanumeric characters!');
      return;
    }

    setLoading(true); // Start loading state
    try {
      const requestBody = {
        roomCode,
        creator: { username: name, team, role }, // Add creator details
      };

      console.log('Create Room Request Body:', requestBody); // Debugging log

      // Use environment variable for backend URL
      const response = await fetch(`${backendUrl}/api/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Create Room Response:', data); // Debugging log

      if (response.status === 201) {
        sessionStorage.setItem('username', name); // Save player details
        navigate(`/room/${data.roomCode}`); // Redirect to the room
      } else {
        setErrorMessage(data.error || 'Failed to create room.');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      console.error('Create Room Error:', error);
    } finally {
      setLoading(false); // Stop loading state
    }
  };

  return (
    <>

      <Header />
      <div className="create-room-container">
        <h2 className="create-title">Create a Room</h2>
        <input
          className="retro-input"
          type="text"
          placeholder="Enter Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />
        <input
          className="retro-input"
          type="text"
          placeholder="Enter Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="retro-input"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
        >
          <option value="Red">Red Team</option>
          <option value="Blue">Blue Team</option>
        </select>
        <select
          className="retro-input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="Agent">Agent</option>
          <option value="Spymaster">Spymaster</option>
        </select>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button
          className="retro-button"
          onClick={handleCreateRoom}
          disabled={loading} // Disable button during loading
        >
          {loading ? 'Creating...' : 'Create Room'}
        </button>
      </div>
    </>
  );
}

export default CreateRoom;
