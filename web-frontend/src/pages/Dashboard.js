import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ClientDashboard from './dashboards/ClientDashboard';
import EnforcerDashboard from './dashboards/EnforcerDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  switch (user.role) {
    case 'client':
      return <ClientDashboard />;
    case 'enforcer':
      return <EnforcerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <div>Invalid role</div>;
  }
};

export default Dashboard;
