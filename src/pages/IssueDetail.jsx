import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Badge, 
  Alert,
  Modal,
  Select,
  Textarea,
  Input
} from '../components/common';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  MapPin, 
  Calendar, 
  User, 
  Clock,
  MessageSquare,
  Tag as TagIcon,
  CheckCircle
} from 'lucide-react';
import { issueService } from '../services/issueService';
import { ROUTES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

export const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  
  // Form states
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: ''
  });

  useEffect(() => {
    loadIssueDetail();
  }, [id]);

  const loadIssueDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await issueService.getById(id);
      setIssue(response.data);
      setNewStatus(response.data.status);
      setEditForm({
        title: response.data.title,
        description: response.data.description,
        category: response.data.category
      });
    } catch (err) {
      console.error('Error loading issue:', err);
      setError('Failed to load issue. Using demo data.');
      
      // Demo data
      setIssue({
        id: id,
        title: 'Road Damage on Main Street',
        description: 'There is a large pothole on Main Street near the intersection with 5th Avenue. It poses a safety hazard to vehicles and pedestrians. The damage appears to be getting worse with recent rainfall.',
        category: 'Infrastructure',
        status: 'REPORTED',
        dateReported: new Date().toISOString(),
        dateResolved: null,
        photoUrl: 'https://via.placeholder.com/800x400?text=Issue+Photo',
        location: { 
          id: 'loc1',
          name: 'Kigali',
          type: 'CITY'
        },
        reportedBy: { 
          id: 'user1',
          fullName: 'John Doe',
          email: 'john@example.com'
        },
        tags: [
          { id: 'tag1', name: 'Urgent' },
          { id: 'tag2', name: 'Safety' }
        ]
      });
      setNewStatus('REPORTED');
      setEditForm({
        title: 'Road Damage on Main Street',
        description: 'There is a large pothole on Main Street...',
        category: 'Infrastructure'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      setError(null);
      await issueService.updateStatus(id, newStatus);
      setSuccess('Status updated successfully!');
      setShowStatusModal(false);
      loadIssueDetail();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

  const handleEdit = async () => {
    try {
      setError(null);
      await issueService.update(id, editForm);
      setSuccess('Issue updated successfully!');
      setShowEditModal(false);
      loadIssueDetail();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating issue:', err);
      setError('Failed to update issue');
    }
  };

  const handleDelete = async () => {
    try {
      setError(null);
      await issueService.delete(id);
      setSuccess('Issue deleted successfully!');
      setTimeout(() => {
        navigate(ROUTES.ISSUES);
      }, 1000);
    } catch (err) {
      console.error('Error deleting issue:', err);
      setError('Failed to delete issue');
    }
  };

  const handleAddComment = () => {
    setSuccess('Comment added successfully!');
    setComment('');
    setShowCommentModal(false);
    setTimeout(() => setSuccess(null), 3000);
  };

  const getStatusBadge = (status) => {
    const variants = {
      REPORTED: 'primary',
      IN_PROGRESS: 'warning',
      RESOLVED: 'success'
    };
    return <Badge variant={variants[status] || 'default'}>{status?.replace('_', ' ')}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading issue details...</p>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Issue not found</p>
        <Button className="mt-4" onClick={() => navigate(ROUTES.ISSUES)}>
          Back to Issues
        </Button>
      </div>
    );
  }

  const statusOptions = [
    { value: 'REPORTED', label: 'Reported' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' }
  ];

  const categoryOptions = [
    { value: 'Infrastructure', label: 'Infrastructure' },
    { value: 'Utilities', label: 'Utilities' },
    { value: 'Safety', label: 'Safety' },
    { value: 'Sanitation', label: 'Sanitation' },
    { value: 'Environment', label: 'Environment' },
    { value: 'Other', label: 'Other' }
  ];

  const canEdit = user?.role === 'ADMIN' || user?.id === issue.reportedBy?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate(ROUTES.ISSUES)}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{issue.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Issue #{id.substring(0, 8)} · Reported {formatDate(issue.dateReported)}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={Edit}
              onClick={() => setShowEditModal(true)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card title="Description">
            <p className="text-gray-700 whitespace-pre-wrap">{issue.description}</p>
          </Card>

          {/* Photo */}
          {issue.photoUrl && (
            <Card title="Photo">
              <img 
                src={issue.photoUrl} 
                alt="Issue" 
                className="w-full rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
                }}
              />
            </Card>
          )}

          {/* Comments Section */}
          <Card 
            title="Comments" 
            action={
              <Button 
                variant="ghost" 
                size="sm"
                icon={MessageSquare}
                onClick={() => setShowCommentModal(true)}
              >
                Add Comment
              </Button>
            }
          >
            <div className="space-y-4">
              {/* Demo Comments */}
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    JD
                  </div>
                  <div>
                    <p className="font-medium text-sm">John Doe</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">
                  I've reported this to the maintenance team. They should be looking into it soon.
                </p>
              </div>

              <div className="text-center text-gray-500 text-sm py-4">
                <MessageSquare className="mx-auto mb-2 text-gray-400" size={24} />
                <p>No more comments yet</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card title="Status">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Current Status</p>
                {getStatusBadge(issue.status)}
              </div>
              
              {user?.role === 'ADMIN' && (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => setShowStatusModal(true)}
                >
                  Update Status
                </Button>
              )}
            </div>
          </Card>

          {/* Details Card */}
          <Card title="Details">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <TagIcon className="text-gray-400 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium">{issue.category}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="text-gray-400 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{issue.location?.name || 'N/A'}</p>
                  <p className="text-xs text-gray-500">{issue.location?.type || ''}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="text-gray-400 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Reported By</p>
                  <p className="font-medium">{issue.reportedBy?.fullName || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{issue.reportedBy?.email || ''}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="text-gray-400 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Date Reported</p>
                  <p className="font-medium text-sm">{formatDate(issue.dateReported)}</p>
                </div>
              </div>

              {issue.dateResolved && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-500 mt-0.5" size={18} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Date Resolved</p>
                    <p className="font-medium text-sm">{formatDate(issue.dateResolved)}</p>
                  </div>
                </div>
              )}

              {!issue.dateResolved && issue.status !== 'RESOLVED' && (
                <div className="flex items-start gap-3">
                  <Clock className="text-yellow-500 mt-0.5" size={18} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Time Elapsed</p>
                    <p className="font-medium text-sm">
                      {Math.floor((Date.now() - new Date(issue.dateReported)) / (1000 * 60 * 60))} hours
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Tags Card */}
          {issue.tags && issue.tags.length > 0 && (
            <Card title="Tags">
              <div className="flex flex-wrap gap-2">
                {issue.tags.map(tag => (
                  <Badge key={tag.id} variant="default">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Update Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Issue Status"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleStatusUpdate}>
              Update Status
            </Button>
          </>
        }
      >
        <Select
          label="New Status"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          options={statusOptions}
          required
        />
        <p className="text-sm text-gray-600 mt-4">
          Current status: <strong>{issue.status.replace('_', ' ')}</strong>
        </p>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Issue"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEdit}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            required
          />
          <Select
            label="Category"
            value={editForm.category}
            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
            options={categoryOptions}
            required
          />
          <Textarea
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            rows={6}
            required
          />
        </div>
      </Modal>

      {/* Add Comment Modal */}
      <Modal
        isOpen={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        title="Add Comment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCommentModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddComment}
              disabled={!comment.trim()}
            >
              Add Comment
            </Button>
          </>
        }
      >
        <Textarea
          label="Your Comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your comment here..."
          rows={4}
          required
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Issue"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Issue
            </Button>
          </>
        }
      >
        <p className="text-gray-700">
          Are you sure you want to delete this issue? This action cannot be undone.
        </p>
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">
            Issue: {issue.title}
          </p>
        </div>
      </Modal>
    </div>
  );
};