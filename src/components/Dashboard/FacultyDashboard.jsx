import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const FacultyDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [forwardedRequests, setForwardedRequests] = useState([]);

  // Fetch requests assigned to the faculty
  useEffect(() => {
    const q = query(collection(db, "requests"), where("currentApprover", "==", "faculty"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRequests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPendingRequests(fetchedRequests);
    });
    return () => unsubscribe();
  }, []);

  // Fetch requests forwarded to the dean
  useEffect(() => {
    const q = query(collection(db, "requests"), where("currentApprover", "==", "dean"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRequests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setForwardedRequests(fetchedRequests);
    });
    return () => unsubscribe();
  }, []);

  // Approve request and forward to the dean
  const handleApprove = async (requestId) => {
    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        status: "Approved by Faculty",
        currentApprover: "dean",
        responseMessage: "Your request has been approved by the faculty and forwarded to the dean.",
      });
      alert("Request approved and forwarded to the dean.");
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  // Reject request and notify the student
  const handleReject = async (requestId) => {
    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        status: "Rejected by Faculty",
        currentApprover: null,
        responseMessage: "Your request has been rejected by the faculty.",
      });
      alert("Request rejected.");
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  return (
    <div>
      <h2>Faculty Dashboard</h2>

      {/* Pending Requests Section */}
      <section>
        <h3>Pending Requests</h3>
        {pendingRequests.length === 0 ? (
          <p>No requests assigned to you.</p>
        ) : (
          <ul>
            {pendingRequests.map((request) => (
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
      </section>

      {/* Forwarded Requests Section */}
      <section style={{ marginTop: "40px" }}>
        <h3>Requests Forwarded to Dean</h3>
        {forwardedRequests.length === 0 ? (
          <p>No requests have been forwarded to the dean.</p>
        ) : (
          <ul>
            {forwardedRequests.map((request) => (
              <li key={request.id} style={{ marginBottom: "20px", borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>
                <p><strong>Student ID:</strong> {request.studentId}</p>
                <p><strong>Reason:</strong> {request.reason}</p>
                <p><strong>Status:</strong> {request.status}</p>
                <p>
                  <strong>Dean's Approval:</strong> {request.status === "Approved by Dean" ? "Approved" : "Pending"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default FacultyDashboard;
