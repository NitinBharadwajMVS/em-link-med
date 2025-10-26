import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Initialize Leaflet icons only once
let leafletInitialized = false;

function initializeLeafletIcons() {
  if (leafletInitialized) return;
  
  try {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
    leafletInitialized = true;
  } catch (error) {
    console.warn('Leaflet icon initialization failed:', error);
  }
}

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
  const mapInitialized = useRef(false);

  useEffect(() => {
    if (!mapInitialized.current) {
      initializeLeafletIcons();
      mapInitialized.current = true;
    }
  }, []);

  // Defensive guards
  if (!ambulancePosition || ambulancePosition.length !== 2) {
    return (
      <div style={{ 
        width: '100%', 
        height: '500px', 
        borderRadius: '8px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'hsl(var(--muted))',
        color: 'hsl(var(--muted-foreground))'
      }}>
        <p>Map unavailable: Invalid ambulance position</p>
      </div>
    );
  }

  if (!hospitals || hospitals.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: '500px', 
        borderRadius: '8px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'hsl(var(--muted))',
        color: 'hsl(var(--muted-foreground))'
      }}>
        <p>Loading hospital data...</p>
      </div>
    );
  }

  const validHospitals = hospitals.filter(hospital => 
    hospital.position && 
    Array.isArray(hospital.position) && 
    hospital.position.length === 2
  );

  return (
    <div style={{ width: '100%', height: '500px', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={ambulancePosition}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
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

        {validHospitals.map((hospital) => (
          <Marker key={hospital.id} position={hospital.position}>
            <Popup>
              <div style={{ padding: '4px' }}>
                <strong>{hospital.name || 'Unknown Hospital'}</strong>
                <br />
                <small>Status: {hospital.canAccept ? 'Available' : 'Unavailable'}</small>
                {selectedHospitalId === hospital.id && (
                  <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>SELECTED</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {route && Array.isArray(route) && route.length > 1 && (
          <Polyline
            positions={route}
            pathOptions={{ color: '#3b82f6', weight: 4 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
