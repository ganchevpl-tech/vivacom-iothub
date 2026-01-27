import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogEntry } from '@/types/dashboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LogManagerProps {
  logs: LogEntry[];
}

const resultIcons = {
  success: CheckCircle2,
  failure: XCircle,
  warning: AlertTriangle,
};

const resultColors = {
  success: 'text-status-ok bg-status-ok/10',
  failure: 'text-status-alert bg-status-alert/10',
  warning: 'text-status-warning bg-status-warning/10',
};

const categoryColors = {
  access: 'bg-vivacom-blue/10 text-vivacom-blue border-vivacom-blue/20',
  system: 'bg-muted text-muted-foreground border-border',
  sensor: 'bg-vivacom-orange/10 text-vivacom-orange border-vivacom-orange/20',
  security: 'bg-status-alert/10 text-status-alert border-status-alert/20',
};

export function LogManager({ logs }: LogManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = searchQuery === '' || 
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === null || log.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [logs, searchQuery, selectedCategory]);

  const categories = ['access', 'system', 'sensor', 'security'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-card rounded-xl shadow-card border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Smart Log Manager</h3>
            <p className="text-sm text-muted-foreground">
              {filteredLogs.length} of {logs.length} entries
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search logs by action, user, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="capitalize"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead className="w-[120px]">User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="w-[100px]">Category</TableHead>
              <TableHead className="w-[100px]">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No logs found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log, index) => {
                const ResultIcon = resultIcons[log.result];
                return (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.user}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{log.action}</p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground truncate max-w-[300px] group-hover:whitespace-normal">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'capitalize font-medium',
                          categoryColors[log.category as keyof typeof categoryColors]
                        )}
                      >
                        {log.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
                        resultColors[log.result]
                      )}>
                        <ResultIcon className="w-3.5 h-3.5" />
                        <span className="capitalize">{log.result}</span>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredLogs.length} entries
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
