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
  db,
  googleProvider,
  isFirebaseConfigured,
} from '@/lib/firebase';

import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

import {
  UserProfile,
  UserRole,
} from '@/types';

import {
  eventPassStore,
} from '@/lib/store';

import {
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

const userRoles: UserRole[] = [
  'student',
  'proctor',
  'incharge',
  'admin',
];

function profileDate(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

async function resolveFirebaseProfile(
  firebaseUser: FirebaseUser,
  allowStudentRegistration = false
): Promise<UserProfile> {
  if (!db) {
    throw new Error('Firebase profile storage is unavailable.');
  }

  const profileRef = doc(db, 'users', firebaseUser.uid);
  const profileSnapshot = await getDoc(profileRef);

  if (profileSnapshot.exists()) {
    const data = profileSnapshot.data();
    if (
      data.uid !== firebaseUser.uid ||
      !userRoles.includes(data.role) ||
      (firebaseUser.email && data.email?.toLowerCase() !== firebaseUser.email.toLowerCase())
    ) {
      throw new Error('The account profile is invalid or does not match this sign-in.');
    }

    const profile = {
      ...data,
      uid: firebaseUser.uid,
      email: firebaseUser.email || data.email,
      displayName: firebaseUser.displayName || data.displayName,
      photoURL: firebaseUser.photoURL || data.photoURL,
      createdAt: profileDate(data.createdAt),
      updatedAt: profileDate(data.updatedAt),
    } as UserProfile;

    return eventPassStore.syncAuthenticatedUser(profile);
  }

  if (!allowStudentRegistration || !firebaseUser.email) {
    throw new Error('No authorized role profile exists for this account.');
  }

  const knownStudent = INITIAL_STUDENTS.find(
    (student) => student.email.toLowerCase() === firebaseUser.email!.toLowerCase()
  );
  const now = new Date().toISOString();
  const studentProfile: UserProfile = {
    ...(knownStudent || {} as UserProfile),
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName || knownStudent?.displayName || firebaseUser.email.split('@')[0],
    role: 'student',
    isProfileComplete: knownStudent?.isProfileComplete || false,
    photoURL: firebaseUser.photoURL || undefined,
    createdAt: now,
    updatedAt: now,
  };

  const profileData = Object.fromEntries(
    Object.entries(studentProfile).filter(([, value]) => value !== undefined)
  );
  await setDoc(profileRef, profileData);
  return eventPassStore.syncAuthenticatedUser(studentProfile);
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
      async (firebaseUser) => {
        try {
          if (firebaseUser) {
            const isGoogleAccount = firebaseUser.providerData.some(
              (provider) => provider.providerId === 'google.com'
            );
            const profile = await resolveFirebaseProfile(firebaseUser, isGoogleAccount);
            setCurrentUser(profile);
          } else {
            eventPassStore.setCurrentUser(null);
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Session initialization failed:', error);
          if (auth) await firebaseSignOut(auth);
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
      const profile = await resolveFirebaseProfile(result.user, true);
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

      const profile = await resolveFirebaseProfile(result.user);
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
