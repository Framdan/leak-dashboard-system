import React, { useState, useContext } from "react";
import "./Navbar.css";
import { NavLink } from "react-router-dom";
import {
  Droplets, LayoutGrid, Radio, BarChart2, Map, Bell,
  Settings, LogOut, ChevronLeft, ChevronRight, Activity,
  Waves
} from "lucide-react";
import { NodeContext } from "../../context/NodeContext";

export default function Navbar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { nodes } = useContext(NodeContext);

  const navLinkClass = ({ isActive }) =>
    `sidebar-link ${isActive ? "sidebar-link--active" : ""}`;

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login";
  };

  const navGroups = [
    {
      label: "MAIN",
      links: [
        { to: "/dashboard", icon: <LayoutGrid size={18} />, label: "Dashboard" },
      ],
    },
    {
      label: "MONITORING",
      links: [
        { to: "/nodes", icon: <Radio size={18} />, label: "Monitoring Nodes" },
        { to: "/analytics", icon: <BarChart2 size={18} />, label: "Analytics" },
        { to: "/map", icon: <Map size={18} />, label: "Map View" },
        { to: "/alerts-page", icon: <Bell size={18} />, label: "Alerts" },
      ],
    },
    {
      label: "SYSTEM",
      links: [
        { to: "/settings", icon: <Settings size={18} />, label: "Admin" },
      ],
    },
  ];

  const SidebarContent = ({ isMobile = false }) => (
    <div className={`sidebar-inner${collapsed && !isMobile ? " sidebar-inner--collapsed" : ""}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Droplets size={20} />
        </div>
        {(!collapsed || isMobile) && (
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">AquaTrace</span>
            <span className="sidebar-brand-sub">Leak Monitor</span>
          </div>
        )}
        {!isMobile && (
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Live Status Badge */}
      {(!collapsed || isMobile) && (
        <div className="sidebar-live-badge">
          <span className="sidebar-live-dot" />
          <span className="sidebar-live-text">Live Monitoring</span>
          <Waves size={12} className="sidebar-live-wave" />
        </div>
      )}
      {(collapsed && !isMobile) && (
        <div className="sidebar-live-badge sidebar-live-badge--icon">
          <span className="sidebar-live-dot" />
        </div>
      )}

      {/* Nav Groups */}
      <nav className="sidebar-nav">
        {navGroups.map((group) => (
          <div key={group.label} className="sidebar-group">
            {(!collapsed || isMobile) && (
              <span className="sidebar-group-label">{group.label}</span>
            )}
            {group.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={navLinkClass}
                onClick={() => isMobile && setIsMobileOpen(false)}
                title={collapsed && !isMobile ? link.label : undefined}
              >
                <span className="sidebar-link-icon">{link.icon}</span>
                {(!collapsed || isMobile) && (
                  <span className="sidebar-link-label">{link.label}</span>
                )}
                {(!collapsed || isMobile) && link.to === "/alerts-page" && (
                  <span className="sidebar-link-badge">Live</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {(!collapsed || isMobile) && (
          <div className="sidebar-node-count">
            <Activity size={12} />
            <span>{nodes?.length || 0} node{nodes?.length !== 1 ? "s" : ""} registered</span>
          </div>
        )}
        <button
          className={`sidebar-logout${collapsed && !isMobile ? " sidebar-logout--icon" : ""}`}
          onClick={handleLogout}
          title={collapsed && !isMobile ? "Logout" : undefined}
        >
          <LogOut size={16} />
          {(!collapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="mobile-topbar">
        <button
          className="mobile-topbar-btn"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open menu"
        >
          <div className="mobile-topbar-hamburger">
            <span /><span /><span />
          </div>
        </button>
        <div className="mobile-topbar-brand">
          <Droplets size={18} />
          <span>AquaTrace</span>
        </div>
        <span className="mobile-live-dot" />
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <>
          <div
            className="mobile-overlay"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="sidebar sidebar--mobile-open">
            <button
              className="mobile-close-btn"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
            <SidebarContent isMobile />
          </aside>
        </>
      )}
    </>
  );
}
