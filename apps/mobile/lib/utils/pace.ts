export function formatPace(secPerKm: number, imperial = false): string {
  if (!secPerKm || !isFinite(secPerKm) || secPerKm <= 0) return "--:--";
  const secPerUnit = imperial ? secPerKm * 1.60934 : secPerKm;
  const mins = Math.floor(secPerUnit / 60);
  const secs = Math.round(secPerUnit % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatDistance(meters: number, imperial = false): string {
  if (imperial) {
    const miles = meters / 1609.34;
    return miles < 0.1 ? `${Math.round(meters)} m` : `${miles.toFixed(2)} mi`;
  }
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function paceZoneColor(zone: string): string {
  const colors: Record<string, string> = {
    recovery: "#6B7280",
    easy: "#34D399",
    marathon: "#60A5FA",
    threshold: "#FBBF24",
    interval: "#F97316",
    repetition: "#EF4444",
  };
  return colors[zone] ?? "#6B7280";
}

export function paceZoneLabel(zone: string): string {
  const labels: Record<string, string> = {
    recovery: "Recovery",
    easy: "Easy",
    marathon: "Marathon",
    threshold: "Threshold",
    interval: "Interval",
    repetition: "Reps",
  };
  return labels[zone] ?? zone;
}

export function distanceLabel(distance: string): string {
  const labels: Record<string, string> = {
    "5k": "5K",
    "8k": "8K",
    "10k": "10K",
    "15k": "15K",
    "10mi": "10 Mile",
    half_marathon: "Half Marathon",
    "25k": "25K",
    "30k": "30K",
    marathon: "Marathon",
    "50k": "50K",
    "50mi": "50 Mile",
    "100k": "100K",
    "100mi": "100 Mile",
  };
  return labels[distance] ?? distance.toUpperCase();
}
