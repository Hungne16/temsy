"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix cho icon marker của Leaflet trong Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationPickerMapProps {
  initialPosition?: { lat: number; lng: number };
  searchedPosition?: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], map.getZoom() > 13 ? map.getZoom() : 15);
    }
  }, [position, map]);
  return null;
}

export default function LocationPickerMap({ initialPosition, searchedPosition, onLocationSelect }: LocationPickerMapProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialPosition || null
  );

  useEffect(() => {
    if (searchedPosition) {
      setTimeout(() => setPosition(searchedPosition), 0);
    }
  }, [searchedPosition]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition({ lat, lng });
    onLocationSelect(lat, lng);
  };

  return (
    <div className="w-full h-[400px] rounded-sm overflow-hidden relative z-0 border-[3px] border-pencil wobbly-border shadow-[2px_2px_0px_0px_#2d2d2d] bg-white -rotate-1">
      <MapContainer
        center={position ? [position.lat, position.lng] : [21.0285, 105.8542]}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />
        <MapEvents onLocationSelect={handleLocationSelect} />
        <MapUpdater position={position} />
        {position && <Marker position={[position.lat, position.lng]} />}
      </MapContainer>
    </div>
  );
}
