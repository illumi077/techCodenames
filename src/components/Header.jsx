import React from "react";
import '../styles/Header.css';
import logo from "../assets/logo.png"
import logo1 from "../assets/logo1.png"

function Header(){
    return (
        <>
            <header>
                <div className="header">
                    <div className="logo-div"><img src={logo} alt="logo" /></div>
                    <div className="title">IT-UTSAV 3.0</div>
                    <div className="logo-div"><img src={logo1} alt="logo" /></div>
                </div>
            </header>
        </>
    );
}
export default Header;