# Village Code Frontend Implementation Guide

This guide explains how to integrate village code support in the frontend for both **Issue Creation** and **User Signup**.

## Overview

The backend now supports two ways to specify a location:
1. **`locationId`** (UUID) - Use an existing Location entity ID from the database
2. **`villageCode`** (Integer) - Use a village code from RwandaLocations (automatically resolves to/create a Location)

## API Endpoints Supporting Village Code

### 1. Issue Creation
**Endpoint:** `POST /api/issues`

**Request Body:**
```json
{
  "title": "Road pothole",
  "description": "Large pothole on main road",
  "category": "Infrastructure",
  "villageCode": 101080110,  // ✅ Use villageCode instead of locationId
  "reportedById": "9459afe8-1ba0-43ce-aa89-12efda5778cf",
  "photoUrl": "https://example.com/photo.jpg",
  "tagIds": ["705066b7-dedd-4822-b8f3-08f09005428d"]
}
```

**Alternative (using locationId):**
```json
{
  "title": "Road pothole",
  "description": "Large pothole on main road",
  "category": "Infrastructure",
  "locationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  // ✅ Or use locationId
  "reportedById": "9459afe8-1ba0-43ce-aa89-12efda5778cf",
  "photoUrl": "https://example.com/photo.jpg",
  "tagIds": ["705066b7-dedd-4822-b8f3-08f09005428d"]
}
```

### 2. User Signup
**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNumber": "+250123456789",
  "role": "RESIDENT",
  "villageCode": 101080110  // ✅ Use villageCode instead of locationId
}
```

**Alternative (using locationId):**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNumber": "+250123456789",
  "role": "RESIDENT",
  "locationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  // ✅ Or use locationId
}
```

## Frontend Implementation

### Step 1: Update Issue Creation Form

**File:** `src/components/features/IssueForm.jsx` or similar

```jsx
import React, { useState, useEffect } from 'react';
import { locationService } from '../../services/locationService';

export const IssueForm = ({ onSubmit, user }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    villageCode: null,  // ✅ Use villageCode instead of locationId
    reportedById: user?.id || '',
    photoUrl: '',
    tagIds: []
  });

  const [locationHierarchy, setLocationHierarchy] = useState({
    province: null,
    district: null,
    sector: null,
    cell: null,
    village: null
  });

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    try {
      const response = await locationService.getProvinces();
      setProvinces(response.data);
    } catch (error) {
      console.error('Failed to load provinces:', error);
    }
  };

  const loadDistricts = async (provinceCode) => {
    try {
      const response = await locationService.getDistricts(provinceCode);
      setDistricts(response.data);
    } catch (error) {
      console.error('Failed to load districts:', error);
    }
  };

  const loadSectors = async (districtCode) => {
    try {
      const response = await locationService.getSectors(districtCode);
      setSectors(response.data);
    } catch (error) {
      console.error('Failed to load sectors:', error);
    }
  };

  const loadCells = async (sectorCode) => {
    try {
      const response = await locationService.getCells(sectorCode);
      setCells(response.data);
    } catch (error) {
      console.error('Failed to load cells:', error);
    }
  };

  const loadVillages = async (cellCode) => {
    try {
      const response = await locationService.getVillages(cellCode);
      setVillages(response.data);
    } catch (error) {
      console.error('Failed to load villages:', error);
    }
  };

  const handleLocationChange = (level, value) => {
    const newHierarchy = { ...locationHierarchy };
    
    if (level === 'province') {
      newHierarchy.province = value;
      newHierarchy.district = null;
      newHierarchy.sector = null;
      newHierarchy.cell = null;
      newHierarchy.village = null;
      if (value) loadDistricts(value);
    } else if (level === 'district') {
      newHierarchy.district = value;
      newHierarchy.sector = null;
      newHierarchy.cell = null;
      newHierarchy.village = null;
      if (value) loadSectors(value);
    } else if (level === 'sector') {
      newHierarchy.sector = value;
      newHierarchy.cell = null;
      newHierarchy.village = null;
      if (value) loadSectors(value);
    } else if (level === 'cell') {
      newHierarchy.cell = value;
      newHierarchy.village = null;
      if (value) loadVillages(value);
    } else if (level === 'village') {
      newHierarchy.village = value;
      // ✅ Set villageCode in formData
      setFormData(prev => ({
        ...prev,
        villageCode: value ? parseInt(value) : null
      }));
    }
    
    setLocationHierarchy(newHierarchy);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // ✅ Prepare data with villageCode
    const submitData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      villageCode: formData.villageCode,  // ✅ Send villageCode
      reportedById: formData.reportedById || user?.id,
      photoUrl: formData.photoUrl.trim() || null,
      tagIds: formData.tagIds
    };
    
    console.log('Submitting issue with villageCode:', submitData);
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Title, Description, Category fields... */}
      
      {/* Location Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        
        {/* Province Selector */}
        <select
          value={locationHierarchy.province || ''}
          onChange={(e) => handleLocationChange('province', e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select Province</option>
          {provinces.map(province => (
            <option key={province.code} value={province.code}>
              {province.name}
            </option>
          ))}
        </select>

        {/* District Selector */}
        {locationHierarchy.province && (
          <select
            value={locationHierarchy.district || ''}
            onChange={(e) => handleLocationChange('district', e.target.value)}
            className="w-full p-2 border rounded mt-2"
          >
            <option value="">Select District</option>
            {districts.map(district => (
              <option key={district.code} value={district.code}>
                {district.name}
              </option>
            ))}
          </select>
        )}

        {/* Sector Selector */}
        {locationHierarchy.district && (
          <select
            value={locationHierarchy.sector || ''}
            onChange={(e) => handleLocationChange('sector', e.target.value)}
            className="w-full p-2 border rounded mt-2"
          >
            <option value="">Select Sector</option>
            {sectors.map(sector => (
              <option key={sector.code} value={sector.code}>
                {sector.name}
              </option>
            ))}
          </select>
        )}

        {/* Cell Selector */}
        {locationHierarchy.sector && (
          <select
            value={locationHierarchy.cell || ''}
            onChange={(e) => handleLocationChange('cell', e.target.value)}
            className="w-full p-2 border rounded mt-2"
          >
            <option value="">Select Cell</option>
            {cells.map(cell => (
              <option key={cell.code} value={cell.code}>
                {cell.name}
              </option>
            ))}
          </select>
        )}

        {/* Village Selector */}
        {locationHierarchy.cell && (
          <select
            value={locationHierarchy.village || ''}
            onChange={(e) => handleLocationChange('village', e.target.value)}
            className="w-full p-2 border rounded mt-2"
            required
          >
            <option value="">Select Village</option>
            {villages.map(village => (
              <option key={village.code} value={village.code}>
                {village.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Submit button */}
      <button type="submit" className="btn-primary">
        Submit Issue
      </button>
    </form>
  );
};
```

### Step 2: Update Signup Form

**File:** `src/pages/auth/SignUp.jsx` or similar

```jsx
import React, { useState, useEffect } from 'react';
import { locationService } from '../../services/locationService';
import { authService } from '../../services/authService';

export const SignUp = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    villageCode: null  // ✅ Use villageCode instead of locationId
  });

  const [locationHierarchy, setLocationHierarchy] = useState({
    province: null,
    district: null,
    sector: null,
    cell: null,
    village: null
  });

  // ... (same location loading functions as IssueForm)

  const handleLocationChange = (level, value) => {
    // ... (same logic as IssueForm)
    
    if (level === 'village') {
      setFormData(prev => ({
        ...prev,
        villageCode: value ? parseInt(value) : null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.villageCode) {
      setError('Please select a village');
      return;
    }

    setLoading(true);
    
    try {
      // ✅ Prepare signup data with villageCode
      const { confirmPassword, ...signupData } = {
        ...formData,
        villageCode: formData.villageCode  // ✅ Send villageCode
      };
      
      await authService.signup(signupData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Sign up failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Name, Email, Password fields... */}
      
      {/* Location Selector (same as IssueForm) */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        {/* ... (same location selector as IssueForm) */}
      </div>

      <button type="submit" className="btn-primary">
        Sign Up
      </button>
    </form>
  );
};
```

### Step 3: Update Service Files

**File:** `src/services/locationService.js`

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/locations';

export const locationService = {
  // Get all locations (for dropdowns)
  getAll: () => axios.get(`${API_BASE_URL}`),

  // Get provinces
  getProvinces: () => axios.get(`${API_BASE_URL}/provinces`),

  // Get districts (optionally filtered by province)
  getDistricts: (provinceCode) => 
    axios.get(`${API_BASE_URL}/districts`, {
      params: provinceCode ? { provinceCode } : {}
    }),

  // Get sectors (optionally filtered by district)
  getSectors: (districtCode) => 
    axios.get(`${API_BASE_URL}/sectors`, {
      params: districtCode ? { districtCode } : {}
    }),

  // Get cells (optionally filtered by sector)
  getCells: (sectorCode) => 
    axios.get(`${API_BASE_URL}/cells`, {
      params: sectorCode ? { sectorCode } : {}
    }),

  // Get villages (optionally filtered by cell)
  getVillages: (cellCode) => 
    axios.get(`${API_BASE_URL}/villages`, {
      params: cellCode ? { cellCode } : {}
    }),

  // Get location by village code
  getLocationByVillageCode: (villageCode) => 
    axios.get(`${API_BASE_URL}/village/${villageCode}`),

  // Search locations
  searchLocations: (searchTerm, level = 'all') => 
    axios.get(`${API_BASE_URL}/rwanda/search`, {
      params: { searchTerm, level }
    }),

  // Get location statistics
  getStats: () => axios.get(`${API_BASE_URL}/stats`)
};
```

**File:** `src/services/issueService.js`

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/issues';

export const issueService = {
  create: (issueData) => {
    // ✅ Backend accepts both locationId and villageCode
    return axios.post(`${API_BASE_URL}`, issueData);
  },
  
  // ... other methods
};
```

**File:** `src/services/authService.js`

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/auth';

export const authService = {
  signup: (userData) => {
    // ✅ Backend accepts both locationId and villageCode
    return axios.post(`${API_BASE_URL}/signup`, userData);
  },
  
  // ... other methods
};
```

## Important Notes

### 1. **Village Code vs Location ID**
- **`villageCode`**: Integer (e.g., `101080110`) - Automatically resolves to/create a Location
- **`locationId`**: UUID (e.g., `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`) - Must exist in database

### 2. **Priority**
- If both `locationId` and `villageCode` are provided, `locationId` takes precedence
- If neither is provided, the request will fail with validation error

### 3. **Location Creation**
- When using `villageCode`, the backend automatically:
  1. Looks up the village in RwandaLocations
  2. Searches for an existing Location by name (case-insensitive)
  3. Creates a new Location if not found
  4. Uses that Location for the issue/user

### 4. **Error Handling**
```javascript
try {
  await issueService.create({
    title: "Issue title",
    description: "Issue description",
    category: "Safety",
    villageCode: 101080110  // ✅ Use villageCode
  });
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error - check if villageCode is valid
    console.error('Invalid village code or missing required fields');
  } else if (error.response?.status === 500) {
    // Server error - village code might not exist in RwandaLocations
    console.error('Village code not found in RwandaLocations');
  }
}
```

## Example: Complete Location Selector Component

**File:** `src/components/common/LocationSelector.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { locationService } from '../../services/locationService';

export const LocationSelector = ({ onVillageSelected, required = false }) => {
  const [hierarchy, setHierarchy] = useState({
    province: null,
    district: null,
    sector: null,
    cell: null,
    village: null
  });

  const [options, setOptions] = useState({
    provinces: [],
    districts: [],
    sectors: [],
    cells: [],
    villages: []
  });

  useEffect(() => {
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    try {
      const response = await locationService.getProvinces();
      setOptions(prev => ({ ...prev, provinces: response.data }));
    } catch (error) {
      console.error('Failed to load provinces:', error);
    }
  };

  const loadDistricts = async (provinceCode) => {
    try {
      const response = await locationService.getDistricts(provinceCode);
      setOptions(prev => ({ ...prev, districts: response.data }));
    } catch (error) {
      console.error('Failed to load districts:', error);
    }
  };

  const loadSectors = async (districtCode) => {
    try {
      const response = await locationService.getSectors(districtCode);
      setOptions(prev => ({ ...prev, sectors: response.data }));
    } catch (error) {
      console.error('Failed to load sectors:', error);
    }
  };

  const loadCells = async (sectorCode) => {
    try {
      const response = await locationService.getCells(sectorCode);
      setOptions(prev => ({ ...prev, cells: response.data }));
    } catch (error) {
      console.error('Failed to load cells:', error);
    }
  };

  const loadVillages = async (cellCode) => {
    try {
      const response = await locationService.getVillages(cellCode);
      setOptions(prev => ({ ...prev, villages: response.data }));
    } catch (error) {
      console.error('Failed to load villages:', error);
    }
  };

  const handleChange = (level, value) => {
    const newHierarchy = { ...hierarchy };
    
    // Reset downstream selections
    if (level === 'province') {
      newHierarchy.province = value;
      newHierarchy.district = null;
      newHierarchy.sector = null;
      newHierarchy.cell = null;
      newHierarchy.village = null;
      setOptions(prev => ({ ...prev, districts: [], sectors: [], cells: [], villages: [] }));
      if (value) loadDistricts(value);
    } else if (level === 'district') {
      newHierarchy.district = value;
      newHierarchy.sector = null;
      newHierarchy.cell = null;
      newHierarchy.village = null;
      setOptions(prev => ({ ...prev, sectors: [], cells: [], villages: [] }));
      if (value) loadSectors(value);
    } else if (level === 'sector') {
      newHierarchy.sector = value;
      newHierarchy.cell = null;
      newHierarchy.village = null;
      setOptions(prev => ({ ...prev, cells: [], villages: [] }));
      if (value) loadCells(value);
    } else if (level === 'cell') {
      newHierarchy.cell = value;
      newHierarchy.village = null;
      setOptions(prev => ({ ...prev, villages: [] }));
      if (value) loadVillages(value);
    } else if (level === 'village') {
      newHierarchy.village = value;
      // ✅ Callback with village code
      if (onVillageSelected) {
        onVillageSelected(value ? parseInt(value) : null);
      }
    }
    
    setHierarchy(newHierarchy);
  };

  return (
    <div className="space-y-4">
      {/* Province */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Province {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={hierarchy.province || ''}
          onChange={(e) => handleChange('province', e.target.value)}
          className="w-full p-2 border rounded-md"
          required={required}
        >
          <option value="">Select Province</option>
          {options.provinces.map(province => (
            <option key={province.code} value={province.code}>
              {province.name}
            </option>
          ))}
        </select>
      </div>

      {/* District */}
      {hierarchy.province && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            District {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={hierarchy.district || ''}
            onChange={(e) => handleChange('district', e.target.value)}
            className="w-full p-2 border rounded-md"
            required={required}
          >
            <option value="">Select District</option>
            {options.districts.map(district => (
              <option key={district.code} value={district.code}>
                {district.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sector */}
      {hierarchy.district && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sector {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={hierarchy.sector || ''}
            onChange={(e) => handleChange('sector', e.target.value)}
            className="w-full p-2 border rounded-md"
            required={required}
          >
            <option value="">Select Sector</option>
            {options.sectors.map(sector => (
              <option key={sector.code} value={sector.code}>
                {sector.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Cell */}
      {hierarchy.sector && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cell {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={hierarchy.cell || ''}
            onChange={(e) => handleChange('cell', e.target.value)}
            className="w-full p-2 border rounded-md"
            required={required}
          >
            <option value="">Select Cell</option>
            {options.cells.map(cell => (
              <option key={cell.code} value={cell.code}>
                {cell.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Village */}
      {hierarchy.cell && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Village {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={hierarchy.village || ''}
            onChange={(e) => handleChange('village', e.target.value)}
            className="w-full p-2 border rounded-md"
            required={required}
          >
            <option value="">Select Village</option>
            {options.villages.map(village => (
              <option key={village.code} value={village.code}>
                {village.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
```

## Usage Example

```jsx
import { LocationSelector } from '../components/common/LocationSelector';

function IssueForm() {
  const [villageCode, setVillageCode] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    await issueService.create({
      title: "Issue title",
      description: "Issue description",
      category: "Safety",
      villageCode: villageCode  // ✅ Use the selected village code
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields */}
      
      <LocationSelector 
        onVillageSelected={setVillageCode} 
        required={true}
      />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Testing

### Test with Village Code
```javascript
// Issue Creation
const issueData = {
  title: "Test Issue",
  description: "Test description",
  category: "Safety",
  villageCode: 101080110,  // ✅ Valid village code
  reportedById: "user-id-here",
  tagIds: []
};

// User Signup
const signupData = {
  fullName: "Test User",
  email: "test@example.com",
  password: "password123",
  phoneNumber: "+250123456789",
  role: "RESIDENT",
  villageCode: 101080110  // ✅ Valid village code
};
```

## Summary

✅ **Use `villageCode` (Integer)** when:
- Users select location from RwandaLocations hierarchy
- You want automatic location creation
- You're using the cascading location selector

✅ **Use `locationId` (UUID)** when:
- You have an existing Location entity ID
- You're using a simple location dropdown with pre-existing locations

The backend handles both seamlessly! 🎉

