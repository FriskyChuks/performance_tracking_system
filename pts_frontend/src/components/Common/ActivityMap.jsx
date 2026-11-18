// src/components/Common/ActivityMap.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to center map on marker
const MapCenter = ({ position }) => {
  const map = useMap();
  React.useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [map, position]);
  return null;
};

const ActivityMap = ({ latitude, longitude, address, title }) => {
  const hasCoordinates = latitude && longitude;
  const position = hasCoordinates ? [parseFloat(latitude), parseFloat(longitude)] : [9.0765, 7.3986]; // Default to Abuja
  
  return (
    <div className="h-80 w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenter position={position} />
        {hasCoordinates && (
          <Marker position={position}>
            <Popup>
              <div className="text-sm">
                <strong>{title}</strong><br />
                {address && <span className="text-xs text-gray-600">{address}</span>}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default ActivityMap;