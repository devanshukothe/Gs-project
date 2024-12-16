import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  addDoc,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";

const FacultyDashboard = () => {
  const [requests, setRequests] = useState({
    pending: [],
    forwarded: [],
    rejected: []
  });
  const [logData, setLogData] = useState(null);

  // Fetch faculty data once the component mounts
  useEffect(() => {
    const getFacultyData = async () => {
      try {
        const facultyDoc = await getDoc(doc(db, "Faculty", auth.currentUser.email));
        if (facultyDoc.exists()) {
          setLogData(facultyDoc.data());
        } else {
          console.log("No such faculty data found!");
        }
      } catch (error) {
        console.error("Error fetching faculty data:", error);
      }
    };

    if (auth.currentUser) {
      getFacultyData();
    }
  }, []); // Runs once on mount

  // Fetch all requests (pending, forwarded, and rejected) when logData is updated
  useEffect(() => {
    if (logData && logData.Name) {
      const fetchRequests = async () => {
        try {
          // Fetch pending requests
          const pendingQuery = query(
            collection(db, "Requests"),
            where("currentApprover", "==", logData.Name)
          );
          const unsubscribe = onSnapshot(pendingQuery, (snapshot) => {
            const fetchedPending = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setRequests((prev) => ({ ...prev, pending: fetchedPending }));
          });

          // Fetch forwarded requests
          const forwardedSnapshot = await getDocs(
            collection(db, "Faculty", logData.email, "ApprovedRequests")
          );
          const forwardedRequests = await Promise.all(
            forwardedSnapshot.docs.map(async (forwardDoc) => {
              const request = await getDoc(doc(db, "Requests", forwardDoc.data().requestId));
              return request.data();
            })
          );
          setRequests((prev) => ({ ...prev, forwarded: forwardedRequests }));

          // Fetch rejected requests
          const rejectedSnapshot = await getDocs(
            collection(db, "Faculty", logData.email, "RejectedRequests")
          );
          const rejectedRequests = await Promise.all(
            rejectedSnapshot.docs.map(async (rejectDoc) => {
              const request = await getDoc(doc(db, "Requests", rejectDoc.data().requestId));
              return request.data();
            })
          );
          setRequests((prev) => ({ ...prev, rejected: rejectedRequests }));

          // Cleanup subscription
          return () => unsubscribe();
        } catch (error) {
          console.error("Error fetching requests:", error);
        }
      };

      fetchRequests();
    }
  }, [logData]); // Runs when logData changes

  // Approve request and forward to the GS (General Secretary)
  const handleApprove = async (requestId) => {
    try {
      const requestRef = doc(db, "Requests", requestId);
      const next = requests.pending.find((req) => req.id === requestId)?.secretary || "General Secretary";

      await updateDoc(requestRef, {
        status: "Approved by Faculty",
        currentApprover: next,
        responseMessage: `Your request has been approved by the faculty and forwarded to the GS.`,
      });

      await addDoc(collection(db, "Faculty", logData.email, "ApprovedRequests"), {
        requestId,
        ForwardedTo: next,
        Date: Timestamp.now(),
      });

      alert(`Request approved and forwarded to ${next}.`);
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  // Reject request and notify the student
  const handleReject = async (requestId) => {
    try {
      const requestRef = doc(db, "Requests", requestId);
      await updateDoc(requestRef, {
        status: "Rejected by Faculty",
        currentApprover: null,
        responseMessage: "Your request has been rejected by the faculty.",
      });

      await addDoc(collection(db, "Faculty", logData.email, "RejectedRequests"), {
        requestId,
        Date: Timestamp.now(),
      });

      alert("Request rejected.");
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  // Render requests
  const renderRequests = (requests, type) => {
    if (!requests.length) {
      return <p>No requests {type}.</p>;
    }
    return (
      <ul>
        {requests.map((request, i) => (
          <li key={i} style={{ marginBottom: "20px", borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>
            <p><strong>Request Author:</strong> {request.Author}</p>
            <p><strong>Reason:</strong> {request.reason}</p>
            <p><strong>Status:</strong> {request.status}</p>
            {type === 'pending' && (
              <>
                <button onClick={() => handleApprove(request.id)} style={{ marginRight: "10px", padding: "5px 10px", backgroundColor: "green", color: "white" }}>Approve</button>
                <button onClick={() => handleReject(request.id)} style={{ padding: "5px 10px", backgroundColor: "red", color: "white" }}>Reject</button>
              </>
            )}
            {type === 'forwarded' && (
              <p><strong>Dean's Approval:</strong> {request.status === "Approved by Dean" ? "Approved" : "Pending"}</p>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div>
      <h2>Faculty Dashboard</h2>

      {/* Pending Requests Section */}
      <section>
        <h3>Pending Requests</h3>
        {renderRequests(requests.pending, 'pending')}
      </section>

      {/* Forwarded Requests Section */}
      <section style={{ marginTop: "40px" }}>
        <h3>Requests Forwarded to Dean</h3>
        {renderRequests(requests.forwarded, 'forwarded')}
      </section>

      {/* Rejected Requests Section */}
      <section style={{ marginTop: "40px" }}>
        <h3>Requests Rejected</h3>
        {renderRequests(requests.rejected, 'rejected')}
      </section>
    </div>
  );
};

export default FacultyDashboard;
