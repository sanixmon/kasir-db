import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CalculateRentalModal from '../CalculateRentalModal';

vi.mock('../../../../lib/items', () => ({
  ITEMS: [
    { code: 'STROLLER', name: 'Stroller Bayi', priceHour: 40000, priceOT30: 20000, priceOT60: 40000, isPackage: false },
    { code: 'SCOOTER', name: 'Scooter Anak', priceHour: 30000, priceOT30: 15000, priceOT60: 30000, isPackage: false }
  ]
}));

describe('CalculateRentalModal Component Tests', () => {
  it('calculates overtime independently per-item based on individual startTime', () => {
    const now = Date.now();
    // Stroller started 80 minutes ago (80m - 60m = 20m OT -> 1x half hour OT: 20.000)
    const strollerStart = now - (80 * 60 * 1000);
    // Scooter started 15 minutes ago (15m elapsed -> 0m OT: 0)
    const scooterStart = now - (15 * 60 * 1000);

    const session = {
      id: 's-123',
      queueNo: 2,
      nama: 'Keluarga Budi',
      startTime: strollerStart,
      items: [
        { code: 'STROLLER', qty: 1, startTime: strollerStart },
        { code: 'SCOOTER', qty: 1, startTime: scooterStart }
      ]
    };

    const onProceedPayment = vi.fn();

    render(
      <CalculateRentalModal
        session={session}
        onClose={vi.fn()}
        onProceedPayment={onProceedPayment}
      />
    );

    // Stroller should have overtime cost Rp 20.000
    // Scooter should have overtime cost Rp 0
    expect(screen.getAllByText(/Rp 70\.000/i)[0]).toBeInTheDocument();

    const proceedBtn = screen.getByRole('button', { name: /Lanjut Pembayaran/i });
    fireEvent.click(proceedBtn);

    expect(onProceedPayment).toHaveBeenCalledTimes(1);
    const paymentData = onProceedPayment.mock.calls[0][0];
    expect(paymentData.base).toBe(70000);
    expect(paymentData.ot).toBe(20000); // Only stroller is in OT
    expect(paymentData.grand).toBe(20000);
  });

  it('supports partial return by reducing returnQty for an item', () => {
    const now = Date.now();
    const session = {
      id: 's-123',
      queueNo: 2,
      nama: 'Budi',
      startTime: now - (30 * 60 * 1000),
      items: [
        { code: 'STROLLER', qty: 1 },
        { code: 'SCOOTER', qty: 1 }
      ]
    };

    const onProceedPayment = vi.fn();

    render(
      <CalculateRentalModal
        session={session}
        onClose={vi.fn()}
        onProceedPayment={onProceedPayment}
      />
    );

    // Click minus on Scooter (index 1) to return only Stroller
    const minusButtons = screen.getAllByRole('button', { name: '-' });
    fireEvent.click(minusButtons[1]); // Second item minus

    const proceedBtn = screen.getByRole('button', { name: /Lanjut Pembayaran/i });
    fireEvent.click(proceedBtn);

    const paymentData = onProceedPayment.mock.calls[0][0];
    expect(paymentData.base).toBe(40000); // only stroller returned
  });
});
