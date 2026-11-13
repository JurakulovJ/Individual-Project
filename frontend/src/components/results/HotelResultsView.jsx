import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Heart,
  ChevronLeft,
  ChevronRight,
  Star,
  Wifi,
  Utensils,
  Briefcase,
  Accessibility,
  RotateCcw,
  CreditCard,
  X,
  MapPin,
  Leaf,
  Loader2,
  Map as MapIcon,
} from 'lucide-react';
import { searchHotels } from '../../services/api';
import HotelLeafletMap from './HotelLeafletMap';
import HotelOffersModal from './HotelOffersModal';

const FALLBACK_HOTEL_IMAGE =
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80';

function formatPluralVariants(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `доступен ${count} вариант`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `доступно ${count} варианта`;
  }
  return `доступно ${count} вариантов`;
}

export default function HotelResultsView({
  searchParams,
  onBackToDashboard,
  onSelectHotel,
  onOpenHotelDetail,
}) {
  // Left Sidebar Filter States
  const [viewMode, setViewMode] = useState('list');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  const [hotelNameFilter, setHotelNameFilter] = useState('');
  const [selectedMeals, setSelectedMeals] = useState(
    searchParams.meals?.length ? searchParams.meals : []
  );
  const [selectedStars, setSelectedStars] = useState(
    searchParams.stars?.length ? searchParams.stars : []
  );

  // Sync filters when updated from HeroSearch
  useEffect(() => {
    setSelectedStars(
      Array.isArray(searchParams.stars) ? searchParams.stars : []
    );
    setSelectedMeals(
      Array.isArray(searchParams.meals) ? searchParams.meals : []
    );
  }, [searchParams.stars, searchParams.meals, searchParams.hotelDestination]);

  const [favorites, setFavorites] = useState({});
  const [slideIndices, setSlideIndices] = useState({});
  const [showImages, setShowImages] = useState(true);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapHidden, setMapHidden] = useState(false);
  const [searchOnMapMove, setSearchOnMapMove] = useState(false);
  const [mapSearchText, setMapSearchText] = useState('');
  const [selectedHotelPin, setSelectedHotelPin] = useState(null);
  const [mapBbox, setMapBbox] = useState(null);
  const [visibleCount, setVisibleCount] = useState(20);

  // Dynamic Backend Data State
  const [hotels, setHotels] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [cityCenter, setCityCenter] = useState(null);
  const [cityLabel, setCityLabel] = useState(
    searchParams.selectedCityShort ||
    (searchParams.hotelDestination || 'Нью-Йорк').split(',')[0].trim() ||
    'Нью-Йорк'
  );
  const [facets, setFacets] = useState({
    meal_counts: { RO: 26, BB: 48, HB: 12, FB: 6, AI: 6 },
    star_counts: { 5: 30, 4: 28, 3: 22, 2: 10, 0: 8 },
  });
  const [loading, setLoading] = useState(true);
  const [sourceMode, setSourceMode] = useState('mock');
  const [fetchError, setFetchError] = useState(null);
  const [offersModalHotel, setOffersModalHotel] = useState(null);

  const cardRefs = useRef({});

  const fetchHotelResults = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await searchHotels({
        destination: searchParams.hotelDestination || 'Нью-Йорк',
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: (searchParams.adults || 2) + (searchParams.children || 0),
        rooms: searchParams.rooms || 1,
        citizenship: searchParams.citizenship,
        stars: selectedStars,
        meals: selectedMeals,
        freeCancellation: searchParams.freeCancellation,
        hotelName: hotelNameFilter || mapSearchText,
        sortBy,
        bbox: mapBbox,
      });
      const list = data.items || [];
      setHotels(list);
      setTotalCount(data.total_count ?? list.length);
      setSourceMode(data.source || 'mock');
      setVisibleCount(20);
      if (data.city_center) {
        setCityCenter(data.city_center);
      }
      setCityLabel(
        data.city_label ||
        searchParams.selectedCityShort ||
        (searchParams.hotelDestination || 'Нью-Йорк').split(',')[0].trim() ||
        'Нью-Йорк'
      );
      if (list.length > 0) {
        setSelectedHotelPin(list[0].id);
      }
      if (data.facets) {
        setFacets(data.facets);
      }
    } catch {
      setFetchError('Не удалось загрузить список отелей. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  }, [
    searchParams.hotelDestination,
    searchParams.selectedCityShort,
    searchParams.checkIn,
    searchParams.checkOut,
    searchParams.adults,
    searchParams.children,
    searchParams.rooms,
    searchParams.citizenship,
    searchParams.freeCancellation,
    selectedStars,
    selectedMeals,
    hotelNameFilter,
    mapSearchText,
    sortBy,
    mapBbox,
  ]);

  useEffect(() => {
    fetchHotelResults();
  }, [fetchHotelResults]);

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStarFilter = (starCount) => {
    setSelectedStars((prev) =>
      prev.includes(starCount)
        ? prev.filter((s) => s !== starCount)
        : [...prev, starCount]
    );
  };

  const toggleMealFilter = (mealCode) => {
    setSelectedMeals((prev) =>
      prev.includes(mealCode)
        ? prev.filter((m) => m !== mealCode)
        : [...prev, mealCode]
    );
  };

  const resetAllFilters = () => {
    setFavoritesOnly(false);
    setHotelNameFilter('');
    setMapSearchText('');
    setSelectedMeals([]);
    setSelectedStars([]);
    setMapBbox(null);
  };

  const filteredHotels = hotels.filter((h) => {
    if (favoritesOnly && !favorites[h.id]) return false;
    return true;
  });

  const paginatedHotels = filteredHotels.slice(0, visibleCount);
  const remainingCount = Math.max(0, filteredHotels.length - visibleCount);

  const nextSlide = (e, id, total) => {
    e.stopPropagation();
    setSlideIndices((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) + 1) % Math.max(1, total),
    }));
  };

  const prevSlide = (e, id, total) => {
    e.stopPropagation();
    const len = Math.max(1, total);
    setSlideIndices((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) - 1 + len) % len,
    }));
  };

  const handlePinClick = (hotel) => {
    setSelectedHotelPin(hotel.id);
    if (mapExpanded) {
      if (onOpenHotelDetail) onOpenHotelDetail(hotel);
      else if (onSelectHotel) onSelectHotel(hotel);
      return;
    }
    const idxInList = filteredHotels.findIndex((x) => x.id === hotel.id);
    if (idxInList >= visibleCount) {
      setVisibleCount(idxInList + 10);
    }
    setTimeout(() => {
      const el = cardRefs.current[hotel.id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  };

  const handleOpenDetail = (hotel) => {
    if (onOpenHotelDetail) {
      onOpenHotelDetail(hotel);
    } else if (onSelectHotel) {
      onSelectHotel(hotel);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <div className="max-w-[1440px] mx-auto px-4 pt-3 pb-14">
        {/* Top Breadcrumb (`Главная > Стамбул`) + Map & Photo Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-[12px]">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-[#2563EB] hover:underline font-medium"
            >
              Главная
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[#4B5563] font-medium">{cityLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile / Tablet Controls (<1024px) */}
            <div className="flex lg:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="px-3 py-1 rounded-lg bg-[#F6D04D] text-[#111827] text-xs font-bold shadow-2xs"
              >
                {mobileFiltersOpen ? 'Скрыть фильтры' : 'Фильтры'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextMode = viewMode === 'map' ? 'list' : 'map';
                  setViewMode(nextMode);
                  setMapHidden(false);
                  setMapExpanded(nextMode === 'map');
                }}
                className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-[#111827] text-xs font-semibold shadow-2xs"
              >
                {viewMode === 'map' ? 'Показать список' : 'На карте'}
              </button>
            </div>

            {mapHidden && (
              <button
                type="button"
                onClick={() => setMapHidden(false)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[#2563EB] hover:bg-blue-50 font-semibold shadow-2xs flex items-center gap-1"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Показать карту</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowImages(!showImages)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-2xs"
            >
              {showImages ? 'Скрыть фото отелей' : 'Показать фото отелей'}
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3-COLUMN RESPONSIVE FLEX LAYOUT (ZERO CLIPPING)                     */}
        {/* Left: w-[250px] | Middle: flex-1 min-w-0 | Right: w-[380px]/440px   */}
        {/* =================================================================== */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* ================================================================= */}
          {/* COLUMN 1: LEFT FILTERS SIDEBAR (`w-[250px] shrink-0`)             */}
          {/* ================================================================= */}
          {!mapExpanded && (
            <aside
              className={`${mobileFiltersOpen ? 'block' : 'hidden'
                } lg:block w-full lg:w-[250px] shrink-0 space-y-3`}
            >
              {/* Search Summary Box */}
              <div
                onClick={onBackToDashboard}
                className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 cursor-pointer hover:border-gray-300 transition-all relative"
              >
                <div className="text-[13px] font-semibold text-[#2563EB] pr-5 truncate">
                  {searchParams.hotelDestination || cityLabel}
                </div>
                <div className="text-[11px] text-[#374151] mt-1">
                  {searchParams.checkIn || '12 нояб. 2026 г.'} —{' '}
                  {searchParams.checkOut || '19 нояб. 2026 г.'}
                </div>
                <div className="text-[11px] text-[#6B7280] mt-0.5">
                  {searchParams.rooms || 1} номер для{' '}
                  {(searchParams.adults || 2) + (searchParams.children || 0)}{' '}
                  гостей
                </div>
                <div className="text-[11px] text-[#6B7280]">
                  гражданство: {searchParams.citizenship || 'Узбекистан'}
                </div>
                <Search className="w-4 h-4 text-[#2563EB] absolute right-3.5 bottom-3.5" />
              </div>

              {/* Список / Карта Toggle Card */}
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-[#E5E7EB] p-2.5 shadow-sm">
                <div className="flex items-center justify-around mb-1.5 opacity-80">
                  <MapPin className="w-4 h-4 text-[#111827] fill-current" />
                  <MapPin className="w-5 h-5 text-[#111827] fill-current -mt-1" />
                  <MapPin className="w-4 h-4 text-[#111827] fill-current" />
                </div>
                <div className="bg-white rounded-lg p-0.5 grid grid-cols-2 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('list');
                      setMapExpanded(false);
                    }}
                    className={`py-1.5 text-[12px] rounded-md transition-colors ${viewMode === 'list'
                        ? 'font-semibold text-[#111827] bg-white shadow-sm'
                        : 'text-[#6B7280]'
                      }`}
                  >
                    Список
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('map');
                      setMapHidden(false);
                      setMapExpanded(true);
                    }}
                    className={`py-1.5 text-[12px] rounded-md transition-colors ${viewMode === 'map'
                        ? 'font-semibold text-[#111827] bg-gray-100'
                        : 'text-[#6B7280]'
                      }`}
                  >
                    Карта
                  </button>
                </div>
              </div>

              {/* Избранное Switch */}
              <div className="bg-white rounded-xl px-3.5 py-3 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#DC2626] fill-current" />
                  <span className="text-[13px] font-medium text-[#111827]">
                    Избранное
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFavoritesOnly(!favoritesOnly)}
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 ${favoritesOnly ? 'bg-[#F5C400]' : 'bg-gray-300'
                    }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${favoritesOnly ? 'translate-x-4' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>

              {/* Сортировка Dropdown */}
              <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 space-y-2">
                <label className="text-[13px] font-bold text-[#111827] block">
                  Сортировка
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-[38px] px-3 rounded-lg border border-gray-200 text-[12px] text-[#111827] bg-white focus:outline-none cursor-pointer"
                >
                  <option value="popular">По популярности</option>
                  <option value="price_asc">Сначала дешевле</option>
                  <option value="price_desc">Сначала дороже</option>
                  <option value="rating_desc">По оценке гостей</option>
                </select>
              </div>

              {/* Название отеля Text Input */}
              <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 space-y-2">
                <label className="text-[13px] font-bold text-[#111827] block">
                  Название отеля
                </label>
                <input
                  type="text"
                  value={hotelNameFilter}
                  onChange={(e) => setHotelNameFilter(e.target.value)}
                  placeholder="Например, Swissôtel или Hilton"
                  className="w-full h-[38px] px-3 rounded-lg border border-gray-200 text-[12px] text-[#111827] placeholder-gray-400 focus:outline-none focus:border-gray-400"
                />
              </div>

              {/* Питание Checkboxes with Dynamic Facet Counts */}
              <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 space-y-2.5">
                <label className="text-[13px] font-bold text-[#111827] block">
                  Питание
                </label>
                {[
                  {
                    code: 'RO',
                    label: 'Питание не включено',
                    count: facets.meal_counts?.RO ?? 0,
                  },
                  {
                    code: 'BB',
                    label: 'Завтрак включён',
                    count: facets.meal_counts?.BB ?? 0,
                  },
                  {
                    code: 'HB',
                    label: 'Завтрак + обед или ужин',
                    count: facets.meal_counts?.HB ?? 0,
                  },
                  {
                    code: 'FB',
                    label: 'Полный пансион (FB)',
                    count: facets.meal_counts?.FB ?? 0,
                  },
                  {
                    code: 'AI',
                    label: 'Всё включено',
                    count: facets.meal_counts?.AI ?? 0,
                  },
                ].map((m) => (
                  <label
                    key={m.code}
                    className="flex items-start justify-between gap-2 text-[12px] text-[#374151] cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selectedMeals.includes(m.code)}
                        onChange={() => toggleMealFilter(m.code)}
                        className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-[#F5C400] focus:ring-[#F5C400]"
                      />
                      <span className="leading-snug">{m.label}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {m.count}
                    </span>
                  </label>
                ))}
              </div>

              {/* Количество звёзд Yellow Star Checkboxes */}
              <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 space-y-2.5">
                <label className="text-[13px] font-bold text-[#111827] block">
                  Количество звёзд
                </label>
                {[
                  { stars: 5, count: facets.star_counts?.['5'] ?? 30 },
                  { stars: 4, count: facets.star_counts?.['4'] ?? 28 },
                  { stars: 3, count: facets.star_counts?.['3'] ?? 22 },
                  { stars: 2, count: facets.star_counts?.['2'] ?? 10 },
                  { stars: 0, count: facets.star_counts?.['0'] ?? 8 },
                ].map((row) => {
                  const checked = selectedStars.includes(row.stars);
                  return (
                    <label
                      key={row.stars}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStarFilter(row.stars)}
                          className="w-4 h-4 rounded border-gray-300 text-[#F5C400] focus:ring-[#F5C400]"
                        />
                        {row.stars === 0 ? (
                          <span className="text-[12px] text-[#374151]">
                            Без звёзд / Апартаменты
                          </span>
                        ) : (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: row.stars }).map((_, idx) => (
                              <Star
                                key={idx}
                                className="w-3.5 h-3.5 text-[#F59E0B] fill-current"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {row.count}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Сбросить фильтры Button */}
              <button
                type="button"
                onClick={resetAllFilters}
                className="w-full py-2.5 rounded-xl bg-gray-200/70 hover:bg-gray-200 text-[13px] font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                Сбросить фильтры
              </button>
            </aside>
          )}

          {/* ================================================================= */}
          {/* COLUMN 2: MIDDLE HOTEL CARDS LIST (`flex-1 min-w-0`)              */}
          {/* ================================================================= */}
          {!mapExpanded && (
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header Box (`Стамбул: доступно 98 вариантов` + active filter chips) */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-[19px] font-bold text-[#111827]">
                      {cityLabel}: {formatPluralVariants(totalCount)}
                    </h1>
                    {sourceMode === 'mock' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                        Демо-данные
                      </span>
                    )}
                  </div>
                  {loading && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#6B7280]" />
                  )}
                </div>

                {(selectedStars.length > 0 ||
                  selectedMeals.length > 0 ||
                  mapBbox ||
                  hotelNameFilter) && (
                    <>
                      <div className="text-[12px] text-[#6B7280]">
                        с применёнными фильтрами:
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {selectedStars.map((st) => (
                          <span
                            key={st}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-[12px] text-[#374151]"
                          >
                            <span>
                              {st === 0 ? 'Без звёзд' : `${st} звёзд`}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleStarFilter(st)}
                              className="text-gray-400 hover:text-gray-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {selectedMeals.map((meal) => (
                          <span
                            key={meal}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-[12px] text-[#374151]"
                          >
                            <span>Питание: {meal}</span>
                            <button
                              type="button"
                              onClick={() => toggleMealFilter(meal)}
                              className="text-gray-400 hover:text-gray-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {mapBbox && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-[#F6D04D] text-[12px] text-[#111827] font-medium">
                            <span>Область карты</span>
                            <button
                              type="button"
                              onClick={() => setMapBbox(null)}
                              className="hover:text-black"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                      </div>
                    </>
                  )}
              </div>

              {/* Hotel Cards List */}
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((sk) => (
                    <div
                      key={sk}
                      className="bg-white rounded-xl h-[205px] shadow-sm border border-gray-200 animate-pulse flex overflow-hidden"
                    >
                      <div className="w-[200px] bg-gray-200 shrink-0" />
                      <div className="flex-1 p-4 space-y-3">
                        <div className="h-5 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="h-16 bg-gray-100 rounded-lg mt-4" />
                      </div>
                      <div className="w-[175px] border-l border-gray-100 p-3 flex flex-col justify-between items-end">
                        <div className="w-9 h-9 bg-gray-200 rounded-lg" />
                        <div className="w-full h-9 bg-gray-200 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : fetchError ? (
                <div className="bg-white rounded-xl p-8 text-center border border-red-200 space-y-3">
                  <div className="text-base font-bold text-[#111827]">
                    {fetchError}
                  </div>
                  <button
                    type="button"
                    onClick={fetchHotelResults}
                    className="px-4 py-2 rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] text-xs font-bold"
                  >
                    Повторить
                  </button>
                </div>
              ) : filteredHotels.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-gray-200 space-y-2">
                  <div className="text-base font-bold text-[#111827]">
                    Отели по выбранным параметрам не найдены
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Сбросьте фильтр питания или звёздности, чтобы увидеть все доступные варианты в городе {cityLabel}.
                  </p>
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="px-4 py-2 rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] text-xs font-bold"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedHotels.map((hotel) => {
                    const imgs =
                      hotel.images && hotel.images.length > 0
                        ? hotel.images
                        : [FALLBACK_HOTEL_IMAGE];
                    const currentSlide = slideIndices[hotel.id] || 0;
                    const isFav = favorites[hotel.id];
                    const isHighlighted = selectedHotelPin === hotel.id;
                    const formattedPrice = Number(
                      hotel.total_price || 0
                    ).toLocaleString('ru-RU');
                    const formattedOld = Number(
                      hotel.old_price || 0
                    ).toLocaleString('ru-RU');

                    return (
                      <div
                        key={hotel.id}
                        ref={(el) => {
                          cardRefs.current[hotel.id] = el;
                        }}
                        onMouseEnter={() => setSelectedHotelPin(hotel.id)}
                        className="w-full overflow-hidden flex flex-col sm:flex-row bg-white rounded-xl shadow-sm border border-gray-200/85 hover:border-gray-300 hover:shadow-md transition-all"
                      >
                        {/* 1. Left Photo Thumbnail (`sm:w-[200px] shrink-0`) */}
                        <div
                          onClick={() => handleOpenDetail(hotel)}
                          className="w-full sm:w-[200px] h-[195px] sm:h-auto bg-gray-200 relative shrink-0 overflow-hidden cursor-pointer group"
                        >
                          {showImages ? (
                            <img
                              src={imgs[currentSlide % imgs.length]}
                              alt={hotel.name}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = FALLBACK_HOTEL_IMAGE;
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#E5E7EB] text-xs text-gray-500">
                              Фото скрыто
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(e, hotel.id)}
                            className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm z-10"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${isFav
                                  ? 'text-[#DC2626] fill-current'
                                  : 'text-[#374151]'
                                }`}
                            />
                          </button>

                          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-white/95 shadow-sm flex items-center gap-1 text-[10px] font-semibold text-[#2563EB]">
                            <span>до {hotel.loyalty_points}</span>
                            <span className="w-3.5 h-3.5 rounded-full bg-[#2563EB] text-white text-[9px] font-bold flex items-center justify-center">
                              P
                            </span>
                          </div>

                          {imgs.length > 1 && showImages && (
                            <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2.5 text-white text-[10px] font-semibold bg-gradient-to-t from-black/55 to-transparent pt-4 pb-0.5">
                              <button
                                type="button"
                                onClick={(e) =>
                                  prevSlide(e, hotel.id, imgs.length)
                                }
                                className="p-0.5 hover:scale-110 transition-transform"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <span>
                                {currentSlide + 1} / {hotel.slides_total || 36}
                              </span>
                              <button
                                type="button"
                                onClick={(e) =>
                                  nextSlide(e, hotel.id, imgs.length)
                                }
                                className="p-0.5 hover:scale-110 transition-transform"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 2. Center Info Block (`flex-1 min-w-0 px-4 py-3`) */}
                        <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-between gap-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                              {hotel.stars > 0 ? (
                                Array.from({ length: hotel.stars }).map(
                                  (_, i) => (
                                    <Star
                                      key={i}
                                      className="w-3 h-3 text-[#F59E0B] fill-current shrink-0"
                                    />
                                  )
                                )
                              ) : (
                                <span className="text-[10px] font-semibold text-gray-500 uppercase">
                                  Апартаменты
                                </span>
                              )}
                              {hotel.eco_certified && (
                                <Leaf className="w-3 h-3 text-[#16A34A] fill-current ml-1 shrink-0" />
                              )}
                            </div>

                            <h3
                              onClick={() => handleOpenDetail(hotel)}
                              title={hotel.name}
                              className="text-[15px] font-bold text-[#2563EB] hover:underline cursor-pointer truncate leading-snug"
                            >
                              {hotel.name}
                            </h3>

                            <div className="text-[11px] text-[#3B82F6] truncate mt-0.5">
                              {hotel.address}
                            </div>
                            <div className="text-[11px] text-[#4B5563] truncate mt-0.5">
                              {hotel.distance_center_label} • {hotel.nearest_metro}
                            </div>

                            <div className="flex items-center gap-2 text-[#6B7280] mt-1.5">
                              <Wifi className="w-3.5 h-3.5" />
                              <span className="w-3.5 h-3.5 rounded bg-[#111827] text-white text-[9px] font-bold flex items-center justify-center">
                                P
                              </span>
                              <Briefcase className="w-3.5 h-3.5" />
                              <Utensils className="w-3.5 h-3.5" />
                              <Accessibility className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          {/* Compact RateHawk Room & Conditions Box */}
                          <div className="rounded-lg bg-[#F8F9FA] border border-gray-100 p-2.5 space-y-1 min-w-0">
                            <div className="text-[12px] font-bold text-[#111827] truncate">
                              {hotel.room_type}
                            </div>
                            <div className="text-[11px] text-[#6B7280] truncate">
                              {hotel.bed_type}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px]">
                              <span
                                className={`inline-flex items-center gap-1 ${hotel.meal_included
                                    ? 'text-[#16A34A] font-medium'
                                    : 'text-[#4B5563]'
                                  }`}
                              >
                                <Utensils className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {hotel.meal_label}
                                </span>
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 ${hotel.free_cancellation
                                    ? 'text-[#16A34A] font-medium'
                                    : 'text-[#4B5563]'
                                  }`}
                              >
                                <RotateCcw className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {hotel.cancellation_label}
                                </span>
                              </span>
                              <span className="inline-flex items-center gap-1 text-[#4B5563]">
                                <CreditCard className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  Booking • Agoda • Trip.com
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Right Rating & Price Column (`sm:w-[175px] shrink-0`) — NEVER CLIPPED */}
                        <div className="w-full sm:w-[175px] shrink-0 flex sm:flex-col justify-between items-center sm:items-end p-3 border-t sm:border-t-0 sm:border-l border-gray-100 bg-white gap-2">
                          {/* Rating Badge */}
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-[11px] font-semibold text-[#111827] leading-tight">
                                {Number(hotel.rating) >= 9.0
                                  ? 'Превосходно'
                                  : Number(hotel.rating) >= 8.4
                                    ? 'Отлично'
                                    : 'Очень хорошо'}
                              </div>
                              <div className="text-[10px] text-[#6B7280]">
                                {Number(hotel.reviews_count || 0).toLocaleString(
                                  'ru-RU'
                                )}{' '}
                                отзыва
                              </div>
                            </div>
                            <div className="w-[34px] h-[36px] rounded-t-md rounded-b-lg bg-[#16A34A] text-white font-bold text-[13px] flex items-center justify-center shadow-2xs shrink-0">
                              {hotel.rating_label}
                            </div>
                          </div>

                          {/* Price + Full Yellow CTA Button */}
                          <div className="flex flex-col items-end w-auto sm:w-full">
                            {hotel.old_price > hotel.total_price && (
                              <div className="text-[11px] text-[#9CA3AF] line-through leading-none">
                                {formattedOld} $
                              </div>
                            )}
                            <div className="text-[19px] font-extrabold text-[#111827] leading-tight mt-0.5 whitespace-nowrap">
                              {formattedPrice} $
                            </div>
                            <div className="text-[10px] text-[#6B7280] leading-tight text-right mb-2">
                              за {hotel.nights} ночей, для {hotel.guests} гостей
                            </div>

                            <button
                              type="button"
                              onClick={() => setOffersModalHotel(hotel)}
                              className="w-full px-3 py-2 rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] text-[12px] font-bold transition-colors whitespace-nowrap text-center shadow-2xs cursor-pointer"
                            >
                              Смотреть цены
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination / Load More Button (`Показать ещё 20 вариантов`) */}
                  {remainingCount > 0 && (
                    <div className="pt-2 pb-4 flex flex-col items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleCount((prev) => prev + 20)
                        }
                        className="w-full sm:w-auto min-w-[300px] px-6 py-3 rounded-xl bg-white hover:bg-[#FFFDF5] border-2 border-[#F6D04D] text-[#111827] text-[13px] font-bold shadow-sm transition-all"
                      >
                        Показать ещё {Math.min(20, remainingCount)} вариантов
                        (осталось {remainingCount})
                      </button>
                      <span className="text-[11px] text-[#6B7280]">
                        Показано {paginatedHotels.length} из{' '}
                        {filteredHotels.length} отелей в городе {cityLabel}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* COLUMN 3: REAL INTERACTIVE LEAFLET MAP (`w-[380px] xl:w-[440px]`) */}
          {/* ================================================================= */}
          {!mapHidden && (
            <div
              className={`${mapExpanded
                  ? 'w-full'
                  : 'hidden lg:block lg:w-[380px] xl:w-[440px] shrink-0'
                } lg:sticky lg:top-[76px]`}
            >
              <HotelLeafletMap
                hotels={filteredHotels}
                cityCenter={cityCenter}
                cityLabel={cityLabel}
                selectedHotelId={selectedHotelPin}
                onSelectPin={handlePinClick}
                onOpenHotelDetail={handleOpenDetail}
                mapExpanded={mapExpanded}
                onToggleExpand={() => {
                  const next = !mapExpanded;
                  setMapExpanded(next);
                  setViewMode(next ? 'map' : 'list');
                }}
                onHideMap={() => {
                  setMapExpanded(false);
                  setViewMode('list');
                  setMapHidden(true);
                }}
                mapSearchText={mapSearchText}
                onChangeMapSearch={setMapSearchText}
                searchOnMapMove={searchOnMapMove}
                onToggleSearchOnMove={setSearchOnMapMove}
                onBoundsFilter={(bboxStr) => setMapBbox(bboxStr)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Stage 4: Multi-Platform Hotel Offers Modal (`Смотреть цены`) */}
      {offersModalHotel && (
        <HotelOffersModal
          hotel={offersModalHotel}
          searchParams={searchParams}
          onClose={() => setOffersModalHotel(null)}
          onOpenFullDetail={(h) => handleOpenDetail(h)}
        />
      )}
    </div>
  );
}
