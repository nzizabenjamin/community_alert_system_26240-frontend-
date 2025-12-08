import React, { useState, useEffect } from 'react';
import { StatCard, Card, Table, Badge, Button, Alert } from '../components/common';
import { AlertCircle, Users, CheckCircle, TrendingUp, Plus, Clock } from 'lucide-react';
import { issueService } from '../services/issueService';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalIssues: 0,
    resolvedIssues: 0,
    inProgressIssues: 0,
    reportedIssues: 0
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch recent issues (first page, 5 items)
      const response = await issueService.getAll(0, 5, 'dateReported', 'DESC');
      
      if (response.data && Array.isArray(response.data)) {
        setRecentIssues(response.data);
        
        // Calculate stats from the data
        // In a real app, you'd have a separate stats endpoint
        const total = response.data.length;
        const resolved = response.data.filter(i => i.status === 'RESOLVED').length;
        const inProgress = response.data.filter(i => i.status === 'IN_PROGRESS').length;
        const reported = response.data.filter(i => i.status === 'REPORTED').length;
        
        setStats({
          totalIssues: total,
          resolvedIssues: resolved,
          inProgressIssues: inProgress,
          reportedIssues: reported
        });
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data. Using demo data.');
      
      // Demo data for development
      setStats({
        totalIssues: 247,
        resolvedIssues: 189,
        inProgressIssues: 35,
        reportedIssues: 23
      });
      
      setRecentIssues([
        { 
          id: '1', 
          title: 'Road Damage on Main Street', 
          status: 'REPORTED', 
          dateReported: new Date().toISOString(),
          category: 'Infrastructure',
          location: { name: 'Kigali' }
        },
        { 
          id: '2', 
          title: 'Water Supply Issue', 
          status: 'IN_PROGRESS', 
          dateReported: new Date(Date.now() - 86400000).toISOString(),
          category: 'Utilities',
          location: { name: 'Nyanza' }
        },
        { 
          id: '3', 
          title: 'Street Light Not Working', 
          status: 'RESOLVED', 
          dateReported: new Date(Date.now() - 172800000).toISOString(),
          category: 'Infrastructure',
          location: { name: 'Musanze' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      REPORTED: 'primary',
      IN_PROGRESS: 'warning',
      RESOLVED: 'success'
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const issueColumns = [
    { 
      header: 'Title', 
      accessor: 'title',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="text-xs text-gray-500">{row.category}</p>
        </div>
      )
    },
    { 
      header: 'Location', 
      accessor: 'location',
      render: (row) => row.location?.name || 'N/A'
    },
    { 
      header: 'Status', 
      render: (row) => getStatusBadge(row.status)
    },
    { 
      header: 'Reported', 
      accessor: 'dateReported',
      render: (row) => formatDate(row.dateReported)
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <Button 
          variant="primary" 
          icon={Plus}
          onClick={() => navigate(ROUTES.ISSUES)}
        >
          Report Issue
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="warning" message={error} onClose={() => setError(null)} />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Issues"
          value={stats.totalIssues}
          icon={AlertCircle}
          trend={12}
          color="blue"
        />
        <StatCard
          title="Resolved"
          value={stats.resolvedIssues}
          icon={CheckCircle}
          trend={8}
          color="green"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgressIssues}
          icon={Clock}
          trend={-3}
          color="yellow"
        />
        <StatCard
          title="Reported"
          value={stats.reportedIssues}
          icon={TrendingUp}
          trend={5}
          color="red"
        />
      </div>

      {/* Recent Issues Table */}
      <Card 
        title="Recent Issues"
        action={
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(ROUTES.ISSUES)}
          >
            View All
          </Button>
        }
        noPadding
      >
        {recentIssues.length > 0 ? (
          <Table
            columns={issueColumns}
            data={recentIssues}
            onRowClick={(row) => navigate(`${ROUTES.ISSUES}/${row.id}`)}
          />
        ) : (
          <div className="p-12 text-center text-gray-500">
            <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
            <p>No issues reported yet</p>
            <Button 
              variant="primary" 
              className="mt-4"
              onClick={() => navigate(ROUTES.ISSUES)}
            >
              Report First Issue
            </Button>
          </div>
        )}
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Issue Categories">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Infrastructure</span>
              <div className="flex items-center gap-2">
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: '65%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12">65%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Utilities</span>
              <div className="flex items-center gap-2">
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-600" style={{ width: '25%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12">25%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Safety</span>
              <div className="flex items-center gap-2">
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-600" style={{ width: '10%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12">10%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Response Time">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Average Response</span>
                <span className="font-medium">2.5 hours</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Average Resolution</span>
                <span className="font-medium">24 hours</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};