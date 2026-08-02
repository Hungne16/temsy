"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getMapStamps } from "@/lib/stampService";
import { useAuth } from "@/context/AuthContext";
import {
  X, ChevronLeft, MapPin, Calendar, Camera,
  Locate, Plus, Minus, BookOpen, Navigation,
  Route, Search, Landmark, UtensilsCrossed,
  Trees, Heart, Layers, ChevronDown, ChevronUp,
} from "lucide-react";
import Link from "next/link";

// ── Haversine ──────────────────────────────────────────────────────────────
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
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

// ── Stamp marker ───────────────────────────────────────────────────────────
function createStampMarker(imageUrl: string, count = 1) {
  const badge =
    count > 1
      ? `<div style="
          position:absolute;top:-8px;right:-8px;
          background:#ff4d4d;color:white;
          border-radius:999px;min-width:22px;height:22px;
          display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:800;
          border:2.5px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,.3);
          padding:0 4px;
          font-family:sans-serif;
         ">${count}</div>`
      : "";

  return new L.DivIcon({
    html: `
      <div style="position:relative;width:66px;height:70px;">
        <div style="
          width:62px;height:62px;
          background:white;
          padding:5px;
          box-shadow:3px 3px 0 rgba(45,45,45,.55), 0 4px 12px rgba(0,0,0,.18);
          -webkit-mask:
            radial-gradient(circle at 50% 0,    transparent 4.5px, #000 5px) 0    0/10px 6px repeat-x,
            radial-gradient(circle at 50% 100%, transparent 4.5px, #000 5px) 0 100%/10px 6px repeat-x,
            radial-gradient(circle at 0   50%,  transparent 4.5px, #000 5px) 0    0/6px 10px repeat-y,
            radial-gradient(circle at 100% 50%, transparent 4.5px, #000 5px) 100% 0/6px 10px repeat-y,
            linear-gradient(#000,#000) center/calc(100% - 12px) calc(100% - 12px) no-repeat;
          mask:
            radial-gradient(circle at 50% 0,    transparent 4.5px, #000 5px) 0    0/10px 6px repeat-x,
            radial-gradient(circle at 50% 100%, transparent 4.5px, #000 5px) 0 100%/10px 6px repeat-x,
            radial-gradient(circle at 0   50%,  transparent 4.5px, #000 5px) 0    0/6px 10px repeat-y,
            radial-gradient(circle at 100% 50%, transparent 4.5px, #000 5px) 100% 0/6px 10px repeat-y,
            linear-gradient(#000,#000) center/calc(100% - 12px) calc(100% - 12px) no-repeat;
        ">
          <img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;" />
        </div>
        <div style="
          position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);
          width:0;height:0;
          border-left:8px solid transparent;
          border-right:8px solid transparent;
          border-top:10px solid rgba(45,45,45,.55);
        "></div>
        ${badge}
      </div>`,
    className: "",
    iconSize: [66, 70],
    iconAnchor: [31, 70],
  });
}

const userIcon = new L.DivIcon({
  html: `
    <div style="position:relative;width:20px;height:20px;">
      <div style="width:20px;height:20px;background:#2d5da1;border-radius:50%;border:3px solid white;box-shadow:0 0 0 5px rgba(45,93,161,.2),0 2px 8px rgba(0,0,0,.3);"></div>
    </div>`,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ── Zoom controls ─────────────────────────────────────────────────────────
function ZoomLocate({ onLocate }: { onLocate: () => void }) {
  const map = useMap();
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[900] flex flex-col gap-2">
      <button onClick={onLocate}
        className="w-10 h-10 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all">
        <Locate size={17} className="text-gray-600" />
      </button>
      <button onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all text-gray-600 font-bold text-xl">
        <Plus size={17} />
      </button>
      <button onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all text-gray-600 font-bold text-xl">
        <Minus size={17} />
      </button>
    </div>
  );
}

function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 14, { animate: true, duration: 1.2 }); }, [center, map]);
  return null;
}

// ── Filters ──────────────────────────────────────────────────────────────
const FILTERS = [
  { id: "all",      label: "Tất cả",    icon: Layers },
  { id: "landmark", label: "Địa danh",  icon: Landmark },
  { id: "food",     label: "Ẩm thực",   icon: UtensilsCrossed },
  { id: "nature",   label: "Thiên nhiên",icon: Trees },
  { id: "liked",    label: "Yêu thích", icon: Heart },
];

// ── Main ──────────────────────────────────────────────────────────────────
export default function MapComponent() {
  const { user } = useAuth();
  const [position, setPosition] = useState<[number, number]>([10.762622, 106.660172]);
  const [hasLocation, setHasLocation]   = useState(false);
  const [stamps, setStamps]             = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showJourney, setShowJourney]   = useState(true);
  const [searchText, setSearchText]     = useState("");
  const [flyTarget, setFlyTarget]       = useState<[number, number] | null>(null);
  const [albumGroup, setAlbumGroup]     = useState<any[] | null>(null);
  const [detailStamp, setDetailStamp]   = useState<any | null>(null);
  const [statsOpen, setStatsOpen]       = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => { const c: [number,number] = [p.coords.latitude, p.coords.longitude]; setPosition(c); setFlyTarget(c); setHasLocation(true); },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    getMapStamps(user?.uid).then((f: any[]) => {
      setStamps(f.filter(s => s.metadata?.coordinates?.lat && s.metadata?.coordinates?.lng));
    });
  }, [user]);

  // Cluster
  const clusters = useMemo(() => {
    const result: { lat: number; lng: number; stamps: any[] }[] = [];
    for (const stamp of stamps) {
      const lat = stamp.metadata.coordinates.lat;
      const lng = stamp.metadata.coordinates.lng;
      const ex = result.find(c => haversineM(c.lat, c.lng, lat, lng) <= 300);
      if (ex) {
        ex.stamps.push(stamp);
        ex.lat = ex.stamps.reduce((s,st) => s + st.metadata.coordinates.lat, 0) / ex.stamps.length;
        ex.lng = ex.stamps.reduce((s,st) => s + st.metadata.coordinates.lng, 0) / ex.stamps.length;
      } else {
        result.push({ lat, lng, stamps: [stamp] });
      }
    }
    return result;
  }, [stamps]);

  // Journey path
  const journeyPath = useMemo((): [number,number][] =>
    [...stamps]
      .sort((a,b) => new Date(a.metadata.date).getTime() - new Date(b.metadata.date).getTime())
      .map(s => [s.metadata.coordinates.lat, s.metadata.coordinates.lng]),
    [stamps]);

  // Stats
  const stats = useMemo(() => {
    const cities = new Set(stamps.map(s => s.metadata?.location?.split(",")[0]?.trim()).filter(Boolean));
    return { total: stamps.length, cities: cities.size };
  }, [stamps]);

  const closeAll   = useCallback(() => { setAlbumGroup(null); setDetailStamp(null); }, []);
  const handleLocate = useCallback(() => { if (hasLocation) setFlyTarget([...position] as [number,number]); }, [hasLocation, position]);

  const panelOpen = albumGroup || detailStamp;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#f4f0e8] font-patrick">

      {/* ═══════════════════════════════ MAP (fullscreen) ═══════════════ */}
      <MapContainer
        center={position} zoom={13}
        style={{ position:"absolute", inset:0, zIndex:0 }}
        zoomControl={false} attributionControl={false}
      >
        <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />
        {flyTarget && <FlyTo center={flyTarget} />}
        {hasLocation && <Marker position={position} icon={userIcon} />}
        {showJourney && journeyPath.length > 1 && (
          <Polyline positions={journeyPath} pathOptions={{ color:"#ff4d4d", weight:2, dashArray:"10,7", opacity:0.65 }} />
        )}
        {clusters.map(cluster => (
          <Marker
            key={`${cluster.lat.toFixed(6)}-${cluster.lng.toFixed(6)}`}
            position={[cluster.lat, cluster.lng]}
            icon={createStampMarker(cluster.stamps[0].imageUrl, cluster.stamps.length)}
            eventHandlers={{ click: () => {
              if (cluster.stamps.length === 1) { setAlbumGroup(null); setDetailStamp(cluster.stamps[0]); }
              else { setDetailStamp(null); setAlbumGroup(cluster.stamps); }
            }}}
          />
        ))}
        <ZoomLocate onLocate={handleLocate} />
      </MapContainer>

      {/* ═══════════════════════════ FLOATING HEADER ══════════════════ */}
      <div className="absolute top-4 left-4 right-4 z-[800] flex flex-col gap-2 pointer-events-none">

        {/* Top row: title + bell */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Brand pill */}
          <div className="flex items-center gap-2.5 bg-white/92 backdrop-blur-xl rounded-2xl px-3.5 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,.12)] border border-white/60 flex-1">
            <div className="w-8 h-8 bg-marker-red rounded-xl flex items-center justify-center flex-shrink-0">
              <img src="/logo.png" className="w-5 h-5 object-contain" alt="Temsy" />
            </div>
            <div>
              <p className="font-kalam font-bold text-base leading-none text-pencil">Khám phá</p>
              <p className="text-[10px] text-pencil/45 leading-none mt-0.5">Dấu chân của bạn</p>
            </div>

            {/* Stats mini inline */}
            <div className="ml-auto flex items-center gap-3 text-right">
              <div className="text-center">
                <p className="font-kalam font-bold text-sm leading-none text-pencil">{stats.total}</p>
                <p className="text-[9px] text-pencil/45 leading-none">Tem</p>
              </div>
              <div className="w-px h-5 bg-pencil/10" />
              <div className="text-center">
                <p className="font-kalam font-bold text-sm leading-none text-pencil">{stats.cities}</p>
                <p className="text-[9px] text-pencil/45 leading-none">Nơi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="pointer-events-auto relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pencil/35 z-10" />
          <input
            type="text"
            placeholder="Tìm địa điểm..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-white/92 backdrop-blur-xl border border-white/60 rounded-2xl text-sm font-patrick text-pencil placeholder-pencil/35 focus:outline-none focus:ring-2 focus:ring-marker-red/25 shadow-[0_4px_20px_rgba(0,0,0,.1)] transition-all"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 pointer-events-auto" style={{scrollbarWidth:"none"}}>
          {FILTERS.map(f => {
            const Icon = f.icon;
            const active = activeFilter === f.id;
            return (
              <button key={f.id} onClick={() => setActiveFilter(f.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all backdrop-blur-xl shadow-sm ${
                  active
                    ? "bg-marker-red text-white border-marker-red shadow-[0_3px_12px_rgba(255,77,77,.35)]"
                    : "bg-white/88 text-pencil/70 border-white/50 hover:bg-white"
                }`}>
                <Icon size={12} />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════ JOURNEY button (bottom left) ═════════════════ */}
      <button
        onClick={() => setShowJourney(v => !v)}
        className={`absolute bottom-28 left-4 z-[800] flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border shadow-lg backdrop-blur-xl transition-all active:scale-95 ${
          showJourney
            ? "bg-white text-marker-red border-marker-red/30 shadow-[0_4px_16px_rgba(255,77,77,.2)]"
            : "bg-white/88 text-pencil/60 border-white/50"
        }`}
      >
        <Route size={15} />
        Hành trình
      </button>

      {/* ═══════════════ CAMERA FAB (bottom right) ════════════════════ */}
      <Link href="/create"
        className="absolute bottom-24 right-4 z-[800] w-14 h-14 bg-marker-red rounded-full flex items-center justify-center shadow-[0_6px_24px_rgba(255,77,77,.45)] hover:shadow-[0_8px_28px_rgba(255,77,77,.55)] active:scale-95 transition-all"
      >
        <Camera size={22} className="text-white" />
      </Link>

      {/* ═══════════════ DIM OVERLAY when panel open ══════════════════ */}
      {panelOpen && (
        <div className="absolute inset-0 bg-black/25 z-[1400] backdrop-blur-[1px]" onClick={closeAll} />
      )}

      {/* ═══════════ BOTTOM SHEET: Album (multiple stamps) ════════════ */}
      {albumGroup && !detailStamp && (
        <BottomSheet onClose={closeAll}>
          <div className="px-5 pb-2 flex items-start justify-between mb-1">
            <div>
              <h2 className="font-kalam font-bold text-lg text-pencil leading-tight">
                {albumGroup[0].metadata.location?.split(",")[0] || "Địa điểm này"}
              </h2>
              <p className="text-xs text-pencil/50">{albumGroup.length} kỷ niệm tại đây</p>
            </div>
            <button onClick={closeAll} className="w-7 h-7 rounded-full bg-muted-paper flex items-center justify-center ml-3 flex-shrink-0">
              <X size={14} className="text-pencil/60" />
            </button>
          </div>

          <div className="overflow-x-auto px-5 pb-6 pt-1 flex gap-3 filter-scrollbar snap-x">
            {albumGroup.map(stamp => (
              <button key={stamp.id} onClick={() => setDetailStamp(stamp)}
                className="flex-shrink-0 w-36 snap-start rounded-2xl overflow-hidden border border-pencil/10 bg-white shadow-md hover:-translate-y-1 transition-transform group"
              >
                <div className="h-28 overflow-hidden">
                  <img src={stamp.imageUrl} alt={stamp.metadata.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-pencil truncate">{stamp.metadata.title}</p>
                  <p className="text-[10px] text-pencil/45 mt-0.5">{stamp.metadata.date}</p>
                </div>
              </button>
            ))}
            <Link href="/create"
              className="flex-shrink-0 w-32 h-[calc(7rem+52px)] snap-start rounded-2xl border-2 border-dashed border-pencil/20 flex flex-col items-center justify-center gap-2 text-pencil/35 hover:border-marker-red hover:text-marker-red transition-colors"
            >
              <Plus size={24} strokeWidth={1.5} />
              <span className="text-xs font-bold text-center">Thêm tem</span>
            </Link>
          </div>
        </BottomSheet>
      )}

      {/* ═══════════ BOTTOM SHEET: Single stamp detail ════════════════ */}
      {detailStamp && (
        <BottomSheet onClose={closeAll}>
          <div className="px-5 pb-6">
            {/* Back + close */}
            {albumGroup && albumGroup.length > 1 && (
              <button onClick={() => setDetailStamp(null)}
                className="flex items-center gap-1.5 text-xs text-pencil/50 font-bold mb-3 hover:text-pencil transition-colors">
                <ChevronLeft size={14} /> Quay lại album
              </button>
            )}

            {/* Card */}
            <div className="flex gap-4 items-start relative">
              {/* Stamp frame */}
              <div className="w-[88px] h-[88px] flex-shrink-0 bg-white p-[5px] shadow-[3px_3px_0_rgba(45,45,45,.3)]"
                style={{
                  WebkitMask: stampMask,
                  mask: stampMask,
                }}
              >
                <img src={detailStamp.imageUrl} alt={detailStamp.metadata.title}
                  className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <h2 className="font-kalam font-bold text-xl text-pencil leading-tight truncate">
                  {detailStamp.metadata.title}
                </h2>
                {detailStamp.metadata.location && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={11} className="text-marker-red flex-shrink-0" />
                    <p className="text-xs text-pencil/55 truncate">{detailStamp.metadata.location}</p>
                  </div>
                )}
                {detailStamp.metadata.date && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Calendar size={11} className="text-marker-blue flex-shrink-0" />
                    <p className="text-xs text-pencil/55">{detailStamp.metadata.date}</p>
                  </div>
                )}
              </div>

              {/* Watermark */}
              <div className="absolute right-0 top-0 opacity-[0.05] pointer-events-none rotate-12">
                <img src="/logo.png" className="w-16 h-16 object-contain" />
              </div>

              <button onClick={closeAll} className="absolute -top-1 right-0 w-7 h-7 rounded-full bg-muted-paper flex items-center justify-center">
                <X size={13} className="text-pencil/60" />
              </button>
            </div>

            {/* Story */}
            {detailStamp.metadata.story && (
              <div className="mt-4 bg-[#fffcf0] border border-pencil/12 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <BookOpen size={10} className="text-pencil/40" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pencil/40">Câu chuyện</span>
                </div>
                <p className="text-sm text-pencil/75 italic leading-relaxed">
                  "{detailStamp.metadata.story}"
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  const { lat, lng } = detailStamp.metadata.coordinates || {};
                  if (lat && lng) window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-pencil/15 rounded-2xl text-sm font-bold text-pencil hover:bg-muted-paper transition-colors"
              >
                <Navigation size={15} />
                Chỉ đường
              </button>
              <Link href="/collection"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-marker-red text-white rounded-2xl text-sm font-bold shadow-[0_4px_14px_rgba(255,77,77,.4)] hover:opacity-90 transition-opacity"
              >
                <Layers size={15} />
                Bộ sưu tập
              </Link>
            </div>
          </div>
        </BottomSheet>
      )}

      <style>{`
        @keyframes slideUp { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
        .leaflet-container { font-family:inherit; }
        .leaflet-control-attribution { display:none!important; }
        .leaflet-popup { display:none!important; }
        .filter-scrollbar::-webkit-scrollbar { display:none; }
        .filter-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>
    </div>
  );
}

// ── Stamp perforated mask ──────────────────────────────────────────────────
const stampMask =
  "radial-gradient(circle at 50% 0,    transparent 4.5px, #000 5px) 0 0/10px 6px repeat-x," +
  "radial-gradient(circle at 50% 100%, transparent 4.5px, #000 5px) 0 100%/10px 6px repeat-x," +
  "radial-gradient(circle at 0 50%,    transparent 4.5px, #000 5px) 0 0/6px 10px repeat-y," +
  "radial-gradient(circle at 100% 50%, transparent 4.5px, #000 5px) 100% 0/6px 10px repeat-y," +
  "linear-gradient(#000,#000) center/calc(100% - 12px) calc(100% - 12px) no-repeat";

// ── Reusable bottom sheet wrapper ─────────────────────────────────────────
function BottomSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-[1500] bg-white rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,.18)] pt-3"
      style={{ animation: "slideUp 0.28s cubic-bezier(.32,1,.36,1)" }}
      onClick={e => e.stopPropagation()}
    >
      {/* Drag handle */}
      <div className="flex justify-center mb-3">
        <div className="w-9 h-1 bg-pencil/15 rounded-full" />
      </div>
      {children}
    </div>
  );
}
