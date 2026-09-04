import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardTab from '../DashboardTab';

describe('DashboardTab Integration Tests', () => {
  it('renders "+ Item" button on active session cards and triggers onAddItem when clicked', () => {
    const activeSessions = [
      {
        id: 's-active-1',
        queueNo: 3,
        nama: 'Pak Joko',
        startTime: Date.now(),
        payAwal: 'cash',
        items: [{ code: 'STROLLER', qty: 1 }]
      }
    ];

    const onAddItem = vi.fn();

    render(
      <DashboardTab
        activeSessions={activeSessions}
        onStartSewa={vi.fn()}
        getImgUrl={vi.fn()}
        onSelesaiSewa={vi.fn()}
        onShowQR={vi.fn()}
        onPrintSesi={vi.fn()}
        onEditSesi={vi.fn()}
        onAddItem={onAddItem}
      />
    );

    const addBtn = screen.getByTitle('Tambah Item');
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);
    expect(onAddItem).toHaveBeenCalledTimes(1);
    expect(onAddItem).toHaveBeenCalledWith(activeSessions[0]);
  });
});
