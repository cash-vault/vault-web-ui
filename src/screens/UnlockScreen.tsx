import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import "./UnlockScreen.css";

interface UnlockScreenProps {
  onUnlock: (masterPassword: string) => Promise<void>;
  error: string;
  email?: string;
}

export default function UnlockScreen({ onUnlock, error, email }: UnlockScreenProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      await onUnlock(password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card glass animate-in">
      <div className="card-header">
        <div className="icon-circle unlock-icon">
          <Lock size={28} />
        </div>
        <h1>Unlock Vault</h1>
        <p>Enter your master password to decrypt data</p>
        {email && <p className="email-indicator">Signed in as {email}</p>}
      </div>

      <div className="form-group">
        <label>Master Password</label>
        <input
          type="password"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Vault master password"
          autoFocus
          autoComplete="off"
          disabled={loading}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={loading || !password}>
        {loading ? <Loader2 className="spinner" size={20} /> : "Unlock"}
      </button>

      {error && <p className="error-message">{error}</p>}
    </form>
  );
}
