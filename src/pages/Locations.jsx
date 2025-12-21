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
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';

export const Locations = () => {
  const { user, refreshUser } = useAuth();
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
    if (user) {
      console.log('👤 User object in Locations page:', user);
      console.log('📍 User locationId:', user.locationId);
      console.log('📍 User location object:', user.location);
      loadLocations();
    }
  }, [user]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For RESIDENTS, only show their own location
      // Also handle case where role might be null but user has locationId (treat as RESIDENT)
      const isResident = user?.role === 'RESIDENT' || (user?.role === null && user?.locationId);
      
      if (isResident) {
        // Get locationId from user object (could be user.locationId or user.location?.id)
        let locationId = user?.locationId || user?.location?.id;
        let currentUser = user;
        let locationFromUser = user?.location;
        
        // Check if we have a full location object in the user object
        if (locationFromUser && locationFromUser.id) {
          console.log('✅ Found location object in user:', locationFromUser);
          setLocations([locationFromUser]);
          setLoading(false);
          return; // Early return if we have location data
        }
        
        // If no locationId found, try refreshing user data from backend
        if (!locationId) {
          try {
            console.log('🔄 No locationId in user object, refreshing user data from backend...');
            if (refreshUser) {
              currentUser = await refreshUser();
              locationId = currentUser?.locationId || currentUser?.location?.id;
              locationFromUser = currentUser?.location;
              console.log('✅ Refreshed user data, locationId:', locationId);
              
              // Check if refreshed user has location object
              if (locationFromUser && locationFromUser.id) {
                console.log('✅ Found location object in refreshed user:', locationFromUser);
                setLocations([locationFromUser]);
                setLoading(false);
                return; // Early return if we have location data
              }
            } else {
              // Fallback: use userService directly
              const userResponse = await userService.getCurrentUserProfile();
              if (userResponse.data) {
                currentUser = userResponse.data;
                locationId = currentUser?.locationId || currentUser?.location?.id;
                locationFromUser = currentUser?.location;
                localStorage.setItem('user', JSON.stringify(currentUser));
                console.log('✅ Refreshed user data via service, locationId:', locationId);
                
                // Check if refreshed user has location object
                if (locationFromUser && locationFromUser.id) {
                  console.log('✅ Found location object in refreshed user:', locationFromUser);
                  setLocations([locationFromUser]);
                  setLoading(false);
                  return; // Early return if we have location data
                }
              }
            }
          } catch (refreshErr) {
            console.warn('⚠️ Failed to refresh user data:', refreshErr);
            // Continue with error handling below
          }
        }
        
        if (locationId) {
          try {
            console.log('🔍 Fetching location with ID:', locationId);
            const response = await locationService.getById(locationId);
            console.log('📦 Raw API response:', response);
            console.log('📦 Response data:', response.data);
            
            // Handle different response structures
            let locationData = null;
            if (response.data) {
              // Check if response.data is the location object directly
              if (response.data.id || response.data.name) {
                locationData = response.data;
              } 
              // Check if response.data has a nested location
              else if (response.data.location) {
                locationData = response.data.location;
              }
              // Check if response.data is an array with one item
              else if (Array.isArray(response.data) && response.data.length > 0) {
                locationData = response.data[0];
              }
            }
            
            if (locationData) {
              setLocations([locationData]);
              console.log('✅ Loaded resident location:', locationData);
              setError(null); // Clear any previous errors
            } else {
              console.error('❌ Location data is null or invalid:', response);
              setError('Location data received but format is invalid. Please contact support.');
              setLocations([]);
            }
          } catch (err) {
            console.error('❌ Load resident location error:', err);
            console.error('Error details:', {
              status: err.response?.status,
              statusText: err.response?.statusText,
              data: err.response?.data,
              message: err.message
            });
            console.error('Location ID used:', locationId);
            console.error('User object:', currentUser);
            
            const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
            setError(`Failed to load your location: ${errorMessage}`);
            setLocations([]);
          }
        } else {
          // RESIDENT user doesn't have a locationId after refresh
          setError('Your location information is not available. Please log out and log back in, or contact support if the issue persists.');
          setLocations([]);
          console.warn('⚠️ RESIDENT user has no locationId after refresh:', currentUser);
        }
      } else if (user?.role === 'ADMIN') {
        // For ADMIN, load all locations
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
      } else {
        // Unknown role or no user
        setLocations([]);
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
        user?.role === 'ADMIN' && !(user?.role === null && user?.locationId) ? (
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
        ) : (
          <span className="text-sm text-gray-500">View only</span>
        )
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
          <h1 className="text-3xl font-bold text-gray-900">
            {(user?.role === 'RESIDENT' || (user?.role === null && user?.locationId)) ? 'My Location' : 'Locations Management'}
          </h1>
          <p className="text-gray-600 mt-1">
            {(user?.role === 'RESIDENT' || (user?.role === null && user?.locationId))
              ? 'View your location details' 
              : 'Manage Rwanda\'s administrative locations'}
          </p>
        </div>
        {user?.role === 'ADMIN' && (
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
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {user?.role === 'ADMIN' && (
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
      )}

      {user?.role === null && user?.locationId && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Your user role is not set. Please contact support to update your account role.
          </p>
        </div>
      )}

      <Card noPadding>
        {user?.role === 'RESIDENT' && locations.length === 0 && !loading && !error && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Debug Info:</strong> Check browser console for detailed logs about location loading.
            </p>
          </div>
        )}
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