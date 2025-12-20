import React, { useState, useEffect } from 'react';
import { Input, Textarea, Select, Button, Alert } from '../common';
import { tagService } from '../../services/tagService';
import { useAuth } from '../../context/AuthContext';
import { Tag as TagIcon, Check } from 'lucide-react';
import { LocationSelector } from './LocationSelector';

export const IssueForm = ({ onSubmit, onCancel, initialData = null, loading = false }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    villageCode: null,
    locationString: '',
    locationData: null, // Store full location data
    reportedById: user?.id || '',
    photoUrl: ''
  });
  const [activeTags, setActiveTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadActiveTags();
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || '',
        villageCode: initialData.location?.villageCode || null,
        locationString: initialData.location?.locationString || '',
        reportedById: initialData.reportedBy?.id || user?.id || '',
        photoUrl: initialData.photoUrl || ''
      });
      // Set selected tags if editing
      if (initialData.tags && Array.isArray(initialData.tags)) {
        setSelectedTagIds(initialData.tags.map(tag => tag.id));
      }
    } else {
      // Ensure reportedById is set
      setFormData(prev => ({
        ...prev,
        reportedById: user?.id || ''
      }));
    }
  }, [initialData, user]);

  const loadActiveTags = async () => {
    try {
      setLoadingTags(true);
      const response = await tagService.getActive();
      
      // Handle both array and paginated responses
      let tagsData = [];
      if (response.data) {
        if (response.data.content && Array.isArray(response.data.content)) {
          tagsData = response.data.content;
        } else if (Array.isArray(response.data)) {
          tagsData = response.data;
        }
      }
      
      setActiveTags(tagsData);
      console.log('✅ Loaded active tags:', tagsData.length);
    } catch (error) {
      console.error('Error loading active tags:', error);
      setActiveTags([]);
    } finally {
      setLoadingTags(false);
    }
  };

  const handleTagToggle = (tagId) => {
    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
    // Clear tag errors when user selects/deselects
    if (errors.tags) {
      setErrors(prev => ({ ...prev, tags: '' }));
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

  const handleLocationChange = (locationData) => {
    setFormData(prev => ({
      ...prev,
      villageCode: locationData.villageCode,
      locationString: locationData.locationString,
      // Store full location data in case backend needs it
      locationData: locationData
    }));
    // Clear location error when location is selected
    if (errors.villageCode) {
      setErrors(prev => ({ ...prev, villageCode: '' }));
    }
  };

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

    if (!formData.villageCode) {
      newErrors.villageCode = 'Location is required. Please select all location levels (Province, District, Sector, Cell, Village).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      // Prepare data for backend
      // Note: The backend might expect either:
      // 1. locationId (UUID) - legacy format
      // 2. villageCode (integer) - new Rwanda location hierarchy format
      // We're using villageCode as per the location selector guide
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        villageCode: Number(formData.villageCode), // Ensure it's a number, not string
        reportedById: formData.reportedById || user?.id,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : [] // Always send array, even if empty
      };
      
      // Only include photoUrl if it's not empty
      const photoUrl = formData.photoUrl?.trim();
      if (photoUrl) {
        submitData.photoUrl = photoUrl;
      }
      
      console.log('📋 Prepared submit data:', JSON.stringify(submitData, null, 2));
      
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

      {/* Location Selector - Rwanda Hierarchy */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location <span className="text-red-500">*</span>
        </label>
        <LocationSelector
          onLocationChange={handleLocationChange}
          selectedVillageCode={formData.villageCode}
          error={errors.villageCode}
        required
      />
      </div>

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

      {/* Tag Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags (Optional)
          <span className="text-xs text-gray-500 ml-2">Select tags to categorize this issue</span>
        </label>
        {loadingTags ? (
          <div className="text-sm text-gray-500 py-2">Loading tags...</div>
        ) : activeTags.length > 0 ? (
          <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-1 gap-2">
              {activeTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <label
                    key={tag.id}
                    className={`
                      flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors
                      ${isSelected 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50 border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center mt-0.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTagToggle(tag.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={loading}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <TagIcon size={14} className="text-gray-400 flex-shrink-0" />
                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {tag.name}
                        </span>
                        {isSelected && (
                          <Check size={14} className="text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                      {tag.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{tag.description}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 py-2 border border-gray-300 rounded-lg p-3 text-center">
            No tags available
          </div>
        )}
        {errors.tags && (
          <p className="text-sm text-red-600 mt-1">{errors.tags}</p>
        )}
      </div>

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