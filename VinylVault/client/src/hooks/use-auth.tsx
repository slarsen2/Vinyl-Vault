import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  FirebaseUser,
  db,
  doc,
  setDoc,
  getDoc
} from "@/lib/firebase";

// Firebase user type extended with profile data
interface FirebaseUserWithProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  name?: string;
  username?: string;
}

interface LoginCredentials {
  username: string; // Using email as username
  password: string;
}

interface RegisterCredentials {
  username: string; // Using email as username
  password: string;
  name: string;
}

interface AuthContextType {
  user: FirebaseUserWithProfile | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useMutation>;
  registerMutation: ReturnType<typeof useMutation>;
  logoutMutation: ReturnType<typeof useMutation>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Get user profile data from Firestore
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser) return null;
      
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as { name: string, username: string };
      }
      
      return null;
    },
    enabled: !!firebaseUser,
  });

  // Combined user with profile data
  const user: FirebaseUserWithProfile | null = firebaseUser ? {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    ...userProfile
  } : null;

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.username, 
        credentials.password
      );
      return userCredential.user;
    },
    onSuccess: () => {
      toast({
        title: "Welcome back!",
        description: "Logged in successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        credentials.username, 
        credentials.password
      );
      
      // Store additional user data in Firestore
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        name: credentials.name,
        username: credentials.username,
        createdAt: new Date()
      });
      
      return user;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Account created!",
        description: `Welcome to VinylVault, ${variables.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await firebaseSignOut(auth);
    },
    onSuccess: () => {
      // Clear any user-related queries
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['records'] });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || profileLoading,
        error,
        loginMutation,
        registerMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
