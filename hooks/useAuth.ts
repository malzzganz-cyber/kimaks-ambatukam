"use client";
import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/firebase/config";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubFirestoreRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubFirestoreRef.current) {
        unsubFirestoreRef.current();
        unsubFirestoreRef.current = null;
      }

      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
        if (snap.exists()) {
          setUser(snap.data() as User);
        } else {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            balance: 0,
            isAdmin: false,
            createdAt: new Date().toISOString()
          });
        }
        setLoading(false);
      });

      unsubFirestoreRef.current = unsub;
    });

    return () => {
      unsubAuth();
      if (unsubFirestoreRef.current) {
        unsubFirestoreRef.current();
      }
    };
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
