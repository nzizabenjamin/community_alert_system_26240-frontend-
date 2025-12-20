import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../components/common';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Users, 
  MapPin, 
  TrendingUp,
  Activity,
  FileText
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalIssues: 0,
    reportedIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
    totalUsers: 0,
    totalLocations: 0,
    recentIssues: [],
    issuesByCategory: [],
    issuesByLocation: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getStats();
      setStats(response.data || {});
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, description }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp size={14} className={trend > 0 ? 'text-green-500' : 'text-red-500'} />
              <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(trend)}% from last month
              </span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </Card>
  );

  const RecentIssueCard = ({ issue }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'REPORTED': return 'primary';
        case 'IN_PROGRESS': return 'warning';
        case 'RESOLVED': return 'success';
        default: return 'default';
      }
    };

    const timeAgo = (date) => {
      const now = new Date();
      const past = new Date(date);
      const diffMs = now - past;
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    };

    return (
      <div className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium text-gray-900">{issue.title}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin size={14} />
                {issue.location?.name || 'Unknown'}
              </span>
              <span className="text-sm text-gray-500">{timeAgo(issue.dateReported)}</span>
            </div>
          </div>
          <Badge variant={getStatusColor(issue.status)}>
            {issue.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    );
  };

  const CategoryChart = ({ categories }) => {
    const maxValue = Math.max(...categories.map(c => c.count), 1);
    
    // Category descriptions
    const categoryDescriptions = {
      'Infrastructure': 'Roads, bridges, buildings, and public facilities',
      'Utilities': 'Water, electricity, internet, and other essential services',
      'Safety': 'Security concerns, emergency situations, and public safety',
      'Sanitation': 'Waste management, cleanliness, and hygiene',
      'Environment': 'Environmental issues, pollution, and conservation',
      'Other': 'Other types of issues not covered above'
    };
    
    return (
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.name} className="group">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-3 flex-1">
                {/* Category indicator line/bar preview */}
                <div className="flex-shrink-0 mt-1">
                  <div 
                    className="w-3 h-3 rounded-sm bg-blue-600"
                    title={category.name}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900">{category.name}</span>
                  {categoryDescriptions[category.name] && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {categoryDescriptions[category.name]}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold text-gray-900 ml-2 flex-shrink-0">
                {category.count}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 relative">
              <div
                className="h-2.5 rounded-full transition-all duration-500 flex items-center pl-2"
                style={{ 
                  width: `${(category.count / maxValue) * 100}%`,
                  backgroundColor: '#2563eb' // blue-600
                }}
              >
                {category.count > 0 && (
                  <span className="text-[10px] font-medium text-white whitespace-nowrap">
                    {category.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.fullName || 'User'}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your community today
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Issues"
          value={stats.totalIssues || 0}
          icon={FileText}
          color="bg-blue-500"
          trend={12}
        />
        <StatCard
          title="Reported"
          value={stats.reportedIssues || 0}
          icon={AlertCircle}
          color="bg-orange-500"
          description="Awaiting review"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgressIssues || 0}
          icon={Clock}
          color="bg-yellow-500"
          description="Being handled"
        />
        <StatCard
          title="Resolved"
          value={stats.resolvedIssues || 0}
          icon={CheckCircle}
          color="bg-green-500"
          trend={8}
        />
      </div>

      {/* System Overview - Only for ADMIN */}
      {user?.role === 'ADMIN' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => navigate(ROUTES.USERS)}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
              </div>
            </div>
          </Card>
          <Card 
            className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => navigate(ROUTES.LOCATIONS)}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-full">
                <MapPin size={24} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Locations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLocations || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-pink-100 rounded-full">
                <Activity size={24} className="text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalIssues > 0 
                    ? Math.round((stats.resolvedIssues / stats.totalIssues) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Category */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Issues by Category</h2>
          {stats.issuesByCategory && stats.issuesByCategory.length > 0 ? (
            <CategoryChart categories={stats.issuesByCategory} />
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </Card>

        {/* Recent Issues */}
        <Card noPadding>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Issues</h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {stats.recentIssues && stats.recentIssues.length > 0 ? (
              stats.recentIssues.map((issue) => (
                <RecentIssueCard key={issue.id} issue={issue} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No recent issues</p>
            )}
          </div>
        </Card>
      </div>

      {/* Top Locations */}
      {stats.issuesByLocation && stats.issuesByLocation.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Locations by Issues</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.issuesByLocation.slice(0, 6).map((loc, index) => (
              <div 
                key={loc.name} 
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{loc.name}</p>
                      <p className="text-sm text-gray-600">{loc.count} issues</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};