import React, { useState, useEffect } from 'react';
import { Input, Textarea, Select, Button, Alert } from '../common';
import { locationService } from '../../services/locationService';
import { useAuth } from '../../context/AuthContext';

export const IssueForm = ({ onSubmit, onCancel, initialData = null, loading = false }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    locationId: '',
    reportedById: user?.id || '',
    photoUrl: ''
  });
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadLocations();
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || '',
        locationId: initialData.location?.id || '',
        reportedById: initialData.reportedBy?.id || user?.id || '',
        photoUrl: initialData.photoUrl || ''
      });
    } else {
      // Ensure reportedById is set
      setFormData(prev => ({
        ...prev,
        reportedById: user?.id || ''
      }));
    }
  }, [initialData, user]);

  const loadLocations = async () => {
    try {
      const response = await locationService.getAll();
      console.log('Locations response:', response.data); // Debug
      
      // Handle array or object response
      const locationData = Array.isArray(response.data) ? response.data : [];
      setLocations(locationData);
    } catch (error) {
      console.error('Error loading locations:', error);
      // Fallback demo locations
      setLocations([
        { id: 'loc1', name: 'Kigali', type: 'PROVINCE' },
        { id: 'loc2', name: 'Nyanza', type: 'DISTRICT' },
        { id: 'loc3', name: 'Musanze', type: 'DISTRICT' }
      ]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const categoryOptions = [
    { value: '', label: 'Select a category' },
    { value: 'Infrastructure', label: 'Infrastructure' },
    { value: 'Utilities', label: 'Utilities' },
    { value: 'Safety', label: 'Safety' },
    { value: 'Sanitation', label: 'Sanitation' },
    { value: 'Environment', label: 'Environment' },
    { value: 'Other', label: 'Other' }
  ];

  const locationOptions = [
    { value: '', label: 'Select a location' },
    ...locations.map(loc => ({
      value: loc.id,
      label: `${loc.name} (${loc.type || 'Location'})`
    }))
  ];

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.locationId) {
      newErrors.locationId = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      // Prepare data for backend
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        locationId: formData.locationId,
        reportedById: formData.reportedById || user?.id,
        photoUrl: formData.photoUrl.trim() || null
      };
      
      console.log('Submitting issue:', submitData); // Debug
      onSubmit(submitData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Issue Title"
        name="title"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        placeholder="Brief description of the issue"
        required
        error={errors.title}
        disabled={loading}
      />

      <Select
        label="Category"
        name="category"
        value={formData.category}
        onChange={(e) => handleChange('category', e.target.value)}
        options={categoryOptions}
        required
        error={errors.category}
        disabled={loading}
      />

      <Select
        label="Location"
        name="locationId"
        value={formData.locationId}
        onChange={(e) => handleChange('locationId', e.target.value)}
        options={locationOptions}
        required
        error={errors.locationId}
        disabled={loading || loadingLocations}
      />

      <Textarea
        label="Description"
        name="description"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        placeholder="Provide detailed information about the issue..."
        rows={6}
        required
        error={errors.description}
        disabled={loading}
      />

      <Input
        label="Photo URL (Optional)"
        name="photoUrl"
        value={formData.photoUrl}
        onChange={(e) => handleChange('photoUrl', e.target.value)}
        placeholder="https://example.com/photo.jpg"
        disabled={loading}
      />

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          fullWidth
        >
          {loading ? 'Submitting...' : (initialData ? 'Update Issue' : 'Report Issue')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
          fullWidth
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};