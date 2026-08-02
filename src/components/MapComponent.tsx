"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getMapStamps } from "@/lib/stampService";
import { useAuth } from "@/context/AuthContext";
import { Lock, Globe } from "lucide-react";

// Marker gốc (Bạn đang ở đây)
const userIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Marker cho các tem (Tùy chỉnh có màu khác hoặc thiết kế khác nếu rảnh, hiện tại dùng chung hoặc icon khác)
const stampIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
}

export default function MapComponent() {
  const { user } = useAuth();
  
  // Default to a central location (e.g., Ho Chi Minh City or Hanoi)
  const [position, setPosition] = useState<[number, number]>([10.762622, 106.660172]);
  const [hasLocation, setHasLocation] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [stamps, setStamps] = useState<any[]>([]);

  useEffect(() => {
    // Lấy vị trí
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

  useEffect(() => {
    // Lấy danh sách tem để ghim lên bản đồ
    getMapStamps(user?.uid).then((fetchedStamps) => {
      // Chỉ giữ lại những tem có tọa độ
      const validStamps = fetchedStamps.filter(s => s.metadata?.coordinates?.lat && s.metadata?.coordinates?.lng);
      setStamps(validStamps);
    });
  }, [user]);

  return (
    <div className="relative w-full h-[calc(100vh-120px)] rounded-3xl overflow-hidden shadow-2xl z-0">
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
        {/* Bản đồ Google Maps Standard (Đường phố) - Xử lý chủ quyền VN tốt */}
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />
        
        {hasLocation && (
          <>
            <Marker position={position} icon={userIcon}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-gray-800">Bạn đang ở đây</p>
                  <p className="text-xs text-gray-500">Hãy tạo tem để lưu kỷ niệm nào!</p>
                </div>
              </Popup>
            </Marker>
            <MapFlyTo center={position} />
          </>
        )}

        {/* Ghim tất cả các tem */}
        {stamps.map(stamp => (
          <Marker 
            key={stamp.id} 
            position={[stamp.metadata.coordinates.lat, stamp.metadata.coordinates.lng]} 
            icon={stampIcon}
          >
            <Popup className="custom-popup">
              <a 
                href={`/stamp/${stamp.id}`}
                className="flex flex-col w-48 rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity block"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <img 
                  src={stamp.imageUrl} 
                  alt={stamp.metadata.title} 
                  className="w-full h-32 object-cover bg-gray-100" 
                />
                <div className="p-3 bg-white">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{stamp.metadata.title}</h3>
                    {stamp.isPublic === false ? (
                      <span title="Riêng tư"><Lock size={12} className="text-gray-400 shrink-0" /></span>
                    ) : (
                      <span title="Công khai"><Globe size={12} className="text-pastel-blue shrink-0" /></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{stamp.metadata.date} • {stamp.metadata.location}</p>
                  
                  {stamp.metadata.story && (
                    <div className="mt-2 text-xs italic text-gray-700 border-l-2 border-pastel-blue pl-2 py-1 bg-gray-50 rounded-r-md truncate">
                      "{stamp.metadata.story}"
                    </div>
                  )}
                  
                  <div className="mt-2 text-[10px] text-pastel-blue font-medium text-center">Bấm để xem chi tiết</div>
                </div>
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <style jsx global>{`
        /* Fix leaflet popup padding */
        .leaflet-popup-content-wrapper {
          padding: 0;
          overflow: hidden;
          border-radius: 12px;
        }
        .leaflet-popup-content {
          margin: 0;
          width: 100% !important;
        }
        /* Custom font and close button */
        .custom-popup {
          font-family: var(--font-sans), Arial, sans-serif !important;
        }
        .leaflet-popup-close-button {
          background: rgba(255, 255, 255, 0.8) !important;
          border-radius: 50% !important;
          width: 22px !important;
          height: 22px !important;
          line-height: 22px !important;
          top: 8px !important;
          right: 8px !important;
          color: #333 !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-decoration: none !important;
        }
        .leaflet-popup-close-button:hover {
          background: white !important;
          color: black !important;
        }
      `}</style>
    </div>
  );
}
