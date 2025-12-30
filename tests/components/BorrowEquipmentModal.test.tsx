import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BorrowEquipmentModal } from '@/components/BorrowEquipmentModal';
import type { Equipment } from '@/types/lab';

// Mock the borrowEquipment action
vi.mock('@/app/actions/lab', () => ({
    borrowEquipment: vi.fn().mockResolvedValue({ data: true, error: null }),
}));

const mockEquipment: Equipment = {
    id: 'test-id-1',
    equipment_code: 'EQ-001',
    equipment_name: 'Test Oscilloscope',
    category: 'Electronics',
    metadata: {},
    status: 'available',
    condition: 'good',
    location: 'Lab 1',
    purchase_date: '2024-01-01',
    purchase_price: 500,
    current_borrower_id: null,
    borrowed_at: null,
    expected_return_date: null,
    notes: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
};

describe('BorrowEquipmentModal', () => {
    it('renders modal when open', () => {
        render(
            <BorrowEquipmentModal
                equipment={mockEquipment}
                labSchema="lab1"
                isOpen={true}
                onClose={() => { }}
            />
        );

        expect(screen.getByText('Borrow Equipment')).toBeDefined();
        expect(screen.getByText('Test Oscilloscope')).toBeDefined();
        expect(screen.getByText('EQ-001')).toBeDefined();
    });

    it('does not render when closed', () => {
        render(
            <BorrowEquipmentModal
                equipment={mockEquipment}
                labSchema="lab1"
                isOpen={false}
                onClose={() => { }}
            />
        );

        expect(screen.queryByText('Borrow Equipment')).toBeNull();
    });

    it('shows equipment category and condition', () => {
        render(
            <BorrowEquipmentModal
                equipment={mockEquipment}
                labSchema="lab1"
                isOpen={true}
                onClose={() => { }}
            />
        );

        expect(screen.getByText('Electronics')).toBeDefined();
        expect(screen.getByText('good')).toBeDefined();
    });

    it('calls onClose when cancel button clicked', () => {
        const onClose = vi.fn();
        render(
            <BorrowEquipmentModal
                equipment={mockEquipment}
                labSchema="lab1"
                isOpen={true}
                onClose={onClose}
            />
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalled();
    });

    it('disables submit button without date', () => {
        render(
            <BorrowEquipmentModal
                equipment={mockEquipment}
                labSchema="lab1"
                isOpen={true}
                onClose={() => { }}
            />
        );

        const submitButton = screen.getByText('Confirm Borrow');
        expect(submitButton).toHaveProperty('disabled', true);
    });
});
