import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  SearchBar, 
  Badge,
  Modal,
  Alert,
  Input
} from '../components/common';
import { Plus, Edit, Trash2, Tag, Power, PowerOff } from 'lucide-react';
import { tagService } from '../services/tagService';
import { useAuth } from '../context/AuthContext';

export const Tags = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true
  });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tagService.getAll();
      
      // Handle both paginated and non-paginated responses
      if (response.data) {
        let tagsData = [];
        
        if (response.data.content && Array.isArray(response.data.content)) {
          // Backend returns: { content: [...], totalPages: 5, totalElements: 45 }
          tagsData = response.data.content;
        } else if (Array.isArray(response.data)) {
          // Backend returns plain array
          tagsData = response.data;
        }
        
        setTags(tagsData);
        console.log('✅ Loaded tags:', tagsData.length);
      } else {
        setTags([]);
        console.warn('⚠️ No data in response:', response);
      }
    } catch (err) {
      console.error('❌ Load tags error:', err);
      console.error('Response:', err.response?.data);
      setError(`Failed to load tags: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTag) {
        await tagService.update(editingTag.id, formData);
        setSuccess('Tag updated successfully!');
      } else {
        await tagService.create(formData);
        setSuccess('Tag created successfully!');
      }
      setShowCreateModal(false);
      setEditingTag(null);
      resetForm();
      loadTags();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Operation failed: ' + (err.response?.data?.message || err.message));
      console.error('Submit error:', err);
    }
  };

  const handleDelete = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return;
    
    try {
      await tagService.delete(tagId);
      setSuccess('Tag deleted successfully!');
      loadTags();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete tag: This tag may be in use');
      console.error('Delete error:', err);
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      description: tag.description || '',
      active: tag.active !== undefined ? tag.active : true
    });
    setShowCreateModal(true);
  };

  const handleActivate = async (tagId) => {
    try {
      await tagService.activate(tagId);
      setSuccess('Tag activated successfully!');
      loadTags();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to activate tag: ' + (err.response?.data?.message || err.message));
      console.error('Activate error:', err);
    }
  };

  const handleDeactivate = async (tagId) => {
    if (!window.confirm('Are you sure you want to deactivate this tag? Residents will no longer be able to select it for new issues.')) return;
    
    try {
      await tagService.deactivate(tagId);
      setSuccess('Tag deactivated successfully!');
      loadTags();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to deactivate tag: ' + (err.response?.data?.message || err.message));
      console.error('Deactivate error:', err);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', active: true });
  };

  const filteredTags = tags.filter(tag => 
    tag.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tagColumns = [
    { 
      header: 'Name', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-blue-500" />
          <span className="font-medium text-gray-900">{row.name}</span>
        </div>
      )
    },
    { 
      header: 'Description', 
      accessor: 'description',
      render: (row) => (
        <span className="text-gray-600">{row.description || 'No description'}</span>
      )
    },
    { 
      header: 'Status', 
      render: (row) => (
        <Badge variant={row.active !== false ? 'success' : 'default'}>
          {row.active !== false ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    { 
      header: 'Usage Count', 
      render: (row) => (
        <Badge variant="default">
          {row.issueCount || 0} issues
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={Edit}
                onClick={() => handleEdit(row)}
              >
                Edit
              </Button>
              {row.active !== false ? (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={PowerOff}
                  onClick={() => handleDeactivate(row.id)}
                  className="text-orange-600 hover:bg-orange-50"
                  title="Deactivate tag"
                >
                  Deactivate
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Power}
                  onClick={() => handleActivate(row.id)}
                  className="text-green-600 hover:bg-green-50"
                  title="Activate tag"
                >
                  Activate
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={() => handleDelete(row.id)}
                className="text-red-600 hover:bg-red-50"
                title="Delete permanently"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tags Management</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin 
              ? 'Organize and categorize issues with tags' 
              : 'View available tags for categorizing issues'
            }
          </p>
        </div>
        {isAdmin && (
          <Button 
            variant="primary" 
            icon={Plus}
            onClick={() => {
              resetForm();
              setEditingTag(null);
              setShowCreateModal(true);
            }}
          >
            Add Tag
          </Button>
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <Card>
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tags..."
        />
      </Card>

      <Card noPadding>
        <Table
          columns={tagColumns}
          data={filteredTags}
          loading={loading}
          emptyMessage="No tags found. Create your first tag to get started."
        />
      </Card>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTag(null);
          resetForm();
        }}
        title={editingTag ? 'Edit Tag' : 'Create New Tag'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tag Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Urgent, Infrastructure"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this tag's purpose..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {editingTag && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Active (visible to residents)
              </label>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" fullWidth>
              {editingTag ? 'Update Tag' : 'Create Tag'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowCreateModal(false);
                setEditingTag(null);
                resetForm();
              }}
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};