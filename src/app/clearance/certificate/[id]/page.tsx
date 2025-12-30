import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCertificateByRequestId, generateClearanceCertificate } from '@/app/actions/certificate';
import { LAB_NAMES, REQUEST_TYPE_LABELS } from '@/types/clearance';
import Link from 'next/link';
import { CertificateActions } from './CertificateActions';

interface CertificatePageProps {
    params: Promise<{ id: string }>;
}

export default async function CertificatePage({ params }: CertificatePageProps) {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: certificate, error } = await getCertificateByRequestId(id);

    if (error || !certificate) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Certificate Not Found</h1>
                    <p className="text-gray-600 mb-6">{error || 'The requested certificate could not be found.'}</p>
                    <Link
                        href="/clearance"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Back to Clearance
                    </Link>
                </div>
            </div>
        );
    }

    // Check if approved
    if (certificate.status !== 'approved') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
                    <div className="text-yellow-500 text-5xl mb-4">⏳</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Clearance Not Yet Approved</h1>
                    <p className="text-gray-600 mb-6">
                        Your clearance request is still pending. Certificate will be available once all labs are cleared.
                    </p>
                    <Link
                        href="/clearance"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Check Status
                    </Link>
                </div>
            </div>
        );
    }

    // Certificate number (use the stored one or generate format)
    const certificateNumber = certificate.certificate_url ||
        `ECMS-${new Date(certificate.created_at).getFullYear()}-${id.slice(0, 8).toUpperCase()}`;

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Actions Bar */}
                <div className="mb-6 flex justify-between items-center">
                    <Link
                        href="/clearance"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                    >
                        ← Back to Clearance
                    </Link>
                    <CertificateActions requestId={id} certificateNumber={certificateNumber} />
                </div>

                {/* Certificate */}
                <div id="certificate" className="bg-white rounded-lg shadow-xl overflow-hidden">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-8 text-center">
                        <h1 className="text-3xl font-bold tracking-wide">EQUIPMENT CLEARANCE CERTIFICATE</h1>
                        <p className="text-blue-100 mt-2">Lab Equipment Clearance Management System</p>
                    </div>

                    {/* Certificate Body */}
                    <div className="p-8">
                        {/* Certificate Number */}
                        <div className="text-center mb-8">
                            <p className="text-sm text-gray-500">Certificate Number</p>
                            <p className="text-xl font-mono font-bold text-gray-900">{certificateNumber}</p>
                        </div>

                        {/* Main Content */}
                        <div className="text-center mb-8">
                            <p className="text-gray-600 mb-4">This is to certify that</p>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {certificate.user?.full_name || 'Student'}
                            </h2>
                            {certificate.user?.student_id && (
                                <p className="text-gray-600">Student ID: {certificate.user.student_id}</p>
                            )}
                            <p className="text-gray-600">{certificate.user?.email}</p>

                            <p className="text-gray-600 mt-6 mb-2">
                                has successfully completed all equipment clearance requirements for
                            </p>
                            <p className="text-xl font-semibold text-blue-600">
                                {REQUEST_TYPE_LABELS[certificate.request_type as keyof typeof REQUEST_TYPE_LABELS] || certificate.request_type}
                            </p>
                        </div>

                        {/* Labs Cleared */}
                        <div className="border-t border-b border-gray-200 py-6 mb-8">
                            <h3 className="text-center font-semibold text-gray-700 mb-4">Labs Cleared</h3>
                            <div className="grid grid-cols-5 gap-4">
                                {(['lab1', 'lab2', 'lab3', 'lab4', 'lab5'] as const).map((lab) => (
                                    <div key={lab} className="text-center">
                                        <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="text-xs font-medium text-gray-700">{LAB_NAMES[lab]}</p>
                                        {certificate[`${lab}_reviewed_at` as keyof typeof certificate] && (
                                            <p className="text-xs text-gray-500">
                                                {new Date(certificate[`${lab}_reviewed_at` as keyof typeof certificate] as string).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-8 mb-8 text-center">
                            <div>
                                <p className="text-sm text-gray-500">Issue Date</p>
                                <p className="font-semibold text-gray-900">
                                    {certificate.certificate_generated_at
                                        ? new Date(certificate.certificate_generated_at).toLocaleDateString()
                                        : new Date(certificate.final_approved_at || certificate.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Valid Until</p>
                                <p className="font-semibold text-gray-900">
                                    {certificate.valid_until
                                        ? new Date(certificate.valid_until).toLocaleDateString()
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Signature Area */}
                        <div className="border-t pt-8 mt-8">
                            <div className="flex justify-between items-end">
                                <div className="text-center">
                                    <div className="w-48 border-t border-gray-400 pt-2">
                                        <p className="text-sm text-gray-600">Authorized Signature</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-400 text-xs font-mono">
                                        Verification: {id.slice(0, 8).toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-500">
                        <p>This certificate is electronically generated and is valid without signature.</p>
                        <p>Verify at: ecms.edu/verify/{certificateNumber}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
