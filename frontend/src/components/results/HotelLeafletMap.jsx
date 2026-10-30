import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Minus,
  EyeOff,
  MapPin,
} from 'lucide-react';

const CITY_COORD_LOOKUP = {
  стамбул: [41.015, 28.9795],
  istanbul: [41.015, 28.9795],
  'нью-йорк': [40.7553, -73.9832],
  'new york': [40.7553, -73.9832],
  барселона: [41.3874, 2.1686],
  barcelona: [41.3874, 2.1686],
  лондон: [51.5074, -0.1278],
  london: [51.5074, -0.1278],
  дубай: [25.1972, 55.2744],
  dubai: [25.1972, 55.2744],
  ташкент: [41.3111, 69.2797],
  tashkent: [41.3111, 69.2797],
  париж: [48.8566, 2.3522],
  paris: [48.8566, 2.3522],
  рим: [41.9028, 12.4964],
  rome: [41.9028, 12.4964],
  анталья: [36.8841, 30.7056],
  antalya: [36.8841, 30.7056],
  пхукет: [7.8804, 98.3923],
  phuket: [7.8804, 98.3923],
  токио: [35.6762, 139.6503],
  tokyo: [35.6762, 139.6503],
};

function resolveCenterCoords(cityCenter, cityLabel, hotels) {
  if (
    cityCenter &&
    typeof cityCenter.lat === 'number' &&
    typeof cityCenter.lng === 'number'
  ) {
    return [cityCenter.lat, cityCenter.lng];
  }
  const low = String(cityLabel || '').toLowerCase();
  for (const [k, coords] of Object.entries(CITY_COORD_LOOKUP)) {
    if (low.includes(k)) return coords;
  }
  if (hotels?.length > 0 && hotels[0].coordinates?.lat) {
    return [hotels[0].coordinates.lat, hotels[0].coordinates.lng];
  }
  return [41.015, 28.9795];
}

export default function HotelLeafletMap({
  hotels = [],
  cityCenter = null,
  cityLabel = 'Стамбул',
  selectedHotelId = null,
  onSelectPin,
  onOpenHotelDetail,
  mapExpanded = false,
  onToggleExpand,
  onHideMap,
  mapSearchText = '',
  onChangeMapSearch,
  searchOnMapMove = false,
  onToggleSearchOnMove,
  onBoundsFilter,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const lastCenterKeyRef = useRef('');
  const [leafletReady, setLeafletReady] = useState(
    typeof window !== 'undefined' && Boolean(window.L)
  );
  const [leafletFailed, setLeafletFailed] = useState(false);

  // Ensure Leaflet is loaded (in case index.html script finished slightly later)
  useEffect(() => {
    if (window.L) {
      setLeafletReady(true);
      return;
    }
    let script = document.querySelector('script[data-leaflet-fallback]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.dataset.leafletFallback = 'true';
      script.onload = () => setLeafletReady(true);
      script.onerror = () => setLeafletFailed(true);
      document.head.appendChild(script);
    }
    const timer = setTimeout(() => {
      if (window.L) setLeafletReady(true);
      else setLeafletFailed(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const [centerLat, centerLng] = resolveCenterCoords(
    cityCenter,
    cityLabel,
    hotels
  );

  // Initialize Leaflet Map instance once
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || mapInstanceRef.current) {
      return;
    }
    const L = window.L;
    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;
    lastCenterKeyRef.current = `${centerLat.toFixed(3)},${centerLng.toFixed(3)}`;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady]);

  // Invalidate size when mapExpanded toggles so tiles fill full width cleanly
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
    }
  }, [mapExpanded]);

  // Fly to new city coordinates whenever searched city changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const nextKey = `${centerLat.toFixed(3)},${centerLng.toFixed(3)}`;
    if (lastCenterKeyRef.current !== nextKey) {
      lastCenterKeyRef.current = nextKey;
      map.flyTo([centerLat, centerLng], 13, { duration: 0.85 });
    }
  }, [centerLat, centerLng]);

  // Bind optional moveend bbox filter
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !onBoundsFilter) return;
    const handleMoveEnd = () => {
      if (!searchOnMapMove) return;
      const b = map.getBounds();
      const bboxStr = [
        b.getSouth().toFixed(5),
        b.getWest().toFixed(5),
        b.getNorth().toFixed(5),
        b.getEast().toFixed(5),
      ].join(',');
      onBoundsFilter(bboxStr);
    };
    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [searchOnMapMove, onBoundsFilter]);

  // Plot custom HTML price pills (`3 430 $`) + cluster badges (`28`, `14`) for hotels
  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!L || !map || !layer) return;

    layer.clearLayers();
    if (!hotels || hotels.length === 0) return;

    // Show first 28 hotels as interactive RateHawk price pills, and group remaining into neighborhood clusters
    const individualHotels = hotels.slice(0, 28);
    const remainingHotels = hotels.slice(28);

    individualHotels.forEach((hotel) => {
      const lat = hotel.coordinates?.lat;
      const lng = hotel.coordinates?.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      const isActive = selectedHotelId === hotel.id;
      const priceText = `${Number(hotel.total_price || 0).toLocaleString('ru-RU')} $`;

      const pillHtml = `
        <div style="
          display:inline-flex;
          align-items:center;
          justify-content:center;
          white-space:nowrap;
          padding:3px 8px;
          border-radius:9999px;
          font-family:Inter,sans-serif;
          font-size:11px;
          font-weight:700;
          box-shadow:0 2px 6px rgba(0,0,0,0.22);
          border:1.5px solid ${isActive ? '#111827' : '#D1D5DB'};
          background:${isActive ? '#F6D04D' : '#FFFFFF'};
          color:#111827;
          transform:${isActive ? 'scale(1.12)' : 'scale(1)'};
          transition:transform 0.15s ease;
        ">
          ${priceText}
        </div>
      `;

      const icon = L.divIcon({
        className: 'rh-custom-price-pin',
        html: pillHtml,
        iconSize: [74, 26],
        iconAnchor: [37, 13],
      });

      const marker = L.marker([lat, lng], {
        icon,
        zIndexOffset: isActive ? 900 : 100,
      });

      marker.on('click', () => {
        if (onSelectPin) onSelectPin(hotel);
      });
      marker.on('dblclick', () => {
        if (onOpenHotelDetail) onOpenHotelDetail(hotel);
      });

      const starsStr = '★'.repeat(Math.max(0, hotel.stars || 0));
      marker.bindTooltip(
        `<div style="font-family:Inter,sans-serif;font-size:11px;line-height:1.35;padding:2px 4px;">
          <div style="color:#F59E0B;font-size:10px;">${starsStr}</div>
          <div style="font-weight:700;color:#111827;">${hotel.name}</div>
          <div style="color:#16A34A;font-weight:600;">Оценка ${hotel.rating_label} • ${priceText}</div>
        </div>`,
        { direction: 'top', offset: [0, -10] }
      );

      layer.addLayer(marker);
    });

    // Build neighborhood clusters for hotels beyond the first 28
    if (remainingHotels.length > 0) {
      const buckets = {};
      remainingHotels.forEach((h) => {
        const lat = h.coordinates?.lat;
        const lng = h.coordinates?.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number') return;
        const key = `${Math.round(lat * 40) / 40}_${Math.round(lng * 40) / 40}`;
        if (!buckets[key]) {
          buckets[key] = { sumLat: 0, sumLng: 0, count: 0 };
        }
        buckets[key].sumLat += lat;
        buckets[key].sumLng += lng;
        buckets[key].count += 1;
      });

      Object.values(buckets).forEach((b) => {
        if (b.count < 2) return;
        const cLat = b.sumLat / b.count;
        const cLng = b.sumLng / b.count;
        const clusterIcon = L.divIcon({
          className: 'rh-custom-cluster-pin',
          html: `
            <div style="
              width:34px;
              height:34px;
              border-radius:9999px;
              background:#1C2026;
              color:#FFFFFF;
              border:2px solid #FFFFFF;
              box-shadow:0 3px 8px rgba(0,0,0,0.28);
              display:flex;
              align-items:center;
              justify-content:center;
              font-family:Inter,sans-serif;
              font-size:12px;
              font-weight:800;
            ">
              ${b.count}
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        const clusterMarker = L.marker([cLat, cLng], {
          icon: clusterIcon,
          zIndexOffset: 50,
        });
        clusterMarker.on('click', () => {
          map.flyTo([cLat, cLng], Math.min(16, map.getZoom() + 2), {
            duration: 0.5,
          });
        });
        layer.addLayer(clusterMarker);
      });
    }
  }, [hotels, selectedHotelId, onSelectPin, onOpenHotelDetail]);

  if (leafletFailed) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center space-y-3">
        <MapPin className="w-8 h-8 text-gray-400 mx-auto" />
        <div className="text-sm font-bold text-[#111827]">
          Интерактивная карта недоступна в офлайн-режиме
        </div>
        <p className="text-xs text-[#6B7280]">
          Проверьте подключение к интернету для загрузки тайлов OpenStreetMap ({cityLabel}).
        </p>
        {onHideMap && (
          <button
            type="button"
            onClick={onHideMap}
            className="px-4 py-2 rounded-xl bg-[#F6D04D] text-[#111827] text-xs font-bold"
          >
            Скрыть карту
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-96px)] min-h-[580px] rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-[#E5E7EB]">
      {/* Real Interactive Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Overlay Controls (`< Развернуть карту`, `Искать при перемещении`, `Скрыть карту`) */}
      <div className="absolute top-3 left-3 right-3 z-[400] space-y-2 pointer-events-none">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onToggleExpand}
            className="pointer-events-auto px-3 py-1.5 rounded-full bg-white shadow-md border border-gray-200 text-[12px] font-semibold text-[#111827] flex items-center gap-1 hover:bg-gray-50 transition-colors"
          >
            {mapExpanded ? (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Свернуть карту</span>
              </>
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Развернуть карту</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <label className="hidden sm:flex px-2.5 py-1.5 rounded-full bg-white shadow-md border border-gray-200 items-center gap-1.5 text-[11px] text-[#374151] cursor-pointer">
              <input
                type="checkbox"
                checked={searchOnMapMove}
                onChange={(e) =>
                  onToggleSearchOnMove && onToggleSearchOnMove(e.target.checked)
                }
                className="w-3.5 h-3.5 rounded border-gray-300 text-[#F5C400]"
              />
              <span className="leading-tight">Искать на карте</span>
            </label>

            {onHideMap && (
              <button
                type="button"
                onClick={onHideMap}
                title="Скрыть карту"
                className="px-2.5 py-1.5 rounded-full bg-white shadow-md border border-gray-200 hover:bg-gray-50 text-[11px] font-medium text-[#374151] flex items-center gap-1"
              >
                <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                <span className="hidden xl:inline">Скрыть</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Input on Map */}
        <div className="flex justify-end">
          <div className="pointer-events-auto w-full sm:w-[230px] h-[34px] rounded-full bg-white shadow-md border border-gray-200 px-3 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={mapSearchText}
              onChange={(e) =>
                onChangeMapSearch && onChangeMapSearch(e.target.value)
              }
              placeholder={`Район или отель (${cityLabel})`}
              className="w-full text-[11px] text-[#111827] placeholder-gray-400 bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Right Zoom `+` / `−` Controls */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[400] bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col divide-y divide-gray-200">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-8 h-8 flex items-center justify-center text-[#374151] hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-8 h-8 flex items-center justify-center text-[#374151] hover:bg-gray-50"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

