import Link from 'next/link';
import { NutechLogo } from '@/components/ui/NutechLogo';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border-t-4 border-[#105a4b] text-center">
        <div className="flex justify-center mb-4">
          <NutechLogo className="w-auto h-16" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>

        <div className="bg-green-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-[#105a4b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </div>

        <p className="text-gray-600">
          We have sent a verification link to your email address.
          <br />
          Please click the link to verify your account and access the Student Dashboard.
        </p>

        <div className="text-sm bg-yellow-50 p-3 rounded text-yellow-800 border border-yellow-200">
          <strong>Note:</strong> If you are testing locally and want to skip this, please disable "Confirm Email" in your Supabase Dashboard.
        </div>

        <div className="pt-4">
          <Link href="/login" className="text-[#105a4b] font-medium hover:underline">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
