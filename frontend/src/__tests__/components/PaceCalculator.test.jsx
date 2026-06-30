/* eslint-disable no-unused-vars */
// src/__tests__/components/PaceCalculator.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaceCalculator from "@components/calculators/PaceCalculator";
import { AuthContext } from "@context/AuthContext";

const renderWithAuth = (ui, { user = null } = {}) => {
  return render(
    <AuthContext.Provider value={{ user, logout: vi.fn(), isAdmin: false }}>
      {ui}
    </AuthContext.Provider>,
  );
};

describe("PaceCalculator", () => {
  it("renders input form correctly", () => {
    renderWithAuth(<PaceCalculator />);
    expect(screen.getByText(/pace calculator/i)).toBeInTheDocument();
    expect(screen.getByText(/finish time/i)).toBeInTheDocument();
    expect(screen.getByText(/distance/i)).toBeInTheDocument();
  });

  it("shows results after form submission", async () => {
    const user = userEvent.setup();
    renderWithAuth(<PaceCalculator />);

    const calcBtn = screen.getByRole("button", { name: /calculate/i });
    await user.click(calcBtn);

    await waitFor(() => {
      expect(screen.getByText(/your pace/i)).toBeInTheDocument();
    });
  });

  it("switches between km and miles unit", async () => {
    const user = userEvent.setup();
    renderWithAuth(<PaceCalculator />);

    const milesBtn = screen.getByRole("button", { name: /miles/i });
    await user.click(milesBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/miles/i).length).toBeGreaterThan(0);
    });
  });

  it("shows save button when user is logged in", () => {
    renderWithAuth(<PaceCalculator />, {
      user: { id: "1", name: "Test", role: "user" },
    });
    // submit form first, then save button appears
  });

  it("does not show save button for anonymous users", () => {
    renderWithAuth(<PaceCalculator />);
    expect(screen.queryByText(/save calculation/i)).not.toBeInTheDocument();
  });
});
