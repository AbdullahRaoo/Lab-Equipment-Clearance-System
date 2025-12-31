
import { getCurrentUser } from '@/app/actions/auth';
import { ProfileForm } from './ProfileForm';
import { redirect } from 'next/navigation';

export default async function ProfileSettingsPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>
            <div className="bg-white shadow rounded-lg px-4 py-5 sm:p-6">
                <ProfileForm user={user} />
            </div>
        </div>
    );
}
