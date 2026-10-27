/* eslint-disable no-unused-vars */
// src/__tests__/components/VcrCalculator.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import VcrCalculator from "@components/calculators/VcrCalculator";
import { AuthContext } from "@context/AuthContext";

const renderWithAuth = (ui, { user = null } = {}) => {
  return render(
    <AuthContext.Provider value={{ user, logout: vi.fn(), isAdmin: false }}>
      {ui}
    </AuthContext.Provider>,
  );
};

describe("VcrCalculator", () => {
  it("renders input form correctly", () => {
    renderWithAuth(<VcrCalculator />);
    expect(screen.getByText(/vcr calculator/i)).toBeInTheDocument();
    expect(screen.getByText(/test duration/i)).toBeInTheDocument();
    expect(screen.getByText(/distance/i)).toBeInTheDocument();
  });

  it("shows placeholder state before calculation", () => {
    renderWithAuth(<VcrCalculator />);
    expect(screen.getByText(/enter test data/i)).toBeInTheDocument();
  });
});
