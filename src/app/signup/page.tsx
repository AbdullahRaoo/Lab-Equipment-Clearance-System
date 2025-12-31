'use client';

import Link from 'next/link';
import { signUp } from '@/app/actions/auth';
import { useState } from 'react';
import { NutechLogo } from '@/components/ui/NutechLogo';

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setLoading(true);

    try {
      const result = await signUp(formData);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      // If success, redirect happens in server action
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border-t-4 border-[#105a4b]">
        <div className="flex flex-col items-center">
          <NutechLogo className="w-auto h-16 mb-4" />
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Student Registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your account for the Lab Clearance System
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" action={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#105a4b] focus:border-[#105a4b]"
                placeholder="e.g. Muhammad Ali"
              />
            </div>

            <div>
              <label htmlFor="reg_no" className="block text-sm font-medium text-gray-700">
                Registration Number
              </label>
              <input
                id="reg_no"
                name="reg_no"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#105a4b] focus:border-[#105a4b]"
                placeholder="e.g. NUTECH-21-CS-001"
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <select
                id="department"
                name="department"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#105a4b] focus:border-[#105a4b]"
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
              </select>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#105a4b] focus:border-[#105a4b]"
                placeholder="you@nutech.edu.pk"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#105a4b] focus:border-[#105a4b]"
                placeholder="••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#105a4b] hover:bg-[#0d473b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#105a4b] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">Already registerd? </span>
            <Link href="/login" className="font-medium text-[#105a4b] hover:text-[#0d473b]">
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
