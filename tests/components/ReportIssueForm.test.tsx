import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportIssueForm } from '@/components/ReportIssueForm';
import type { Equipment } from '@/types/lab';

// Mock the createIssue action
vi.mock('@/app/actions/lab', () => ({
    createIssue: vi.fn().mockResolvedValue({ data: true, error: null }),
}));

const mockEquipment: Equipment = {
    id: 'test-id-1',
    equipment_code: 'EQ-001',
    equipment_name: 'Test Multimeter',
    category: 'Electronics',
    metadata: {},
    status: 'available',
    condition: 'good',
    location: 'Lab 2',
    purchase_date: '2024-01-01',
    purchase_price: 200,
    current_borrower_id: null,
    borrowed_at: null,
    expected_return_date: null,
    notes: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
};

describe('ReportIssueForm', () => {
    it('renders form with equipment info', () => {
        render(
            <ReportIssueForm
                equipment={mockEquipment}
                labSchema="lab2"
            />
        );

        expect(screen.getByText('Report Issue')).toBeDefined();
        expect(screen.getByText('Test Multimeter')).toBeDefined();
        expect(screen.getByText('EQ-001')).toBeDefined();
    });

    it('shows all issue type options', () => {
        render(
            <ReportIssueForm
                equipment={mockEquipment}
                labSchema="lab2"
            />
        );

        expect(screen.getByText('Physical Damage')).toBeDefined();
        expect(screen.getByText('Malfunction')).toBeDefined();
        expect(screen.getByText('Lost/Missing')).toBeDefined();
        expect(screen.getByText('Other')).toBeDefined();
    });

    it('shows all severity options', () => {
        render(
            <ReportIssueForm
                equipment={mockEquipment}
                labSchema="lab2"
            />
        );

        expect(screen.getByText('Low')).toBeDefined();
        expect(screen.getByText('Medium')).toBeDefined();
        expect(screen.getByText('High')).toBeDefined();
        expect(screen.getByText('Critical')).toBeDefined();
    });

    it('disables submit without required fields', () => {
        render(
            <ReportIssueForm
                equipment={mockEquipment}
                labSchema="lab2"
            />
        );

        const submitButton = screen.getByText('Report Issue');
        expect(submitButton).toHaveProperty('disabled', true);
    });

    it('calls onCancel when cancel button clicked', () => {
        const onCancel = vi.fn();
        render(
            <ReportIssueForm
                equipment={mockEquipment}
                labSchema="lab2"
                onCancel={onCancel}
            />
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(onCancel).toHaveBeenCalled();
    });
});
