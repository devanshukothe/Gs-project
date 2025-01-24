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
        const secretaryDoc = await getDoc(
          doc(db, "Secratory", auth.currentUser.email)
        );
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

  const showPdf = (pdfUrl) => {
    window.open(`${pdfUrl}`, "_blank", "noreferrer");
  };

  const fetchUploadedFiles = async (names) => {
    try {
      const result = await fetch(`http://localhost:5000/get-files`, {
        method: "POST",
        body: JSON.stringify({ names }),
        headers: { "Content-Type": "application/json" }
      });
      const response = await result.json();
      if (response.status === "ok") {
        if (response?.files) {
          const files = response.files.map((file) => ({
            ...file,
            fileUrl: URL.createObjectURL(
              new Blob(
                [
                  Uint8Array.from(atob(file.fileContent), (c) =>
                    c.charCodeAt(0)
                  ),
                ],
                {
                  type: file.contentType,
                }
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


  // Fetch all requests when logData is updated
  useEffect(() => {
    if (logData && logData.role) {
      const fetchRequests = async () => {
        try {
          // Fetch pending requests
          const pendingQuery = query(
            collection(db, "Requests"),
            where("currentApprover", "==", logData.role)
          );

          const unsubscribe = onSnapshot(pendingQuery, async (snapshot) => {
            const fetchedPending = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            const names = fetchedPending.map((req) => req.file);
            const pdfs = await fetchUploadedFiles(names);
            setRequests((prev) => ({
              ...prev,
              pending: { req: fetchedPending, pdf: pdfs },
            }));
          });

          // Fetch forwarded requests
          const forwardedSnapshot = await getDocs(
            collection(db, "Secratory", logData.email, "approveRequests")
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
          const fpdfs = await fetchUploadedFiles(fnames);
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
          const rpdfs = await fetchUploadedFiles(rnames);
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
      if (logData.role === "General Secretary") {
        next = requests.pending.req.find((req) => req.id === requestId)?.dean;
      } else {
        next = "General Secretary";
      }
      const status =
        action === "approve"
          ? `Approved by ${logData.role} secretary`
          : `Rejected by ${logData.role} secretary`;
      const responseMessage =
        action === "approve"
          ? `Your request has been approved by ${logData.role}  and forwarded to the ${logData.role==="General Secretary"?"Dean "+next :next}.`
          : `Your request has been rejected ${logData.role} `;

      await updateDoc(requestRef, {
        status,
        currentApprover: action === "approve" ? next : null,
        responseMessage,
        updatedAt:Timestamp.now()
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
      <ul className="list-group">
        {requests.req.map((r, i) => {
          const pdfFile = requests.pdf.find((p) => p.filename === r.file);
          return (
            <li key={i} className="list-group-item">
              <p>
                <strong>Request Author:</strong> {r.Author || "Error"}
              </p>
              <p>
                <strong>File:</strong>{" "}
                {pdfFile ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => showPdf(pdfFile.fileUrl)}
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
    <h2 className="my-4">{logData?logData.role:"Secretary"} Dashboard</h2>

    <section>
      <h3>Pending Requests</h3>
      {renderRequests(requests.pending, "pending")}
    </section>

    <section>
      <h3>Requests Forwarded to Dean</h3>
      {renderRequests(requests.forwarded, "forwarded")}
    </section>

    <section>
      <h3>Requests Rejected</h3>
      {renderRequests(requests.rejected, "rejected")}
    </section>
  </div>
  );
};

export default SecretaryDashboard;
