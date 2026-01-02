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
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <NutechLogo />
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                Sign In
              </Link>
              <Link href="/register" className="bg-[#7d2628] hover:bg-[#5c1d1f] text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-[#7d2628]/20 hover:shadow-xl">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7d2628]/5 via-white to-[#ba8d36]/10"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#7d2628]/10 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ba8d36]/20 text-[#7d2628] rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-[#7d2628] rounded-full animate-pulse"></span>
                NUTECH University Lab System
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Smart<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7d2628] to-[#a33335]">
                  Lab Equipment
                </span><br />
                Management
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-lg">
                Streamline equipment borrowing, track inventory in real-time, and manage clearance certificates across all university laboratories.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#7d2628] text-white rounded-xl font-semibold text-lg shadow-lg shadow-[#7d2628]/30 hover:bg-[#5c1d1f] hover:shadow-xl transition-all"
                >
                  Student Portal
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-[#7d2628] text-[#7d2628] rounded-xl font-semibold text-lg hover:bg-[#7d2628]/5 transition-all"
                >
                  Create Account
                </Link>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#7d2628]/20 to-[#ba8d36]/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#7d2628]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#ba8d36]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#2da552]"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-100 rounded-full w-3/4"></div>
                  <div className="h-3 bg-[#7d2628]/20 rounded-full w-1/2"></div>
                  <div className="h-12 bg-gradient-to-r from-[#7d2628]/10 to-[#ba8d36]/10 rounded-lg mt-4"></div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="h-16 bg-[#4e6bb2]/10 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🖥️</span>
                    </div>
                    <div className="h-16 bg-[#ba8d36]/10 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <div className="h-16 bg-[#2da552]/10 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🤖</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#7d2628]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-white">5</p>
              <p className="text-[#ba8d36] mt-1 font-medium">Specialized Labs</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">500+</p>
              <p className="text-[#ba8d36] mt-1 font-medium">Equipment Items</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">3-Stage</p>
              <p className="text-[#ba8d36] mt-1 font-medium">Approval Flow</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">24/7</p>
              <p className="text-[#ba8d36] mt-1 font-medium">Digital Access</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Simple 4-step process from request to return
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Submit Request', desc: 'Browse labs and select equipment you need', icon: '📝', color: 'bg-[#4e6bb2]' },
              { step: '2', title: 'Get Approved', desc: 'Lab staff and HOD review your request', icon: '✅', color: 'bg-[#7d2628]' },
              { step: '3', title: 'Collect Equipment', desc: 'Pick up approved items from the lab', icon: '📦', color: 'bg-[#ba8d36]' },
              { step: '4', title: 'Return & Clear', desc: 'Return items and get clearance certificate', icon: '🎓', color: 'bg-[#2da552]' },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                {idx < 3 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200"></div>
                )}
                <div className="relative bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow">
                  <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg`}>
                    {item.icon}
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#7d2628] text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-gray-500 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Labs Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">University Laboratories</h2>
            <p className="mt-4 text-lg text-gray-600">Access equipment across 5 specialized labs</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { name: 'Computer & Network', code: 'CNET', icon: '🖥️', color: 'from-[#4e6bb2] to-[#3d5a9f]' },
              { name: 'DLD Lab', code: 'DLD', icon: '⚡', color: 'from-[#ba8d36] to-[#9a7528]' },
              { name: 'Embedded Design', code: 'EMB', icon: '🔧', color: 'from-[#5d5f5e] to-[#4a4c4b]' },
              { name: 'IoT Lab', code: 'IOT', icon: '📡', color: 'from-[#2da552] to-[#238a43]' },
              { name: 'Robotics Lab', code: 'ROBO', icon: '🤖', color: 'from-[#7d2628] to-[#5c1d1f]' },
            ].map((lab, idx) => (
              <div key={idx} className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${lab.color} flex items-center justify-center text-2xl shadow-lg mb-4`}>
                  {lab.icon}
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-[#7d2628] transition-colors">{lab.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{lab.code}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Powerful Features</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need for efficient lab resource management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Digital Requests', desc: 'Paperless equipment borrowing with real-time status tracking', icon: '📋', border: 'border-[#4e6bb2]' },
              { title: 'Multi-Stage Approval', desc: 'Streamlined Lab → OIC → HOD approval workflow', icon: '✔️', border: 'border-[#7d2628]' },
              { title: 'Inventory Tracking', desc: 'Real-time visibility of equipment across all labs', icon: '📊', border: 'border-[#ba8d36]' },
              { title: 'Clearance Certificates', desc: 'Automated no-dues verification for graduating students', icon: '🎓', border: 'border-[#2da552]' },
              { title: 'Role-Based Access', desc: '7 user levels from Student to HOD with specific permissions', icon: '🔐', border: 'border-[#5d5f5e]' },
              { title: 'Late Fine Management', desc: 'Automated tracking of overdue returns with fine calculation', icon: '💰', border: 'border-[#7d2628]' },
            ].map((feature, idx) => (
              <div key={idx} className={`bg-white rounded-2xl p-6 shadow-lg border-l-4 ${feature.border} hover:shadow-xl transition-shadow`}>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#7d2628] to-[#5c1d1f]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join hundreds of students and faculty members using ECMS for seamless lab equipment management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#ba8d36] text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-[#a37d2f] transition-all"
            >
              Create Your Account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <NutechLogo variant="light" />
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/login" className="hover:text-white transition-colors">Login</Link>
              <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 NUTECH University Islamabad. Equipment Clearance Management System.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
