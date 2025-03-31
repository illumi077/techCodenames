import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css'; // We’ll style this later

function Home() {
  return (
    <div className="home-container">
      <h1 className="retro-title">Welcome to Tech Codenames</h1>
      <div className="retro-buttons">
        <Link to="/create-room" className="retro-button">Create Room</Link>
        <Link to="/join-room" className="retro-button">Join Room</Link>
      </div>
    </div>
  );
}

export default Home;
