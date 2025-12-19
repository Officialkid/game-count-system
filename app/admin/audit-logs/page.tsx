'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { getAuditLogs, getAuditStats, type AuditLog } from '@/lib/services/appwriteAudit';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'create' | 'update' | 'delete'>('all');
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load audit logs
      const logsResult = await getAuditLogs({
        limit: 100,
        action: filter !== 'all' ? `*.${filter}` : undefined,
      });

      if (logsResult.success && logsResult.data) {
        setLogs(logsResult.data.logs);
      }

      // Load stats
      const statsResult = await getAuditStats();
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Failed to load audit data:', error);
      showToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string): string => {
    if (action.includes('create')) return 'bg-green-100 text-green-700';
    if (action.includes('update')) return 'bg-blue-100 text-blue-700';
    if (action.includes('delete')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" className="mt-4" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
        <p className="text-gray-600">
          View all system activity and changes
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Logs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-1">Create Actions</p>
                <p className="text-3xl font-bold text-green-600">
                  {Object.entries(stats.by_action)
                    .filter(([key]) => key.includes('create'))
                    .reduce((sum, [, val]) => sum + (val as number), 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-1">Update Actions</p>
                <p className="text-3xl font-bold text-blue-600">
                  {Object.entries(stats.by_action)
                    .filter(([key]) => key.includes('update'))
                    .reduce((sum, [, val]) => sum + (val as number), 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-1">Delete Actions</p>
                <p className="text-3xl font-bold text-red-600">
                  {Object.entries(stats.by_action)
                    .filter(([key]) => key.includes('delete'))
                    .reduce((sum, [, val]) => sum + (val as number), 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          onClick={() => setFilter('all')}
        >
          All Actions
        </Button>
        <Button
          variant={filter === 'create' ? 'primary' : 'secondary'}
          onClick={() => setFilter('create')}
        >
          Creates
        </Button>
        <Button
          variant={filter === 'update' ? 'primary' : 'secondary'}
          onClick={() => setFilter('update')}
        >
          Updates
        </Button>
        <Button
          variant={filter === 'delete' ? 'primary' : 'secondary'}
          onClick={() => setFilter('delete')}
        >
          Deletes
        </Button>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Timestamp</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Entity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Record ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.$id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                        {log.entity}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                        {log.record_id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                        {log.user_id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:text-blue-700">
                              View details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-w-xs">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <Button variant="secondary" onClick={loadData}>
          🔄 Refresh Logs
        </Button>
      </div>
    </div>
  );
}
