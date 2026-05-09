import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ConfirmationScreen from "./ConfirmationScreen";

describe("ConfirmationScreen", () => {
  it("renders success message", () => {
    render(<ConfirmationScreen onAddAnother={vi.fn()} />);
    expect(screen.getByText("Transaction Added")).toBeInTheDocument();
    expect(
      screen.getByText("Your transaction has been saved securely."),
    ).toBeInTheDocument();
  });

  it("calls onAddAnother when button is clicked", async () => {
    const onAddAnother = vi.fn();
    render(<ConfirmationScreen onAddAnother={onAddAnother} />);
    await userEvent.click(screen.getByRole("button", { name: "Add Another" }));
    expect(onAddAnother).toHaveBeenCalledTimes(1);
  });
});
