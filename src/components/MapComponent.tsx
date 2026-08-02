"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon issue in React
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
}

export default function MapComponent() {
  // Default to a central location (e.g., Ho Chi Minh City or Hanoi)
  const [position, setPosition] = useState<[number, number]>([10.762622, 106.660172]);
  const [hasLocation, setHasLocation] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setHasLocation(true);
        },
        (err) => {
          console.error(err);
          setErrorMsg("Không thể lấy vị trí hiện tại. Vui lòng cấp quyền định vị.");
        }
      );
    } else {
      setErrorMsg("Trình duyệt của bạn không hỗ trợ định vị GPS.");
    }
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-120px)] rounded-3xl overflow-hidden shadow-2xl">
      {errorMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg whitespace-nowrap">
          {errorMsg}
        </div>
      )}
      
      {!hasLocation && !errorMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-pastel-blue-dark text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
          Đang lấy vị trí của bạn...
        </div>
      )}

      <MapContainer 
        center={position} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasLocation && (
          <>
            <Marker position={position} icon={customIcon}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-gray-800">Bạn đang ở đây</p>
                  <p className="text-xs text-gray-500">Sẵn sàng để dán tem chưa?</p>
                </div>
              </Popup>
            </Marker>
            <MapFlyTo center={position} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
