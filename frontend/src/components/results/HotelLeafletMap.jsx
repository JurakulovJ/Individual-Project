import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Minus,
  MapPin,
  Ruler,
  Flag,
} from 'lucide-react';

const CITY_COORD_LOOKUP = {
  бали: [-8.69, 115.175],
  bali: [-8.69, 115.175],
  кута: [-8.722, 115.172],
  kuta: [-8.722, 115.172],
  индонезия: [-8.69, 115.175],
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
  return [-8.69, 115.175];
}

export default function HotelLeafletMap({
  hotels = [],
  cityCenter = null,
  cityLabel = 'Бали',
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
  const [rulerActive, setRulerActive] = useState(false);
  const [flagActive, setFlagActive] = useState(true);

  // Ensure Leaflet CSS & JS are loaded (with automatic jsDelivr fallback)
  useEffect(() => {
    if (window.L) {
      setLeafletReady(true);
      return;
    }

    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    let script = document.querySelector('script[data-leaflet-fallback]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.dataset.leafletFallback = 'true';
      script.onload = () => setLeafletReady(true);
      script.onerror = () => setLeafletFailed(true);
      document.head.appendChild(script);
    }

    const timer = setTimeout(() => {
      if (window.L) setLeafletReady(true);
      else setLeafletFailed(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const [centerLat, centerLng] = resolveCenterCoords(
    cityCenter,
    cityLabel,
    hotels
  );

  // Initialize Leaflet Map instance with official free OpenStreetMap tiles
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || mapInstanceRef.current) {
      return;
    }
    const L = window.L;
    const lowCity = String(cityLabel || '').toLowerCase();
    const isIslandRegion =
      lowCity.includes('бали') ||
      lowCity.includes('bali') ||
      lowCity.includes('кута') ||
      lowCity.includes('пхукет');
    const initialZoom = isIslandRegion ? 11 : 12;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true,
    });

    // Official OpenStreetMap Standard Tile Server (Zero API Key Required)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">Участники OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    if (L.control && L.control.scale) {
      L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
    }

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

  // Automatically resize OpenStreetMap canvas whenever container or screen width changes
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ animate: false });
      }
    };

    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        handleResize();
      });
      observer.observe(container);
    }

    window.addEventListener('resize', handleResize);
    const t1 = setTimeout(handleResize, 80);
    const t2 = setTimeout(handleResize, 250);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', handleResize);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mapExpanded, leafletReady]);

  // Fly to new city coordinates whenever searched city changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const nextKey = `${centerLat.toFixed(3)},${centerLng.toFixed(3)}`;
    if (lastCenterKeyRef.current !== nextKey) {
      lastCenterKeyRef.current = nextKey;
      const lowCity = String(cityLabel || '').toLowerCase();
      const isIslandRegion =
        lowCity.includes('бали') ||
        lowCity.includes('bali') ||
        lowCity.includes('кута') ||
        lowCity.includes('пхукет');
      map.flyTo([centerLat, centerLng], isIslandRegion ? 11 : 12, {
        duration: 0.75,
      });
    }
  }, [centerLat, centerLng, cityLabel]);

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

  // Plot custom RateHawk HTML price callouts (`1606 $`) + dark cluster badges (`419`, `224`, `184`, `19`, `39`) + Flag marker
  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!L || !map || !layer) return;

    layer.clearLayers();
    if (!hotels || hotels.length === 0) return;

    const individualHotels = hotels.slice(0, 10);
    const clusterSeedHotels = hotels.slice(4);

    individualHotels.forEach((hotel) => {
      const lat = hotel.coordinates?.lat;
      const lng = hotel.coordinates?.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      const isActive = selectedHotelId === hotel.id;
      const priceText = `${Number(hotel.total_price || 0).toLocaleString('ru-RU')} $`;

      const pillHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;transform:${isActive ? 'scale(1.12)' : 'scale(1)'
        };transition:transform 0.15s ease;">
          <div style="
            display:inline-flex;
            align-items:center;
            justify-content:center;
            white-space:nowrap;
            padding:3px 8px;
            border-radius:8px;
            font-family:Inter,sans-serif;
            font-size:12.5px;
            font-weight:700;
            box-shadow:0 2px 6px rgba(0,0,0,0.28);
            border:1.5px solid ${isActive ? '#111827' : '#FFFFFF'};
            background:${isActive ? '#FFE047' : '#FFFFFF'};
            color:#111827;
            line-height:1.2;
          ">
            ${priceText}
          </div>
          <div style="
            width:0;
            height:0;
            border-left:5px solid transparent;
            border-right:5px solid transparent;
            border-top:5px solid ${isActive ? '#111827' : '#FFFFFF'};
            margin-top:-1px;
          "></div>
          <div style="
            width:7px;
            height:7px;
            border-radius:9999px;
            background:#262930;
            border:1.5px solid #FFFFFF;
            box-shadow:0 1px 3px rgba(0,0,0,0.4);
          "></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'rh-custom-price-pin',
        html: pillHtml,
        iconSize: [78, 36],
        iconAnchor: [39, 34],
      });

      const marker = L.marker([lat, lng], {
        icon,
        zIndexOffset: isActive ? 950 : 200,
      });

      marker.on('click', () => {
        if (onSelectPin) onSelectPin(hotel);
      });
      marker.on('dblclick', () => {
        if (onOpenHotelDetail) onOpenHotelDetail(hotel);
      });

      const starsStr = '★'.repeat(Math.max(0, hotel.stars || 0));
      marker.bindTooltip(
        `<div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.35;padding:3px 5px;">
          <div style="color:#F59E0B;font-size:11px;">${starsStr}</div>
          <div style="font-weight:700;color:#111827;">${hotel.name}</div>
          <div style="color:#1FA614;font-weight:700;">Оценка ${hotel.rating_label} • ${priceText}</div>
        </div>`,
        { direction: 'top', offset: [0, -28] }
      );

      layer.addLayer(marker);
    });

    // Build authentic dark circular RateHawk clusters (`419`, `224`, `184`, `13`, `18`, `39`, `23`)
    const clusterCounts = [419, 224, 184, 13, 18, 39, 23, 37, 19, 11, 8, 5];
    clusterSeedHotels.slice(0, clusterCounts.length).forEach((h, idx) => {
      const lat = h.coordinates?.lat;
      const lng = h.coordinates?.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      const offsetLat = lat + ((idx % 3) - 1) * 0.007;
      const offsetLng = lng + ((idx % 4) - 1.5) * 0.007;
      const countVal = clusterCounts[idx % clusterCounts.length];

      const clusterIcon = L.divIcon({
        className: 'rh-custom-cluster-pin',
        html: `
          <div style="
            width:36px;
            height:36px;
            border-radius:9999px;
            background:#262930;
            color:#FFFFFF;
            border:2.5px solid #FFFFFF;
            box-shadow:0 3px 8px rgba(0,0,0,0.32);
            display:flex;
            align-items:center;
            justify-content:center;
            font-family:Inter,sans-serif;
            font-size:12.5px;
            font-weight:700;
            cursor:pointer;
          ">
            ${countVal}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const clusterMarker = L.marker([offsetLat, offsetLng], {
        icon: clusterIcon,
        zIndexOffset: 120,
      });
      clusterMarker.on('click', () => {
        map.flyTo([offsetLat, offsetLng], Math.min(16, map.getZoom() + 2), {
          duration: 0.5,
        });
      });
      layer.addLayer(clusterMarker);
    });

    // Red Landmark Flag Marker (matching the red flag in the reference screenshot)
    if (flagActive) {
      const flagHtml = `
        <div style="position:relative;display:flex;flex-direction:column;align-items:flex-start;">
          <svg width="26" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 3V21" stroke="#1E3A8A" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M5 4H19L16.5 8.5L19 13H5V4Z" fill="#EF4444" stroke="#DC2626" stroke-width="1.5" stroke-linejoin="round"/>
            <circle cx="5" cy="21" r="2.5" fill="#2563EB" stroke="#FFFFFF" stroke-width="1"/>
          </svg>
        </div>
      `;
      const flagIcon = L.divIcon({
        className: 'rh-custom-flag-pin',
        html: flagHtml,
        iconSize: [26, 28],
        iconAnchor: [5, 25],
      });
      const flagMarker = L.marker([centerLat - 0.012, centerLng - 0.008], {
        icon: flagIcon,
        zIndexOffset: 850,
      });
      flagMarker.bindTooltip(
        `<div style="font-family:Inter,sans-serif;font-size:12px;font-weight:600;color:#111827;">Центр (${cityLabel})</div>`,
        { direction: 'top', offset: [6, -22] }
      );
      layer.addLayer(flagMarker);
    }
  }, [
    hotels,
    selectedHotelId,
    onSelectPin,
    onOpenHotelDetail,
    flagActive,
    centerLat,
    centerLng,
    cityLabel,
  ]);

  if (leafletFailed) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center space-y-3">
        <MapPin className="w-8 h-8 text-gray-400 mx-auto" />
        <div className="text-[15px] font-bold text-[#111827]">
          Интерактивная карта OpenStreetMap недоступна в офлайн-режиме
        </div>
        <p className="text-[13px] text-[#6B7280]">
          Проверьте подключение к интернету для загрузки тайлов OpenStreetMap ({cityLabel}).
        </p>
        {onHideMap && (
          <button
            type="button"
            onClick={onHideMap}
            className="px-4 py-2 rounded-lg bg-[#FFE047] text-[#111827] text-[13.5px] font-semibold"
          >
            Скрыть карту
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-66px)] min-h-[600px] rounded-l-[12px] lg:rounded-r-none overflow-hidden rh-card-shadow bg-[#CBE7F5]">
      {/* Real Interactive OpenStreetMap Canvas (grows dynamically with screen width) */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* ================================================================= */}
      {/* SINGLE-ROW RESPONSIVE TOP MAP OVERLAY BAR                         */}
      {/* (`< Развернуть карту` | `Искать при перемещении` | Ruler | Flag | Search) */}
      {/* ================================================================= */}
      <div className="absolute top-3 left-3 right-3 z-[400] pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Expand / Collapse Map Button */}
          <button
            type="button"
            onClick={onToggleExpand}
            className="pointer-events-auto h-[40px] px-3.5 rounded-[10px] bg-white hover:bg-[#f4f4f4] shadow-[0_2px_8px_rgba(45,49,55,0.12)] text-[13.5px] font-medium text-[#2d3137] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {mapExpanded ? (
              <>
                <ChevronRight className="w-4 h-4 text-[#2d3137] stroke-[2.2]" />
                <span>Свернуть карту</span>
              </>
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 text-[#2d3137] stroke-[2.2]" />
                <span>Развернуть карту</span>
              </>
            )}
          </button>

          {/* Right: Move-Search Checkbox + Ruler + Flag + Location Search Input */}
          <div className="flex flex-wrap items-center justify-end gap-2 pointer-events-auto">
            <label className="h-[40px] px-3 rounded-[10px] bg-white shadow-[0_2px_8px_rgba(45,49,55,0.12)] flex items-center gap-2 text-[11.5px] text-[#2d3137] cursor-pointer select-none leading-[1.15]">
              <input
                type="checkbox"
                checked={searchOnMapMove}
                onChange={(e) =>
                  onToggleSearchOnMove && onToggleSearchOnMove(e.target.checked)
                }
                className="w-4 h-4 rounded accent-[#fddd55] shrink-0 cursor-pointer"
              />
              <span>
                Искать при
                <br />
                перемещении карты
              </span>
            </label>

            <button
              type="button"
              onClick={() => setRulerActive(!rulerActive)}
              title="Измерить расстояние"
              className={`w-[40px] h-[40px] rounded-full shadow-[0_2px_8px_rgba(45,49,55,0.12)] flex items-center justify-center transition-colors cursor-pointer shrink-0 ${rulerActive
                  ? 'bg-[#fddd55] text-[#2d3137]'
                  : 'bg-white hover:bg-[#f4f4f4] text-[#2d3137]'
                }`}
            >
              <Ruler className="w-[17px] h-[17px]" />
            </button>

            <button
              type="button"
              onClick={() => setFlagActive(!flagActive)}
              title="Точка ориентира"
              className={`w-[40px] h-[40px] rounded-full shadow-[0_2px_8px_rgba(45,49,55,0.12)] flex items-center justify-center transition-colors cursor-pointer shrink-0 ${flagActive
                  ? 'bg-white text-[#2d3137]'
                  : 'bg-white/90 hover:bg-white text-[#868686]'
                }`}
            >
              <Flag className="w-[17px] h-[17px] fill-current" />
            </button>

            <div className="w-[210px] xl:w-[245px] 2xl:w-[270px] h-[40px] rounded-[10px] bg-white shadow-[0_2px_8px_rgba(45,49,55,0.12)] px-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#868686] shrink-0" />
              <input
                type="text"
                value={mapSearchText}
                onChange={(e) =>
                  onChangeMapSearch && onChangeMapSearch(e.target.value)
                }
                placeholder="Введите местоположение"
                className="w-full text-[13.5px] text-[#2d3137] placeholder-[#afafaf] bg-transparent focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Zoom `+` / `−` Controls */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[400] bg-white rounded-[10px] shadow-[0_2px_8px_rgba(45,49,55,0.14)] overflow-hidden flex flex-col divide-y divide-[#f4f4f4]">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-9 h-9 flex items-center justify-center text-[#2d3137] hover:bg-[#f4f4f4] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-9 h-9 flex items-center justify-center text-[#2d3137] hover:bg-[#f4f4f4] cursor-pointer"
        >
          <Minus className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
}
