import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PaymentModal from "../PaymentModal";

describe("PaymentModal Component Tests", () => {
  it("renders on-time return banner and Konfirmasi Selesai button when grand is 0", () => {
    const onFinalize = vi.fn();
    const onClose = vi.fn();

    const bayarData = {
      grand: 0,
      session: {
        nama: "Aisyah",
        payAwal: "cash"
      }
    };

    render(
      <PaymentModal
        bayarData={bayarData}
        onClose={onClose}
        onFinalize={onFinalize}
      />
    );

    // Check on-time notice is present
    expect(screen.getByText(/Pengembalian Tepat Waktu/i)).toBeInTheDocument();
    expect(screen.getByText(/Tidak ada tagihan overtime/i)).toBeInTheDocument();

    // Button should say "Konfirmasi Selesai (Rp 0)"
    const submitBtn = screen.getByRole("button", { name: /Konfirmasi Selesai \(Rp 0\)/i });
    expect(submitBtn).toBeInTheDocument();

    fireEvent.click(submitBtn);

    expect(onFinalize).toHaveBeenCalledWith(0, 0);
  });

  it("renders payment options when grand > 0", () => {
    const onFinalize = vi.fn();
    const onClose = vi.fn();

    const bayarData = {
      grand: 20000,
      session: {
        nama: "Budi",
        payAwal: "cash"
      }
    };

    render(
      <PaymentModal
        bayarData={bayarData}
        onClose={onClose}
        onFinalize={onFinalize}
      />
    );

    expect(screen.getByRole("button", { name: /Metode Pembayaran Cash/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Metode Pembayaran QRIS/i })).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Konfirmasi Pembayaran/i });
    expect(submitBtn).toBeInTheDocument();

    fireEvent.click(submitBtn);

    expect(onFinalize).toHaveBeenCalledWith(20000, 0);
  });
});
