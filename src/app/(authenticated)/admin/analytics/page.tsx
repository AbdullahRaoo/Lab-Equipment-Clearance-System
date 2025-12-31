
import { getAnalyticsData } from '@/app/actions/analytics';
import AnalyticsCharts from './AnalyticsCharts';
import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';

export default async function AnalyticsPage() {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'hod' && user.role !== 'pro_hod')) {
        // redirect('/dashboard'); 
        // For development, we allow access or maybe not? 
        // Let's enforce strict RBAC as requested.
        redirect('/dashboard');
    }

    const data = await getAnalyticsData();

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Lab Analytics Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Overview of lab inventory assets, values, and clearance activity.
                </p>
            </div>

            <AnalyticsCharts data={data} />
        </div>
    );
}
