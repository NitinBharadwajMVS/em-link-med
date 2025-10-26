import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hospital } from '@/types/patient';

interface RouteMapProps {
  ambulanceLocation: { lat: number; lng: number };
  hospitals: Hospital[];
  selectedHospital?: Hospital;
  routeCoordinates?: [number, number][];
}

// Custom marker icons
const createIcon = (color: string, size: number) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const ambulanceIcon = createIcon('#ef4444', 32);
const hospitalIcon = createIcon('#10b981', 32);
const selectedHospitalIcon = createIcon('#3b82f6', 40);

export const RouteMap: React.FC<RouteMapProps> = ({ 
  ambulanceLocation, 
  hospitals, 
  selectedHospital,
  routeCoordinates 
}) => {
  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border-2 border-ambulance-border shadow-xl">
      <MapContainer
        center={[ambulanceLocation.lat, ambulanceLocation.lng]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ background: '#1a1f2e' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker 
          position={[ambulanceLocation.lat, ambulanceLocation.lng]} 
          icon={ambulanceIcon}
        >
          <Popup>
            <strong>Ambulance Location</strong>
          </Popup>
        </Marker>

        {hospitals.map((hospital) => (
          <Marker
            key={hospital.id}
            position={[hospital.coordinates.lat, hospital.coordinates.lng]}
            icon={selectedHospital?.id === hospital.id ? selectedHospitalIcon : hospitalIcon}
          >
            <Popup>
              <div>
                <strong>{hospital.name}</strong>
                <br />
                <small>{hospital.address}</small>
                <br />
                <small>Phone: {hospital.phone}</small>
                <br />
                <small>Status: {hospital.canAccept ? '✓ Can Accept' : '✗ Cannot Accept'}</small>
              </div>
            </Popup>
          </Marker>
        ))}

        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates.map(coord => [coord[1], coord[0]] as [number, number])}
            pathOptions={{
              color: '#3b82f6',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 10',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};
