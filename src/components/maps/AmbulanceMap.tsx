import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HospitalWithRoute, Coordinates } from '@/services/geoapifyRouting';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AmbulanceMapProps {
  ambulancePosition: Coordinates;
  hospitals: HospitalWithRoute[];
  selectedHospital: HospitalWithRoute | null;
  onHospitalSelect: (hospital: HospitalWithRoute) => void;
}

function MapUpdater({ center }: { center: Coordinates }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center, map]);
  return null;
}

export function AmbulanceMap({
  ambulancePosition,
  hospitals,
  selectedHospital,
  onHospitalSelect,
}: AmbulanceMapProps) {
  const mapRef = useRef<L.Map>(null);

  const ambulanceIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const createNumberedIcon = (number: number, isSelected: boolean) => {
    const color = isSelected ? '#22c55e' : '#3b82f6';
    return new L.DivIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">${number}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  if (!ambulancePosition.lat || !ambulancePosition.lng) {
    return (
      <div className="h-full flex items-center justify-center bg-muted text-muted-foreground">
        Waiting for ambulance location...
      </div>
    );
  }

  return (
    <MapContainer
      center={[ambulancePosition.lat, ambulancePosition.lng]}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <MapUpdater center={ambulancePosition} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Ambulance marker */}
      <Marker position={[ambulancePosition.lat, ambulancePosition.lng]} icon={ambulanceIcon}>
        <Popup>
          <div className="font-semibold">Your Location</div>
        </Popup>
      </Marker>

      {/* Hospital markers */}
      {hospitals.map((hospital, index) => (
        <Marker
          key={hospital.id}
          position={[hospital.coordinates.lat, hospital.coordinates.lng]}
          icon={createNumberedIcon(index + 1, selectedHospital?.id === hospital.id)}
          eventHandlers={{
            click: () => onHospitalSelect(hospital),
          }}
        >
          <Popup>
            <div className="space-y-1">
              <div className="font-semibold">{hospital.name}</div>
              <div className="text-sm">ETA: {hospital.eta} min</div>
              <div className="text-sm">Distance: {(hospital.distance / 1000).toFixed(1)} km</div>
              <div className="text-xs text-muted-foreground">{hospital.contact}</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Route polyline */}
      {selectedHospital?.route && selectedHospital.route.coordinates.length > 0 && (
        <Polyline
          positions={selectedHospital.route.coordinates.map(coord => [coord[1], coord[0]] as [number, number])}
          color="#22c55e"
          weight={4}
          opacity={0.7}
        />
      )}
    </MapContainer>
  );
}
