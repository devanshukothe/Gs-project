// components/Dashboard/StudentDashboard.jsx
import React, { useState } from "react";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";

const StudentDashboard = () => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    try {
      setLoading(true);
      await addDoc(collection(db, "requests"), {
        studentId: auth.currentUser.uid,
        reason,
        status: "Pending",
        createdAt: Timestamp.now(),
      });
      setReason("");
    } catch (error) {
      console.error("Error submitting request:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Student Dashboard</h2>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for permission"></textarea>
      <button onClick={handleRequest} disabled={loading}>
        Submit Request
      </button>
    </div>
  );
};

export default StudentDashboard;
