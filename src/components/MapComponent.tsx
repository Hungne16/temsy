"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  X,
  ChevronLeft,
  MapPin,
  Calendar,
  Camera,
  Locate,
  Plus,
  Minus,
  BookOpen,
  Navigation,
  Route,
  Search,
  Bell,
  Landmark,
  UtensilsCrossed,
  Trees,
  Heart,
  Layers,
} from "lucide-react";
import Link from "next/link";

// ── Haversine ───────────────────────────────────────────────────────────────
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

// ── Stamp marker DivIcon ─────────────────────────────────────────────────────
function createStampMarker(imageUrl: string, count = 1, liked = false) {
  const heartDot = liked
    ? `<div style="position:absolute;top:-5px;right:-5px;width:18px;height:18px;background:#ff4d4d;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:9px;box-shadow:0 1px 3px rgba(0,0,0,.3);">❤</div>`
    : "";
  const countBadge =
    count > 1
      ? `<div style="position:absolute;top:-5px;left:-5px;min-width:20px;height:20px;background:#ff4d4d;border-radius:10px;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:white;padding:0 3px;box-shadow:0 1px 3px rgba(0,0,0,.3);">${count}</div>`
      : "";

  return new L.DivIcon({
    html: `
      <div style="position:relative;width:64px;height:68px;cursor:pointer;">
        <div style="
          width:60px;height:60px;
          background:white;
          padding:4px;
          box-shadow:3px 3px 0 rgba(45,45,45,0.7);
          -webkit-mask:
            radial-gradient(circle at 50% 0, transparent 4px, #000 4.5px)   0   0/10px 5px repeat-x,
            radial-gradient(circle at 50% 100%, transparent 4px, #000 4.5px) 0 100%/10px 5px repeat-x,
            radial-gradient(circle at 0 50%,   transparent 4px, #000 4.5px) 0   0/5px 10px repeat-y,
            radial-gradient(circle at 100% 50%, transparent 4px, #000 4.5px) 100% 0/5px 10px repeat-y,
            linear-gradient(#000,#000) center/calc(100% - 10px) calc(100% - 10px) no-repeat;
          mask:
            radial-gradient(circle at 50% 0, transparent 4px, #000 4.5px)   0   0/10px 5px repeat-x,
            radial-gradient(circle at 50% 100%, transparent 4px, #000 4.5px) 0 100%/10px 5px repeat-x,
            radial-gradient(circle at 0 50%,   transparent 4px, #000 4.5px) 0   0/5px 10px repeat-y,
            radial-gradient(circle at 100% 50%, transparent 4px, #000 4.5px) 100% 0/5px 10px repeat-y,
            linear-gradient(#000,#000) center/calc(100% - 10px) calc(100% - 10px) no-repeat;
        ">
          <img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        ${heartDot}
        ${countBadge}
      </div>`,
    className: "",
    iconSize: [64, 68],
    iconAnchor: [30, 60],
  });
}

// ── User location icon ────────────────────────────────────────────────────────
const userIcon = new L.DivIcon({
  html: `<div style="width:16px;height:16px;background:#2d5da1;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(45,93,161,.25),0 2px 6px rgba(0,0,0,.3);"></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// ── Map controls ──────────────────────────────────────────────────────────────
function MapControls({ onLocate }: { onLocate: () => void }) {
  const map = useMap();
  return (
    <div className="absolute right-4 bottom-48 z-[1000] flex flex-col gap-2">
      <button
        onClick={onLocate}
        className="w-11 h-11 bg-white border-2 border-pencil/20 rounded-2xl shadow-md flex items-center justify-center hover:bg-muted-paper transition-colors"
      >
        <Locate size={18} className="text-pencil/70" />
      </button>
      <button
        onClick={() => map.zoomIn()}
        className="w-11 h-11 bg-white border-2 border-pencil/20 rounded-2xl shadow-md flex items-center justify-center hover:bg-muted-paper transition-colors font-bold text-xl text-pencil/70"
      >
        <Plus size={18} />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-11 h-11 bg-white border-2 border-pencil/20 rounded-2xl shadow-md flex items-center justify-center hover:bg-muted-paper transition-colors font-bold text-xl text-pencil/70"
      >
        <Minus size={18} />
      </button>
    </div>
  );
}

function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { animate: true, duration: 1.2 });
  }, [center, map]);
  return null;
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTERS = [
  { id: "all", label: "Tất cả", icon: Layers },
  { id: "landmark", label: "Địa danh", icon: Landmark },
  { id: "food", label: "Ẩm thực", icon: UtensilsCrossed },
  { id: "nature", label: "Thiên nhiên", icon: Trees },
  { id: "liked", label: "Yêu thích", icon: Heart },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function MapComponent() {
  const { user } = useAuth();
  const [position, setPosition] = useState<[number, number]>([10.762622, 106.660172]);
  const [hasLocation, setHasLocation] = useState(false);
  const [stamps, setStamps] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showJourney, setShowJourney] = useState(true);
  const [searchText, setSearchText] = useState("");

  // Panel state
  const [albumGroup, setAlbumGroup] = useState<any[] | null>(null);
  const [detailStamp, setDetailStamp] = useState<any | null>(null);

  // Fly-to trigger
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(coords);
          setFlyTarget(coords);
          setHasLocation(true);
        },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    getMapStamps(user?.uid).then((fetched: any[]) => {
      const valid = fetched.filter(
        (s) => s.metadata?.coordinates?.lat && s.metadata?.coordinates?.lng
      );
      setStamps(valid);
    });
  }, [user]);

  // ── Cluster stamps (Haversine 300m) ──────────────────────────────────────
  const clusters = useMemo(() => {
    const result: { lat: number; lng: number; stamps: any[] }[] = [];
    for (const stamp of stamps) {
      const lat = stamp.metadata.coordinates.lat;
      const lng = stamp.metadata.coordinates.lng;
      const existing = result.find((c) => haversineM(c.lat, c.lng, lat, lng) <= 300);
      if (existing) {
        existing.stamps.push(stamp);
        existing.lat =
          existing.stamps.reduce((s, st) => s + st.metadata.coordinates.lat, 0) /
          existing.stamps.length;
        existing.lng =
          existing.stamps.reduce((s, st) => s + st.metadata.coordinates.lng, 0) /
          existing.stamps.length;
      } else {
        result.push({ lat, lng, stamps: [stamp] });
      }
    }
    return result;
  }, [stamps]);

  // ── Journey path: sort all stamps by date → polyline ──────────────────────
  const journeyPath = useMemo((): [number, number][] => {
    const sorted = [...stamps]
      .filter((s) => s.metadata?.coordinates)
      .sort((a, b) => new Date(a.metadata.date).getTime() - new Date(b.metadata.date).getTime());
    return sorted.map((s) => [s.metadata.coordinates.lat, s.metadata.coordinates.lng]);
  }, [stamps]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const cities = new Set(stamps.map((s) => s.metadata?.location?.split(",")[0]?.trim()).filter(Boolean));
    return { total: stamps.length, cities: cities.size };
  }, [stamps]);

  const closeAll = useCallback(() => {
    setAlbumGroup(null);
    setDetailStamp(null);
  }, []);

  const handleLocate = useCallback(() => {
    if (position) setFlyTarget([...position] as [number, number]);
  }, [position]);

  const panelOpen = albumGroup || detailStamp;

  return (
    <div className="flex flex-col h-[100dvh] bg-paper font-patrick overflow-hidden">

      {/* ── TOP HEADER ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-paper/95 backdrop-blur-sm border-b border-pencil/10 px-4 pt-4 pb-3 z-20">
        {/* Row 1: Logo + title + bell */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-marker-red rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_rgba(45,45,45,.3)]">
            <img src="/logo.png" alt="Temsy" className="w-7 h-7 object-contain" />
          </div>
          <div className="flex-1">
            <h1 className="font-kalam font-bold text-xl text-pencil leading-none">Khám phá</h1>
            <p className="text-xs text-pencil/50 mt-0.5">Dấu chân của bạn trên bản đồ</p>
          </div>
          <button className="w-10 h-10 bg-white border-2 border-pencil/15 rounded-2xl flex items-center justify-center shadow-sm relative">
            <Bell size={18} className="text-pencil/60" />
            {stamps.length > 0 && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-marker-red rounded-full" />
            )}
          </button>
        </div>

        {/* Row 2: Search bar */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pencil/40" />
          <input
            type="text"
            placeholder="Tìm địa điểm, thành phố..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border-2 border-pencil/15 rounded-2xl text-sm font-patrick text-pencil placeholder-pencil/40 focus:outline-none focus:border-marker-red/50 transition-colors"
          />
        </div>

        {/* Row 3: Stats */}
        <div className="flex gap-3 mb-3">
          {[
            { value: stats.total, label: "Tem đã sưu tầm", emoji: "🏷️" },
            { value: stats.cities, label: "Địa điểm", emoji: "📍" },
            { value: user ? 1 : 0, label: "Hành trình", emoji: "🗺️" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex-1 bg-white border-2 border-pencil/10 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-sm"
            >
              <span className="text-lg">{s.emoji}</span>
              <div>
                <p className="font-kalam font-bold text-lg leading-none text-pencil">{s.value}</p>
                <p className="text-[10px] text-pencil/50 mt-0.5 leading-none">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Row 4: Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 filter-scrollbar">
          {FILTERS.map((f) => {
            const Icon = f.icon;
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold transition-all border-2 ${
                  isActive
                    ? "bg-marker-red text-white border-marker-red shadow-[2px_2px_0_0_rgba(45,45,45,.3)]"
                    : "bg-white text-pencil/70 border-pencil/15 hover:border-pencil/30"
                }`}
              >
                <Icon size={13} />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAP ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />

          {/* Fly-to effect */}
          {flyTarget && <FlyTo center={flyTarget} />}

          {/* Current location */}
          {hasLocation && <Marker position={position} icon={userIcon} />}

          {/* Journey dashed path */}
          {showJourney && journeyPath.length > 1 && (
            <Polyline
              positions={journeyPath}
              pathOptions={{
                color: "#ff4d4d",
                weight: 2.5,
                dashArray: "8, 6",
                opacity: 0.7,
              }}
            />
          )}

          {/* Stamp cluster markers */}
          {clusters.map((cluster) => {
            const first = cluster.stamps[0];
            const pos: [number, number] = [cluster.lat, cluster.lng];
            const icon = createStampMarker(first.imageUrl, cluster.stamps.length);
            return (
              <Marker
                key={`${cluster.lat.toFixed(6)}-${cluster.lng.toFixed(6)}`}
                position={pos}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (cluster.stamps.length === 1) {
                      setAlbumGroup(null);
                      setDetailStamp(cluster.stamps[0]);
                    } else {
                      setDetailStamp(null);
                      setAlbumGroup(cluster.stamps);
                    }
                  },
                }}
              />
            );
          })}

          {/* Map controls */}
          <MapControls onLocate={handleLocate} />
        </MapContainer>

        {/* ── Journey toggle button ── */}
        <button
          onClick={() => setShowJourney(!showJourney)}
          className={`absolute bottom-6 left-4 z-[1000] flex items-center gap-2 px-4 py-3 rounded-2xl border-2 font-bold text-sm shadow-md transition-all ${
            showJourney
              ? "bg-white border-marker-red text-marker-red shadow-[2px_2px_0_0_rgba(45,45,45,.2)]"
              : "bg-white border-pencil/20 text-pencil/60"
          }`}
        >
          <Route size={16} />
          Hành trình
        </button>

        {/* ── Camera FAB ── */}
        <Link
          href="/create"
          className="absolute bottom-5 right-4 z-[1000] w-14 h-14 bg-marker-red rounded-full flex items-center justify-center shadow-[3px_3px_0_0_rgba(45,45,45,.4)] hover:shadow-[4px_4px_0_0_rgba(45,45,45,.4)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-sm transition-all"
        >
          <Camera size={24} className="text-white" />
        </Link>

        {/* ── Overlay to close panel on mobile ── */}
        {panelOpen && (
          <div
            className="absolute inset-0 bg-black/10 z-[1500]"
            onClick={closeAll}
          />
        )}

        {/* ── BOTTOM SHEET: Album (multiple stamps) ── */}
        {albumGroup && !detailStamp && (
          <div
            className="absolute bottom-0 left-0 right-0 z-[2000] bg-paper rounded-t-3xl shadow-[0_-4px_30px_rgba(0,0,0,0.15)] border-t-2 border-pencil/10"
            style={{ animation: "slideUp 0.3s ease", maxHeight: "60vh" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 bg-pencil/20 rounded-full" />
            </div>

            <div className="px-5 pb-2 flex items-center justify-between">
              <div>
                <h2 className="font-kalam font-bold text-xl text-pencil">
                  {albumGroup[0].metadata.location?.split(",")[0] || "Địa điểm này"}
                </h2>
                <p className="text-xs text-pencil/50 font-patrick">{albumGroup.length} kỷ niệm tại đây</p>
              </div>
              <button
                onClick={closeAll}
                className="w-8 h-8 rounded-full border-2 border-pencil/15 bg-white flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <div
              className="overflow-y-auto px-5 pb-6"
              style={{ maxHeight: "calc(60vh - 100px)" }}
            >
              <div className="grid grid-cols-3 gap-3 pt-2">
                {albumGroup.map((stamp) => (
                  <button
                    key={stamp.id}
                    onClick={() => setDetailStamp(stamp)}
                    className="group flex flex-col rounded-2xl overflow-hidden border-2 border-pencil/15 bg-white shadow-sm hover:-translate-y-0.5 transition-all"
                  >
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={stamp.imageUrl}
                        alt={stamp.metadata.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-bold text-pencil truncate">{stamp.metadata.title}</p>
                    </div>
                  </button>
                ))}

                {/* Add to this location */}
                <Link
                  href="/create"
                  className="aspect-square rounded-2xl border-[2.5px] border-dashed border-pencil/25 flex flex-col items-center justify-center gap-1 text-pencil/40 hover:border-marker-red hover:text-marker-red transition-colors"
                >
                  <Plus size={22} strokeWidth={1.5} />
                  <span className="text-[10px] font-bold text-center leading-tight">Thêm<br />tem</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── BOTTOM SHEET: Single stamp detail ── */}
        {detailStamp && (
          <div
            className="absolute bottom-0 left-0 right-0 z-[2000] bg-paper rounded-t-3xl shadow-[0_-4px_30px_rgba(0,0,0,0.15)] border-t-2 border-pencil/10"
            style={{ animation: "slideUp 0.25s ease" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 bg-pencil/20 rounded-full" />
            </div>

            <div className="px-5 pb-6">
              {/* Header row */}
              <div className="flex items-center gap-2 mb-3">
                {albumGroup && albumGroup.length > 1 && (
                  <button
                    onClick={() => setDetailStamp(null)}
                    className="w-8 h-8 rounded-full border-2 border-pencil/15 bg-white flex items-center justify-center"
                  >
                    <ChevronLeft size={15} />
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={closeAll}
                  className="w-8 h-8 rounded-full border-2 border-pencil/15 bg-white flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Main card */}
              <div className="flex gap-4 items-start mb-4 relative">
                {/* Stamp image — styled like a postage stamp */}
                <div
                  className="w-24 h-24 flex-shrink-0 bg-white p-1.5 shadow-[3px_3px_0_0_rgba(45,45,45,.25)]"
                  style={{
                    WebkitMask:
                      "radial-gradient(circle at 50% 0,transparent 4px,#000 4.5px) 0 0/10px 5px repeat-x," +
                      "radial-gradient(circle at 50% 100%,transparent 4px,#000 4.5px) 0 100%/10px 5px repeat-x," +
                      "radial-gradient(circle at 0 50%,transparent 4px,#000 4.5px) 0 0/5px 10px repeat-y," +
                      "radial-gradient(circle at 100% 50%,transparent 4px,#000 4.5px) 100% 0/5px 10px repeat-y," +
                      "linear-gradient(#000,#000) center/calc(100% - 10px) calc(100% - 10px) no-repeat",
                    mask:
                      "radial-gradient(circle at 50% 0,transparent 4px,#000 4.5px) 0 0/10px 5px repeat-x," +
                      "radial-gradient(circle at 50% 100%,transparent 4px,#000 4.5px) 0 100%/10px 5px repeat-x," +
                      "radial-gradient(circle at 0 50%,transparent 4px,#000 4.5px) 0 0/5px 10px repeat-y," +
                      "radial-gradient(circle at 100% 50%,transparent 4px,#000 4.5px) 100% 0/5px 10px repeat-y," +
                      "linear-gradient(#000,#000) center/calc(100% - 10px) calc(100% - 10px) no-repeat",
                  }}
                >
                  <img
                    src={detailStamp.imageUrl}
                    alt={detailStamp.metadata.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-kalam font-bold text-xl text-pencil leading-tight">
                    {detailStamp.metadata.title}
                  </h2>
                  {detailStamp.metadata.location && (
                    <p className="text-sm text-pencil/50 font-patrick mt-0.5 truncate">
                      {detailStamp.metadata.location}
                    </p>
                  )}
                  {detailStamp.metadata.date && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Calendar size={12} className="text-marker-red" />
                      <span className="text-xs font-patrick text-pencil/60">{detailStamp.metadata.date}</span>
                    </div>
                  )}
                </div>

                {/* Decorative watermark stamp */}
                <div className="absolute right-0 top-0 opacity-[0.06] pointer-events-none">
                  <img src="/logo.png" className="w-20 h-20 object-contain" />
                </div>
              </div>

              {/* Story */}
              {detailStamp.metadata.story && (
                <div className="bg-postit border-2 border-pencil/15 rounded-2xl px-4 py-3 mb-4 -rotate-[0.3deg]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <BookOpen size={11} className="text-pencil/50" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pencil/50">Câu chuyện</span>
                  </div>
                  <p className="text-sm font-patrick text-pencil/80 italic leading-relaxed">
                    "{detailStamp.metadata.story}"
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (detailStamp.metadata.coordinates) {
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${detailStamp.metadata.coordinates.lat},${detailStamp.metadata.coordinates.lng}`,
                        "_blank"
                      );
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-pencil/20 rounded-2xl font-bold text-sm text-pencil hover:bg-muted-paper transition-colors shadow-[2px_2px_0_0_rgba(45,45,45,.15)]"
                >
                  <Navigation size={16} />
                  Chỉ đường
                </button>
                <Link
                  href="/collection"
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-marker-red text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity shadow-[2px_2px_0_0_rgba(45,45,45,.3)]"
                >
                  <Layers size={16} />
                  Xem bộ sưu tập
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .leaflet-container { font-family: inherit; }
        .leaflet-control-attribution { display: none !important; }
        .leaflet-popup { display: none !important; }
        .filter-scrollbar::-webkit-scrollbar { display: none; }
        .filter-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
