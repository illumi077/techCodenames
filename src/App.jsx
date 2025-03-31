import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import PlayerSetup from './components/PlayerSetup'; // Import the new component
import Room from './components/Room';
import './styles/index.css';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/join-room" element={<JoinRoom />} />
        <Route path="/room/:roomCode/setup" element={<PlayerSetup />} /> {/* New route added */}
        <Route path="/room/:roomCode" element={<Room />} />
      </Routes>
    </div>
  );
}

export default App;
