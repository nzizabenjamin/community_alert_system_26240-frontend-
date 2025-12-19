import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  SearchBar, 
  Badge,
  Modal,
  Alert,
  Input,
  Select
} from '../components/common';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { locationService } from '../services/locationService';

export const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    parentID: ''
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await locationService.getAll();
      
      // Handle both paginated and non-paginated responses
      if (response.data) {
        let locationsData = [];
        
        if (response.data.content && Array.isArray(response.data.content)) {
          // Backend returns: { content: [...], totalPages: 5, totalElements: 45 }
          locationsData = response.data.content;
        } else if (Array.isArray(response.data)) {
          // Backend returns plain array
          locationsData = response.data;
        }
        
        setLocations(locationsData);
        console.log('✅ Loaded locations:', locationsData.length);
      } else {
        setLocations([]);
        console.warn('⚠️ No data in response:', response);
      }
    } catch (err) {
      console.error('❌ Load locations error:', err);
      console.error('Response:', err.response?.data);
      setError(`Failed to load locations: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await locationService.update(editingLocation.id, formData);
        setSuccess('Location updated successfully!');
      } else {
        await locationService.create(formData);
        setSuccess('Location created successfully!');
      }
      setShowCreateModal(false);
      setEditingLocation(null);
      resetForm();
      loadLocations();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Operation failed');
    }
  };

  const handleDelete = async (locationId) => {
    if (!window.confirm('Are you sure? This may affect related data.')) return;
    
    try {
      await locationService.delete(locationId);
      setSuccess('Location deleted successfully!');
      loadLocations();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete location');
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      type: location.type,
      parentID: location.parentID || ''
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', type: '', parentID: '' });
  };

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = loc.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || loc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const locationColumns = [
    { 
      header: 'Name', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-gray-400" />
          <span className="font-medium">{row.name}</span>
        </div>
      )
    },
    { 
      header: 'Type', 
      render: (row) => <Badge variant="primary">{row.type}</Badge>
    },
    { 
      header: 'Parent', 
      render: (row) => row.parentName || '-'
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
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'PROVINCE', label: 'Province' },
    { value: 'DISTRICT', label: 'District' },
    { value: 'SECTOR', label: 'Sector' },
    { value: 'CELL', label: 'Cell' },
    { value: 'VILLAGE', label: 'Village' }
  ];

  const parentOptions = [
    { value: '', label: 'None (Top Level)' },
    ...locations.map(loc => ({
      value: loc.id,
      label: `${loc.name} (${loc.type})`
    }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locations Management</h1>
          <p className="text-gray-600 mt-1">Manage Rwanda's administrative locations</p>
        </div>
        <Button 
          variant="primary" 
          icon={Plus}
          onClick={() => {
            resetForm();
            setEditingLocation(null);
            setShowCreateModal(true);
          }}
        >
          Add Location
        </Button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search locations..."
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={typeOptions}
          />
        </div>
      </Card>

      <Card noPadding>
        <Table
          columns={locationColumns}
          data={filteredLocations}
          loading={loading}
        />
      </Card>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingLocation(null);
          resetForm();
        }}
        title={editingLocation ? 'Edit Location' : 'Create New Location'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Location Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Kigali"
            required
          />
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: '', label: 'Select Type' },
              { value: 'PROVINCE', label: 'Province' },
              { value: 'DISTRICT', label: 'District' },
              { value: 'SECTOR', label: 'Sector' },
              { value: 'CELL', label: 'Cell' },
              { value: 'VILLAGE', label: 'Village' }
            ]}
            required
          />
          <Select
            label="Parent Location"
            value={formData.parentID}
            onChange={(e) => setFormData({ ...formData, parentID: e.target.value })}
            options={parentOptions}
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" fullWidth>
              {editingLocation ? 'Update Location' : 'Create Location'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowCreateModal(false);
                setEditingLocation(null);
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