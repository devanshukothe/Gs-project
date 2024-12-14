import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const DeanDashboard = () => {
  const [requests, setRequests] = useState([]);

  // Fetch requests for the dean to process
  useEffect(() => {
    const q = query(collection(db, "requests"), where("currentApprover", "==", "dean"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRequests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(fetchedRequests);
    });
    return () => unsubscribe();
  }, []);

  // Approve request and finalize it
  const handleApprove = async (requestId) => {
    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        status: "Approved by Dean",
        currentApprover: null,
        responseMessage: "Your request has been fully approved by the dean.",
      });
      alert("Request approved and student notified.");
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  // Reject request and notify the student
  const handleReject = async (requestId) => {
    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        status: "Rejected by Dean",
        currentApprover: null,
        responseMessage: "Your request has been rejected by the dean.",
      });
      alert("Request rejected.");
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  return (
    <div>
      <h2>Dean Dashboard</h2>
      {requests.length === 0 ? (
        <p>No requests assigned to you.</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li key={request.id} style={{ marginBottom: "20px", borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>
              <p><strong>Student ID:</strong> {request.studentId}</p>
              <p><strong>Reason:</strong> {request.reason}</p>
              <p><strong>Status:</strong> {request.status}</p>
              <button
                onClick={() => handleApprove(request.id)}
                style={{ marginRight: "10px", padding: "5px 10px", backgroundColor: "green", color: "white" }}
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(request.id)}
                style={{ padding: "5px 10px", backgroundColor: "red", color: "white" }}
              >
                Reject
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DeanDashboard;
