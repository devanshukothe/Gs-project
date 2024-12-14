import React, { useEffect, useState } from "react";
import { addDoc, collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";

const StudentDashboard = () => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

  // Fetch requests made by the logged-in student
  useEffect(() => {
    const q = query(collection(db, "requests"), where("studentId", "==", auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRequests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(fetchedRequests);
    });
    return () => unsubscribe();
  }, []);

  const handleRequest = async () => {
    try {
      setLoading(true);
      await addDoc(collection(db, "requests"), {
        studentId: auth.currentUser.uid,
        reason,
        status: "Pending",
        currentApprover: "faculty",
        createdAt: Timestamp.now(),
      });
      setReason("");
      alert("Request submitted successfully!");
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit the request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Student Dashboard</h2>

      {/* Form to submit a new request */}
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for permission"
        disabled={loading}
        rows="4"
        cols="50"
      />
      <br />
      <button onClick={handleRequest} disabled={loading || !reason.trim()}>
        {loading ? "Submitting..." : "Submit Request"}
      </button>

      {/* List of submitted requests */}
      <h3>Your Requests</h3>
      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li key={request.id} style={{ marginBottom: "10px" }}>
              <p><strong>Reason:</strong> {request.reason}</p>
              <p><strong>Status:</strong> {request.status}</p>
              <p><strong>Response:</strong> {request.responseMessage || "No response yet."}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudentDashboard;
