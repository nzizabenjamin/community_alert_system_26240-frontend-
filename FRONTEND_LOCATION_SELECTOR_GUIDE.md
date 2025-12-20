# Frontend Location Selector Implementation Guide

## Overview
This guide explains how to implement a cascading location selector component in React that uses the Rwanda Locations API endpoints. The component will have 5 dropdowns: Province → District → Sector → Cell → Village.

## Backend API Endpoints

The backend provides the following endpoints:

### 1. Get All Provinces
```http
GET /api/locations/provinces
Response: [
  { "code": 1, "name": "Kigali" },
  { "code": 2, "name": "Northern Province" },
  ...
]
```

### 2. Get Districts (optionally filtered by province)
```http
GET /api/locations/districts?provinceCode=1
Response: [
  { 
    "code": 101, 
    "name": "Nyarugenge",
    "province_code": 1,
    "province_name": "Kigali"
  },
  ...
]
```

### 3. Get Sectors (optionally filtered by district)
```http
GET /api/locations/sectors?districtCode=101
Response: [
  {
    "code": "010101",
    "name": "Gitega",
    "district_code": 101,
    "district_name": "Nyarugenge",
    ...
  },
  ...
]
```

### 4. Get Cells (optionally filtered by sector)
```http
GET /api/locations/cells?sectorCode=010101
Response: [
  {
    "code": 10101,
    "name": "Cell Name",
    "sector_code": "010101",
    ...
  },
  ...
]
```

### 5. Get Villages (optionally filtered by cell)
```http
GET /api/locations/villages?cellCode=10101
Response: [
  {
    "code": 1010101,
    "name": "Village Name",
    "cell_code": 10101,
    ...
  },
  ...
]
```

### 6. Get Complete Location Hierarchy by Village Code
```http
GET /api/locations/village/{villageCode}
Response: {
  "province": { "code": 1, "name": "Kigali" },
  "district": { "code": 101, "name": "Nyarugenge" },
  "sector": { "code": "010101", "name": "Gitega" },
  "cell": { "code": 10101, "name": "Cell Name" },
  "village": { "code": 1010101, "name": "Village Name" }
}
```

## Frontend Implementation

### Step 1: Create Location Service

Create or update `src/services/locationService.js`:

```javascript
import api from './api';

export const locationService = {
  // Existing methods...
  getAll: () => api.get('/locations'),
  getById: (id) => api.get(`/locations/${id}`),
  create: (locationData) => api.post('/locations', locationData),
  update: (id, locationData) => api.put(`/locations/${id}`, locationData),
  delete: (id) => api.delete(`/locations/${id}`),

  // New Rwanda Locations hierarchy methods
  getProvinces: () => api.get('/locations/provinces'),
  getDistricts: (provinceCode) => {
    const params = provinceCode ? { provinceCode } : {};
    return api.get('/locations/districts', { params });
  },
  getSectors: (districtCode) => {
    const params = districtCode ? { districtCode } : {};
    return api.get('/locations/sectors', { params });
  },
  getCells: (sectorCode) => {
    const params = sectorCode ? { sectorCode } : {};
    return api.get('/locations/cells', { params });
  },
  getVillages: (cellCode) => {
    const params = cellCode ? { cellCode } : {};
    return api.get('/locations/villages', { params });
  },
  getLocationByVillageCode: (villageCode) => 
    api.get(`/locations/village/${villageCode}`),
  searchRwandaLocations: (query, level = 'all') => 
    api.get('/locations/rwanda/search', { params: { q: query, level } }),
  getLocationStats: () => api.get('/locations/stats')
};
```

### Step 2: Create Custom Hook

Create `src/hooks/useLocationHierarchy.js`:

```javascript
import { useState, useEffect, useCallback } from 'react';
import { locationService } from '../services/locationService';

export const useLocationHierarchy = () => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [cells, setCells] = useState([]);
  const [villages, setVillages] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedSector, setSelectedSector] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);

  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    sectors: false,
    cells: false,
    villages: false
  });

  const [error, setError] = useState(null);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoading(prev => ({ ...prev, provinces: true }));
        const response = await locationService.getProvinces();
        setProvinces(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error loading provinces:', err);
        setError('Failed to load provinces');
      } finally {
        setLoading(prev => ({ ...prev, provinces: false }));
      }
    };
    loadProvinces();
  }, []);

  // Load districts when province is selected
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setSelectedDistrict(null);
      return;
    }

    const loadDistricts = async () => {
      try {
        setLoading(prev => ({ ...prev, districts: true }));
        const response = await locationService.getDistricts(selectedProvince);
        setDistricts(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error loading districts:', err);
        setError('Failed to load districts');
      } finally {
        setLoading(prev => ({ ...prev, districts: false }));
      }
    };
    loadDistricts();
  }, [selectedProvince]);

  // Load sectors when district is selected
  useEffect(() => {
    if (!selectedDistrict) {
      setSectors([]);
      setSelectedSector(null);
      return;
    }

    const loadSectors = async () => {
      try {
        setLoading(prev => ({ ...prev, sectors: true }));
        const response = await locationService.getSectors(selectedDistrict);
        setSectors(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error loading sectors:', err);
        setError('Failed to load sectors');
      } finally {
        setLoading(prev => ({ ...prev, sectors: false }));
      }
    };
    loadSectors();
  }, [selectedDistrict]);

  // Load cells when sector is selected
  useEffect(() => {
    if (!selectedSector) {
      setCells([]);
      setSelectedCell(null);
      return;
    }

    const loadCells = async () => {
      try {
        setLoading(prev => ({ ...prev, cells: true }));
        const response = await locationService.getCells(selectedSector);
        setCells(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error loading cells:', err);
        setError('Failed to load cells');
      } finally {
        setLoading(prev => ({ ...prev, cells: false }));
      }
    };
    loadCells();
  }, [selectedSector]);

  // Load villages when cell is selected
  useEffect(() => {
    if (!selectedCell) {
      setVillages([]);
      setSelectedVillage(null);
      return;
    }

    const loadVillages = async () => {
      try {
        setLoading(prev => ({ ...prev, villages: true }));
        const response = await locationService.getVillages(selectedCell);
        setVillages(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error loading villages:', err);
        setError('Failed to load villages');
      } finally {
        setLoading(prev => ({ ...prev, villages: false }));
      }
    };
    loadVillages();
  }, [selectedCell]);

  // Reset downstream selections when parent changes
  const handleProvinceChange = useCallback((provinceCode) => {
    setSelectedProvince(provinceCode);
    setSelectedDistrict(null);
    setSelectedSector(null);
    setSelectedCell(null);
    setSelectedVillage(null);
  }, []);

  const handleDistrictChange = useCallback((districtCode) => {
    setSelectedDistrict(districtCode);
    setSelectedSector(null);
    setSelectedCell(null);
    setSelectedVillage(null);
  }, []);

  const handleSectorChange = useCallback((sectorCode) => {
    setSelectedSector(sectorCode);
    setSelectedCell(null);
    setSelectedVillage(null);
  }, []);

  const handleCellChange = useCallback((cellCode) => {
    setSelectedCell(cellCode);
    setSelectedVillage(null);
  }, []);

  const handleVillageChange = useCallback((villageCode) => {
    setSelectedVillage(villageCode);
  }, []);

  // Get full location string
  const getLocationString = useCallback(() => {
    if (!selectedVillage) return '';
    
    const province = provinces.find(p => p.code === selectedProvince);
    const district = districts.find(d => d.code === selectedDistrict);
    const sector = sectors.find(s => s.code === selectedSector);
    const cell = cells.find(c => c.code === selectedCell);
    const village = villages.find(v => v.code === selectedVillage);

    if (!province || !district || !sector || !cell || !village) return '';

    return `${village.name}, ${cell.name}, ${sector.name}, ${district.name}, ${province.name}`;
  }, [selectedProvince, selectedDistrict, selectedSector, selectedCell, selectedVillage, provinces, districts, sectors, cells, villages]);

  // Reset all selections
  const reset = useCallback(() => {
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedSector(null);
    setSelectedCell(null);
    setSelectedVillage(null);
  }, []);

  return {
    // Data
    provinces,
    districts,
    sectors,
    cells,
    villages,
    
    // Selected values
    selectedProvince,
    selectedDistrict,
    selectedSector,
    selectedCell,
    selectedVillage,
    
    // Handlers
    handleProvinceChange,
    handleDistrictChange,
    handleSectorChange,
    handleCellChange,
    handleVillageChange,
    
    // Utilities
    getLocationString,
    reset,
    
    // State
    loading,
    error
  };
};
```

### Step 3: Create LocationSelector Component

Create `src/components/features/LocationSelector.jsx`:

```jsx
import React from 'react';
import { useLocationHierarchy } from '../../hooks/useLocationHierarchy';
import { Select } from '../common'; // Adjust import based on your component structure

export const LocationSelector = ({ 
  onLocationChange, 
  selectedVillageCode = null,
  className = '' 
}) => {
  const {
    provinces,
    districts,
    sectors,
    cells,
    villages,
    selectedProvince,
    selectedDistrict,
    selectedSector,
    selectedCell,
    selectedVillage,
    handleProvinceChange,
    handleDistrictChange,
    handleSectorChange,
    handleCellChange,
    handleVillageChange,
    getLocationString,
    loading,
    error
  } = useLocationHierarchy();

  // Notify parent when village is selected
  React.useEffect(() => {
    if (selectedVillage && onLocationChange) {
      const locationString = getLocationString();
      onLocationChange({
        villageCode: selectedVillage,
        locationString,
        province: provinces.find(p => p.code === selectedProvince),
        district: districts.find(d => d.code === selectedDistrict),
        sector: sectors.find(s => s.code === selectedSector),
        cell: cells.find(c => c.code === selectedCell),
        village: villages.find(v => v.code === selectedVillage)
      });
    }
  }, [selectedVillage, getLocationString, onLocationChange, selectedProvince, selectedDistrict, selectedSector, selectedCell, provinces, districts, sectors, cells, villages]);

  return (
    <div className={`location-selector ${className}`}>
      {error && (
        <div className="text-red-500 text-sm mb-2">{error}</div>
      )}

      {/* Province Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Province <span className="text-red-500">*</span>
        </label>
        <Select
          value={selectedProvince || ''}
          onChange={(e) => handleProvinceChange(e.target.value ? parseInt(e.target.value) : null)}
          disabled={loading.provinces}
          required
        >
          <option value="">Select Province</option>
          {provinces.map((province) => (
            <option key={province.code} value={province.code}>
              {province.name}
            </option>
          ))}
        </Select>
      </div>

      {/* District Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          District <span className="text-red-500">*</span>
        </label>
        <Select
          value={selectedDistrict || ''}
          onChange={(e) => handleDistrictChange(e.target.value ? parseInt(e.target.value) : null)}
          disabled={!selectedProvince || loading.districts}
          required
        >
          <option value="">Select District</option>
          {districts.map((district) => (
            <option key={district.code} value={district.code}>
              {district.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Sector Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Sector <span className="text-red-500">*</span>
        </label>
        <Select
          value={selectedSector || ''}
          onChange={(e) => handleSectorChange(e.target.value || null)}
          disabled={!selectedDistrict || loading.sectors}
          required
        >
          <option value="">Select Sector</option>
          {sectors.map((sector) => (
            <option key={sector.code} value={sector.code}>
              {sector.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Cell Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Cell <span className="text-red-500">*</span>
        </label>
        <Select
          value={selectedCell || ''}
          onChange={(e) => handleCellChange(e.target.value ? parseInt(e.target.value) : null)}
          disabled={!selectedSector || loading.cells}
          required
        >
          <option value="">Select Cell</option>
          {cells.map((cell) => (
            <option key={cell.code} value={cell.code}>
              {cell.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Village Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Village <span className="text-red-500">*</span>
        </label>
        <Select
          value={selectedVillage || ''}
          onChange={(e) => handleVillageChange(e.target.value ? parseInt(e.target.value) : null)}
          disabled={!selectedCell || loading.villages}
          required
        >
          <option value="">Select Village</option>
          {villages.map((village) => (
            <option key={village.code} value={village.code}>
              {village.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Display selected location string */}
      {selectedVillage && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="text-sm text-gray-600">
            <strong>Selected Location:</strong> {getLocationString()}
          </p>
        </div>
      )}
    </div>
  );
};
```

### Step 4: Use in Issue Form

Update your `IssueForm.jsx` to use the LocationSelector:

```jsx
import { LocationSelector } from '../components/features/LocationSelector';

// In your component:
const [locationData, setLocationData] = useState({
  villageCode: null,
  locationString: ''
});

// In your form:
<LocationSelector
  onLocationChange={(data) => {
    setLocationData({
      villageCode: data.villageCode,
      locationString: data.locationString
    });
  }}
/>

// When submitting the form, you can use:
// - locationData.villageCode (for storing the village code)
// - locationData.locationString (for displaying the full location)
```

## Data Structure

### Selected Location Object
When a village is selected, `onLocationChange` receives:
```javascript
{
  villageCode: 1010101,  // Integer - the village code
  locationString: "Village Name, Cell Name, Sector Name, District Name, Province Name",
  province: { code: 1, name: "Kigali" },
  district: { code: 101, name: "Nyarugenge", ... },
  sector: { code: "010101", name: "Gitega", ... },
  cell: { code: 10101, name: "Cell Name", ... },
  village: { code: 1010101, name: "Village Name", ... }
}
```

## Important Notes

1. **Cascading Behavior**: Each dropdown depends on the previous selection. When a parent selection changes, all child selections are reset.

2. **Loading States**: The hook provides loading states for each dropdown, which you can use to show loading indicators.

3. **Error Handling**: The hook includes error handling. Display errors to users appropriately.

4. **Validation**: Ensure all 5 levels are selected before allowing form submission.

5. **Village Code**: The final `villageCode` is what should be stored/used for location identification.

6. **Location String**: Use `locationString` for display purposes (e.g., showing the full address).

## Testing

Test the endpoints:
```bash
# Get provinces
curl http://localhost:8080/api/locations/provinces

# Get districts in Kigali (province code 1)
curl http://localhost:8080/api/locations/districts?provinceCode=1

# Get sectors in a district
curl http://localhost:8080/api/locations/sectors?districtCode=101

# Get cells in a sector
curl http://localhost:8080/api/locations/cells?sectorCode=010101

# Get villages in a cell
curl http://localhost:8080/api/locations/villages?cellCode=10101
```

## Troubleshooting

1. **Locations not loading**: Check if `locations.json` is in `src/main/resources/`
2. **Cascading not working**: Verify the parent selection is being passed correctly
3. **API errors**: Check browser console and backend logs for error messages

