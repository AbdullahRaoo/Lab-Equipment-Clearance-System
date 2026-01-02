'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { signIn } from '@/app/actions/auth';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NutechLogo } from '@/components/ui/NutechLogo';

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for verification errors in URL
    if (searchParams.get('error') === 'verification_failed') {
      setError('Email verification failed. Please try signing up again.');
    }
  }, [searchParams]);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setLoading(true);

    try {
      const result = await signIn(formData);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.success) {
        // Successful login
        router.push('/dashboard');
        router.refresh(); // Ensure data is fresh
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border-t-4 border-[#7d2628]">
      <div className="flex flex-col items-center">
        <NutechLogo className="w-auto h-16 mb-4" />
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Sign In
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access your Lab Dashboard
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#7d2628] focus:border-[#7d2628]"
              placeholder="email@nutech.edu.pk"
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
              autoComplete="current-password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#7d2628] focus:border-[#7d2628]"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7d2628] hover:bg-[#5c1d1f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7d2628] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <Link href="/register" className="font-medium text-[#7d2628] hover:text-[#5c1d1f]">
            Register as Student
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg animate-pulse">
          <div className="h-16 bg-gray-200 rounded mb-4 mx-auto w-32"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-8 w-3/4 mx-auto"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-[#e8f0ee] rounded"></div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
