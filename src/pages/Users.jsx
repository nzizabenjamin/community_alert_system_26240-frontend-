import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Pagination, 
  Button, 
  SearchBar, 
  Badge,
  Modal,
  Alert,
  Input,
  Select
} from '../components/common';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { userService } from '../services/userService';
import { locationService } from '../services/locationService';
import { useAuth } from '../context/AuthContext';

export const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'RESIDENT',
    locationId: ''
  });

  useEffect(() => {
    loadUsers();
    loadLocations();
  }, []); // Load once on mount

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getAll();
      
      // Handle both paginated and non-paginated responses
      if (response.data) {
        let usersData = [];
        
        if (response.data.content && Array.isArray(response.data.content)) {
          // Backend returns: { content: [...], totalPages: 5, totalElements: 45 }
          usersData = response.data.content;
        } else if (Array.isArray(response.data)) {
          // Backend returns plain array
          usersData = response.data;
        }
        
        setUsers(usersData);
        console.log('✅ Loaded users:', usersData.length);
      } else {
        setUsers([]);
        console.warn('⚠️ No data in response:', response);
      }
    } catch (err) {
      console.error('❌ Load users error:', err);
      console.error('Response:', err.response?.data);
      setError(`Failed to load users: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await locationService.getAll();
      setLocations(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load locations:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await userService.update(editingUser.id, formData);
        setSuccess('User updated successfully!');
      } else {
        await userService.create(formData);
        setSuccess('User created successfully!');
      }
      setShowCreateModal(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Operation failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await userService.delete(userId);
      setSuccess('User deleted successfully!');
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      password: '',
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      locationId: user.locationId || ''
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      password: '',
      phoneNumber: '',
      role: 'RESIDENT',
      locationId: ''
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const userColumns = [
    { 
      header: 'Name', 
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.fullName}</p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      )
    },
    { 
      header: 'Phone', 
      accessor: 'phoneNumber',
      render: (row) => row.phoneNumber || 'N/A'
    },
    { 
      header: 'Role', 
      render: (row) => (
        <Badge variant={row.role === 'ADMIN' ? 'danger' : 'primary'}>
          {row.role}
        </Badge>
      )
    },
    { 
      header: 'Location', 
      render: (row) => row.locationName || 'N/A'
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Edit}
            onClick={() => handleEdit(row)}
          >
            Edit
          </Button>
          {currentUser?.role === 'ADMIN' && row.id !== currentUser.id && (
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={() => handleDelete(row.id)}
              className="text-red-600 hover:bg-red-50"
            >
              Delete
            </Button>
          )}
        </div>
      )
    }
  ];

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'RESIDENT', label: 'Resident' },
    { value: 'ADMIN', label: 'Admin' }
  ];

  const locationOptions = [
    { value: '', label: 'Select Location' },
    ...locations.map(loc => ({
      value: loc.id,
      label: `${loc.name} (${loc.type})`
    }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and permissions</p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <Button 
            variant="primary" 
            icon={Plus}
            onClick={() => {
              resetForm();
              setEditingUser(null);
              setShowCreateModal(true);
            }}
          >
            Add User
          </Button>
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
          />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={roleOptions}
          />
        </div>
      </Card>

      <Card noPadding>
        <Table
          columns={userColumns}
          data={filteredUsers}
          loading={loading}
        />
      </Card>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingUser(null);
          resetForm();
        }}
        title={editingUser ? 'Edit User' : 'Create New User'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          {!editingUser && (
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          )}
          <Input
            label="Phone Number"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          />
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'RESIDENT', label: 'Resident' },
              { value: 'ADMIN', label: 'Admin' }
            ]}
            required
          />
          <Select
            label="Location"
            value={formData.locationId}
            onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
            options={locationOptions}
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" fullWidth>
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowCreateModal(false);
                setEditingUser(null);
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