import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface SimpleMapProps {
  ambulancePosition: [number, number];
  hospitals: Array<{
    id: string;
    name: string;
    position: [number, number];
    canAccept: boolean;
  }>;
  selectedHospitalId?: string;
  route?: Array<[number, number]>;
}

export function SimpleMap(props: SimpleMapProps) {
  const { ambulancePosition, hospitals, selectedHospitalId, route } = props;

  return (
    <div style={{ width: '100%', height: '500px', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={ambulancePosition}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        <Marker position={ambulancePosition}>
          <Popup>
            <div style={{ padding: '4px' }}>
              <strong>Ambulance Location</strong>
            </div>
          </Popup>
        </Marker>

        {hospitals.map((hospital) => (
          <Marker key={hospital.id} position={hospital.position}>
            <Popup>
              <div style={{ padding: '4px' }}>
                <strong>{hospital.name}</strong>
                <br />
                <small>Status: {hospital.canAccept ? 'Available' : 'Unavailable'}</small>
                {selectedHospitalId === hospital.id && (
                  <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>SELECTED</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {route && route.length > 0 && (
          <Polyline
            positions={route}
            pathOptions={{ color: '#3b82f6', weight: 4 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
