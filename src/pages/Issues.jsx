import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Pagination, 
  Button, 
  SearchBar, 
  Badge,
  Select,
  Modal,
  Alert
} from '../components/common';
import { Plus, Filter, Download, Eye } from 'lucide-react';
import { issueService } from '../services/issueService';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import { IssueForm } from '../components/features';

export const Issues = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadIssues();
  }, [currentPage, statusFilter]);

const loadIssues = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await issueService.getAll(currentPage, pageSize, 'dateReported', 'DESC');
    
    // ✅ Handle paginated response correctly
    if (response.data) {
      let issuesData = [];
      let pages = 1;
      
      if (response.data.content && Array.isArray(response.data.content)) {
        // Backend returns: { content: [...], totalPages: 5, totalElements: 45 }
        issuesData = response.data.content;
        pages = response.data.totalPages || 1;
      } else if (Array.isArray(response.data)) {
        // Fallback if backend returns plain array
        issuesData = response.data;
        pages = 1;
      }
      
      setIssues(issuesData);
      setTotalPages(pages);
    }
    
  } catch (err) {
    console.error('Load error:', err);
    setError('Failed to load issues');
  } finally {
    setLoading(false);
  }
};

  const handleCreateIssue = async (issueData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📤 Creating issue:', issueData);
      
      const response = await issueService.create(issueData);
      console.log('✅ Issue created:', response.data);
      
      setSuccess('Issue reported successfully!');
      setShowCreateModal(false);
      loadIssues(); // Reload the list
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('❌ Create error:', err);
      console.error('Response:', err.response?.data);
      
      // Handle tag validation errors specifically
      let errorMessage = err.response?.data?.message || 
                        err.response?.data?.error ||
                        err.message ||
                        'Failed to create issue';
      
      // Check for tag-related errors
      if (errorMessage.includes('tag') || errorMessage.includes('Tag')) {
        errorMessage = `Tag Error: ${errorMessage}. Please select only active tags.`;
      }
      
      setError(errorMessage);
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const issueColumns = [
    { 
      header: 'ID', 
      accessor: 'id',
      render: (row) => (
        <span className="text-xs text-gray-500 font-mono">
          #{row.id.substring(0, 8)}
        </span>
      )
    },
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
      header: 'Reported By', 
      accessor: 'reportedBy',
      render: (row) => row.reportedBy?.fullName || 'Unknown'
    },
    { 
      header: 'Status', 
      render: (row) => getStatusBadge(row.status)
    },
    { 
      header: 'Date', 
      accessor: 'dateReported',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {formatDate(row.dateReported)}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          icon={Eye}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`${ROUTES.ISSUES}/${row.id}`);
          }}
        >
          View
        </Button>
      )
    }
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'REPORTED', label: 'Reported' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Issues Management</h1>
          <p className="text-gray-600 mt-1">View and manage all reported issues</p>
        </div>
        <Button 
          variant="primary" 
          icon={Plus}
          onClick={() => setShowCreateModal(true)}
        >
          Report New Issue
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {/* Success Alert */}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess(null)} />
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or category..."
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="ghost" size="sm" icon={Filter}>
            More Filters
          </Button>
          <Button variant="ghost" size="sm" icon={Download}>
            Export
          </Button>
        </div>
      </Card>

      {/* Issues Table */}
      <Card noPadding>
        <Table
          columns={issueColumns}
          data={filteredIssues}
          loading={loading}
          onRowClick={(row) => navigate(`${ROUTES.ISSUES}/${row.id}`)}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          loading={loading}
        />
      </Card>

      {/* Create Issue Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Report New Issue"
        size="lg"
      >
        <IssueForm
          onSubmit={handleCreateIssue}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
        />
      </Modal>
    </div>
  );
};