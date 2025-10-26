import { useEffect } from 'react';
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

// Fix for default marker icons in react-leaflet
const ambulanceIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNOCAyMGgyIi8+PHBhdGggZD0iTTE0IDIwaDIiLz48cGF0aCBkPSJNMTAgMTZoNCIvPjxwYXRoIGQ9Ik0xMyAyLjUgNS43MyA5Yy0uNS40LS43My45LS43MyAxLjV2Ni41YTIgMiAwIDAgMCAyIDJoMTJhMiAyIDAgMCAwIDItMnYtNi41YzAtLjYtLjIzLTEuMS0uNzMtMS41TDEzIDIuNWEyIDIgMCAwIDAtMiAwWiIvPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const hospitalIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxMGI5ODEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgNnYxMiIvPjxwYXRoIGQ9Ik02IDEyaDEyIi8+PHJlY3Qgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiB4PSIzIiB5PSIzIiByeD0iMiIvPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const selectedHospitalIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgNnYxMiIvPjxwYXRoIGQ9Ik02IDEyaDEyIi8+PHJlY3Qgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiB4PSIzIiB5PSIzIiByeD0iMiIvPjwvc3ZnPg==',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

export const RouteMap = ({ 
  ambulanceLocation, 
  hospitals, 
  selectedHospital,
  routeCoordinates 
}: RouteMapProps) => {
  // Calculate center and bounds
  const allPoints: L.LatLngTuple[] = [
    [ambulanceLocation.lat, ambulanceLocation.lng],
    ...hospitals.map(h => [h.coordinates.lat, h.coordinates.lng] as L.LatLngTuple),
  ];

  const bounds = L.latLngBounds(allPoints);
  const center = bounds.getCenter();

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border-2 border-ambulance-border shadow-xl">
      <MapContainer
        key={`${center.lat}-${center.lng}`}
        center={[center.lat, center.lng]}
        zoom={12}
        bounds={bounds}
        boundsOptions={{ padding: [50, 50] }}
        className="w-full h-full"
        style={{ background: '#1a1f2e' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <Marker 
          position={[ambulanceLocation.lat, ambulanceLocation.lng]} 
          icon={ambulanceIcon}
        >
          <Popup>
            <div className="text-center font-semibold">
              Ambulance Location
            </div>
          </Popup>
        </Marker>

        {hospitals.map((hospital) => (
          <Marker
            key={hospital.id}
            position={[hospital.coordinates.lat, hospital.coordinates.lng]}
            icon={selectedHospital?.id === hospital.id ? selectedHospitalIcon : hospitalIcon}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{hospital.name}</div>
                <div className="text-xs text-muted-foreground">{hospital.address}</div>
                <div className="text-xs">
                  <strong>Phone:</strong> {hospital.phone}
                </div>
                <div className="text-xs">
                  <strong>Status:</strong> {hospital.canAccept ? '✓ Can Accept' : '✗ Cannot Accept'}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates.map(coord => [coord[1], coord[0]] as L.LatLngTuple)}
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
