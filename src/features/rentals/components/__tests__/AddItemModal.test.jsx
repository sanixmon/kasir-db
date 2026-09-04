import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AddItemModal from '../AddItemModal';

const mockCatalog = [
  { code: 'SCOOTER', name: 'Scooter Anak', priceHour: 30000 },
  { code: 'STROLLER', name: 'Stroller Bayi', priceHour: 40000 }
];

describe('AddItemModal Component Tests', () => {
  it('renders customer name, queue number and calculates additional subtotal correctly', () => {
    const session = { id: 's-1', queueNo: 7, nama: 'Anita' };
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(<AddItemModal session={session} onClose={onClose} onSave={onSave} itemsCatalog={mockCatalog} />);

    expect(screen.getByText(/Antrian #7/i)).toBeInTheDocument();
    expect(screen.getByText(/Anita/i)).toBeInTheDocument();

    // Initially total is Rp 0 and submit is disabled
    const saveBtn = screen.getByRole('button', { name: /Simpan & Cetak/i });
    expect(saveBtn).toBeDisabled();

    // Click + on Scooter
    const plusButtons = screen.getAllByRole('button', { name: '+' });
    fireEvent.click(plusButtons[0]);

    // Now total should show Rp 30.000 and save button enabled
    expect(screen.getByText(/^Rp 30\.000$/i)).toBeInTheDocument();
    expect(saveBtn).not.toBeDisabled();

    // Decrease quantity
    const minusButtons = screen.getAllByRole('button', { name: '−' });
    fireEvent.click(minusButtons[0]);
    expect(screen.getByText(/^Rp 0$/i)).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();
  });

  it('submits selected items and payment method on save click', async () => {
    const session = { id: 's-1', queueNo: 7, nama: 'Anita' };
    const onClose = vi.fn();
    const onSave = vi.fn().mockResolvedValue({ success: true });

    render(<AddItemModal session={session} onClose={onClose} onSave={onSave} itemsCatalog={mockCatalog} />);

    // Add 1 Scooter
    const plusButtons = screen.getAllByRole('button', { name: '+' });
    fireEvent.click(plusButtons[0]);

    // Select QRIS
    const qrisRadio = screen.getByLabelText(/QRIS/i);
    fireEvent.click(qrisRadio);

    // Click submit
    const saveBtn = screen.getByRole('button', { name: /Simpan & Cetak/i });
    await React.act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(onSave).toHaveBeenCalledWith(
      [{ code: 'SCOOTER', qty: 1, priceBase: 30000 }],
      'qris'
    );
  });

  it('calculates change when cash given exceeds total additional amount', () => {
    const session = { id: 's-1', queueNo: 7, nama: 'Anita' };
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(<AddItemModal session={session} onClose={onClose} onSave={onSave} itemsCatalog={mockCatalog} />);

    // Add 1 Scooter (Rp 30.000)
    const plusButtons = screen.getAllByRole('button', { name: '+' });
    fireEvent.click(plusButtons[0]);

    const cashInput = screen.getByPlaceholderText(/Contoh: 30000/i);
    fireEvent.change(cashInput, { target: { value: '50000' } });

    expect(screen.getByText(/Kembalian:/i)).toBeInTheDocument();
    expect(screen.getByText(/Rp 20\.000/i)).toBeInTheDocument();
  });

  it('calls onClose when Batal or close button is clicked', () => {
    const session = { id: 's-1', queueNo: 7, nama: 'Anita' };
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(<AddItemModal session={session} onClose={onClose} onSave={onSave} itemsCatalog={mockCatalog} />);

    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
