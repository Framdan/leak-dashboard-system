import React from "react";
import "./MainLayout.css";
import Navbar from "./Navbar";

export default function MainLayout({ children }) {
    return (
        <div className="app-layout">
            <div className="app-layout__nav">
                <Navbar />
            </div>
            <div className="app-layout__main">
                <div className="app-layout__content">{children}</div>
            </div>
        </div>
    );
}
