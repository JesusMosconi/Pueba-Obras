"use client";

import { useEffect, useRef } from "react";

export type MapObra = { id: number; nombre: string; localidad: string; montoMillones: number; latitud: number; longitud: number };

export default function ObrasMap({ obras }: { obras: MapObra[] }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const layer = useRef<import("leaflet").LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !element.current || map.current) return;
      map.current = L.map(element.current, { scrollWheelZoom: false }).setView([-31.5, -64.2], 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map.current);
      layer.current = L.layerGroup().addTo(map.current);
      updateMarkers(L);
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; layer.current = null; };
    // Initialized once; the next effect updates points when filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    import("leaflet").then((L) => updateMarkers(L));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obras]);

  function updateMarkers(L: typeof import("leaflet")) {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    const bounds: [number, number][] = [];
    for (const obra of obras) {
      const point: [number, number] = [obra.latitud, obra.longitud];
      bounds.push(point);
      const popup = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = `#${obra.id} · ${obra.localidad}`;
      const detail = document.createElement("div");
      detail.textContent = obra.nombre;
      const amount = document.createElement("div");
      amount.textContent = `${new Intl.NumberFormat("es-AR").format(obra.montoMillones)} M de pesos`;
      popup.append(strong, detail, amount);
      L.circleMarker(point, { radius: 6, color: "#0e5b70", fillColor: "#21a0a0", fillOpacity: .8, weight: 1.5 })
        .bindPopup(popup).addTo(layer.current);
    }
    if (bounds.length) map.current.fitBounds(bounds, { padding: [28, 28], maxZoom: bounds.length === 1 ? 10 : 8 });
  }

  return <div ref={element} className="map" role="img" aria-label={`Mapa con ${obras.length} obras`} />;
}
