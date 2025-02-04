import React, { useEffect, useState } from "react";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

const ApprovedRequests = () => {
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [facultyEmail, setFacultyEmail] = useState("");

  // Get Faculty Email when authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFacultyEmail(user.email);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Approved Requests from Firestore
  useEffect(() => {
    if (facultyEmail) {
      const fetchApprovedRequests = async () => {
        try {
          const approvedSnapshot = await getDocs(
            collection(db, "Faculty", facultyEmail, "approveRequests")
          );

          const approvedRequestsData = await Promise.all(
            approvedSnapshot.docs.map(async (docRef) => {
              const requestRef = doc(db, "Requests", docRef.data().requestId);
              const requestDoc = await getDoc(requestRef);

              if (requestDoc.exists()) {
                return { id: requestDoc.id, ...requestDoc.data() };
              } else {
                console.warn("Request not found:", docRef.data().requestId);
                return null;
              }
            })
          );

          // Filter out any `null` values from failed fetches
          setApprovedRequests(approvedRequestsData.filter((req) => req !== null));
        } catch (error) {
          console.error("Error fetching approved requests:", error);
        }
      };

      fetchApprovedRequests();
    }
  }, [facultyEmail]);

  return (
    <div>
      <h3>Requests Forwarded
      </h3>
      {approvedRequests.length > 0 ? (
        <ul className="list-group">
          {approvedRequests.map((r, i) => (
            <li key={i} className="list-group-item">
              <p>
                <strong>Request Subject:</strong> {r.title || "Error"}
              </p>
              <p>
                <strong>Request Author:</strong> {r.Author || "Error"}
              </p>
              <p>
                <strong>Status:</strong> {`Forwared to  ${r.currentApprover}` || "Error"}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No approved requests.</p>
      )}
    </div>
  );
};

export default ApprovedRequests;
