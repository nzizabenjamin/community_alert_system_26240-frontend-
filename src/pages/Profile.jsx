import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Alert, Badge } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Shield, Calendar, Edit, Save, X } from 'lucide-react';
import { locationService } from '../services/locationService';
import { userService } from '../services/userService';

export const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      });
      
      // Load location if user has locationId
      if (user.locationId) {
        loadLocation(user.locationId);
      } else {
        setLoadingLocation(false);
      }
    }
  }, [user]);

  const loadLocation = async (locationId) => {
    try {
      setLoadingLocation(true);
      const response = await locationService.getById(locationId);
      setLocation(response.data);
    } catch (err) {
      console.error('Error loading location:', err);
      setLocation(null);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || ''
    });
    setError(null);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Update user profile
      const response = await userService.update(user.id, {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber
        // Note: Email might not be updatable, check backend
      });
      
      // Update user in context
      const updatedUser = { ...user, ...response.data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">View and manage your account information</p>
        </div>
        {!isEditing && (
          <Button
            variant="primary"
            icon={Edit}
            onClick={handleEdit}
          >
            Edit Profile
          </Button>
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                {isEditing ? (
                  <Input
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    disabled={loading}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <User size={18} className="text-gray-400" />
                    <span className="text-gray-900">{user.fullName || 'Not set'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Mail size={18} className="text-gray-400" />
                  <span className="text-gray-900">{user.email || 'Not set'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    placeholder="Enter your phone number"
                    disabled={loading}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Phone size={18} className="text-gray-400" />
                    <span className="text-gray-900">{user.phoneNumber || 'Not set'}</span>
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="primary"
                    icon={Save}
                    onClick={handleSave}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="secondary"
                    icon={X}
                    onClick={handleCancel}
                    disabled={loading}
                    fullWidth
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Account Details */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Shield size={18} className="text-gray-400" />
                  <Badge variant={user.role === 'ADMIN' ? 'primary' : 'default'}>
                    {user.role || 'RESIDENT'}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Created
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Calendar size={18} className="text-gray-400" />
                  <span className="text-gray-900">
                    {formatDate(user.createdAt || user.dateCreated)}
                  </span>
                </div>
              </div>

              {user.locationId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <MapPin size={18} className="text-gray-400" />
                    {loadingLocation ? (
                      <span className="text-gray-500">Loading...</span>
                    ) : location ? (
                      <span className="text-gray-900">{location.name || 'Unknown Location'}</span>
                    ) : (
                      <span className="text-gray-500">Location not found</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Profile Summary Card */}
        <div className="space-y-6">
          <Card>
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-white">
                  {user.fullName?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {user.fullName || 'User'}
              </h3>
              <p className="text-gray-600 mb-3">{user.email}</p>
              <Badge variant={user.role === 'ADMIN' ? 'primary' : 'default'}>
                {user.role || 'RESIDENT'}
              </Badge>
            </div>
          </Card>

          {/* Quick Stats (if available) */}
          {user.role === 'RESIDENT' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Issues Reported</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {user.totalIssues || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Resolved Issues</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {user.resolvedIssues || 0}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

