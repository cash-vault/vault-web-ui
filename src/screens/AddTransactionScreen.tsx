import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../supabase";
import { encrypt, decrypt } from "../crypto";
import { Loader2 } from "lucide-react";
import "./AddTransactionScreen.css";

interface AddTransactionScreenProps {
  vaultKey: Uint8Array;
  onSuccess: () => void;
}

interface RawAccount {
  id: string;
  name_enc: string;
  iv: string;
  currency: string;
  balance_enc: string | null;
  balance_iv: string | null;
}

interface RawCategory {
  id: string;
  name_enc: string;
  iv: string;
  color: string | null;
  icon: string | null;
}

interface Account {
  id: string;
  name: string;
  currency: string;
  balance: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function AddTransactionScreen({ vaultKey, onSuccess }: AddTransactionScreenProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    const load = async () => {
      try {
        const [accRes, catRes] = await Promise.all([
          supabase.from("accounts").select("id,name_enc,iv,currency,balance_enc,balance_iv"),
          supabase.from("categories").select("id,name_enc,iv,color,icon"),
        ]);

        if (accRes.error) throw new Error(accRes.error.message);
        if (catRes.error) throw new Error(catRes.error.message);

        const decryptedAccs = await Promise.all(
          (accRes.data as RawAccount[]).map(async (a) => {
            const name = await decrypt(a.name_enc, a.iv, vaultKey);
            let balance = 0;
            if (a.balance_enc && a.balance_iv) {
              const balStr = await decrypt(a.balance_enc, a.balance_iv, vaultKey);
              balance = parseFloat(balStr) || 0;
            }
            return { id: a.id, name, currency: a.currency, balance };
          }),
        );

        const decryptedCats = await Promise.all(
          (catRes.data as RawCategory[]).map(async (c) => {
            const name = await decrypt(c.name_enc, c.iv, vaultKey);
            return { id: c.id, name, color: c.color || "#007aff" };
          }),
        );

        setAccounts(decryptedAccs);
        setCategories(decryptedCats);
        if (decryptedAccs.length > 0) setAccountId(decryptedAccs[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [vaultKey]);

  const { today, yesterday } = useMemo(() => {
    const now = new Date();
    return {
      today: now.toISOString().split("T")[0],
      yesterday: new Date(now.getTime() - 86400000).toISOString().split("T")[0],
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || !description.trim() || !accountId) {
      setError("Please fill in all required fields.");
      return;
    }

    const account = accounts.find((a) => a.id === accountId);
    if (!account) {
      setError("Selected account not found.");
      return;
    }

    setSubmitting(true);
    try {
      const id = crypto.randomUUID();
      const txData = JSON.stringify({ amount: numAmount, description: description.trim() });
      const { ciphertext: encrypted_data, iv } = await encrypt(txData, vaultKey);

      const balanceDiff = type === "income" ? numAmount : -numAmount;
      const newBalance = account.balance + balanceDiff;
      const { ciphertext: balance_enc, iv: balance_iv } = await encrypt(newBalance.toString(), vaultKey);

      const { error: rpcError } = await supabase.rpc("add_transaction_with_balance_update", {
        p_id: id,
        p_account_id: accountId,
        p_category_id: categoryId || null,
        p_encrypted_data: encrypted_data,
        p_iv: iv,
        p_type: type,
        p_date: new Date(date).toISOString(),
        p_balance_enc: balance_enc,
        p_balance_iv: balance_iv,
      });

      if (rpcError) throw new Error(rpcError.message);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add transaction");
    } finally {
      setSubmitting(false);
    }
  }, [amount, description, accountId, categoryId, type, date, vaultKey, accounts, onSuccess]);

  if (loading) {
    return (
      <div className="card glass animate-in" style={{ textAlign: "center", padding: 48 }}>
        <Loader2 className="spinner" size={32} />
        <p style={{ marginTop: 12, color: "var(--text-secondary)" }}>Loading accounts...</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="card glass animate-in" style={{ textAlign: "center", padding: 48 }}>
        <p style={{ color: "var(--text-secondary)" }}>No accounts found. Create one on your Mac first.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card glass animate-in">
      <div className="card-header">
        <h1>Add Transaction</h1>
      </div>

      <div className="type-toggle">
        <button
          type="button"
          className={`type-btn expense ${type === "expense" ? "active" : ""}`}
          onClick={() => setType("expense")}
        >
          Expense
        </button>
        <button
          type="button"
          className={`type-btn income ${type === "income" ? "active" : ""}`}
          onClick={() => setType("income")}
        >
          Income
        </button>
      </div>

      <div className="form-group">
        <label>Amount</label>
        <div className="amount-row">
          <input
            type="number"
            step="0.01"
            className="input-field amount-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            autoFocus
            required
            disabled={submitting}
          />
          <span className="currency-badge">
            {accounts.find((a) => a.id === accountId)?.currency || ""}
          </span>
        </div>
      </div>

      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          className="input-field"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was this for?"
          required
          disabled={submitting}
        />
      </div>

      <div className="form-row">
        <div className="form-group flex-1">
          <label>Account</label>
          <select
            className="input-field select-field"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            disabled={submitting}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group flex-1">
          <label>Category</label>
          <select
            className="input-field select-field"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={submitting}
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Date</label>
        <div className="date-row">
          <input
            type="date"
            className="input-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={submitting}
          />
          <button
            type="button"
            className="date-shortcut"
            onClick={() => setDate(today)}
          >
            Today
          </button>
          <button
            type="button"
            className="date-shortcut"
            onClick={() => setDate(yesterday)}
          >
            Yesterday
          </button>
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={submitting || !amount || !description.trim()}>
        {submitting ? <Loader2 className="spinner" size={20} /> : "Add Transaction"}
      </button>

      {error && <p className="error-message">{error}</p>}
    </form>
  );
}
