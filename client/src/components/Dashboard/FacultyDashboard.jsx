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
import { onAuthStateChanged } from "firebase/auth";
import RejectedRequests from "./rejectedRequest";
import ApprovedRequests from "./ApprovedRequests";

const FacultyDashboard = () => {
  const [requests, setRequests] = useState({
    pending: { req: [], pdf: [] },
    forwarded: { req: [], pdf: [] },
    rejected: { req: [], pdf: [] },
  });
  const [logData, setLogData] = useState(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const getFacultyData = async () => {
          try {
            const facultyDoc = await getDoc(doc(db, "Faculty", user.email));
            if (facultyDoc.exists()) {
              setLogData(facultyDoc.data());
            } else {
              console.error("No faculty data found for this email.");
            }
          } catch (error) {
            console.error("Error fetching faculty data:", error);
          }
        };
        getFacultyData();
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUploadedFiles = async (names) => {
    try {
      const result = await fetch(`http://localhost:5000/get-files`, {
        method: "POST",
        body: JSON.stringify({ names }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await result.json();
      if (response.status === "ok" && response?.files) {
        return response.files.map((file) => ({
          ...file,
          fileUrl: URL.createObjectURL(
            new Blob(
              [Uint8Array.from(atob(file.fileContent), (c) => c.charCodeAt(0))],
              {
                type: file.contentType,
              }
            )
          ),
        }));
      }
    } catch (error) {
      console.error("Error fetching uploaded PDFs:", error);
    }
  };

  useEffect(() => {
    if (logData?.name) {
      const fetchRequests = async () => {
        try {
          const pendingQuery = query(
            collection(db, "Requests"),
            where("currentApprover", "==", logData.name)
          );
          const unsubscribePending = onSnapshot(
            pendingQuery,
            async (snapshot) => {
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
            }
          );

          const forwardedSnapshot = await getDocs(
            collection(db, "Faculty", logData.email, "approveRequests")
          );
          const forwardedRequests = await Promise.all(
            forwardedSnapshot.docs.map(async (forwardDoc) => {
              const request = await getDoc(
                doc(db, "Requests", forwardDoc.data().requestId)
              );
              return { id: forwardDoc.id, ...request.data() };
            })
          );
          const fnames = forwardedRequests.map((req) => req.file);
          const fpdfs = await fetchUploadedFiles(fnames);
          setRequests((prev) => ({
            ...prev,
            forwarded: { req: forwardedRequests, pdf: fpdfs },
          }));

          const rejectedSnapshot = await getDocs(
            collection(db, "Faculty", logData.email, "rejectRequests")
          );
          const rejectedRequests = await Promise.all(
            rejectedSnapshot.docs.map(async (rejectDoc) => {
              const request = await getDoc(
                doc(db, "Requests", rejectDoc.data().requestId)
              );
              return { id: rejectDoc.id, ...request.data() };
            })
          );
          const rnames = rejectedRequests.map((req) => req.file);
          const rpdfs = await fetchUploadedFiles(rnames);
          setRequests((prev) => ({
            ...prev,
            rejected: { req: rejectedRequests, pdf: rpdfs },
          }));
        } catch (error) {
          console.error("Error fetching requests:", error);
        }
      };
      fetchRequests();
    }
  }, [logData]);

  const showPdf = (pdfUrl) => {
    window.open(`${pdfUrl}`, "_blank", "noreferrer");
  };

  const handleRequest = async (requestId, action) => {
    try {
      const requestRef = doc(db, "Requests", requestId);
      const nextApprover = requests.pending.req.find(
        (req) => req.id === requestId
      )?.secretary;
      const status =
        action === "approve" ? "Approved by Faculty" : "Rejected by Faculty";
      const responseMessage =
        action === "approve"
          ? `Approved and forwarded to ${
              nextApprover === "Not Applied"
                ? "General Secretary"
                : nextApprover
            }.`
          : `Rejecte by ${logData.role}`;

      await updateDoc(requestRef, {
        status,
        currentApprover:
          action === "approve"
            ? nextApprover === "Not Applied"
              ? "General Secretary"
              : nextApprover
            : logData.role,
        responseMessage,
        feedback: feedback,
        updatedAt: Timestamp.now(),
      });

      await addDoc(
        collection(db, "Faculty", logData.email, `${action}Requests`),
        {
          requestId,
          Date: Timestamp.now(),
        }
      );

      alert(`Request ${action === "approve" ? "approved" : "rejected"}.`);
      setFeedback("");
    } catch (error) {
      console.error(`Error ${action} request:`, error);
    }
  };

  const renderRequests = (requests, type) => {
    if (!requests.req.length) return <p>No requests {type}.</p>;

    return (
      <ul className="list-group">
        {requests.req.map((r, i) => {
          const pdfFile = requests?.pdf?.find((p) => p.filename === r.file);
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
                  <textarea
                    className="form-control my-2"
                    placeholder="Enter feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
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
    <div className="container-fluid">
      <div className="class=" col py-3>
        <h2 className="my-4">Faculty Dashboard</h2>

        <section>
          <h3>Pending Requests</h3>
          {renderRequests(requests.pending, "pending")}
        </section>
        <section>
          <ApprovedRequests />
        </section>
        <section>
          <h3>Requests Rejected</h3>
          {renderRequests(requests.rejected, "rejected")}
        </section>
      </div>
    </div>
  );
};

export default FacultyDashboard;
