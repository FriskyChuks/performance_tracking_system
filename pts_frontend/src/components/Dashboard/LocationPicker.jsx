// src/components/Dashboard/LocationPicker.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Crosshair, AlertCircle, Globe, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import toast from 'react-hot-toast';

const LocationPicker = ({ latitude, longitude, address, onLocationChange, onAddressChange }) => {
  const [useMap, setUseMap] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [searchInput, setSearchInput] = useState(address || '');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const searchBoxRef = useRef(null);
  
  // Manual entry state
  const [lat, setLat] = useState(latitude || '');
  const [lng, setLng] = useState(longitude || '');
  const [addr, setAddr] = useState(address || '');
  const [errors, setErrors] = useState({});

  // Check if Google Maps API key is configured
  const hasApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY && 
                    import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== 'your_google_maps_api_key_here';

  // Load Google Maps script
  useEffect(() => {
    if (!useMap || !hasApiKey) return;
    
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initMap();
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      script.onerror = () => setMapError('Failed to load Google Maps. Using manual entry mode.');
      document.head.appendChild(script);
    };
    
    loadGoogleMaps();
  }, [useMap]);

  const initMap = () => {
    if (!window.google || !window.google.maps) return;
    
    const center = { lat: parseFloat(latitude) || 9.0765, lng: parseFloat(longitude) || 7.3986 };
    
    const map = new window.google.maps.Map(document.getElementById('location-map'), {
      center,
      zoom: 13,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });
    
    const marker = new window.google.maps.Marker({
      map,
      position: center,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    });
    
    mapRef.current = map;
    markerRef.current = marker;
    
    // Click on map
    map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updateLocationFromMap(lat, lng);
    });
    
    // Drag marker
    marker.addListener('dragend', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updateLocationFromMap(lat, lng);
    });
    
    // Search box
    const searchInputElement = document.getElementById('location-search-input');
    if (searchInputElement) {
      const searchBox = new window.google.maps.places.SearchBox(searchInputElement);
      searchBoxRef.current = searchBox;
      
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        if (places.length === 0) return;
        
        const place = places[0];
        const location = place.geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        map.setCenter({ lat, lng });
        map.setZoom(15);
        updateLocationFromMap(lat, lng, place.formatted_address);
        setSearchInput(place.formatted_address);
      });
    }
    
    setMapLoaded(true);
  };

  const updateLocationFromMap = async (lat, lng, customAddress = null) => {
    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
    }
    if (mapRef.current) {
      mapRef.current.setCenter({ lat, lng });
    }
    
    // Update manual fields
    setLat(lat.toFixed(6));
    setLng(lng.toFixed(6));
    onLocationChange(lat, lng);
    
    if (!customAddress && window.google) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address;
            setAddr(address);
            onAddressChange(address);
            setSearchInput(address);
          }
        });
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
      }
    } else if (customAddress) {
      setAddr(customAddress);
      onAddressChange(customAddress);
    }
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (useMap && mapRef.current) {
          updateLocationFromMap(latitude, longitude);
        } else {
          setLat(latitude.toFixed(6));
          setLng(longitude.toFixed(6));
          onLocationChange(latitude, longitude);
        }
        
        toast.success('Location updated to your current position');
        setGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'Unable to get your location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Please check your device settings.';
        }
        toast.error(errorMessage);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Manual entry validation
  const validateAndUpdateManual = (newLat, newLng) => {
    const latNum = parseFloat(newLat);
    const lngNum = parseFloat(newLng);
    
    const newErrors = {};
    let isValid = true;
    
    if (newLat && (isNaN(latNum) || latNum < -90 || latNum > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
      isValid = false;
    }
    
    if (newLng && (isNaN(lngNum) || lngNum < -180 || lngNum > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
      isValid = false;
    }
    
    setErrors(newErrors);
    
    if (isValid && newLat && newLng) {
      onLocationChange(latNum, lngNum);
    }
  };

  const handleManualLatChange = (e) => {
    const value = e.target.value;
    setLat(value);
    if (lng) validateAndUpdateManual(value, lng);
  };

  const handleManualLngChange = (e) => {
    const value = e.target.value;
    setLng(value);
    if (lat) validateAndUpdateManual(lat, value);
  };

  const handleManualAddressChange = (e) => {
    const value = e.target.value;
    setAddr(value);
    onAddressChange(value);
  };

  const openGoogleMapsHelp = () => {
    window.open('https://www.google.com/maps', '_blank');
    toast.success(
      '📍 How to get coordinates:\n1. Right-click on your project location\n2. Select "What\'s here?"\n3. Copy the coordinates\n4. Paste them in the fields below',
      { duration: 8000 }
    );
  };

  const toggleMapExpand = () => {
    setIsMapExpanded(!isMapExpanded);
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setUseMap(true)}
          className={`px-3 py-1.5 text-sm rounded-lg transition ${
            useMap && hasApiKey
              ? 'bg-green-600 text-white' 
              : 'text-gray-500 hover:text-gray-700'
          } ${!hasApiKey ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!hasApiKey}
          title={!hasApiKey ? 'Google Maps API key not configured' : 'Use interactive map'}
        >
          🗺️ Map View
        </button>
        <button
          type="button"
          onClick={() => setUseMap(false)}
          className={`px-3 py-1.5 text-sm rounded-lg transition ${
            !useMap 
              ? 'bg-green-600 text-white' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📝 Manual Entry
        </button>
      </div>

      {!hasApiKey && useMap && (
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Google Maps API key not configured</p>
              <p className="text-yellow-700 text-xs mt-1">
                To use the interactive map, add your Google Maps API key to the .env file.
                <br />
                <span className="font-mono text-xs">VITE_GOOGLE_MAPS_API_KEY=your_api_key_here</span>
              </p>
              <p className="text-yellow-600 text-xs mt-2">
                You can still use Manual Entry mode above.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Map View */}
      {useMap && hasApiKey && (
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="location-search-input"
                type="text"
                placeholder="Search for a location..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {gettingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crosshair className="w-4 h-4" />
              )}
              Current
            </button>
            <button
              type="button"
              onClick={toggleMapExpand}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              {isMapExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Map Container */}
          <div 
            id="location-map" 
            className={`w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100 transition-all duration-300 ${
              isMapExpanded ? 'h-96' : 'h-64'
            }`}
          >
            {!mapLoaded && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Help Text for Map */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-start gap-2">
              <Globe className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">💡 Tips:</p>
                <ul className="list-disc list-inside text-blue-700 text-xs space-y-1 mt-1">
                  <li>Click anywhere on the map to set location</li>
                  <li>Drag the marker for precise placement</li>
                  <li>Use search to find specific addresses</li>
                  <li>Click "Current" to use your device location</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry View */}
      {!useMap && (
        <div className="space-y-4">
          {/* Help Box for Manual Entry */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-start gap-2">
              <Globe className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">📍 How to get coordinates:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700 text-xs">
                  <li>Click the button below to open Google Maps</li>
                  <li>Find and right-click on your project location</li>
                  <li>Select "What's here?" from the menu</li>
                  <li>Copy the coordinates (e.g., 9.0765, 7.3986)</li>
                  <li>Paste them in the fields below</li>
                </ol>
                <button
                  type="button"
                  onClick={openGoogleMapsHelp}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  Open Google Maps
                </button>
              </div>
            </div>
          </div>

          {/* Current Location Button */}
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium disabled:opacity-50"
          >
            <Crosshair className={`w-4 h-4 ${gettingLocation ? 'animate-pulse' : ''}`} />
            {gettingLocation ? 'Getting your location...' : 'Use My Current Location'}
          </button>

          {/* Coordinate Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={lat}
                  onChange={handleManualLatChange}
                  placeholder="e.g., 9.0765"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${
                    errors.latitude ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
              </div>
              {errors.latitude && (
                <p className="text-xs text-red-500 mt-1">{errors.latitude}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={lng}
                  onChange={handleManualLngChange}
                  placeholder="e.g., 7.3986"
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${
                    errors.longitude ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
              </div>
              {errors.longitude && (
                <p className="text-xs text-red-500 mt-1">{errors.longitude}</p>
              )}
            </div>
          </div>

          {/* Address Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Location Address
            </label>
            <textarea
              value={addr}
              onChange={handleManualAddressChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none"
              placeholder="Enter the physical address or directions to the project location..."
            />
            <p className="text-xs text-gray-400 mt-1">
              Example: "123 Forestry Road, Garki Area 11, Abuja" or "Along Lagos-Ibadan Expressway, Near Redeemed Camp"
            </p>
          </div>

          {/* Example Coordinates */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">📌 Example coordinates for major Nigerian cities:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="font-medium text-gray-700">Abuja</p>
                <p className="text-gray-500">9.0765, 7.3986</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Lagos</p>
                <p className="text-gray-500">6.5244, 3.3792</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Port Harcourt</p>
                <p className="text-gray-500">4.8156, 7.0498</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Kano</p>
                <p className="text-gray-500">12.0022, 8.5919</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;