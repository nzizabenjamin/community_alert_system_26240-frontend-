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

