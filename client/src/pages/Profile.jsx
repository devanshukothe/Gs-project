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
 <div
  className="max-w-md mx-auto mt-10 p-6 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300
    text-gray-900 rounded-xl shadow-md border border-gray-300
    hover:shadow-xl hover:ring-2 hover:ring-gray-400 transition duration-300
    opacity-0 animate-fadeIn opacity-100"
>
  {/* Heading */}
  <h2 className="text-2xl font-serif font-bold mb-6 text-center">
    Welcome, {userData.name}
  </h2>

  <div className="space-y-4">
    <p className="border-b border-gray-300 pb-2 flex items-center gap-2">
      {/* Mail Icon */}
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
      <span className="font-semibold">Email:</span> {userData.email}
    </p>

    <p className="border-b border-gray-300 pb-2 flex items-center gap-2">
      {/* User Icon */}
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9.005 9.005 0 0112 15a9.005 9.005 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span className="font-semibold">Role:</span> {userData.role}
    </p>

    {role === "Club" && (
      <>
        <p className="border-b border-gray-300 pb-2 flex items-center gap-2">
          <span className="font-semibold">Coordinator:</span> {userData.coordinator}
        </p>
        <p className="border-b border-gray-300 pb-2 flex items-center gap-2">
          <span className="font-semibold">Faculty:</span> {userData.faculty}
        </p>
      </>
    )}

   <div
  className="pt-4 text-center cursor-pointer hover:scale-105 transition-transform duration-200 inline-block text-gray-900"
>
  <Logout />
</div>

  </div>
</div>

  );
};

export default Profile;
