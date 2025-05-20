import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Logout from "../components/Auth/Logout";
const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const email = user.email;
          const collections = ["Club", "Faculty", "Dean", "Secratory"];
          let found = null;

          for (const col of collections) {
            const docRef = doc(db, col, email);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              found = docSnap.data();
              setRole(col);
              break;
            }
          }

          if (found) {
            setUserData(found);
          } else {
            console.warn("User data not found in any collection.");
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        } finally {
          setLoading(false);
        }
      } else {
        // Not logged in
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // cleanup on unmount
  }, []);

  if (loading) return <div className="p-6 text-center">Loading profile...</div>;
  if (!userData) return <div className="p-6 text-center">No user found. Please log in again.</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Welcome, {userData.name}</h2>
      <div className="space-y-2">
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Role:</strong> {userData.role}</p>
        {role === "Club" && (
          <>
            <p><strong>Coordinator:</strong> {userData.coordinator}</p>
            <p><strong>Faculty:</strong> {userData.faculty}</p>
          </>
        )}
        <Logout />
      </div>
    </div>
  );
};

export default Profile;
