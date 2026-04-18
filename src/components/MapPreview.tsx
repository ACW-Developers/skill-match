import React from "react";

interface Point {
  lat: number;
  lng: number;
}

interface MapPreviewProps {
  customer: Point;
  worker: Point;
  distanceLabel?: string;
  height?: number;
}

/**
 * Lightweight, dependency-free map preview using OpenStreetMap static tiles
 * with two pins and a connecting distance line drawn as an SVG overlay.
 */
export const MapPreview: React.FC<MapPreviewProps> = ({ customer, worker, distanceLabel, height = 180 }) => {
  // Compute bounding box around the two points with padding
  const minLat = Math.min(customer.lat, worker.lat);
  const maxLat = Math.max(customer.lat, worker.lat);
  const minLng = Math.min(customer.lng, worker.lng);
  const maxLng = Math.max(customer.lng, worker.lng);
  const latPad = Math.max((maxLat - minLat) * 0.6, 0.005);
  const lngPad = Math.max((maxLng - minLng) * 0.6, 0.005);
  const bbox = `${minLng - lngPad},${minLat - latPad},${maxLng + lngPad},${maxLat + latPad}`;

  const tileUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${(customer.lat + worker.lat) / 2}%2C${(customer.lng + worker.lng) / 2}`;

  // Project lat/lng into 0..100 SVG percent coordinates inside the bbox
  const projectX = (lng: number) =>
    ((lng - (minLng - lngPad)) / (maxLng + lngPad - (minLng - lngPad))) * 100;
  const projectY = (lat: number) =>
    100 - ((lat - (minLat - latPad)) / (maxLat + latPad - (minLat - latPad))) * 100;

  const cx = projectX(customer.lng);
  const cy = projectY(customer.lat);
  const wx = projectX(worker.lng);
  const wy = projectY(worker.lat);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border" style={{ height }}>
      <iframe
        title="map-preview"
        src={tileUrl}
        className="absolute inset-0 w-full h-full"
        style={{ border: 0 }}
        loading="lazy"
      />
      {/* SVG overlay with line + pins */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <line
          x1={cx} y1={cy} x2={wx} y2={wy}
          stroke="hsl(var(--primary))"
          strokeWidth="0.8"
          strokeDasharray="2 1.5"
        />
        {/* Customer pin (blue) */}
        <circle cx={cx} cy={cy} r="2.2" fill="hsl(var(--chart-2))" stroke="white" strokeWidth="0.6" />
        {/* Worker pin (primary orange) */}
        <circle cx={wx} cy={wy} r="2.2" fill="hsl(var(--primary))" stroke="white" strokeWidth="0.6" />
      </svg>
      {distanceLabel && (
        <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur px-2 py-0.5 rounded-md text-xs font-medium text-foreground border border-border">
          {distanceLabel}
        </div>
      )}
      <div className="absolute top-2 left-2 flex gap-2 text-[10px]">
        <span className="bg-background/90 backdrop-blur px-1.5 py-0.5 rounded border border-border flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--chart-2))" }} /> You
        </span>
        <span className="bg-background/90 backdrop-blur px-1.5 py-0.5 rounded border border-border flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--primary))" }} /> Fundi
        </span>
      </div>
    </div>
  );
};
