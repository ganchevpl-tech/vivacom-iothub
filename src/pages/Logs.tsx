import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LogManager } from '@/components/dashboard/LogManager';
import { mockLogEntries } from '@/data/mockData';

const Logs = () => {
  return (
    <DashboardLayout 
      title="System Logs" 
      subtitle="Comprehensive activity and event logs"
    >
      <LogManager logs={mockLogEntries} />
    </DashboardLayout>
  );
};

export default Logs;
