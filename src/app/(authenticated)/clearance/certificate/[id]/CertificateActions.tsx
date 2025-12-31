'use client';

import { useState } from 'react';
import { generateClearanceCertificate } from '@/app/actions/certificate';

interface CertificateActionsProps {
    requestId: string;
    certificateNumber: string;
}

export function CertificateActions({ requestId, certificateNumber }: CertificateActionsProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const handleGeneratePDF = async () => {
        setIsGenerating(true);
        try {
            // Generate certificate data in backend
            await generateClearanceCertificate(requestId);

            // Trigger print dialog which can save as PDF
            window.print();
        } catch (error) {
            console.error('Failed to generate PDF:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyLink = async () => {
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        alert('Certificate link copied to clipboard!');
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={handleCopyLink}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Link
            </button>

            <button
                onClick={handlePrint}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print / Save PDF
            </button>
        </div>
    );
}
