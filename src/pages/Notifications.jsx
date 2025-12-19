import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  SearchBar, 
  Badge,
  Alert,
  Select
} from '../components/common';
import { Bell, CheckCircle, Mail, AlertCircle, Trash2 } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try with pagination first, fallback to simple call if that fails
      let response;
      try {
        response = await notificationService.getAll(0, 100, 'sentAt', 'DESC');
      } catch (paginationError) {
        // If pagination fails, try without parameters
        console.warn('Pagination request failed, trying simple request:', paginationError);
        try {
          response = await api.get('/notifications');
        } catch (simpleError) {
          throw simpleError; // Re-throw if both fail
        }
      }
      
      // Handle both paginated and non-paginated responses
      if (response.data) {
        let notificationsData = [];
        
        if (response.data.content && Array.isArray(response.data.content)) {
          // Backend returns: { content: [...], totalPages: 5, totalElements: 45 }
          notificationsData = response.data.content;
        } else if (Array.isArray(response.data)) {
          // Backend returns plain array
          notificationsData = response.data;
        }
        
        setNotifications(notificationsData);
        console.log('✅ Loaded notifications:', notificationsData.length);
      } else {
        setNotifications([]);
        console.warn('⚠️ No data in response:', response);
      }
    } catch (err) {
      console.error('❌ Load notifications error:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      
      // More detailed error message
      let errorMessage = 'Failed to load notifications';
      if (err.response?.status === 500) {
        errorMessage = 'Server error: The notifications service encountered an error. Please try again later or contact support.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Notifications endpoint not found. The backend may not have this feature implemented yet.';
      } else if (err.response?.data?.message) {
        errorMessage = `Failed to load notifications: ${err.response.data.message}`;
      } else if (err.message) {
        errorMessage = `Failed to load notifications: ${err.message}`;
      }
      
      setError(errorMessage);
      // Set empty array so UI doesn't break
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setSuccess('Notification marked as read');
      loadNotifications();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to mark notification as read');
      console.error('Mark as read error:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setSuccess('All notifications marked as read');
      loadNotifications();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to mark all as read');
      console.error('Mark all as read error:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      await notificationService.delete(notificationId);
      setSuccess('Notification deleted');
      loadNotifications();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to delete notification');
      console.error('Delete error:', err);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = notif.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notif.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || notif.status === statusFilter;
    const matchesType = !typeFilter || notif.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'EMAIL': return <Mail size={16} className="text-blue-500" />;
      case 'SMS': return <Bell size={16} className="text-green-500" />;
      case 'PUSH': return <AlertCircle size={16} className="text-purple-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const notificationColumns = [
    { 
      header: 'Status',
      render: (row) => (
        <div className="flex items-center">
          {row.status === 'READ' ? (
            <CheckCircle size={20} className="text-green-500" />
          ) : (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      )
    },
    { 
      header: 'Type', 
      render: (row) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(row.type)}
          <span className="text-xs text-gray-600">{row.type}</span>
        </div>
      )
    },
    { 
      header: 'Message', 
      render: (row) => (
        <div className={row.status === 'UNREAD' ? 'font-medium' : ''}>
          <p className="text-gray-900">{row.subject || 'Notification'}</p>
          <p className="text-sm text-gray-600 truncate max-w-md">{row.message}</p>
        </div>
      )
    },
    { 
      header: 'Recipient', 
      render: (row) => (
        <div>
          <p className="text-sm text-gray-900">{row.recipientName || 'User'}</p>
          <p className="text-xs text-gray-500">{row.recipientEmail}</p>
        </div>
      )
    },
    { 
      header: 'Time', 
      render: (row) => (
        <span className="text-sm text-gray-600">{formatDate(row.sentAt)}</span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {row.status === 'UNREAD' && (
            <Button
              variant="ghost"
              size="sm"
              icon={CheckCircle}
              onClick={() => handleMarkAsRead(row.id)}
              title="Mark as read"
            >
              Read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:bg-red-50"
            title="Delete"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'UNREAD', label: 'Unread' },
    { value: 'READ', label: 'Read' }
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'SMS', label: 'SMS' },
    { value: 'PUSH', label: 'Push' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="primary" 
            icon={CheckCircle}
            onClick={handleMarkAllAsRead}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={typeOptions}
          />
        </div>
      </Card>

      <Card noPadding>
        {error && error.includes('Server error') && (
          <div className="p-4 bg-yellow-50 border-b border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> The notifications service may not be fully configured on the backend. 
              This is a server-side issue (500 error). Please check your backend logs for more details.
            </p>
          </div>
        )}
        <Table
          columns={notificationColumns}
          data={filteredNotifications}
          loading={loading}
          emptyMessage={error ? "Unable to load notifications" : "No notifications to display"}
        />
      </Card>
    </div>
  );
};