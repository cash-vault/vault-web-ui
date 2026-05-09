import { useState, useCallback } from "react";
import { supabase } from "./supabase";
import { deriveEncryptionKey } from "./crypto";
import LoginScreen from "./screens/LoginScreen";
import UnlockScreen from "./screens/UnlockScreen";
import AddTransactionScreen from "./screens/AddTransactionScreen";
import ConfirmationScreen from "./screens/ConfirmationScreen";
import "./App.css";

type Step = "login" | "unlock" | "add" | "confirmation";

export default function App() {
  const [step, setStep] = useState<Step>("login");
  const [vaultKey, setVaultKey] = useState<Uint8Array | null>(null);
  const [error, setError] = useState("");

  const handleLogin = useCallback(async (email: string, password: string) => {
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
      return;
    }
    setStep("unlock");
  }, []);

  const handleUnlock = useCallback(async (masterPassword: string) => {
    setError("");
    const { data: saltData, error: saltError } = await supabase
      .from("app_config")
      .select("pbkdf2_salt")
      .single();
    if (saltError || !saltData?.pbkdf2_salt) {
      setError("No vault salt found. Set up the vault on your Mac first.");
      return;
    }
    try {
      const key = await deriveEncryptionKey(masterPassword, saltData.pbkdf2_salt);
      setVaultKey(key);
      setStep("add");
    } catch {
      setError("Failed to derive encryption key. Wrong password?");
    }
  }, []);

  const handleTransactionAdded = useCallback(() => {
    setStep("confirmation");
  }, []);

  const handleAddAnother = useCallback(() => {
    setStep("add");
  }, []);

  return (
    <div className="app animate-in">
      {step === "login" && (
        <LoginScreen onLogin={handleLogin} error={error} />
      )}
      {step === "unlock" && (
        <UnlockScreen onUnlock={handleUnlock} error={error} />
      )}
      {step === "add" && vaultKey && (
        <AddTransactionScreen
          vaultKey={vaultKey}
          onSuccess={handleTransactionAdded}
        />
      )}
      {step === "confirmation" && (
        <ConfirmationScreen onAddAnother={handleAddAnother} />
      )}
    </div>
  );
}
