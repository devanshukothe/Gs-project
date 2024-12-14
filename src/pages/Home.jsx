import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Welcome to the Home Page!</h1>
      {user ? (
        <p>Welcome back, {user.email}!</p>
      ) : (
        <p>Please log in to access more features.</p>
      )}
    </div>
  );
};

export default Home;
