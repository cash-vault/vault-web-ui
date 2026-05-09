import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import LoginScreen from "./LoginScreen";

describe("LoginScreen", () => {
  const defaultProps = { onLogin: vi.fn(), error: "" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password fields and sign in button", () => {
    render(<LoginScreen {...defaultProps} />);
    expect(
      screen.getByPlaceholderText("you@example.com"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Supabase password"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign In" }),
    ).toBeInTheDocument();
  });

  it("disables button when fields are empty", () => {
    render(<LoginScreen {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Sign In" })).toBeDisabled();
  });

  it("enables button when both fields have values", async () => {
    render(<LoginScreen {...defaultProps} />);
    await userEvent.type(
      screen.getByPlaceholderText("you@example.com"),
      "a@b.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText("Supabase password"),
      "secret",
    );
    expect(
      screen.getByRole("button", { name: "Sign In" }),
    ).not.toBeDisabled();
  });

  it("calls onLogin with email and password on submit", async () => {
    const onLogin = vi.fn();
    render(<LoginScreen onLogin={onLogin} error="" />);
    await userEvent.type(
      screen.getByPlaceholderText("you@example.com"),
      "a@b.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText("Supabase password"),
      "secret",
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));
    expect(onLogin).toHaveBeenCalledWith("a@b.com", "secret");
  });

  it("shows error message when error prop is set", () => {
    render(<LoginScreen {...defaultProps} error="Invalid credentials" />);
    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("shows spinner while loading", async () => {
    const onLogin = vi.fn(() => new Promise<void>(() => {}));
    render(<LoginScreen onLogin={onLogin} error="" />);
    await userEvent.type(
      screen.getByPlaceholderText("you@example.com"),
      "a@b.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText("Supabase password"),
      "secret",
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));
    expect(screen.getByRole("button")).toContainHTML("spinner");
  });

  it("does not submit if email is empty (button disabled)", () => {
    const onLogin = vi.fn();
    render(<LoginScreen onLogin={onLogin} error="" />);
    expect(
      screen.getByRole("button", { name: "Sign In" }),
    ).toBeDisabled();
    expect(onLogin).not.toHaveBeenCalled();
  });
});
