import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';

const Home = () => {
  const { user } = useAuth();
  function Card({ title, description, to }) {
  return (
    <Link
      to={to}
      className="bg-black text-white rounded-xl p-6 hover:bg-gray-900 shadow-lg transition transform hover:-translate-y-1"
    >
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-300 text-sm">{description}</p>
    </Link>
  );
}
  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-white text-black px-6 py-10">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to the SGGS-PermitFlow Dashboard</h1>
        <p className="text-lg text-gray-600 mb-10">
          A centralized platform for managing student activities, approvals, feedback, and more — designed to simplify your college journey.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* Dashboard Cards */}
          <Card title="Submit Requests" description="Apply for leaves, events, or approvals." to="/requests" />
          <Card title="Uploaded Documents" description="View and manage your uploaded PDFs." to="/documents" />
          <Card title="Faculty Feedback" description="Check the feedback given by faculty." to="/feedback" />
          <Card title="Admin Panel" description="For GS/Admin to manage student requests." to="/admin" />
          <Card title="Complaint System" description="Submit anonymous or formal complaints." to="/complaints" />
          <Card title="Profile" description="Manage your personal details and activity." to="/profile" />
        </div>
      </div>
    </div>
    </>
  );
};


export default Home;
