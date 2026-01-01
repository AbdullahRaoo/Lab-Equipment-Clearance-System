export const dynamic = 'force-dynamic';


import Link from 'next/link';
import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { NutechLogo } from '@/components/ui/NutechLogo';

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <NutechLogo className="h-8 w-auto text-[#105a4b]" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-500 hover:text-gray-900 font-medium text-sm">
                Staff Login
              </Link>
              <Link href="/login" className="bg-[#105a4b] hover:bg-[#0d473b] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-[#105a4b] sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Next-Gen</span>{' '}
                  <span className="block text-gray-900 xl:inline">Lab Management</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  NUTECH Equipment Clearance & Management System (ECMS) streamlines borrowing, inventory tracking, and no-dues certification across all university laboratories.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#105a4b] hover:bg-[#0d473b] md:py-4 md:text-lg transition-colors"
                    >
                      Student Portal
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      href="/signup"
                      className="w-full flex items-center justify-center px-8 py-3 border border-[#105a4b] text-base font-medium rounded-md text-[#105a4b] bg-white hover:bg-gray-50 md:py-4 md:text-lg transition-colors"
                    >
                      New Registration
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* Abstract Background / Image */}
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-gray-50 flex items-center justify-center">
          {/* Using a pattern or placeholder if image is not desired, utilizing NUTECH branding */}
          <div className="w-full h-full bg-[#105a4b]/5 pattern-grid-lg">
            <svg className="h-full w-full text-[#105a4b]/10" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Integrated Workflow
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Efficiently manage lab resources with role-based access control.
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col items-center">
                <span className="p-4 rounded-full bg-green-100 text-[#105a4b] mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </span>
                <h3 className="text-lg font-medium text-gray-900">Digital Requests</h3>
                <p className="mt-2 text-base text-gray-500 text-center">Paperless equipment borrowing and no-dues clearance.</p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center">
                <span className="p-4 rounded-full bg-green-100 text-[#105a4b] mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                </span>
                <h3 className="text-lg font-medium text-gray-900">Inventory Tracking</h3>
                <p className="mt-2 text-base text-gray-500 text-center">Real-time asset visibility for 5 specialized labs.</p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center">
                <span className="p-4 rounded-full bg-green-100 text-[#105a4b] mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                <h3 className="text-lg font-medium text-gray-900">Automated Approvals</h3>
                <p className="mt-2 text-base text-gray-500 text-center">Streamlined verification workflow for students and faculty.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
            <div className="flex justify-center space-x-6 md:order-2">
              <p className="text-center text-base text-gray-400">
                NUTECH University Islamabad
              </p>
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
              <p className="text-center text-base text-gray-400">
                &copy; 2024 Lab Management System. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

