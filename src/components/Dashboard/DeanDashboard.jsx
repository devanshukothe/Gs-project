// components/Dashboard/DeanDashboard.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";

const DeanDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const q = query(collection(db, "requests"), where("status", "==", "Approved"));
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

  const handleFinalApproval = async (requestId) => {
    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, { status: "Final Approved" });
    } catch (error) {
      console.error("Error final approving request:", error);
    }
  };

  return (
    <div>
      <h2>Dean Dashboard</h2>
      {loading ? (
        <p>Loading requests...</p>
      ) : (
        <ul>
          {requests.map(request => (
            <li key={request.id}>
              <p>{request.reason}</p>
              <button onClick={() => handleFinalApproval(request.id)}>Final Approve</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DeanDashboard;
