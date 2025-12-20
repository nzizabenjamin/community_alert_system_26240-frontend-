import React from 'react';
import { useLocationHierarchy } from '../../hooks/useLocationHierarchy';
import { Select } from '../common';

export const LocationSelector = ({ 
  onLocationChange, 
  selectedVillageCode = null,
  className = '',
  error = null,
  required = true
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
    error: hierarchyError
  } = useLocationHierarchy();

  // Notify parent when village is selected
  React.useEffect(() => {
    if (selectedVillage && onLocationChange) {
      const locationString = getLocationString();
      const province = provinces.find(p => p.code === selectedProvince);
      const district = districts.find(d => d.code === selectedDistrict);
      const sector = sectors.find(s => s.code === selectedSector);
      const cell = cells.find(c => c.code === selectedCell);
      const village = villages.find(v => v.code === selectedVillage);
      
      // Only call onLocationChange if we have all required data
      if (province && district && sector && cell && village) {
        onLocationChange({
          villageCode: selectedVillage,
          locationString,
          province,
          district,
          sector,
          cell,
          village
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVillage, selectedProvince, selectedDistrict, selectedSector, selectedCell]);

  const displayError = error || hierarchyError;

  return (
    <div className={`location-selector ${className}`}>
      {displayError && (
        <div className="text-red-500 text-sm mb-2">{displayError}</div>
      )}

      {/* Province Selector */}
      <div className="mb-4">
        <Select
          label="Province"
          value={selectedProvince || ''}
          onChange={(e) => handleProvinceChange(e.target.value ? parseInt(e.target.value) : null)}
          disabled={loading.provinces}
          required={required}
          error={!selectedProvince && required ? 'Province is required' : null}
          options={[
            { value: '', label: 'Select Province' },
            ...provinces.map((province) => ({
              value: province.code,
              label: province.name
            }))
          ]}
        />
      </div>

      {/* District Selector */}
      <div className="mb-4">
        <Select
          label="District"
          value={selectedDistrict || ''}
          onChange={(e) => handleDistrictChange(e.target.value ? parseInt(e.target.value) : null)}
          disabled={!selectedProvince || loading.districts}
          required={required}
          error={!selectedDistrict && required && selectedProvince ? 'District is required' : null}
          options={[
            { value: '', label: 'Select District' },
            ...districts.map((district) => ({
              value: district.code,
              label: district.name
            }))
          ]}
        />
      </div>

      {/* Sector Selector */}
      <div className="mb-4">
        <Select
          label="Sector"
          value={selectedSector || ''}
          onChange={(e) => handleSectorChange(e.target.value || null)}
          disabled={!selectedDistrict || loading.sectors}
          required={required}
          error={!selectedSector && required && selectedDistrict ? 'Sector is required' : null}
          options={[
            { value: '', label: 'Select Sector' },
            ...sectors.map((sector) => ({
              value: sector.code,
              label: sector.name
            }))
          ]}
        />
      </div>

      {/* Cell Selector */}
      <div className="mb-4">
        <Select
          label="Cell"
          value={selectedCell || ''}
          onChange={(e) => handleCellChange(e.target.value ? parseInt(e.target.value) : null)}
          disabled={!selectedSector || loading.cells}
          required={required}
          error={!selectedCell && required && selectedSector ? 'Cell is required' : null}
          options={[
            { value: '', label: 'Select Cell' },
            ...cells.map((cell) => ({
              value: cell.code,
              label: cell.name
            }))
          ]}
        />
      </div>

      {/* Village Selector */}
      <div className="mb-4">
        <Select
          label="Village"
          value={selectedVillage || ''}
          onChange={(e) => handleVillageChange(e.target.value ? parseInt(e.target.value) : null)}
          disabled={!selectedCell || loading.villages}
          required={required}
          error={error || (!selectedVillage && required && selectedCell ? 'Village is required' : null)}
          options={[
            { value: '', label: 'Select Village' },
            ...villages.map((village) => ({
              value: village.code,
              label: village.name
            }))
          ]}
        />
      </div>

      {/* Display selected location string */}
      {selectedVillage && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Selected Location:</strong> {getLocationString()}
          </p>
        </div>
      )}
    </div>
  );
};

