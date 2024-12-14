// components/Dashboard/FacultyDashboard.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";

const FacultyDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const q = query(collection(db, "requests"), where("status", "==", "Pending"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRequests(data);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleApprove = async (requestId) => {
    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, { status: "Approved" });
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, { status: "Rejected" });
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  return (
    <div>
      <h2>Faculty Dashboard</h2>
      {loading ? (
        <p>Loading requests...</p>
      ) : (
        <ul>
          {requests.map(request => (
            <li key={request.id}>
              <p>{request.reason}</p>
              <button onClick={() => handleApprove(request.id)}>Approve</button>
              <button onClick={() => handleReject(request.id)}>Reject</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FacultyDashboard;
