import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css'; // We’ll style this later
import Header from "./Header"

function Home() {
  return (
    <>
      <Header />
      <div className="home-container">
        <br /><br /><br /><br /><br /><br />
        <h1 className="retro-title"><span className='black'>Welcome to the Final Round of</span>  <br />
        <br /><span className='back-img'>ESCAPE ROOMS</span></h1>
        <h2 className='retro-title'> <br /><span className='red'>Code</span><span className='blue'>Names</span></h2>
        <div className="retro-buttons">
          <Link to="/create-room" className="retro-button">Create Room</Link>
          <Link to="/join-room" className="retro-button">Join Room</Link>
        </div>
      </div>
    </>
  );
}

export default Home;
