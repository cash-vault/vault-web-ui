import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock("./crypto", () => ({
  deriveEncryptionKey: vi.fn(),
  encrypt: vi.fn(),
  decrypt: vi.fn(),
}));

vi.mock("./screens/LoginScreen", () => ({
  default: ({ onLogin, error }: { onLogin: (e: string, p: string) => void; error: string }) => (
    <div data-testid="login-screen">
      <button onClick={() => onLogin("a@b.com", "pw")}>trigger-login</button>
      {error && <p data-testid="login-error">{error}</p>}
    </div>
  ),
}));

vi.mock("./screens/UnlockScreen", () => ({
  default: ({ onUnlock, error }: { onUnlock: (p: string) => void; error: string }) => (
    <div data-testid="unlock-screen">
      <button onClick={() => onUnlock("masterpw")}>trigger-unlock</button>
      {error && <p data-testid="unlock-error">{error}</p>}
    </div>
  ),
}));

vi.mock("./screens/AddTransactionScreen", () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="add-screen">
      <button onClick={() => onSuccess()}>trigger-add</button>
    </div>
  ),
}));

vi.mock("./screens/ConfirmationScreen", () => ({
  default: ({ onAddAnother }: { onAddAnother: () => void }) => (
    <div data-testid="confirmation-screen">
      <button onClick={() => onAddAnother()}>trigger-another</button>
    </div>
  ),
}));

const { supabase } = await import("./supabase");
const { deriveEncryptionKey } = await import("./crypto");

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as never);
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as never);
  });

  it("shows loading state while checking session", async () => {
    vi.mocked(supabase.auth.getSession).mockReturnValue(
      new Promise(() => {}),
    );

    const App = (await import("./App")).default;
    render(<App />);

    expect(screen.getByText("Checking session...")).toBeInTheDocument();
  });

  it("routes to login when no session exists", async () => {
    const App = (await import("./App")).default;
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("login-screen")).toBeInTheDocument();
    });
  });

  it("routes to unlock when a valid session exists", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { email: "test@example.com" } } },
    } as never);

    const App = (await import("./App")).default;
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("unlock-screen")).toBeInTheDocument();
    });
  });

  it("redirects to login when SIGNED_OUT event fires", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { email: "test@example.com" } } },
    } as never);
    let authCallback: ((event: string, session: unknown) => void) | null = null;
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(
      (cb: (event: string, session: unknown) => void) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    );

    const App = (await import("./App")).default;
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("unlock-screen")).toBeInTheDocument();
    });

    authCallback?.("SIGNED_OUT", null);

    await waitFor(() => {
      expect(screen.getByTestId("login-screen")).toBeInTheDocument();
    });
  });

  it("transitions to unlock screen on successful login", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as never);

    const App = (await import("./App")).default;
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId("login-screen")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("trigger-login"));
    expect(screen.getByTestId("unlock-screen")).toBeInTheDocument();
  });

  it("shows error on failed login", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid credentials" },
    } as never);

    const App = (await import("./App")).default;
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId("login-screen")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("trigger-login"));
    expect(screen.getByTestId("login-error")).toHaveTextContent(
      "Invalid credentials",
    );
  });

  it("transitions to add screen on successful unlock", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as never);
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { pbkdf2_salt: "test-salt" },
          error: null,
        }),
      }),
    } as never);
    vi.mocked(deriveEncryptionKey).mockResolvedValue(
      new Uint8Array(32),
    );

    const App = (await import("./App")).default;
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId("login-screen")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("trigger-login"));
    await userEvent.click(screen.getByText("trigger-unlock"));
    expect(screen.getByTestId("add-screen")).toBeInTheDocument();
  });

  it("shows error on unlock when no salt found", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as never);
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      }),
    } as never);

    const App = (await import("./App")).default;
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId("login-screen")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("trigger-login"));
    await userEvent.click(screen.getByText("trigger-unlock"));
    expect(screen.getByTestId("unlock-error")).toHaveTextContent(
      "No vault salt found",
    );
  });

  it("transitions from add to confirmation on success", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as never);
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { pbkdf2_salt: "test-salt" },
          error: null,
        }),
      }),
    } as never);
    vi.mocked(deriveEncryptionKey).mockResolvedValue(
      new Uint8Array(32),
    );

    const App = (await import("./App")).default;
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId("login-screen")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("trigger-login"));
    await userEvent.click(screen.getByText("trigger-unlock"));
    await userEvent.click(screen.getByText("trigger-add"));
    expect(screen.getByTestId("confirmation-screen")).toBeInTheDocument();
  });

  it("transitions from confirmation back to add on add another", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as never);
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { pbkdf2_salt: "test-salt" },
          error: null,
        }),
      }),
    } as never);
    vi.mocked(deriveEncryptionKey).mockResolvedValue(
      new Uint8Array(32),
    );

    const App = (await import("./App")).default;
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId("login-screen")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("trigger-login"));
    await userEvent.click(screen.getByText("trigger-unlock"));
    await userEvent.click(screen.getByText("trigger-add"));
    await userEvent.click(screen.getByText("trigger-another"));
    expect(screen.getByTestId("add-screen")).toBeInTheDocument();
  });
});
