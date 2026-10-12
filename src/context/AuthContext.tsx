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

/**
 * Resolve the profile for a signed-in Firebase user.
 *
 * IMPORTANT:
 * This prioritizes the project's hardcoded sample staff accounts before
 * looking at a profile stored locally. That prevents an old local student
 * profile for a sample staff email from masking the sample staff role.
 *
 * This is suitable only for the existing demo/sample-account setup.
 * For production, resolve roles from an authoritative Firestore document or
 * Firebase custom claims, and enforce access in backend/Firestore rules.
 */
function resolveExistingRole(
  firebaseUser: FirebaseUser
): UserProfile {
  const email = (firebaseUser.email || '').trim().toLowerCase();

  const withFirebaseIdentity = (
    profile: UserProfile
  ): UserProfile => ({
    ...profile,
    uid: firebaseUser.uid,
    email: firebaseUser.email || profile.email,
    displayName:
      firebaseUser.displayName || profile.displayName,
    photoURL:
      firebaseUser.photoURL || profile.photoURL,
  });

  /*
   * Check known sample staff accounts FIRST.
   * This order is intentional: an old local profile must not override these
   * sample mappings merely because its email matches.
   */
  const proctor = INITIAL_PROCTORS.find(
    (user) => user.email.trim().toLowerCase() === email
  );

  if (proctor) {
    const updated = withFirebaseIdentity(proctor);
    eventPassStore.setCurrentUser(updated);
    return updated;
  }

  if (INITIAL_INCHARGE.email.trim().toLowerCase() === email) {
    const updated = withFirebaseIdentity(INITIAL_INCHARGE);
    eventPassStore.setCurrentUser(updated);
    return updated;
  }

  if (INITIAL_ADMIN.email.trim().toLowerCase() === email) {
    const updated = withFirebaseIdentity(INITIAL_ADMIN);
    eventPassStore.setCurrentUser(updated);
    return updated;
  }

  /*
   * For non-sample accounts, preserve an existing profile.
   * UID is checked before email to avoid accidentally matching a different
   * account that happens to share an email value in local demo data.
   */
  const existingById =
    eventPassStore.getUserById(firebaseUser.uid);

  if (existingById) {
    eventPassStore.setCurrentUser(existingById);
    return existingById;
  }

  const existingByEmail =
    eventPassStore.getUserByEmail(email);

  if (existingByEmail) {
    const updated = withFirebaseIdentity(existingByEmail);
    eventPassStore.setCurrentUser(updated);
    return updated;
  }

  /*
   * Match the supplied sample student accounts.
   */
  const student = INITIAL_STUDENTS.find(
    (user) => user.email.trim().toLowerCase() === email
  );

  if (student) {
    const updated = withFirebaseIdentity(student);
    eventPassStore.setCurrentUser(updated);
    return updated;
  }

  /*
   * Unknown Firebase accounts are registered as students in this demo.
   * Do not use this fallback to grant staff access in production.
   */
  const created =
    eventPassStore.createOrRegisterUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || undefined,
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
            const profile = resolveExistingRole(firebaseUser);
            setCurrentUser(profile);
          } else {
            eventPassStore.setCurrentUser(null);
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Session initialization failed:', error);
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
      const result = await signInWithPopup(auth, googleProvider);
      const profile = resolveExistingRole(result.user);
      setCurrentUser(profile);
      return profile;
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
      throw new Error('Email and password are required.');
    }

    setIsLoading(true);

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const profile = resolveExistingRole(result.user);
      setCurrentUser(profile);
      return profile;
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

    const updated = eventPassStore.updateUserProfile(
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
      isFirebaseActive: isFirebaseConfigured,
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
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
