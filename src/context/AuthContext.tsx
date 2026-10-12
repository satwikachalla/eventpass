import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';

import {
  auth,
  googleProvider,
  isFirebaseConfigured,
} from '@/lib/firebase';

import {
  UserProfile,
  UserRole,
} from '@/types';

import {
  eventPassStore,
} from '@/lib/store';

import {
  INITIAL_ADMIN,
  INITIAL_INCHARGE,
  INITIAL_PROCTORS,
  INITIAL_STUDENTS,
} from '@/lib/mockData';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isFirebaseActive: boolean;

  signInWithGoogle: () => Promise<UserProfile>;
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<UserProfile>;

  signOut: () => Promise<void>;

  updateProfile: (
    data: Partial<UserProfile>
  ) => void;
}

const AuthContext =
  createContext<AuthContextType | undefined>(undefined);

function resolveExistingRole(
  firebaseUser: FirebaseUser
): UserProfile {
  const email = (firebaseUser.email || '').toLowerCase();

  const existing =
    eventPassStore.getUserById(firebaseUser.uid) ||
    eventPassStore.getUserByEmail(email);

  if (existing) {
    eventPassStore.setCurrentUser(existing);
    return existing;
  }

  /*
   * These mappings keep the supplied sample accounts usable.
   * In production, roles should come from Firestore.
   */

  const proctor = INITIAL_PROCTORS.find(
    (user) => user.email.toLowerCase() === email
  );

  if (proctor) {
    const updated = {
      ...proctor,
      uid: firebaseUser.uid,
      email: firebaseUser.email || proctor.email,
      displayName:
        firebaseUser.displayName || proctor.displayName,
      photoURL: firebaseUser.photoURL || proctor.photoURL,
    };

    eventPassStore.setCurrentUser(updated);
    return updated;
  }

  if (INITIAL_INCHARGE.email.toLowerCase() === email) {
    const updated = {
      ...INITIAL_INCHARGE,
      uid: firebaseUser.uid,
      email: firebaseUser.email || INITIAL_INCHARGE.email,
      displayName:
        firebaseUser.displayName || INITIAL_INCHARGE.displayName,
    };

    eventPassStore.setCurrentUser(updated);
    return updated;
  }

  if (INITIAL_ADMIN.email.toLowerCase() === email) {
    const updated = {
      ...INITIAL_ADMIN,
      uid: firebaseUser.uid,
      email: firebaseUser.email || INITIAL_ADMIN.email,
      displayName:
        firebaseUser.displayName || INITIAL_ADMIN.displayName,
    };

    eventPassStore.setCurrentUser(updated);
    return updated;
  }

  /*
   * Existing student account matched by email.
   */
  const student = INITIAL_STUDENTS.find(
    (user) => user.email.toLowerCase() === email
  );

  if (student) {
    const updated = {
      ...student,
      uid: firebaseUser.uid,
      email: firebaseUser.email || student.email,
      displayName:
        firebaseUser.displayName || student.displayName,
      photoURL: firebaseUser.photoURL || student.photoURL,
    };

    eventPassStore.setCurrentUser(updated);
    return updated;
  }

  /*
   * New Firebase accounts are students by default.
   */
  const created =
    eventPassStore.createOrRegisterUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName:
        firebaseUser.displayName || '',
      photoURL:
        firebaseUser.photoURL || undefined,
    });

  eventPassStore.setCurrentUser(created);

  return created;
}

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [currentUser, setCurrentUser] =
    useState<UserProfile | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        try {
          if (firebaseUser) {
            const profile =
              resolveExistingRole(firebaseUser);

            setCurrentUser(profile);
          } else {
            eventPassStore.setCurrentUser(null);
            setCurrentUser(null);
          }
        } catch (error) {
          console.error(
            'Session initialization failed:',
            error
          );

          setCurrentUser(null);
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        'Firebase is not configured. Add your Firebase credentials to .env.'
      );
    }

    setIsLoading(true);

    try {
      const result =
        await signInWithPopup(
          auth,
          googleProvider
        );

      return resolveExistingRole(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPassword = async (
    email: string,
    password: string
  ) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        'Firebase is not configured. Add your Firebase credentials to .env.'
      );
    }

    if (!email.trim() || !password) {
      throw new Error(
        'Email and password are required.'
      );
    }

    setIsLoading(true);

    try {
      const result =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      return resolveExistingRole(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);

    try {
      if (auth) {
        await firebaseSignOut(auth);
      }

      eventPassStore.setCurrentUser(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = (
    data: Partial<UserProfile>
  ) => {
    if (!currentUser) return;

    const updated =
      eventPassStore.updateUserProfile(
        currentUser.uid,
        data
      );

    setCurrentUser(updated);
  };

  const value = useMemo(
    () => ({
      currentUser,
      role: currentUser?.role || null,
      isLoading,
      isFirebaseActive:
        isFirebaseConfigured,

      signInWithGoogle,
      signInWithPassword,
      signOut,
      updateProfile,
    }),
    [currentUser, isLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
};