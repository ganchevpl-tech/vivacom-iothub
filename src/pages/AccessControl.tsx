import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AccessControlList } from '@/components/dashboard/AccessControlList';
import { AccessPointsMap } from '@/components/dashboard/AccessPointsMap';
import { mockAccessEntries } from '@/data/mockData';
import { ShieldCheck, Clock, MapPin } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';

const AccessControl = () => {
  const grantedCount = mockAccessEntries.filter(e => e.status === 'granted').length;
  const deniedCount = mockAccessEntries.filter(e => e.status === 'denied').length;

  return (
    <DashboardLayout 
      title="Access Control" 
      subtitle="Monitor and manage building access"
    >
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Access Points"
            value={12}
            subtitle="Active monitoring"
            icon={MapPin}
            variant="primary"
            delay={0}
          />
          <StatCard
            title="Granted Today"
            value={grantedCount}
            subtitle="Successful entries"
            icon={ShieldCheck}
            delay={0.1}
          />
          <StatCard
            title="Denied Today"
            value={deniedCount}
            subtitle="Blocked attempts"
            icon={ShieldCheck}
            variant={deniedCount > 0 ? 'alert' : 'default'}
            delay={0.2}
          />
          <StatCard
            title="Avg Response"
            value="0.3s"
            subtitle="Authentication time"
            icon={Clock}
            delay={0.3}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AccessControlList entries={mockAccessEntries} />
          <AccessPointsMap />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccessControl;
