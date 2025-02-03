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

const DeanDashboard = () => {
  const [requests, setRequests] = useState({
    pending: { req: [], pdf: [] },
    approved: { req: [], pdf: [] },
    rejected: { req: [], pdf: [] },
  });
  const [logData, setLogData] = useState(null);

  // Fetch dean data once the component mounts
  useEffect(() => {
    const getDeanData = async () => {
      try {
        const deanDoc = await getDoc(
          doc(db, "Dean", auth.currentUser.email)
        );
        if (deanDoc.exists()) {
          setLogData(deanDoc.data());
        } else {
          console.log("No dean data found!");
        }
      } catch (error) {
        console.error("Error fetching dean data:", error);
      }
    };

    if (auth.currentUser) {
      getDeanData();
    }
  }, []);

  const fetchUploadedFiles = async (names) => {
    try {
      const result = await fetch(`http://localhost:5000/get-files`, {
        method: "POST",
        body: JSON.stringify({ names }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await result.json();
      if (response.status === "ok") {
        if (response?.files) {
          const files = response.files.map((file) => ({
            ...file,
            fileUrl: URL.createObjectURL(
              new Blob(
                [Uint8Array.from(atob(file.fileContent), (c) => c.charCodeAt(0))],
                { type: file.contentType }
              )
            ),
          }));
          return files;
        }
      }
    } catch (error) {
      console.error("Error fetching uploaded PDFs:", error);
    }
  };

  const fetchRequests = async () => {
    if(logData && logData.role) {
      try {
        // Fetch pending requests
        const pendingQuery = query(
          collection(db, "Requests"),
          where("currentApprover", "==", logData.role)
        );
        const unsubscribePending = onSnapshot(pendingQuery, async (snapshot) => {
          const fetchedPending = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          const names = fetchedPending.map((req) => req.file);
          console.log(names, fetchedPending);
          const pdfs = await fetchUploadedFiles(names);
          setRequests((prev) => ({
            ...prev,
            pending: { req: fetchedPending, pdf: pdfs },
          }));
        });
  
        // Fetch approved requests
        const approvedSnapshot = await getDocs(
          collection(db, "Dean", logData.email, "approveRequests")
        );
        const approvedRequests = await Promise.all(
          approvedSnapshot.docs.map(async (approvedDoc) => {
            const request = await getDoc(doc(db, "Requests", approvedDoc.data().requestId));
            return request.data();
          })
        );
        const approvedNames = approvedRequests.map((req) => req.file);
        const approvedPdfs = await fetchUploadedFiles(approvedNames);
        setRequests((prev) => ({
          ...prev,
          approved: { req: approvedRequests, pdf: approvedPdfs },
        }));
  
        // Fetch rejected requests
        const rejectedSnapshot = await getDocs(
          collection(db, "Dean", logData.email, "rejectRequests")
        );
        const rejectedRequests = await Promise.all(
          rejectedSnapshot.docs.map(async (rejectedDoc) => {
            const request = await getDoc(doc(db, "Requests", rejectedDoc.data().requestId));
            return request.data();
          })
        );
        const rejectedNames = rejectedRequests.map((req) => req.file);
        const rejectedPdfs = await fetchUploadedFiles(rejectedNames);
        setRequests((prev) => ({
          ...prev,
          rejected: { req: rejectedRequests, pdf: rejectedPdfs },
        }));
  
        return () => {
          unsubscribePending(); // Cleanup subscription
        };
      } catch (error) {
        console.error("Error fetching dean requests:", error);
      }
    }
    else{
      console.log("Error in logData")
    }
  };

  useEffect(() => {
    if (logData) fetchRequests();
  }, [logData]);

  const handleRequest = async (requestId, action) => {
    try {
      const requestRef = doc(db, "Requests", requestId);
      const status =
        action === "approve"
          ? "Approved by Dean"
          : "Rejected by Dean";
      const responseMessage =
        action === "approve"
          ? "Your request has been approved by the Dean."
          : "Your request has been rejected by the Dean.";

      await updateDoc(requestRef, {
        status,
        currentApprover: null,
        responseMessage,
        updatedAt:Timestamp.now()
      });

      await addDoc(
        collection(db, "Dean", logData.email, `${action}Requests`),
        {
          requestId,
          timestamp: Timestamp.now(),
        }
      );

      alert(`Request ${action === "approve" ? "approved" : "rejected"}.`);
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
    }
  };

  const renderRequests = (requests, type) => {
    if (requests.req.length === 0) {
      return <p>No requests {type}.</p>;
    }

    return (
      <ul className="list-group">
        {requests.req.map((r, i) => {
          const pdfFile = requests.pdf.find((p) => p.filename === r.file);
          return (
            <li key={i} className="list-group-item">
                <p>
                <strong>Request Subject:</strong> {r.title || "Error"}
              </p>
              <p>
                <strong>Request Author:</strong> {r.Author || "Error"}
              </p>
              <p>
                <strong>File:</strong>{" "}
                {pdfFile ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => window.open(pdfFile.fileUrl, "_blank")}
                  >
                    View Pdf
                  </button>
                ) : (
                  "No file available"
                )}
              </p>
              <p>
                <strong>Status:</strong> {r.status || "Error"}
              </p>
              {type === "pending" && (
                <>
                  <button
                    onClick={() => handleRequest(r.id, "approve")}
                    className="btn btn-success mx-2"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRequest(r.id, "reject")}
                    className="btn btn-danger mx-2"
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
    <div className="container">
      <h2 className="my-4">{logData ? "Dean "+ logData.role : "Dean"} Dashboard</h2>

      <section>
        <h3>Pending Requests</h3>
        {renderRequests(requests.pending, "pending")}
      </section>

      <section>
        <h3>Approved Requests</h3>
        {renderRequests(requests.approved, "approved")}
      </section>

      <section>
        <h3>Rejected Requests</h3>
        {renderRequests(requests.rejected, "rejected")}
      </section>
    </div>
  );
};

export default DeanDashboard;
