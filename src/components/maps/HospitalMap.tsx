import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Alert } from '@/types/patient';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface HospitalMapProps {
  hospitalPosition: { lat: number; lng: number };
  alerts: Alert[];
}

export function HospitalMap({ hospitalPosition, alerts }: HospitalMapProps) {
  const mapRef = useRef<L.Map>(null);

  const hospitalIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const getAmbulanceIcon = (triageLevel: string) => {
    const colorMap: Record<string, string> = {
      critical: 'red',
      urgent: 'orange',
      stable: 'blue',
    };
    const color = colorMap[triageLevel] || 'grey';
    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  };

  if (!hospitalPosition.lat || !hospitalPosition.lng) {
    return (
      <div className="h-full flex items-center justify-center bg-muted text-muted-foreground">
        Hospital location not available
      </div>
    );
  }

  return (
    <MapContainer
      center={[hospitalPosition.lat, hospitalPosition.lng]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Hospital marker */}
      <Marker position={[hospitalPosition.lat, hospitalPosition.lng]} icon={hospitalIcon}>
        <Popup>
          <div className="font-semibold">Your Hospital</div>
        </Popup>
      </Marker>

      {/* Ambulance markers */}
      {alerts.map((alert) => {
        if (!alert.ambulancePosition) return null;
        
        return (
          <Marker
            key={alert.id}
            position={[alert.ambulancePosition.lat, alert.ambulancePosition.lng]}
            icon={getAmbulanceIcon(alert.patient.triageLevel)}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{alert.ambulanceId}</div>
                <div className="text-sm">Patient: {alert.patient.name}</div>
                <div className="text-sm">ETA: {alert.eta} min</div>
                <div className="text-xs capitalize">{alert.patient.triageLevel}</div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Route polylines */}
      {alerts.map((alert) => {
        if (!alert.route || !alert.ambulancePosition || alert.route.length === 0) return null;
        
        return (
          <Polyline
            key={`route-${alert.id}`}
            positions={alert.route.map(coord => [coord[1], coord[0]] as [number, number])}
            color={
              alert.patient.triageLevel === 'critical' ? '#ef4444' :
              alert.patient.triageLevel === 'urgent' ? '#f97316' :
              '#3b82f6'
            }
            weight={3}
            opacity={0.6}
          />
        );
      })}
    </MapContainer>
  );
}
