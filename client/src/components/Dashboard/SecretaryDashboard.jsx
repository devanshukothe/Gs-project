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

const SecretaryDashboard = () => {
  const [requests, setRequests] = useState({
    pending: { req: [], pdf: [] },
    forwarded: { req: [], pdf: [] },
    rejected: { req: [], pdf: [] },
  });
  const [logData, setLogData] = useState(null);

  // Fetch faculty data once the component mounts
  useEffect(() => {
    const getSecretaryData = async () => {
      try {
        const secretaryDoc = await getDoc(doc(db, "Secratory", auth.currentUser.email));
        if (secretaryDoc.exists()) {
          setLogData(secretaryDoc.data());
        } else {
          console.log("No such secretary data found!");
        }
      } catch (error) {
        console.error("Error fetching secretary  data:", error);
      }
    };

    if (auth.currentUser) {
      getSecretaryData();
    }
  }, []);

  const showPdf = (pdf) => {
    window.open(`http://localhost:5000/files/${pdf}`, "_blank", "noreferrer");
  };

  const getPdf = async (names) => {
    try {
      const pdf = await fetch("http://127.0.0.1:5000/find-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: names }),
      });
      const response = await pdf.json();
      if (response.success) {
        return response.pdfres;
      } else {
        console.error("API error: Unable to fetch PDFs");
      }
    } catch (error) {
      console.error("Error fetching PDFs:", error);
    }
  };

  // Fetch all requests when logData is updated
  useEffect(() => {
    if (logData && logData.Name) {
      const fetchRequests = async () => {
        try {
          // Fetch pending requests
          const pendingQuery = query(
            collection(db, "Requests"),
            where("currentApprover", "==", logData.Name)
          );

          const unsubscribe = onSnapshot(pendingQuery, async (snapshot) => {
            const fetchedPending = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            const names = fetchedPending.map((req) => req.file);
            const pdfs = await getPdf(names);

            setRequests((prev) => ({
              ...prev,
              pending: { req: fetchedPending, pdf: pdfs },
            }));
          });

          // Fetch forwarded requests
          const forwardedSnapshot = await getDocs(collection(db, "Secratory", logData.email, "approveRequests")
          );
          const forwardedRequests = await Promise.all(
            forwardedSnapshot.docs.map(async (forwardDoc) => {
              const request = await getDoc(
                doc(db, "Requests", forwardDoc.data().requestId)
              );
              return request.data();
            })
          );
          const fnames = forwardedRequests.map((req) => req.file);
          const fpdfs = await getPdf(fnames)
          setRequests((prev) => ({
            ...prev,
            forwarded: { req: forwardedRequests, pdf: fpdfs },
          }));

          // Fetch rejected requests
          const rejectedSnapshot = await getDocs(
            collection(db, "Secratory", logData.email, "rejectRequests")
          );
          const rejectedRequests = await Promise.all(
            rejectedSnapshot.docs.map(async (rejectDoc) => {
              const request = await getDoc(
                doc(db, "Requests", rejectDoc.data().requestId)
              );
              return request.data();
            })
          );
          const rnames = rejectedRequests.map((req) => req.file);
          const rpdfs = await getPdf(rnames)
          setRequests((prev) => ({
            ...prev,
            rejected: { req: rejectedRequests, pdf: rpdfs },
          }));

          return () => unsubscribe(); // Cleanup subscription
        } catch (error) {
          console.error("Error fetching requests:", error);
        }
      };

      fetchRequests();
    }
  }, [logData]);

  const handleRequest = async (requestId, action) => {
    try {
      const requestRef = doc(db, "Requests", requestId);
      let next;
      if(logData.role==="Genral"){
         next = requests.pending.req.find((req) => req.id === requestId)?.dean
      }
      else{
        next = "General Secretary";
      }
      const status = action === "approve" ? `Approved by ${logData.role} secretary` : `Rejected by ${logData.role} secretary`;
      const responseMessage =
        action === "approve"
          ? `Your request has been approved by ${logData.role} secretary and forwarded to the ${next}.`
          : `Your request has been rejected ${logData.role} secretary`;

      await updateDoc(requestRef, {
        status,
        currentApprover: action === "approve" ? next : null,
        responseMessage,
      });

      await addDoc(
        collection(db, "Secratory", logData.email, `${action}Requests`),
        {
          requestId,
          Date: Timestamp.now(),
        }
      );

      alert(`Request ${action === "approve" ? "approved" : "rejected"}.`);
    } catch (error) {
      console.error(`Error ${action} request:`, error);
    }
  };

  const renderRequests = (requests, type) => {
    if (requests.req.length === 0) {
      return <p>No requests {type}.</p>;
    }

    return (
      <ul>
        {requests.req.map((r, i) => {
          const pdfFile = requests.pdf.find((p) => p.pdf === r.file);
          return (
            <li key={i} style={{ marginBottom: "20px", borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>
              <p>
                <strong>Request Author:</strong> {r?.Author || "Error"}
              </p>
              <p>
                <strong>File:</strong>
                {r && pdfFile ? (
                  <button onClick={() => showPdf(pdfFile.pdf)}>View Pdf</button>
                ) : (
                  "No file available"
                )}
              </p>
              <p>
                <strong>Status:</strong>
                {r?.status || "Error"}
              </p>
              {type === "pending" && (
                <>
                  <button
                    onClick={() => handleRequest(r.id, "approve")}
                    style={{
                      marginRight: "10px",
                      padding: "5px 10px",
                      backgroundColor: "green",
                      color: "white",
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRequest(r.id, "reject")}
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "red",
                      color: "white",
                    }}
                  >
                    Reject
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div>
      <h2>Secretary Dashboard</h2>

      {/* Pending Requests Section */}
      <section>
        <h3>Pending Requests</h3>
        {renderRequests(requests.pending, "pending")}
      </section>

      {/* Forwarded Requests Section */}
      <section style={{ marginTop: "40px" }}>
        <h3>Requests Forwarded to Dean</h3>
        {renderRequests(requests.forwarded, "forwarded")}
      </section>

      {/* Rejected Requests Section */}
      <section style={{ marginTop: "40px" }}>
        <h3>Requests Rejected</h3>
        {renderRequests(requests.rejected, "rejected")}
      </section>
    </div>
  );
};

export default SecretaryDashboard;
