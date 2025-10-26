import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
  const mapInitialized = useRef(false);

  useEffect(() => {
    if (!mapInitialized.current) {
      initializeLeafletIcons();
      mapInitialized.current = true;
    }
  }, []);

  // Defensive guards
  if (!hospitalPosition || hospitalPosition.length !== 2) {
    return (
      <div style={{ 
        width: '100%', 
        height: '400px', 
        borderRadius: '8px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'hsl(var(--muted))',
        color: 'hsl(var(--muted-foreground))'
      }}>
        <p>Map unavailable: Invalid hospital position</p>
      </div>
    );
  }

  const validAmbulances = Array.isArray(ambulances) 
    ? ambulances.filter(ambulance => 
        ambulance.position && 
        Array.isArray(ambulance.position) && 
        ambulance.position.length === 2 &&
        ambulance.id &&
        ambulance.patientName
      )
    : [];

  return (
    <div style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={hospitalPosition}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
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

        {validAmbulances.map((ambulance) => (
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
