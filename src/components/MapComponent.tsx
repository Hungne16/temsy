"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getMapStamps } from "@/lib/stampService";
import { useAuth } from "@/context/AuthContext";
import { X, ChevronLeft, MapPin, Calendar, BookOpen, Lock, Globe, Plus } from "lucide-react";
import Link from "next/link";

// ── Icons ──────────────────────────────────────────────────────────────────

const userIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const createStampIcon = (imageUrl: string, count = 1) =>
  new L.DivIcon({
    html: `
      <div style="position:relative;width:52px;height:52px;">
        <div style="
          width:48px;height:48px;
          border:3px solid #2d2d2d;
          border-radius:4px 12px 4px 12px / 12px 4px 12px 4px;
          overflow:hidden;
          box-shadow:3px 3px 0 #2d2d2d;
          background:#fdfbf7;
        ">
          <img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        ${
          count > 1
            ? `<div style="
                position:absolute;top:-6px;right:-6px;
                background:#ff4d4d;color:white;
                border-radius:50%;width:20px;height:20px;
                display:flex;align-items:center;justify-content:center;
                font-size:10px;font-weight:bold;
                border:2px solid white;
                box-shadow:0 1px 3px rgba(0,0,0,.3);
              ">${count}</div>`
            : ""
        }
      </div>`,
    className: "",
    iconSize: [52, 52],
    iconAnchor: [24, 48],
    popupAnchor: [0, -52],
  });

// ── Map helpers ──────────────────────────────────────────────────────────────

function MapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function MapComponent() {
  const { user } = useAuth();
  const [position, setPosition] = useState<[number, number]>([10.762622, 106.660172]);
  const [hasLocation, setHasLocation] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [stamps, setStamps] = useState<any[]>([]);

  // Panel state
  const [albumGroup, setAlbumGroup] = useState<any[] | null>(null); // list of stamps at a location
  const [detailStamp, setDetailStamp] = useState<any | null>(null);  // single stamp detail

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setHasLocation(true);
        },
        (err) => {
          console.error(err);
          setErrorMsg("Không thể lấy vị trí. Hãy cấp quyền định vị.");
        }
      );
    }
  }, []);

  useEffect(() => {
    getMapStamps(user?.uid).then((fetched) => {
      const valid = fetched.filter(
        (s: any) => s.metadata?.coordinates?.lat && s.metadata?.coordinates?.lng
      );
      setStamps(valid);
    });
  }, [user]);

  // ── Distance-based clustering (Haversine, radius ~300m) ─────────────────
  // Gom mọi tem (kể cả của nhiều người) trong vòng 300m vào 1 cụm
  const clusterRadius = 300; // metres

  function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const clusters: { lat: number; lng: number; stamps: any[] }[] = [];
  for (const stamp of stamps) {
    const lat = stamp.metadata.coordinates.lat;
    const lng = stamp.metadata.coordinates.lng;
    const existing = clusters.find(
      (c) => haversineMetres(c.lat, c.lng, lat, lng) <= clusterRadius
    );
    if (existing) {
      existing.stamps.push(stamp);
      // Cập nhật tâm cụm = trung bình toạ độ để không bị lệch
      existing.lat = existing.stamps.reduce((s, st) => s + st.metadata.coordinates.lat, 0) / existing.stamps.length;
      existing.lng = existing.stamps.reduce((s, st) => s + st.metadata.coordinates.lng, 0) / existing.stamps.length;
    } else {
      clusters.push({ lat, lng, stamps: [stamp] });
    }
  }


  const closeAll = useCallback(() => {
    setAlbumGroup(null);
    setDetailStamp(null);
  }, []);

  const openAlbum = useCallback((group: any[]) => {
    setDetailStamp(null);
    setAlbumGroup(group);
  }, []);

  const openDetail = useCallback((stamp: any) => {
    setDetailStamp(stamp);
  }, []);

  const backToAlbum = useCallback(() => {
    setDetailStamp(null);
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-xl z-0" style={{ height: "calc(100dvh - 80px)" }}>

      {/* Status toasts */}
      {errorMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg">
          {errorMsg}
        </div>
      )}
      {!hasLocation && !errorMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm text-pencil px-4 py-2 rounded-xl text-sm font-patrick font-bold shadow-lg flex items-center gap-2 border-2 border-pencil/20">
          <div className="w-4 h-4 border-2 border-pencil/40 border-t-pencil rounded-full animate-spin" />
          Đang lấy vị trí của bạn...
        </div>
      )}

      {/* Map */}
      <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
        <TileLayer attribution="&copy; Google Maps" url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />

        {/* Current location marker */}
        {hasLocation && (
          <>
            <Marker position={position} icon={userIcon} />
            <MapFlyTo center={position} />
          </>
        )}

        {/* Stamp cluster markers */}
        {clusters.map((cluster) => {
          const first = cluster.stamps[0];
          const pos: [number, number] = [cluster.lat, cluster.lng];
          const icon = createStampIcon(first.imageUrl, cluster.stamps.length);

          return (
            <Marker
              key={`${cluster.lat.toFixed(6)}-${cluster.lng.toFixed(6)}`}
              position={pos}
              icon={icon}
              eventHandlers={{ click: () => openAlbum(cluster.stamps) }}
            />
          );
        })}
      </MapContainer>

      {/* ── ALBUM PANEL (list of stamps at a location) ── */}
      {albumGroup && !detailStamp && (
        <div
          className="absolute inset-y-0 right-0 w-full sm:w-[360px] bg-paper shadow-2xl z-[2000] flex flex-col border-l-2 border-pencil/20"
          style={{ animation: "slideInRight 0.25s ease" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b-2 border-pencil/10">
            <div>
              <h2 className="font-kalam font-bold text-xl text-pencil">
                📍 {albumGroup[0].metadata.location || "Địa điểm này"}
              </h2>
              <p className="text-sm font-patrick text-pencil/60 mt-0.5">
                {albumGroup.length} kỷ niệm được lưu tại đây
              </p>
            </div>
            <button
              onClick={closeAll}
              className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-pencil/20 hover:bg-muted-paper transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stamp Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-3">
              {albumGroup.map((stamp) => (
                <button
                  key={stamp.id}
                  onClick={() => openDetail(stamp)}
                  className="group relative rounded-xl overflow-hidden border-2 border-pencil/20 bg-white shadow-[2px_2px_0_0_rgba(45,45,45,0.15)] hover:shadow-[3px_3px_0_0_#2d2d2d] hover:-translate-y-0.5 transition-all text-left"
                >
                  {/* Stamp image */}
                  <div className="aspect-square w-full overflow-hidden bg-muted-paper">
                    <img
                      src={stamp.imageUrl}
                      alt={stamp.metadata.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {/* Info */}
                  <div className="p-2.5">
                    <p className="font-patrick font-bold text-sm text-pencil truncate">{stamp.metadata.title}</p>
                    <p className="font-patrick text-xs text-pencil/50 mt-0.5 truncate">{stamp.metadata.date}</p>
                  </div>
                  {/* Privacy badge */}
                  <div className="absolute top-2 right-2">
                    {stamp.isPublic === false ? (
                      <span className="bg-white/80 backdrop-blur-sm rounded-full p-1 flex"><Lock size={10} className="text-pencil/60" /></span>
                    ) : (
                      <span className="bg-white/80 backdrop-blur-sm rounded-full p-1 flex"><Globe size={10} className="text-marker-blue" /></span>
                    )}
                  </div>
                </button>
              ))}

              {/* Add new stamp CTA */}
              <Link
                href="/create"
                className="aspect-square rounded-xl border-[3px] border-dashed border-pencil/30 flex flex-col items-center justify-center gap-2 text-pencil/40 hover:text-pencil/70 hover:border-pencil/50 hover:bg-muted-paper/50 transition-all"
              >
                <Plus size={28} strokeWidth={1.5} />
                <span className="font-patrick text-xs font-bold text-center px-2">Thêm tem vào đây</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL PANEL (single stamp) ── */}
      {detailStamp && (
        <div
          className="absolute inset-y-0 right-0 w-full sm:w-[360px] bg-paper shadow-2xl z-[2000] flex flex-col border-l-2 border-pencil/20"
          style={{ animation: "slideInRight 0.2s ease" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b-2 border-pencil/10">
            {albumGroup && albumGroup.length > 1 && (
              <button
                onClick={backToAlbum}
                className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-pencil/20 hover:bg-muted-paper transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h2 className="font-kalam font-bold text-lg text-pencil flex-1 truncate">Chi tiết tem</h2>
            <button
              onClick={closeAll}
              className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-pencil/20 hover:bg-muted-paper transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Big stamp image */}
            <div className="w-full aspect-[4/3] overflow-hidden bg-muted-paper">
              <img
                src={detailStamp.imageUrl}
                alt={detailStamp.metadata.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-5 space-y-4">
              {/* Title & privacy */}
              <div className="flex items-start justify-between gap-2">
                <h1 className="font-kalam font-bold text-2xl text-pencil leading-tight">{detailStamp.metadata.title}</h1>
                {detailStamp.isPublic === false ? (
                  <span className="flex items-center gap-1 text-xs font-patrick font-bold text-pencil/50 border border-pencil/20 rounded-full px-2 py-0.5 shrink-0">
                    <Lock size={10} /> Riêng tư
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-patrick font-bold text-marker-blue border border-marker-blue/20 rounded-full px-2 py-0.5 shrink-0">
                    <Globe size={10} /> Công khai
                  </span>
                )}
              </div>

              {/* Meta */}
              <div className="flex flex-col gap-1.5">
                {detailStamp.metadata.location && (
                  <div className="flex items-center gap-2 text-sm font-patrick text-pencil/70">
                    <MapPin size={14} className="shrink-0 text-marker-red" />
                    <span>{detailStamp.metadata.location}</span>
                  </div>
                )}
                {detailStamp.metadata.date && (
                  <div className="flex items-center gap-2 text-sm font-patrick text-pencil/70">
                    <Calendar size={14} className="shrink-0 text-marker-blue" />
                    <span>{detailStamp.metadata.date}</span>
                  </div>
                )}
              </div>

              {/* Story */}
              {detailStamp.metadata.story && (
                <div className="bg-postit border-2 border-pencil/20 rounded-xl p-4 -rotate-[0.5deg]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen size={12} className="text-pencil/60" />
                    <span className="text-xs font-patrick font-bold text-pencil/60 uppercase tracking-wider">Câu chuyện</span>
                  </div>
                  <p className="font-patrick text-sm text-pencil/80 leading-relaxed italic">
                    &quot;{detailStamp.metadata.story}&quot;
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Link
                  href="/create"
                  className="flex-1 py-3 text-center font-patrick font-bold text-sm border-2 border-pencil rounded-xl bg-white hover:bg-muted-paper transition-colors shadow-[2px_2px_0_0_#2d2d2d]"
                >
                  + Thêm tem địa điểm này
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close panel on mobile */}
      {(albumGroup || detailStamp) && (
        <div
          className="absolute inset-0 bg-black/20 z-[1999] sm:hidden"
          onClick={closeAll}
        />
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .leaflet-popup { display: none !important; }
        .leaflet-marker-icon { cursor: pointer !important; }
      `}</style>
    </div>
  );
}
