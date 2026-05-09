import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import UnlockScreen from "./UnlockScreen";

describe("UnlockScreen", () => {
  const defaultProps = { onUnlock: vi.fn(), error: "" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders password field and unlock button", () => {
    render(<UnlockScreen {...defaultProps} />);
    expect(
      screen.getByPlaceholderText("Vault master password"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Unlock" }),
    ).toBeInTheDocument();
  });

  it("disables button when password is empty", () => {
    render(<UnlockScreen {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Unlock" })).toBeDisabled();
  });

  it("enables button when password is entered", async () => {
    render(<UnlockScreen {...defaultProps} />);
    await userEvent.type(
      screen.getByPlaceholderText("Vault master password"),
      "mypassword",
    );
    expect(
      screen.getByRole("button", { name: "Unlock" }),
    ).not.toBeDisabled();
  });

  it("calls onUnlock with password on submit", async () => {
    const onUnlock = vi.fn();
    render(<UnlockScreen onUnlock={onUnlock} error="" />);
    await userEvent.type(
      screen.getByPlaceholderText("Vault master password"),
      "mypassword",
    );
    await userEvent.click(screen.getByRole("button", { name: "Unlock" }));
    expect(onUnlock).toHaveBeenCalledWith("mypassword");
  });

  it("shows error message when error prop is set", () => {
    render(<UnlockScreen {...defaultProps} error="Wrong password" />);
    expect(screen.getByText("Wrong password")).toBeInTheDocument();
  });

  it("shows spinner while loading", async () => {
    const onUnlock = vi.fn(() => new Promise<void>(() => {}));
    render(<UnlockScreen onUnlock={onUnlock} error="" />);
    await userEvent.type(
      screen.getByPlaceholderText("Vault master password"),
      "mypassword",
    );
    await userEvent.click(screen.getByRole("button", { name: "Unlock" }));
    expect(screen.getByRole("button")).toContainHTML("spinner");
  });

  it("does not show email indicator when email prop is absent", () => {
    render(<UnlockScreen {...defaultProps} />);
    expect(screen.queryByText(/signed in as/i)).not.toBeInTheDocument();
  });

  it("shows signed-in email when email prop is provided", () => {
    render(<UnlockScreen {...defaultProps} email="user@example.com" />);
    expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
    expect(
      screen.getByText(/user@example\.com/i),
    ).toBeInTheDocument();
  });

  it("does not submit if password is empty (button disabled)", () => {
    const onUnlock = vi.fn();
    render(<UnlockScreen onUnlock={onUnlock} error="" />);
    expect(
      screen.getByRole("button", { name: "Unlock" }),
    ).toBeDisabled();
    expect(onUnlock).not.toHaveBeenCalled();
  });
});
