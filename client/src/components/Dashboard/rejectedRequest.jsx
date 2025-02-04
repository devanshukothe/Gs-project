import React, { useEffect, useState } from "react";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

const RejectedRequests = () => {
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [facultyEmail, setFacultyEmail] = useState("");

  // Fetch faculty email on authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFacultyEmail(user.email);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch rejected requests when faculty email is available
  useEffect(() => {
    if (facultyEmail) {
      const fetchRejectedRequests = async () => {
        try {
          const rejectedSnapshot = await getDocs(
            collection(db, "Faculty", facultyEmail, "rejectRequests")
          );

          const rejectedRequestsData = await Promise.all(
            rejectedSnapshot.docs.map(async (rejectDoc) => {
              const requestRef = doc(db, "Requests", rejectDoc.data().requestId);
              const requestDoc = await getDoc(requestRef);

              if (requestDoc.exists()) {
                return { id: requestDoc.id, ...requestDoc.data() };
              } else {
                console.warn("Request not found:", rejectDoc.data().requestId);
                return null;
              }
            })
          );

          // Filter out any `null` values from failed fetches
          setRejectedRequests(rejectedRequestsData.filter((req) => req !== null));
        } catch (error) {
          console.error("Error fetching rejected requests:", error);
        }
      };

      fetchRejectedRequests();
    }
  }, [facultyEmail]);

  return (
    <div>
      <h3>Rejected Requests</h3>
      {rejectedRequests.length > 0 ? (
        <ul className="list-group">
          {rejectedRequests.map((r, i) => (
            <li key={i} className="list-group-item">
              <p><strong>Request Subject:</strong> {r.title || "Error"}</p>
              <p><strong>Request Author:</strong> {r.Author || "Error"}</p>
              <p><strong>Status:</strong> {r.status || "Error"}</p>
              <p><strong>Feedback:</strong> {r.feedback || "No feedback provided"}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No rejected requests.</p>
      )}
    </div>
  );
};

export default RejectedRequests;
