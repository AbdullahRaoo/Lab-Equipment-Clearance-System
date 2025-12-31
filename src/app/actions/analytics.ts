'use server';

import { createClient } from '@/lib/supabase/server';

export async function getAnalyticsData() {
    const supabase = await createClient();

    // 1. Inventory Distribution by Lab
    const { data: inventory } = await supabase
        .from('inventory')
        .select(`
            id,
            price,
            labs ( name )
        `);

    // Group by Lab
    const labDistribution = inventory?.reduce((acc: any, item: any) => {
        const labName = item.labs?.name || 'Unassigned';
        if (!acc[labName]) acc[labName] = { name: labName, count: 0, value: 0 };
        acc[labName].count += 1;
        acc[labName].value += (item.price || 0);
        return acc;
    }, {}) || {};

    // 2. Request Statuses
    const { data: requests } = await supabase
        .from('borrow_requests')
        .select('status, created_at');

    const statusCounts = requests?.reduce((acc: any, req: any) => {
        const status = req.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {}) || {};

    const statusData = Object.keys(statusCounts).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: statusCounts[key]
    }));

    return {
        labData: Object.values(labDistribution),
        statusData,
        totalItems: inventory?.length || 0,
        totalValue: inventory?.reduce((sum, item) => sum + (item.price || 0), 0) || 0,
        totalRequests: requests?.length || 0
    };
}
