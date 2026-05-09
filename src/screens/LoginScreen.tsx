import { useState } from "react";
import { LogIn, Loader2 } from "lucide-react";
import "./LoginScreen.css";

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  error: string;
}

export default function LoginScreen({ onLogin, error }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card glass animate-in">
      <div className="card-header">
        <div className="icon-circle">
          <LogIn size={28} />
        </div>
        <h1>Sign In</h1>
        <p>Enter your Supabase credentials</p>
      </div>

      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          name="email"
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoFocus
          autoComplete="email"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          name="password"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Supabase password"
          autoComplete="current-password"
          disabled={loading}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={loading || !email || !password}>
        {loading ? <Loader2 className="spinner" size={20} /> : "Sign In"}
      </button>

      {error && <p className="error-message">{error}</p>}
    </form>
  );
}
