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
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";

const SecretaryDashboard = () => {
  const [requests, setRequests] = useState({
    pending: { req: [], pdf: [] },
    forwarded: { req: [], pdf: [] },
    rejected: { req: [], pdf: [] },
  });
  const [feedback, setFeedback] = useState({});
  const [logData, setLogData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const secretaryDoc = await getDoc(doc(db, "Secratory", user.email));
          if (secretaryDoc.exists()) {
            setLogData(secretaryDoc.data());
          } else {
            console.log("No secretary data found.");
          }
        } catch (error) {
          console.error("Error fetching secretary data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        console.log("User not signed in.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const showPdf = (pdfUrl) => {
    window.open(`${pdfUrl}`, "_blank", "noreferrer");
  };

  const fetchUploadedFiles = async (names) => {
    try {
      const result = await fetch(`http://localhost:5000/get-files`, {
        method: "POST",
        body: JSON.stringify({ names }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await result.json();
      if (response.status === "ok") {
        return response.files.map((file) => ({
          ...file,
          fileUrl: URL.createObjectURL(
            new Blob(
              [Uint8Array.from(atob(file.fileContent), (c) => c.charCodeAt(0))],
              { type: file.contentType }
            )
          ),
        }));
      }
    } catch (error) {
      console.error("Error fetching uploaded PDFs:", error);
    }
  };

  useEffect(() => {
    if (logData && logData.role) {
      const fetchRequests = async () => {
        try {
          // Pending
          const pendingQuery = query(
            collection(db, "Requests"),
            where("currentApprover", "==", logData.role)
          );

          const unsubscribe = onSnapshot(pendingQuery, async (snapshot) => {
            const fetchedPending = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            const names = fetchedPending.map((req) => req.file || "");
            const pdfs = await fetchUploadedFiles(names);

            setRequests((prev) => ({
              ...prev,
              pending: { req: fetchedPending, pdf: pdfs },
            }));
          });

          // Forwarded
          const forwardedSnapshot = await getDocs(
            collection(db, "Secratory", logData.email, "approveRequests")
          );
          const forwardedRequests = await Promise.all(
            forwardedSnapshot.docs.map(async (docRef) => {
              const data = await getDoc(doc(db, "Requests", docRef.data().requestId));
              return data.data();
            })
          );
          const fpdfs = await fetchUploadedFiles(forwardedRequests.map((r) => r.file));
          setRequests((prev) => ({
            ...prev,
            forwarded: { req: forwardedRequests, pdf: fpdfs },
          }));

          // Rejected
          const rejectedSnapshot = await getDocs(
            collection(db, "Secratory", logData.email, "rejectRequests")
          );
          const rejectedRequests = await Promise.all(
            rejectedSnapshot.docs.map(async (docRef) => {
              const data = await getDoc(doc(db, "Requests", docRef.data().requestId));
              return data.data();
            })
          );
          const rpdfs = await fetchUploadedFiles(rejectedRequests.map((r) => r.file));
          setRequests((prev) => ({
            ...prev,
            rejected: { req: rejectedRequests, pdf: rpdfs },
          }));

          return () => unsubscribe();
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
      const request = requests.pending.req.find((r) => r.id === requestId);

      const next =
        logData.role === "General Secretary" ? request.dean : "General Secretary";

      const status =
        action === "approve"
          ? `Approved by ${logData.role}`
          : `Rejected by ${logData.role}`;

      const responseMessage =
        action === "approve"
          ? `Your request has been approved by ${logData.role} and forwarded to ${next}`
          : `Your request has been rejected by ${logData.role}`;

      await updateDoc(requestRef, {
        status,
        currentApprover: action === "approve" ? next : logData.role,
        responseMessage,
        feedback: feedback[requestId] || "",
        updatedAt: Timestamp.now(),
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
      console.error("Error updating request:", error);
    }
  };

  const renderRequests = (requests, type) => {
    if (requests.req.length === 0) {
      return <p className="text-gray-600 italic">No {type} requests.</p>;
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {requests.req.map((r, i) => {
          const pdfFile = requests.pdf.find((p) => p.filename === r.file);
          return (
            <div
              key={i}
              className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition"
            >
              <p className="font-bold mb-1">Subject: {r.title || "N/A"}</p>
              <p className="mb-1">Author: {r.Author || "N/A"}</p>
              <p className="mb-2">Status: {r.status || "N/A"}</p>
              {pdfFile ? (
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  onClick={() => showPdf(pdfFile.fileUrl)}
                >
                  View PDF
                </button>
              ) : (
                <p className="text-sm text-gray-500">No file available</p>
              )}
              {type === "pending" && (
                <>
                  <textarea
                    className="w-full mt-3 p-2 border rounded"
                    placeholder="Provide feedback..."
                    value={feedback[r.id] || ""}
                    onChange={(e) =>
                      setFeedback({ ...feedback, [r.id]: e.target.value })
                    }
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      onClick={() => handleRequest(r.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      onClick={() => handleRequest(r.id, "reject")}
                    >
                      Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-700">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-black px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-10 text-center">
          {logData ? logData.role : "Secretary"} Dashboard
        </h2>

        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2 border-gray-300">
            Pending Requests
          </h3>
          {renderRequests(requests.pending, "pending")}
        </section>

        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2 border-gray-300">
            Requests Forwarded
          </h3>
          {renderRequests(requests.forwarded, "forwarded")}
        </section>

        <section>
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2 border-gray-300">
            Requests Rejected
          </h3>
          {renderRequests(requests.rejected, "rejected")}
        </section>
      </div>
    </div>
  );
};

export default SecretaryDashboard;
