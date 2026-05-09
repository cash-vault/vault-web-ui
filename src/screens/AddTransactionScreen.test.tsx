import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import AddTransactionScreen from "./AddTransactionScreen";

const mockAccounts = [
  {
    id: "acc-1",
    name_enc: "enc-checking",
    iv: "iv-1",
    currency: "USD",
    balance_enc: "enc-bal-1",
    balance_iv: "iv-bal-1",
  },
  {
    id: "acc-2",
    name_enc: "enc-savings",
    iv: "iv-2",
    currency: "EUR",
    balance_enc: "enc-bal-2",
    balance_iv: "iv-bal-2",
  },
];

const mockCategories = [
  { id: "cat-1", name_enc: "enc-food", iv: "iv-cat-1", color: "#ff0000", icon: null },
  { id: "cat-2", name_enc: "enc-transport", iv: "iv-cat-2", color: "#00ff00", icon: null },
];

vi.mock("../supabase", () => ({
  supabase: {
    from: vi.fn().mockImplementation((table: string) => ({
      select: vi.fn().mockResolvedValue(
        table === "accounts"
          ? { data: mockAccounts, error: null }
          : { data: mockCategories, error: null },
      ),
    })),
    rpc: vi.fn(),
  },
}));

vi.mock("../crypto", () => ({
  decrypt: vi
    .fn()
    .mockImplementation((ciphertext: string) => {
      if (ciphertext === "enc-checking") return Promise.resolve("Checking");
      if (ciphertext === "enc-savings") return Promise.resolve("Savings");
      if (ciphertext === "enc-food") return Promise.resolve("Food");
      if (ciphertext === "enc-transport") return Promise.resolve("Transport");
      if (ciphertext === "enc-bal-1") return Promise.resolve("1500.00");
      if (ciphertext === "enc-bal-2") return Promise.resolve("3000.00");
      return Promise.resolve("unknown");
    }),
  encrypt: vi.fn().mockResolvedValue({
    ciphertext: "mock-ciphertext",
    iv: "mock-iv",
  }),
}));

const vaultKey = new Uint8Array(32);

function getForm(container: HTMLElement): HTMLFormElement {
  return container.querySelector("form")!;
}

describe("AddTransactionScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(crypto, "randomUUID").mockReturnValue("test-uuid" as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state initially", () => {
    render(
      <AddTransactionScreen vaultKey={vaultKey} onSuccess={vi.fn()} />,
    );
    expect(screen.getByText("Loading accounts...")).toBeInTheDocument();
  });

  it("renders form with accounts and categories loaded", async () => {
    const { container } = render(
      <AddTransactionScreen vaultKey={vaultKey} onSuccess={vi.fn()} />,
    );
    await waitFor(() => {
      expect(getForm(container)).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("What was this for?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Checking")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
  });

  it("toggles between expense and income", async () => {
    const { container } = render(
      <AddTransactionScreen vaultKey={vaultKey} onSuccess={vi.fn()} />,
    );
    await waitFor(() => {
      expect(getForm(container)).toBeInTheDocument();
    });
    const expenseBtn = screen.getByText("Expense");
    const incomeBtn = screen.getByText("Income");
    expect(expenseBtn.className).toContain("active");
    expect(incomeBtn.className).not.toContain("active");

    await userEvent.click(incomeBtn);
    expect(incomeBtn.className).toContain("active");
    expect(expenseBtn.className).not.toContain("active");
  });

  it("shows validation error for zero amount", async () => {
    const { container } = render(
      <AddTransactionScreen vaultKey={vaultKey} onSuccess={vi.fn()} />,
    );
    await waitFor(() => {
      expect(getForm(container)).toBeInTheDocument();
    });
    await userEvent.type(screen.getByPlaceholderText("0.00"), "0");
    await userEvent.type(
      screen.getByPlaceholderText("What was this for?"),
      "x",
    );
    fireEvent.submit(getForm(container));
    expect(
      screen.getByText("Please fill in all required fields."),
    ).toBeInTheDocument();
  });

  it("submits transaction successfully", async () => {
    const onSuccess = vi.fn();
    const { supabase } = await import("../supabase");
    vi.mocked(supabase.rpc).mockResolvedValue({ data: {}, error: null } as never);

    const { container } = render(<AddTransactionScreen vaultKey={vaultKey} onSuccess={onSuccess} />);
    await waitFor(() => {
      expect(getForm(container)).toBeInTheDocument();
    });
    await userEvent.type(screen.getByPlaceholderText("0.00"), "42.50");
    await userEvent.type(
      screen.getByPlaceholderText("What was this for?"),
      "Groceries",
    );
    fireEvent.submit(getForm(container));
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("calls rpc with correct parameters on expense submit", async () => {
    const onSuccess = vi.fn();
    const { supabase } = await import("../supabase");
    vi.mocked(supabase.rpc).mockResolvedValue({ data: {}, error: null } as never);
    const { container } = render(
      <AddTransactionScreen vaultKey={vaultKey} onSuccess={onSuccess} />,
    );
    await waitFor(() => {
      expect(getForm(container)).toBeInTheDocument();
    });
    await userEvent.type(screen.getByPlaceholderText("0.00"), "100");
    await userEvent.type(
      screen.getByPlaceholderText("What was this for?"),
      "Dinner",
    );
    fireEvent.submit(getForm(container));
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith(
        "add_transaction_with_balance_update",
        expect.objectContaining({
          p_type: "expense",
          p_account_id: "acc-1",
          p_encrypted_data: "mock-ciphertext",
        }),
      );
    });
  });

  it("shows error message on rpc failure", async () => {
    const { supabase } = await import("../supabase");
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    } as never);
    const { container } = render(
      <AddTransactionScreen vaultKey={vaultKey} onSuccess={vi.fn()} />,
    );
    await waitFor(() => {
      expect(getForm(container)).toBeInTheDocument();
    });
    await userEvent.type(screen.getByPlaceholderText("0.00"), "50");
    await userEvent.type(
      screen.getByPlaceholderText("What was this for?"),
      "Test",
    );
    fireEvent.submit(getForm(container));
    await waitFor(() => {
      expect(screen.getByText("Database error")).toBeInTheDocument();
    });
  });

  it("shows date shortcuts for today and yesterday", async () => {
    const { container } = render(
      <AddTransactionScreen vaultKey={vaultKey} onSuccess={vi.fn()} />,
    );
    await waitFor(() => {
      expect(getForm(container)).toBeInTheDocument();
    });
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });
});
