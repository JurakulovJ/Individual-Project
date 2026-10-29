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
  Plus,
  Minus,
  Flag,
  Ruler,
  MapPin,
  Leaf,
  Loader2,
} from 'lucide-react';
import { searchHotels } from '../../services/api';

const MAP_CLUSTERS = [
  { id: 'c1', count: 3, x: 66, y: 34 },
  { id: 'c2', count: 2, x: 55, y: 37 },
  { id: 'c3', count: 30, x: 56, y: 42 },
  { id: 'c4', count: 3, x: 45, y: 49 },
  { id: 'c5', count: 8, x: 43, y: 58 },
  { id: 'c6', count: 4, x: 46, y: 63 },
];

export default function HotelResultsView({
  searchParams,
  onBackToDashboard,
  onSelectHotel,
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
    searchParams.stars?.length ? searchParams.stars : [5]
  );

  // Sync filters if user updated them on HeroSearch
  useEffect(() => {
    if (Array.isArray(searchParams.stars) && searchParams.stars.length > 0) {
      setSelectedStars(searchParams.stars);
    }
    if (Array.isArray(searchParams.meals)) {
      setSelectedMeals(searchParams.meals);
    }
  }, [searchParams.stars, searchParams.meals]);
  const [favorites, setFavorites] = useState({});
  const [slideIndices, setSlideIndices] = useState({});
  const [showImages, setShowImages] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [searchOnMapMove, setSearchOnMapMove] = useState(false);
  const [mapSearchText, setMapSearchText] = useState('');
  const [selectedHotelPin, setSelectedHotelPin] = useState('knickerbocker-nyc');
  const [mapBbox, setMapBbox] = useState(null);

  // Dynamic Backend Data State
  const [hotels, setHotels] = useState([]);
  const [providerSource, setProviderSource] = useState('mock_fallback');
  const [totalCount, setTotalCount] = useState(51);
  const [cityLabel, setCityLabel] = useState(
    searchParams.selectedCityShort ||
    (searchParams.hotelDestination || 'Нью-Йорк').split(',')[0].trim() ||
    'Нью-Йорк'
  );
  const [facets, setFacets] = useState({
    meal_counts: { RO: 51, BB: 31, HB: 0, FB: 0, AI: 0 },
    star_counts: { 5: 51, 4: 297, 3: 142, 2: 22 },
  });
  const [loading, setLoading] = useState(true);

  const cardRefs = useRef({});

  const fetchHotelResults = useCallback(async () => {
    setLoading(true);
    try {
      const data = await searchHotels({
        destination: searchParams.hotelDestination || 'Нью-Йорк',
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: searchParams.adults + searchParams.children,
        rooms: searchParams.rooms,
        citizenship: searchParams.citizenship,
        stars: selectedStars,
        meals: selectedMeals,
        freeCancellation: searchParams.freeCancellation,
        hotelName: hotelNameFilter || mapSearchText,
        sortBy,
        bbox: mapBbox,
      });
      setHotels(data.items || []);
      setProviderSource(data.source || 'mock_fallback');
      setTotalCount(data.total_count ?? data.items?.length ?? 0);
      setCityLabel(
        data.city_label ||
        searchParams.selectedCityShort ||
        (searchParams.hotelDestination || 'Нью-Йорк').split(',')[0].trim() ||
        'Нью-Йорк'
      );
      if (data.items?.length > 0) {
        setSelectedHotelPin(data.items[0].id);
      }
      if (data.facets) {
        setFacets(data.facets);
      }
    } catch {
      // Keep current list on transient network error
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

  const toggleFavorite = (id) => {
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
    setSelectedStars([5]);
    setMapBbox(null);
  };

  const displayedHotels = hotels.filter((h) => {
    if (favoritesOnly && !favorites[h.id]) return false;
    return true;
  });

  const nextSlide = (id, total) => {
    setSlideIndices((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) + 1) % total,
    }));
  };

  const prevSlide = (id, total) => {
    setSlideIndices((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) - 1 + total) % total,
    }));
  };

  const handlePinClick = (hotel) => {
    setSelectedHotelPin(hotel.id);
    const el = cardRefs.current[hotel.id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <div className="max-w-[1440px] mx-auto px-4 pt-3 pb-12">
        {/* Top Breadcrumb (`Главная > Нью-Йорк`) + Quick Photo Toggle */}
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
            <span className="text-[#4B5563]">{cityLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile / Tablet Controls (<1024px): Фильтры + Список/Карта */}
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
                  setMapExpanded(nextMode === 'map');
                }}
                className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-[#111827] text-xs font-semibold shadow-2xs"
              >
                {viewMode === 'map' ? 'Показать список' : 'На карте'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowImages(!showImages)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm"
            >
              {showImages ? 'Скрыть фото отелей' : 'Показать фото отелей'}
            </button>
          </div>
        </div>

        {/* 3-COLUMN SPLIT VIEW (FILTERS 245px | HOTEL CARDS | STICKY MAP) */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* ================================================================= */}
          {/* COLUMN 1: LEFT FILTERS SIDEBAR (245px)                            */}
          {/* ================================================================= */}
          {!mapExpanded && (
            <aside
              className={`${mobileFiltersOpen ? 'block' : 'hidden'
                } lg:block w-full lg:w-[245px] shrink-0 space-y-3`}
            >
              {/* Search Summary Box */}
              <div
                onClick={onBackToDashboard}
                className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 cursor-pointer hover:border-gray-300 transition-all relative"
              >
                <div className="text-[13px] font-semibold text-[#2563EB] pr-5 truncate">
                  {searchParams.hotelDestination ||
                    'Нью-Йорк, Соединенные Штаты Америки'}
                </div>
                <div className="text-[11px] text-[#374151] mt-1">
                  {searchParams.checkIn || '12 нояб. 2026 г.'} —{' '}
                  {searchParams.checkOut || '19 нояб. 2026 г.'}
                </div>
                <div className="text-[11px] text-[#6B7280] mt-0.5">
                  {searchParams.rooms} номер для{' '}
                  {searchParams.adults + searchParams.children} гостей
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
                <div className="relative">
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
                  placeholder="Например, Hilton"
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
                    count: facets.meal_counts?.RO ?? 51,
                  },
                  {
                    code: 'BB',
                    label: 'Завтрак включён',
                    count: facets.meal_counts?.BB ?? 31,
                  },
                  {
                    code: 'HB',
                    label: 'Завтрак + обед или ужин включены',
                    count: facets.meal_counts?.HB ?? 0,
                  },
                  {
                    code: 'FB',
                    label: 'Завтрак, обед и ужин включены',
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
                      <span className="leading-snug">
                        {m.label}{' '}
                        <span className="inline-flex w-3.5 h-3.5 items-center justify-center rounded bg-gray-100 text-[9px] text-gray-400 font-serif italic">
                          i
                        </span>
                      </span>
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
                  { stars: 5, count: facets.star_counts?.['5'] ?? 51 },
                  { stars: 4, count: facets.star_counts?.['4'] ?? 297 },
                  { stars: 3, count: facets.star_counts?.['3'] ?? 142 },
                  { stars: 2, count: facets.star_counts?.['2'] ?? 22 },
                  { stars: 0, count: facets.star_counts?.['0'] ?? 14 },
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
          {/* COLUMN 2: MIDDLE HOTEL CARDS LIST                                 */}
          {/* ================================================================= */}
          {!mapExpanded && (
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header Box (`Нью-Йорк: доступен X вариант` + removable filter chips) */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h1 className="text-[20px] font-bold text-[#111827]">
                    {cityLabel}: доступен {totalCount} вариант
                  </h1>
                  {loading && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#6B7280]" />
                  )}
                </div>
                <div className="text-[12px] text-[#6B7280]">
                  с применёнными фильтрами:
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedStars.map((st) => (
                    <span
                      key={st}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-[12px] text-[#374151]"
                    >
                      <span>{st} звёзд</span>
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-100 text-[12px] text-[#7C3AED] font-medium">
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
              </div>

              {/* Hotel Cards List */}
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((sk) => (
                    <div
                      key={sk}
                      className="bg-white rounded-xl h-[225px] shadow-sm border border-gray-200 animate-pulse flex overflow-hidden"
                    >
                      <div className="w-[225px] bg-gray-200 shrink-0" />
                      <div className="flex-1 p-4 space-y-3">
                        <div className="h-5 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="h-20 bg-gray-100 rounded-lg mt-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayedHotels.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-gray-200 space-y-2">
                  <div className="text-base font-bold text-[#111827]">
                    Отели по выбранным параметрам не найдены
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Сбросьте фильтр питания или звёздности, чтобы увидеть все доступные варианты.
                  </p>
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="px-4 py-2 rounded-xl bg-[#F6D04D] text-[#111827] text-xs font-bold"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedHotels.map((hotel) => {
                    const currentSlide = slideIndices[hotel.id] || 0;
                    const isFav = favorites[hotel.id];
                    const isHighlighted = selectedHotelPin === hotel.id;

                    return (
                      <div
                        key={hotel.id}
                        ref={(el) => {
                          cardRefs.current[hotel.id] = el;
                        }}
                        onMouseEnter={() => setSelectedHotelPin(hotel.id)}
                        className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col sm:flex-row min-h-[225px] transition-all ${isHighlighted
                          ? 'border-[#2563EB] ring-1 ring-[#2563EB]/30 shadow-md'
                          : 'border-gray-200/80 hover:shadow-md'
                          }`}
                      >
                        {/* Left Image Carousel (225px wide) */}
                        <div className="sm:w-[225px] h-[200px] sm:h-auto bg-[#DCDCDC] relative shrink-0 flex items-center justify-center overflow-hidden group">
                          {showImages && hotel.images?.[0] ? (
                            <img
                              src={
                                hotel.images[currentSlide % hotel.images.length]
                              }
                              alt={hotel.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
                          )}

                          <button
                            type="button"
                            onClick={() => toggleFavorite(hotel.id)}
                            className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm"
                          >
                            <Heart
                              className={`w-4 h-4 ${isFav
                                ? 'text-[#DC2626] fill-current'
                                : 'text-[#374151]'
                                }`}
                            />
                          </button>

                          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-white/95 shadow-sm flex items-center gap-1 text-[11px] font-semibold text-[#2563EB]">
                            <span>до {hotel.loyalty_points}</span>
                            <span className="w-3.5 h-3.5 rounded-full bg-[#2563EB] text-white text-[9px] font-bold flex items-center justify-center">
                              P
                            </span>
                          </div>

                          <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-3 text-white text-[11px] font-medium drop-shadow">
                            <button
                              type="button"
                              onClick={() =>
                                prevSlide(hotel.id, hotel.slides_total)
                              }
                              className="p-0.5 hover:scale-110 transition-transform"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span>
                              {currentSlide + 1} / {hotel.slides_total}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                nextSlide(hotel.id, hotel.slides_total)
                              }
                              className="p-0.5 hover:scale-110 transition-transform"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Center & Right Info Container */}
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-0.5 mb-0.5">
                                {Array.from({ length: hotel.stars }).map(
                                  (_, i) => (
                                    <Star
                                      key={i}
                                      className="w-3 h-3 text-[#F59E0B] fill-current"
                                    />
                                  )
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <h3
                                  onClick={() => onSelectHotel(hotel)}
                                  className="text-[16px] font-bold text-[#2563EB] hover:underline cursor-pointer truncate"
                                >
                                  {hotel.name}
                                </h3>
                                {hotel.eco_certified && (
                                  <Leaf className="w-3.5 h-3.5 text-[#16A34A] fill-current shrink-0" />
                                )}
                              </div>

                              <div className="text-[11px] text-[#3B82F6] mt-0.5">
                                {hotel.address}
                              </div>
                              <div className="text-[11px] text-[#374151] mt-0.5">
                                {hotel.distance_center_label}
                              </div>
                              <div className="text-[11px] text-[#374151]">
                                {hotel.nearest_metro}
                              </div>
                            </div>

                            {/* Right Rating Block */}
                            <div className="flex flex-col items-end shrink-0">
                              <div className="flex items-start gap-2">
                                <div className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <span className="text-[11px] font-bold text-[#111827]">
                                      🦉
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                      {[1, 2, 3, 4].map((c) => (
                                        <span
                                          key={c}
                                          className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"
                                        />
                                      ))}
                                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#16A34A] from-50% to-gray-200 to-50% border border-[#16A34A]" />
                                    </div>
                                  </div>
                                  <div className="text-[10px] text-[#6B7280] mt-0.5">
                                    {hotel.reviews_count} отзыва
                                  </div>
                                </div>

                                <div className="w-[34px] h-[38px] rounded-t-md rounded-b-lg bg-[#16A34A] text-white font-bold text-[14px] flex items-center justify-center shadow-sm">
                                  {hotel.rating_label}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 text-[#374151] mt-3">
                                <Wifi className="w-3.5 h-3.5" />
                                <span className="w-3.5 h-3.5 rounded bg-[#111827] text-white text-[9px] font-bold flex items-center justify-center">
                                  P
                                </span>
                                <Briefcase className="w-3.5 h-3.5" />
                                <Utensils className="w-3.5 h-3.5" />
                                <Accessibility className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>

                          {/* Middle Gray Box: Room Type + Meal/Cancellation + Price */}
                          <div className="mt-3 rounded-lg bg-[#F8F9FA] border border-gray-100 p-2.5 grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5 pr-2 border-r border-gray-200">
                              <div className="text-[12px] font-bold text-[#111827] leading-tight">
                                {hotel.room_type}
                              </div>
                              <div className="text-[11px] text-[#6B7280] mt-0.5">
                                {hotel.bed_type}
                              </div>
                            </div>

                            <div className="col-span-4 pl-1 space-y-1 text-[11px]">
                              <div
                                className={`flex items-center gap-1.5 ${hotel.meal_included
                                  ? 'text-[#16A34A] font-medium'
                                  : 'text-[#374151]'
                                  }`}
                              >
                                <Utensils className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {hotel.meal_label}
                                </span>
                              </div>
                              <div
                                className={`flex items-center gap-1.5 ${hotel.free_cancellation
                                  ? 'text-[#16A34A] font-medium'
                                  : 'text-[#374151]'
                                  }`}
                              >
                                <RotateCcw className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {hotel.cancellation_label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[#374151]">
                                <CreditCard className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {hotel.payment_type}
                                </span>
                              </div>
                            </div>

                            <div className="col-span-3 text-right">
                              <div className="text-[11px] text-[#6B7280] line-through">
                                {hotel.old_price} $
                              </div>
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-[17px] font-bold text-[#111827] leading-tight">
                                  {hotel.total_price} $
                                </span>
                                <span className="w-3.5 h-3.5 rounded bg-gray-200 text-gray-500 text-[9px] font-serif italic flex items-center justify-center">
                                  i
                                </span>
                              </div>
                              <div className="text-[9px] text-[#6B7280] leading-tight">
                                за {hotel.nights} ночей для {hotel.guests}{' '}
                                гостей
                              </div>
                            </div>
                          </div>

                          {/* Bottom Right CTA: Показать все номера */}
                          <div className="mt-2.5 flex justify-end">
                            <button
                              type="button"
                              onClick={() => onSelectHotel(hotel)}
                              className="px-4 py-2 rounded-lg bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] text-[12px] font-medium transition-colors"
                            >
                              Показать все номера
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* COLUMN 3: STICKY INTERACTIVE NYC MAP (SCREENSHOT 5)               */}
          {/* ================================================================= */}
          <div
            className={`${mapExpanded ? 'w-full' : 'w-full lg:w-[440px] xl:w-[480px]'
              } shrink-0 sticky top-[80px] h-[calc(100vh-100px)] min-h-[620px] rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-[#B5E2F7] relative select-none`}
          >
            {/* Custom Crisp New York / Manhattan Cartographic SVG Canvas */}
            <svg
              viewBox="0 0 500 700"
              className="w-full h-full object-cover"
              preserveAspectRatio="xMidYMid slice"
            >
              <rect width="500" height="700" fill="#Aadaff" />
              <polygon
                points="0,0 265,0 215,160 185,280 155,410 120,455 85,540 0,560"
                fill="#F4F3EE"
              />
              <polygon points="180,20 250,15 220,110 165,95" fill="#D5E8C8" />
              <polygon points="105,360 145,355 135,415 95,410" fill="#D5E8C8" />
              <polygon
                points="290,0 355,0 345,120 325,230 305,340 270,415 230,445 205,435 220,330 250,210 275,90"
                fill="#F7F6F1"
              />
              <polygon
                points="276,145 308,155 280,255 248,245"
                fill="#C8E6B6"
              />
              <polygon
                points="375,0 500,0 500,700 180,700 205,580 245,465 305,400 345,285 375,160"
                fill="#F4F3EE"
              />
              <polygon points="275,560 335,555 325,620 265,610" fill="#C8E6B6" />
              <circle cx="205" cy="480" r="12" fill="#D5E8C8" />
              <polygon points="0,610 125,625 140,700 0,700" fill="#F4F3EE" />

              <g stroke="#FCD34D" strokeWidth="2.2" fill="none" opacity="0.85">
                <path d="M35,0 L125,220 L85,430 L20,540" />
                <path d="M0,180 L215,215 L315,255 L500,295" />
                <path d="M295,0 L255,220 L225,425" />
                <path d="M335,0 L300,240 L265,410 L240,580 L210,700" />
                <path d="M235,435 L385,515 L500,560" />
                <path d="M350,260 L430,440 L390,700" />
              </g>

              <g stroke="#E5E7EB" strokeWidth="1" fill="none">
                <path d="M250,150 L330,175" />
                <path d="M240,190 L320,215" />
                <path d="M230,230 L315,255" />
                <path d="M220,270 L305,295" />
                <path d="M215,310 L295,335" />
                <path d="M210,350 L285,375" />
              </g>

              <g
                fontFamily="Inter, sans-serif"
                fontSize="11"
                fill="#4B5563"
                fontWeight="500"
              >
                <text x="85" y="45">
                  Palisades Park
                </text>
                <text x="80" y="88">
                  Ridgefield
                </text>
                <text x="115" y="132">
                  Cliffside Park
                </text>
                <text x="102" y="158">
                  Fairview
                </text>
                <text x="65" y="185" fontWeight="600">
                  North Bergen
                </text>
                <text x="90" y="220">
                  Guttenberg
                </text>
                <text x="65" y="242" fontWeight="600">
                  West New York
                </text>
                <text x="50" y="260">
                  Union City
                </text>
                <text x="5" y="228">
                  Secaucus
                </text>
                <text x="52" y="290">
                  Weehawken
                </text>
                <text x="55" y="375" fontWeight="600">
                  Hoboken
                </text>
                <text x="15" y="445" fontWeight="600">
                  Jersey City
                </text>
                <text x="200" y="328" fontWeight="700" fill="#111827">
                  {cityLabel.includes('Нью-Йорк')
                    ? 'Manhattan'
                    : 'Центр города'}
                </text>
                <text
                  x="150"
                  y="465"
                  fontSize="13"
                  fontWeight="700"
                  fill="#111827"
                >
                  {cityLabel.includes('Нью-Йорк') ? 'New York' : cityLabel}
                </text>
                <text x="315" y="645" fontWeight="600">
                  Brooklyn
                </text>
                <text x="120" y="595" fill="#2563EB" fontSize="11">
                  Upper New
                </text>
                <text x="125" y="610" fill="#2563EB" fontSize="11">
                  York Bay
                </text>
              </g>
            </svg>

            {/* Top Overlay Controls on Map */}
            <div className="absolute top-3 left-3 right-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setMapExpanded(!mapExpanded)}
                  className="h-[36px] px-3 rounded-full bg-white hover:bg-gray-50 shadow-md border border-gray-200 flex items-center gap-1.5 text-[12px] font-medium text-[#111827]"
                >
                  <ChevronLeft
                    className={`w-4 h-4 transition-transform ${mapExpanded ? 'rotate-180' : ''
                      }`}
                  />
                  <span>
                    {mapExpanded ? 'Свернуть карту' : 'Развернуть карту'}
                  </span>
                </button>

                <div className="flex items-center gap-1.5">
                  <label className="h-[36px] px-3 rounded-full bg-white shadow-md border border-gray-200 flex items-center gap-2 cursor-pointer text-[11px] text-[#374151]">
                    <input
                      type="checkbox"
                      checked={searchOnMapMove}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSearchOnMapMove(checked);
                        setMapBbox(checked ? '45,35,75,65' : null);
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-[#F5C400]"
                    />
                    <span className="leading-tight">
                      Искать при
                      <br />
                      перемещении карты
                    </span>
                  </label>

                  <button
                    type="button"
                    className="w-[36px] h-[36px] rounded-full bg-white hover:bg-gray-50 shadow-md border border-gray-200 flex items-center justify-center text-[#374151]"
                    title="Измерить расстояние"
                  >
                    <Ruler className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    className="w-[36px] h-[36px] rounded-full bg-white hover:bg-gray-50 shadow-md border border-gray-200 flex items-center justify-center text-[#374151]"
                    title="Ориентиры"
                  >
                    <Flag className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>

              {/* Map Location Search Input */}
              <div className="self-end w-[235px] h-[36px] rounded-full bg-white shadow-md border border-gray-200 px-3 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={mapSearchText}
                  onChange={(e) => setMapSearchText(e.target.value)}
                  placeholder="Введите местоположение"
                  className="w-full text-[12px] text-[#111827] placeholder-gray-400 focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Dark Numbered Cluster Circles */}
            {MAP_CLUSTERS.map((cluster) => (
              <button
                key={cluster.id}
                type="button"
                onClick={() => setMapBbox('40,30,70,65')}
                style={{ left: `${cluster.x}%`, top: `${cluster.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#374151] hover:bg-[#111827] text-white font-bold shadow-lg border-2 border-white/80 flex items-center justify-center transition-transform hover:scale-110 ${cluster.count >= 20
                  ? 'w-9 h-9 text-[13px]'
                  : 'w-7 h-7 text-[12px]'
                  }`}
              >
                {cluster.count}
              </button>
            ))}

            {/* Dynamic Hotel Pins from API */}
            {displayedHotels.map((hotel) => {
              const x = hotel.coordinates?.x || 54;
              const y = hotel.coordinates?.y || 49;
              const isSelected = selectedHotelPin === hotel.id;

              if (hotel.is_highlighted_pin) {
                return (
                  <div
                    key={hotel.id}
                    onClick={() => handlePinClick(hotel)}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-full cursor-pointer z-20 transition-transform hover:scale-110"
                    title={hotel.name}
                  >
                    <div className="relative flex flex-col items-center">
                      <Flag className="w-6 h-6 text-[#DC2626] fill-current drop-shadow" />
                      <span className="w-2 h-2 rounded-full bg-[#2563EB] border border-white -mt-1" />
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={hotel.id}
                  type="button"
                  onClick={() => handlePinClick(hotel)}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full font-bold text-[12px] shadow-md border transition-transform hover:scale-105 z-20 ${isSelected
                    ? 'bg-[#F6D04D] text-[#111827] border-[#111827]'
                    : 'bg-white hover:bg-[#F6D04D] text-[#111827] border-gray-300'
                    }`}
                >
                  {hotel.map_price_label || `${hotel.total_price} $`}
                </button>
              );
            })}

            {/* Right Zoom Controls */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col divide-y divide-gray-200">
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-50"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            <div className="absolute bottom-2 left-3 px-2 py-0.5 bg-white/80 rounded text-[10px] text-gray-700 border-b-2 border-x border-gray-600 leading-none">
              2 km
            </div>
            <div className="absolute bottom-1 right-2 text-[9px] text-gray-600 bg-white/70 px-1.5 rounded">
              © Участники <span className="text-[#2563EB]">OpenStreetMap</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
