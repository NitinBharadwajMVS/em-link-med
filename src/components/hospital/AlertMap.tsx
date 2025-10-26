import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Alert } from '@/types/patient';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

interface AlertMapProps {
  alerts: Alert[];
  hospitalLocation: { lat: number; lng: number };
}

const criticalIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZGMzNTQ1IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTggMjBoMiIvPjxwYXRoIGQ9Ik0xNCAyMGgyIi8+PHBhdGggZD0iTTEwIDE2aDQiLz48cGF0aCBkPSJNMTMgMi41IDUuNzMgOWMtLjUuNC0uNzMuOS0uNzMgMS41djYuNWEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJ2LTYuNWMwLS42LS4yMy0xLjEtLjczLTEuNUwxMyAyLjVhMiAyIDAgMCAwLTIgMFoiLz48L3N2Zz4=',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const urgentIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZjU5ZTBiIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTggMjBoMiIvPjxwYXRoIGQ9Ik0xNCAyMGgyIi8+PHBhdGggZD0iTTEwIDE2aDQiLz48cGF0aCBkPSJNMTMgMi41IDUuNzMgOWMtLjUuNC0uNzMuOS0uNzMgMS41djYuNWEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJ2LTYuNWMwLS42LS4yMy0xLjEtLjczLTEuNUwxMyAyLjVhMiAyIDAgMCAwLTIgMFoiLz48L3N2Zz4=',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const stableIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjMTBiOTgxIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTggMjBoMiIvPjxwYXRoIGQ9Ik0xNCAyMGgyIi8+PHBhdGggZD0iTTEwIDE2aDQiLz48cGF0aCBkPSJNMTMgMi41IDUuNzMgOWMtLjUuNC0uNzMuOS0uNzMgMS41djYuNWEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJ2LTYuNWMwLS42LS4yMy0xLjEtLjczLTEuNUwxMyAyLjVhMiAyIDAgMCAwLTIgMFoiLz48L3N2Zz4=',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const hospitalIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjM2I4MmY2IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTEyIDZ2MTIiLz48cGF0aCBkPSJNNiAxMmgxMiIvPjxyZWN0IHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgeD0iMyIgeT0iMyIgcng9IjIiLz48L3N2Zz4=',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

function getIconForTriage(triage: string): L.Icon {
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

function MapController({ center }: { center: L.LatLngTuple }) {
  const map = useMap();
  
  useEffect(() => {
    if (map && center) {
      map.setView(center, 12);
    }
  }, [map, center]);

  return null;
}

export const AlertMap = ({ alerts, hospitalLocation }: AlertMapProps) => {
  const alertsWithLocation = alerts.filter(alert => alert.ambulanceLocation);

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border-2 border-border shadow-lg">
      <MapContainer
        center={[hospitalLocation.lat, hospitalLocation.lng] as L.LatLngTuple}
        zoom={12}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        <MapController center={[hospitalLocation.lat, hospitalLocation.lng]} />

        <Marker position={[hospitalLocation.lat, hospitalLocation.lng] as L.LatLngTuple} icon={hospitalIcon as any}>
          <Popup>
            <div className="text-center font-semibold">
              Your Hospital
            </div>
          </Popup>
        </Marker>

        {alertsWithLocation.map((alert) => (
          <Marker
            key={alert.id}
            position={[alert.ambulanceLocation!.lat, alert.ambulanceLocation!.lng] as L.LatLngTuple}
            icon={getIconForTriage(alert.patient.triageLevel) as any}
          >
            <Popup>
              <div className="space-y-2 min-w-[200px]">
                <div className="font-semibold flex items-center gap-2">
                  {alert.ambulanceId}
                  <Badge
                    variant={
                      alert.patient.triageLevel === 'critical'
                        ? 'destructive'
                        : alert.patient.triageLevel === 'urgent'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {alert.patient.triageLevel}
                  </Badge>
                </div>
                <div className="text-sm space-y-1">
                  <div><strong>Patient:</strong> {alert.patient.name}</div>
                  <div><strong>Age:</strong> {alert.patient.age}</div>
                  <div><strong>ETA:</strong> {alert.eta} min</div>
                  <div><strong>Complaint:</strong> {alert.patient.complaint}</div>
                </div>
                <div className="text-xs space-y-1 border-t pt-2">
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
