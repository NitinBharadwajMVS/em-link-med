import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Alert } from '@/types/patient';
import { Badge } from '@/components/ui/badge';
import 'leaflet/dist/leaflet.css';

interface AlertMapProps {
  alerts: Alert[];
  hospitalLocation: { lat: number; lng: number };
}

// Simple colored circle markers
const createMarker = (color: string, size: number) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const criticalIcon = createMarker('#dc2626', 32);
const urgentIcon = createMarker('#f59e0b', 28);
const stableIcon = createMarker('#10b981', 24);
const hospitalIcon = createMarker('#3b82f6', 40);

function getIconForTriage(triage: string): L.DivIcon {
  switch (triage) {
    case 'critical':
      return criticalIcon;
    case 'urgent':
      return urgentIcon;
    case 'stable':
      return stableIcon;
    default:
      return stableIcon;
  }
}

export const AlertMap: React.FC<AlertMapProps> = ({ alerts, hospitalLocation }) => {
  const alertsWithLocation = alerts.filter(alert => alert.ambulanceLocation);

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border-2 border-border shadow-lg">
      <MapContainer
        center={[hospitalLocation.lat, hospitalLocation.lng]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker 
          position={[hospitalLocation.lat, hospitalLocation.lng]} 
          icon={hospitalIcon}
        >
          <Popup>
            <strong>Your Hospital</strong>
          </Popup>
        </Marker>

        {alertsWithLocation.map((alert) => (
          <Marker
            key={alert.id}
            position={[alert.ambulanceLocation!.lat, alert.ambulanceLocation!.lng]}
            icon={getIconForTriage(alert.patient.triageLevel)}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>{alert.ambulanceId}</strong>
                  <Badge
                    variant={
                      alert.patient.triageLevel === 'critical'
                        ? 'destructive'
                        : alert.patient.triageLevel === 'urgent'
                        ? 'default'
                        : 'secondary'
                    }
                    style={{ marginLeft: '8px' }}
                  >
                    {alert.patient.triageLevel}
                  </Badge>
                </div>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                  <strong>Patient:</strong> {alert.patient.name}
                </div>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                  <strong>Age:</strong> {alert.patient.age}
                </div>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                  <strong>ETA:</strong> {alert.eta} min
                </div>
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                  <strong>Complaint:</strong> {alert.patient.complaint}
                </div>
                <div style={{ fontSize: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                  <div><strong>SpO2:</strong> {alert.patient.vitals.spo2}%</div>
                  <div><strong>HR:</strong> {alert.patient.vitals.heartRate} bpm</div>
                  <div><strong>BP:</strong> {alert.patient.vitals.bloodPressureSys}/{alert.patient.vitals.bloodPressureDia}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
