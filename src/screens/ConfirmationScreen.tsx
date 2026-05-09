import { CheckCircle2 } from "lucide-react";
import "./ConfirmationScreen.css";

interface ConfirmationScreenProps {
  onAddAnother: () => void;
}

export default function ConfirmationScreen({ onAddAnother }: ConfirmationScreenProps) {
  return (
    <div className="card glass animate-in">
      <div className="card-header">
        <div className="success-icon">
          <CheckCircle2 size={48} />
        </div>
        <h1>Transaction Added</h1>
        <p>Your transaction has been saved securely.</p>
      </div>

      <button onClick={onAddAnother} className="btn-primary">
        Add Another
      </button>
    </div>
  );
}
