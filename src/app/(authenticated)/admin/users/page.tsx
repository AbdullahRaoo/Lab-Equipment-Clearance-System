import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { getAllUsers, getAllLabs } from '@/app/actions/users';
import { canAccessUserManagement, UserRole } from '@/types/clearance';
import UserManagementClient from './UserManagementClient';

export const dynamic = 'force-dynamic';

export default async function UserManagementPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (!canAccessUserManagement(user.role as UserRole)) {
        redirect('/dashboard');
    }

    const [usersResult, labsResult] = await Promise.all([
        getAllUsers(),
        getAllLabs()
    ]);

    if (usersResult.error || labsResult.error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    Error loading data: {usersResult.error || labsResult.error}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <UserManagementClient
                users={usersResult.data || []}
                labs={labsResult.data || []}
                currentUserRole={user.role as UserRole}
            />
        </div>
    );
}
