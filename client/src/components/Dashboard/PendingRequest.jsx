import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

const PendingRequests = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [facultyName, setFacultyName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const fetchFacultyData = async () => {
          try {
            const facultyDoc = await getDoc(doc(db, "Faculty", user.email));
            if (facultyDoc.exists()) {
              setFacultyName(facultyDoc.data().name);
            } else {
              console.error("No faculty data found.");
            }
          } catch (error) {
            console.error("Error fetching faculty data:", error);
          }
        };
        fetchFacultyData();
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (facultyName) {
      const q = query(collection(db, "Requests"), where("currentApprover", "==", facultyName));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedRequests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPendingRequests(fetchedRequests);
      });

      return () => unsubscribe(); // Cleanup Firestore listener
    }
  }, [facultyName]);

  return (
    <div>
      <h3>Pending Requests</h3>
      {pendingRequests.length > 0 ? (
        <ul className="list-group">
          {pendingRequests.map((r, i) => (
            <li key={i} className="list-group-item">
              <p><strong>Request Subject:</strong> {r.title || "Error"}</p>
              <p><strong>Request Author:</strong> {r.Author || "Error"}</p>
              <p><strong>Status:</strong> {r.status || "Error"}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No pending requests.</p>
      )}
    </div>
  );
};

export default PendingRequests;
