import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface SimpleAlertMapProps {
  hospitalPosition: [number, number];
  ambulances: Array<{
    id: string;
    position: [number, number];
    patientName: string;
    triageLevel: string;
    eta: number;
  }>;
}

export function SimpleAlertMap(props: SimpleAlertMapProps) {
  const { hospitalPosition, ambulances } = props;

  return (
    <div style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={hospitalPosition}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        <Marker position={hospitalPosition}>
          <Popup>
            <div style={{ padding: '4px' }}>
              <strong>Your Hospital</strong>
            </div>
          </Popup>
        </Marker>

        {ambulances.map((ambulance) => (
          <Marker key={ambulance.id} position={ambulance.position}>
            <Popup>
              <div style={{ padding: '8px', minWidth: '150px' }}>
                <strong>{ambulance.id}</strong>
                <br />
                <span style={{ 
                  backgroundColor: ambulance.triageLevel === 'critical' ? '#dc2626' : 
                                   ambulance.triageLevel === 'urgent' ? '#f59e0b' : '#10b981',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {ambulance.triageLevel}
                </span>
                <br />
                <small>Patient: {ambulance.patientName}</small>
                <br />
                <small>ETA: {ambulance.eta} min</small>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
