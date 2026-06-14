import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="empty-state" style={{ height: '70vh' }}>
      <AlertCircle size={64} color="var(--error)" style={{ filter: 'drop-shadow(0 0 12px rgba(255, 76, 106, 0.4))' }} />
      <h3>404 - Page Not Found</h3>
      <p>The page you are looking for does not exist or has been relocated to another address.</p>
      <button onClick={() => navigate('/')}>Return to Home</button>
    </div>
  );
};

export default NotFound;
