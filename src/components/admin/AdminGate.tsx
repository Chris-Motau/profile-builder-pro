import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { app, firebaseReady } from "@/lib/firebase";

const adminUid = import.meta.env["VITE_FIREBASE_ADMIN_UID"] ?? "";

type Status = "loading" | "signed-out" | "unauthorized" | "authorized" | "error";

function authErrorMessage(cause: unknown): string {
  const code = cause && typeof cause === "object" && "code" in cause ? String(cause.code) : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect. Check the account in Firebase Authentication, or reset its password.";
    case "auth/operation-not-allowed":
      return "This sign-in method is disabled in Firebase Authentication.";
    case "auth/too-many-requests":
      return "Too many sign-in attempts. Wait a little while before trying again.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    default:
      return cause instanceof Error ? cause.message : "Sign in failed.";
  }
}

export function AdminGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (!firebaseReady) {
      setError("Firebase is not configured.");
      setStatus("error");
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | undefined;
    import("firebase/auth")
      .then(({ getAuth, onAuthStateChanged }) => {
        if (!active) return;
        unsubscribe = onAuthStateChanged(
          getAuth(app),
          (user) => {
            if (!active) return;
            setError("");
            if (!user) {
              setUserId("");
              setUserEmail("");
              setStatus("signed-out");
              return;
            }
            setUserId(user.uid);
            setUserEmail(user.email ?? "");
            setStatus(user.uid === adminUid ? "authorized" : "unauthorized");
          },
          (cause) => {
            if (active) {
              setError(cause.message);
              setStatus("error");
            }
          },
        );
      })
      .catch((cause) => {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : "Could not load Firebase Authentication.",
          );
          setStatus("error");
        }
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const auth = await import("firebase/auth");
      await auth.signInWithEmailAndPassword(auth.getAuth(app), email.trim(), password);
    } catch (cause) {
      const message = authErrorMessage(cause);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      setError("Enter your Firebase Authentication email first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { getAuth, sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(getAuth(app), email.trim());
      toast.success("If this email belongs to an account, a password reset link has been sent.");
    } catch (cause) {
      const message = authErrorMessage(cause);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    try {
      const { getAuth, signOut: firebaseSignOut } = await import("firebase/auth");
      await firebaseSignOut(getAuth(app));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Sign out failed.");
    }
  }

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Checking admin access…</p>;
  }

  if (status === "authorized") {
    return (
      <>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
        {children}
      </>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">This account does not have admin access</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {adminUid
            ? "Sign in with the Firebase Authentication account configured as this app's admin."
            : "Copy this UID into the app configuration and both Firebase rules files."}
        </p>
        {userEmail && <p className="mt-2 text-sm">Signed in as: {userEmail}</p>}
        <p className="mt-2 break-all font-mono text-xs">UID: {userId}</p>
        <Button className="mt-4" variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error || "Firebase is not configured."}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Admin sign in</h2>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void signIn();
        }}
      >
        <Input
          aria-label="Email"
          type="email"
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          aria-label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" disabled={busy} className="w-full">
          Sign in with email
        </Button>
      </form>
      <Button variant="link" size="sm" disabled={busy} onClick={() => void resetPassword()}>
        Reset password
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
