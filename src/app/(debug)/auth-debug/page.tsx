'use client';

import { useState } from 'react';
import { runAuthDiagnostics, DiagResult } from '@/app/actions/debug-auth';

export default function AuthDebugPage() {
    const [email, setEmail] = useState('test@nutech.edu.pk');
    const [results, setResults] = useState<DiagResult[]>([]);
    const [loading, setLoading] = useState(false);

    const runDiag = async () => {
        setLoading(true);
        setResults([]);
        try {
            const res = await runAuthDiagnostics(email);
            setResults(res);
        } catch (e: any) {
            setResults([{ step: 'Fatal Error', success: false, error: e.message }]);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-2xl font-bold mb-6">🔍 Auth Diagnostics</h1>

            <div className="flex gap-4 mb-6">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="px-4 py-2 bg-gray-800 rounded border border-gray-700 flex-1"
                    placeholder="Email to test"
                />
                <button
                    onClick={runDiag}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Running...' : 'Run Diagnostics'}
                </button>
            </div>

            <div className="space-y-4">
                {results.map((r, i) => (
                    <div
                        key={i}
                        className={`p-4 rounded-lg border ${r.success
                                ? 'bg-green-900/30 border-green-700'
                                : 'bg-red-900/30 border-red-700'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-lg ${r.success ? 'text-green-400' : 'text-red-400'}`}>
                                {r.success ? '✅' : '❌'}
                            </span>
                            <span className="font-semibold">{r.step}</span>
                        </div>
                        {r.data && (
                            <pre className="text-sm text-gray-300 bg-black/30 p-2 rounded overflow-auto">
                                {typeof r.data === 'string' ? r.data : JSON.stringify(r.data, null, 2)}
                            </pre>
                        )}
                        {r.error && (
                            <pre className="text-sm text-red-300 bg-black/30 p-2 rounded overflow-auto">
                                {typeof r.error === 'string' ? r.error : JSON.stringify(r.error, null, 2)}
                            </pre>
                        )}
                    </div>
                ))}
            </div>

            {results.length > 0 && (
                <div className="mt-8 p-4 bg-gray-800 rounded-lg">
                    <h2 className="font-semibold mb-2">Summary</h2>
                    <p className="text-gray-300">
                        {results.filter(r => r.success).length} / {results.length} steps passed
                    </p>
                    {results.some(r => !r.success && r.step.includes('createUser')) && (
                        <div className="mt-4 p-3 bg-yellow-900/30 rounded border border-yellow-700 text-yellow-200">
                            <strong>createUser failed</strong> - The issue is in Supabase's auth system.
                            <br />Check: Dashboard → Authentication → Hooks
                            <br />Also check: Dashboard → Database → Extensions (if any custom auth extensions)
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
