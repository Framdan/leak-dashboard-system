import React, { useState } from "react";
import "./Navbar.css";
import { NavLink } from "react-router-dom";
import { Droplets, LayoutGrid, Radio, BarChart2, Map, Bell, Settings, Menu, X, LogOut } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `nav-link ${isActive ? "nav-link--active" : ""}`;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  return (
    <div className="navbar">
      <div className="navbar__container">
        {/* Logo Section */}
        <div className="navbar__brand">
          <div className="navbar__logo">
            <Droplets size={24} />
          </div>
          <div className="navbar__title-wrapper">
            <h1 className="navbar__title">Water Leakage Simulation Monitor</h1>
            <span className="navbar__subtitle">Leakage Prevention System</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="nav-menu">
           <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutGrid size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/nodes" className={navLinkClass}>
            <Radio size={18} />
            <span>Monitoring Nodes</span>
          </NavLink>
          <NavLink to="/analytics" className={navLinkClass}>
            <BarChart2 size={18} />
            <span>Analytics</span>
          </NavLink>
          <NavLink to="/map" className={navLinkClass}>
            <Map size={18} />
            <span>Map View</span>
          </NavLink>
          <NavLink to="/alerts-page" className={navLinkClass}>
            <Bell size={18} />
            <span>Alerts</span>
          </NavLink>
           <NavLink to="/settings" className={navLinkClass}>
            <Settings size={18} />
            <span>Admin</span>
          </NavLink>
          
          <button className="logout-btn-styled" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open mobile menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar System */}
      {isMobileMenuOpen && (
        <>
          <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="mobile-sidebar">
            <div className="mobile-sidebar__header">
              <div className="navbar__brand">
                <div className="navbar__logo">
                  <Droplets size={20} />
                </div>
                <div className="navbar__title-wrapper">
                  <h1 className="navbar__title">Water Leakage Simulation Monitor</h1>
                  <span className="navbar__subtitle">Leakage Prevention System</span>
                </div>
              </div>
              <button 
                className="mobile-menu-close" 
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close mobile menu"
              >
                <X size={24} />
              </button>
            </div>
            
            <nav className="mobile-nav">
               <NavLink to="/dashboard" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                <LayoutGrid size={18} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/nodes" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                <Radio size={18} />
                <span>Monitoring Nodes</span>
              </NavLink>
              <NavLink to="/analytics" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                <BarChart2 size={18} />
                <span>Analytics</span>
              </NavLink>
              <NavLink to="/map" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                <Map size={18} />
                <span>Map View</span>
              </NavLink>
              <NavLink to="/alerts-page" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                <Bell size={18} />
                <span>Alerts</span>
              </NavLink>
              
              <div style={{ margin: 'var(--spacing-2) 0', borderTop: '1px solid var(--color-gray-100)' }} />
                            <NavLink to="/settings" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                <Settings size={18} />
                <span>Admin</span>
              </NavLink>
              <button className="logout-btn-styled mobile-logout-btn" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
