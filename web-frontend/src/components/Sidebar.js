import React, { useState } from 'react';
import { FaBars, FaTimes, FaHome, FaClipboardList, FaSearch, FaTicketAlt, FaBuilding, FaUserShield, FaPlus, FaUser, FaChartBar } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ activeSection, onSectionChange, userRole, isCollapsed, toggleSidebar }) => {
    const [internalCollapsed, setInternalCollapsed] = useState(false);

    const collapsed = isCollapsed !== undefined ? isCollapsed : internalCollapsed;
    const handleToggle = toggleSidebar || (() => setInternalCollapsed(!internalCollapsed));

    // Define menu items per role
    const menuItems = {
        admin: [
            { id: 'overview', label: 'Overview', icon: FaHome },
            { id: 'complaints', label: 'Complaints', icon: FaClipboardList },
            { id: 'investigations', label: 'Investigations', icon: FaSearch },
            { id: 'tickets', label: 'Tickets', icon: FaTicketAlt },
            { id: 'franchises', label: 'Franchises', icon: FaBuilding },
            { id: 'enforcers', label: 'Enforcers', icon: FaUserShield },
            { id: 'analytics', label: 'App Analytics', icon: FaChartBar },
        ],
        enforcer: [
            { id: 'available', label: 'Available Quests', icon: FaSearch },
            { id: 'myInvestigations', label: 'Active Quests', icon: FaClipboardList },
            { id: 'completedInvestigations', label: 'Completed Quests', icon: FaTicketAlt },
            { id: 'myTickets', label: 'My Tickets', icon: FaTicketAlt },
            { id: 'franchises', label: 'Franchise Database', icon: FaBuilding },
        ],
        client: [
            { id: 'newComplaint', label: 'New Complaint', icon: FaPlus },
            { id: 'myComplaints', label: 'My Complaints', icon: FaClipboardList },
            { id: 'profile', label: 'Profile', icon: FaUser },
        ],
    };

    const items = menuItems[userRole] || [];

    return (
        <>
            {/* Mobile overlay */}
            {!collapsed && (
                <div
                    className="sidebar-overlay"
                    onClick={() => handleToggle()}
                />
            )}

            <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-toggle" onClick={() => handleToggle()}>
                    {collapsed ? <FaBars size={20} /> : <FaTimes size={20} />}
                </div>

                <nav className="sidebar-nav">
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
                                onClick={() => onSectionChange(item.id)}
                                title={isCollapsed ? item.label : ''}
                            >
                                <Icon className="sidebar-icon" />
                                {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </>
    );
};

export default Sidebar;
