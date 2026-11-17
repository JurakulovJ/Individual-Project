import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Heart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  Wifi,
  Car,
  Users,
  Utensils,
  RotateCcw,
  CreditCard,
  X,
  MapPin,
  Loader2,
  Map as MapIcon,
  Check,
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

function formatPluralReviews(count) {
  const n = Number(count || 0);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} отзыв`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${n} отзыва`;
  }
  return `${n} отзывов`;
}

const MEAL_FILTER_LABELS = {
  RO: 'Питание не включено',
  BB: 'Завтрак включён',
  HB: 'Завтрак + обед или ужин',
  FB: 'Полный пансион',
  AI: 'Всё включено',
};

/**
 * Custom RateHawk B2B Yellow Checkbox (`#fddd55` fill with `#2d3137` check)
 */
function RateHawkCheckbox({ checked, onChange }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
        checked
          ? 'bg-[#fddd55] text-[#2d3137]'
          : 'bg-[#f4f4f4] hover:bg-[#e5e5e5]'
      }`}
    >
      {checked && <Check className="w-3.5 h-3.5 stroke-[3] text-[#2d3137]" />}
    </button>
  );
}

/**
 * Small gray info circle `i` icon matching RateHawk reference (`#e5e5e5` / `#868686`)
 */
function InfoBadge({ title, onClick }) {
  return (
    <span
      title={title}
      onClick={onClick}
      className="w-[15px] h-[15px] rounded-full bg-[#e5e5e5] text-[#868686] hover:bg-[#c8c8c8] hover:text-[#2d3137] text-[10px] font-bold inline-flex items-center justify-center shrink-0 select-none cursor-pointer transition-colors"
    >
      i
    </span>
  );
}

/**
 * Tripadvisor Owl SVG + 5 Green Rating Circles (`#00AA6C`)
 */
function TripadvisorRatingRow({ rating = 9.2 }) {
  const numCircles = 5;
  const fullCount = rating >= 9.0 ? 5 : rating >= 8.0 ? 4 : 3;

  return (
    <div className="flex items-center gap-1.5">
      <svg
        viewBox="0 0 24 16"
        className="w-[20px] h-[14px] text-[#2d3137] shrink-0"
        fill="currentColor"
      >
        <path d="M12 2C7.8 2 4.3 3.9 2 6.8L0 5.5V9.5C0 12.8 2.7 15.5 6 15.5C8.3 15.5 10.3 14.2 11.3 12.3L12 13.5L12.7 12.3C13.7 14.2 15.7 15.5 18 15.5C21.3 15.5 24 12.8 24 9.5V5.5L22 6.8C19.7 3.9 16.2 2 12 2ZM6 13.5C3.8 13.5 2 11.7 2 9.5C2 7.3 3.8 5.5 6 5.5C8.2 5.5 10 7.3 10 9.5C10 11.7 8.2 13.5 6 13.5ZM18 13.5C15.8 13.5 14 11.7 14 9.5C14 7.3 15.8 5.5 18 5.5C20.2 5.5 22 7.3 22 9.5C22 11.7 20.2 13.5 18 13.5ZM6 7.5C4.9 7.5 4 8.4 4 9.5C4 10.6 4.9 11.5 6 11.5C7.1 11.5 8 10.6 8 9.5C8 8.4 7.1 7.5 6 7.5ZM18 7.5C16.9 7.5 16 8.4 16 9.5C16 10.6 16.9 11.5 18 11.5C19.1 11.5 20 10.6 20 9.5C20 8.4 19.1 7.5 18 7.5Z" />
      </svg>

      <div className="flex items-center gap-[2.5px]">
        {Array.from({ length: numCircles }).map((_, idx) => (
          <span
            key={idx}
            className={`w-[11px] h-[11px] rounded-full border border-[#00AA6C] ${
              idx < fullCount ? 'bg-[#00AA6C]' : 'bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Pool Swimmer SVG Icon matching RateHawk amenity row
 */
function PoolSwimmerIcon({ className = 'w-[16px] h-[15px]' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="16.5" cy="6.5" r="2.5" />
      <path d="M5 13l4.5-3.5 3.5 2.5 4-2" />
      <path d="M2 18c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0" />
      <path d="M2 22c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0" />
    </svg>
  );
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

  // Additional B2B Left Sidebar Filters
  const [freeCancelOnly, setFreeCancelOnly] = useState(false);
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState([]);
  const [minRatingFilter, setMinRatingFilter] = useState(null);
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedBedTypes, setSelectedBedTypes] = useState([]);
  const [showCompactFiltersPopover, setShowCompactFiltersPopover] =
    useState(false);

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
      (searchParams.hotelDestination || 'Бали').split(',')[0].trim() ||
      'Бали'
  );
  const [facets, setFacets] = useState({
    meal_counts: { RO: 329, BB: 329, HB: 329, FB: 329, AI: 329 },
    star_counts: { 5: 329, 4: 1238, 3: 1838, 2: 240, 0: 115 },
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
        destination: searchParams.hotelDestination || 'Бали, Индонезия',
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: (searchParams.adults || 2) + (searchParams.children || 0),
        rooms: searchParams.rooms || 1,
        citizenship: searchParams.citizenship,
        stars: selectedStars,
        meals: selectedMeals,
        freeCancellation: searchParams.freeCancellation || freeCancelOnly,
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
          (searchParams.hotelDestination || 'Бали').split(',')[0].trim() ||
          'Бали'
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
    freeCancelOnly,
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

  const toggleArrayItem = (setter, value) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  const resetAllFilters = () => {
    setFavoritesOnly(false);
    setHotelNameFilter('');
    setMapSearchText('');
    setSelectedMeals([]);
    setSelectedStars([]);
    setFreeCancelOnly(false);
    setSelectedPaymentTypes([]);
    setMinRatingFilter(null);
    setMinPriceFilter('');
    setMaxPriceFilter('');
    setSelectedPropertyTypes([]);
    setSelectedAmenities([]);
    setSelectedBedTypes([]);
    setMapBbox(null);
  };

  const filteredHotels = hotels.filter((h) => {
    if (favoritesOnly && !favorites[h.id]) return false;
    if (freeCancelOnly && !h.free_cancellation) return false;
    if (minRatingFilter && Number(h.rating || 0) < minRatingFilter) {
      return false;
    }
    if (minPriceFilter && Number(h.total_price || 0) < Number(minPriceFilter)) {
      return false;
    }
    if (maxPriceFilter && Number(h.total_price || 0) > Number(maxPriceFilter)) {
      return false;
    }
    if (selectedBedTypes.length > 0) {
      const bedLow = String(h.bed_type || '').toLowerCase();
      const matchBed = selectedBedTypes.some((bt) =>
        bt === 'double'
          ? bedLow.includes('двуспальн') || bedLow.includes('king')
          : bedLow.includes('отдельн') || bedLow.includes('twin')
      );
      if (!matchBed) return false;
    }
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

  // Build active filter pills for the header bar
  const activeFilterChips = [];
  selectedMeals.forEach((meal) => {
    activeFilterChips.push({
      key: `meal-${meal}`,
      label: MEAL_FILTER_LABELS[meal] || `Питание: ${meal}`,
      onRemove: () => toggleMealFilter(meal),
    });
  });
  selectedStars.forEach((st) => {
    activeFilterChips.push({
      key: `star-${st}`,
      label: st === 0 ? 'Без звёзд' : `${st} звёзд`,
      onRemove: () => toggleStarFilter(st),
    });
  });
  if (freeCancelOnly) {
    activeFilterChips.push({
      key: 'free-cancel',
      label: 'Бесплатная отмена',
      onRemove: () => setFreeCancelOnly(false),
    });
  }
  if (minRatingFilter) {
    activeFilterChips.push({
      key: 'min-rating',
      label: `Оценка ${minRatingFilter}+`,
      onRemove: () => setMinRatingFilter(null),
    });
  }
  selectedPaymentTypes.forEach((pt) => {
    activeFilterChips.push({
      key: `pay-${pt}`,
      label: pt,
      onRemove: () => toggleArrayItem(setSelectedPaymentTypes, pt),
    });
  });
  selectedAmenities.forEach((am) => {
    activeFilterChips.push({
      key: `am-${am}`,
      label: am,
      onRemove: () => toggleArrayItem(setSelectedAmenities, am),
    });
  });
  selectedPropertyTypes.forEach((pt) => {
    activeFilterChips.push({
      key: `prop-${pt}`,
      label: pt,
      onRemove: () => toggleArrayItem(setSelectedPropertyTypes, pt),
    });
  });
  if (mapBbox) {
    activeFilterChips.push({
      key: 'bbox',
      label: 'Область карты',
      onRemove: () => setMapBbox(null),
    });
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#2d3137]">
      <div className="w-full pl-3 sm:pl-4 lg:pl-5 pr-3 lg:pr-0 pt-2.5 pb-14">
        {/* =================================================================== */}
        {/* TOP BREADCRUMBS (`Главная > Бали`) & QUICK VIEW CONTROLS            */}
        {/* =================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pr-0 lg:pr-4">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[14px]"
          >
            <button
              type="button"
              onClick={onBackToDashboard}
              className="text-[#4086e4] hover:underline font-normal cursor-pointer"
            >
              Главная
            </button>
            <ChevronRight className="w-4 h-4 text-[#868686] stroke-[1.8]" />
            <span className="text-[#2d3137] font-normal">{cityLabel}</span>
          </nav>

          <div className="flex items-center gap-2">
            {/* Mobile / Tablet Controls (<= 1100px) */}
            <div className="flex min-[1101px]:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="px-3.5 py-1.5 rounded-lg bg-[#fddd55] hover:bg-[#ffd300] text-[#2d3137] text-[13px] font-semibold rh-card-shadow"
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
                className="px-3.5 py-1.5 rounded-lg bg-white text-[#2d3137] text-[13px] font-medium rh-card-shadow"
              >
                {viewMode === 'map' ? 'Список' : 'Карта'}
              </button>
            </div>

            {mapHidden && (
              <button
                type="button"
                onClick={() => setMapHidden(false)}
                className="text-[13px] px-3 py-1.5 rounded-lg bg-white text-[#4086e4] hover:bg-blue-50 font-medium rh-card-shadow flex items-center gap-1.5 cursor-pointer"
              >
                <MapIcon className="w-4 h-4" />
                <span>Показать карту</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowImages(!showImages)}
              className="text-[13px] px-3 py-1.5 rounded-lg bg-white text-[#868686] hover:text-[#2d3137] rh-card-shadow cursor-pointer transition-colors"
            >
              {showImages ? 'Скрыть фото отелей' : 'Показать фото отелей'}
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* FULL-WIDTH 3-COLUMN B2B SPLIT-VIEW LAYOUT                           */}
        {/* Filters & 800px Hotel Cards stay FIXED width on the left;           */}
        {/* OpenStreetMap (`min-[1101px]:flex-1`) grows dynamically on right!   */}
        {/* =================================================================== */}
        <div className="flex flex-col lg:flex-row gap-3.5 items-start w-full">
          {/* ================================================================= */}
          {/* COLUMN 1: LEFT FILTERS SIDEBAR (NO GRAY STROKES, SOFT SHADOW)     */}
          {/* ================================================================= */}
          <aside
            className={`${
              mobileFiltersOpen ? 'block' : 'hidden'
            } lg:block w-full ${
              mapExpanded
                ? 'lg:w-[226px] xl:w-[234px]'
                : 'lg:w-[232px] xl:w-[242px]'
            } shrink-0 space-y-2.5`}
          >
            {/* 1. Search Summary Box */}
            <div
              onClick={onBackToDashboard}
              className="bg-white rounded-[12px] p-3.5 rh-card-shadow rh-card-shadow-hover cursor-pointer relative"
            >
              <div className="text-[15.5px] font-medium text-[#4086e4] pr-6 truncate leading-snug">
                {searchParams.hotelDestination || `${cityLabel}, Индонезия`}
              </div>
              <div className="text-[13.5px] text-[#2d3137] mt-1 pr-6 leading-snug">
                {searchParams.checkIn || '3 мар 2027'} —{' '}
                {searchParams.checkOut || '10 мар 2027'}
              </div>
              <div className="text-[13.5px] text-[#868686] mt-0.5 pr-6 leading-snug">
                {searchParams.rooms || 1} номер для{' '}
                {(searchParams.adults || 2) + (searchParams.children || 0)}{' '}
                гостей
              </div>
              <div className="text-[13.5px] text-[#868686] pr-7 leading-snug truncate">
                гражданство: {searchParams.citizenship || 'Узбекистан'}
              </div>
              <Search className="w-[18px] h-[18px] text-[#4086e4] stroke-[2.2] absolute right-3.5 bottom-3.5 pointer-events-none" />
            </div>

            {/* 2. Список / Карта Toggle Card with Map Background Graphic & `#fddd55` Active Bar */}
            <div className="relative rounded-[12px] overflow-hidden bg-[#e5e5e5] pt-5 pb-2 px-2 rh-card-shadow">
              <svg
                className="absolute inset-0 w-full h-full opacity-55 pointer-events-none"
                viewBox="0 0 240 80"
                fill="none"
              >
                <path d="M0 20 L240 55" stroke="#FFFFFF" strokeWidth="4" />
                <path d="M50 0 L130 80" stroke="#FFFFFF" strokeWidth="3.5" />
                <path d="M180 0 L110 80" stroke="#FFFFFF" strokeWidth="3" />
              </svg>
              <div className="relative z-10 flex items-center justify-around px-6 mb-1">
                <MapPin className="w-4 h-4 text-[#2d3137] fill-current" />
                <MapPin className="w-5 h-5 text-[#2d3137] fill-current -mt-2" />
                <MapPin className="w-4 h-4 text-[#2d3137] fill-current" />
              </div>

              <div className="relative z-10 bg-white rounded-[9px] h-[40px] grid grid-cols-2 rh-card-shadow overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('list');
                    setMapExpanded(false);
                  }}
                  className={`relative h-full text-[14.5px] flex items-center justify-center transition-colors cursor-pointer ${
                    !mapExpanded
                      ? 'font-medium text-[#2d3137]'
                      : 'font-normal text-[#868686] hover:text-[#2d3137]'
                  }`}
                >
                  <span>Список</span>
                  {!mapExpanded && (
                    <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-[#fddd55] rounded-t-full" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewMode('map');
                    setMapHidden(false);
                    setMapExpanded(true);
                  }}
                  className={`relative h-full text-[14.5px] flex items-center justify-center border-l border-[#f4f4f4] transition-colors cursor-pointer ${
                    mapExpanded
                      ? 'font-medium text-[#2d3137]'
                      : 'font-normal text-[#868686] hover:text-[#2d3137]'
                  }`}
                >
                  <span>Карта</span>
                  {mapExpanded && (
                    <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-[#fddd55] rounded-t-full" />
                  )}
                </button>
              </div>
            </div>

            {/* 3. Избранное Switch */}
            <div className="bg-white rounded-[12px] px-3.5 py-3 rh-card-shadow flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Heart className="w-[18px] h-[18px] text-[#ce2121] fill-current" />
                <span className="text-[14.5px] font-normal text-[#2d3137]">
                  Избранное
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                className={`w-[42px] h-[24px] rounded-full transition-colors p-0.5 cursor-pointer ${
                  favoritesOnly ? 'bg-[#fddd55]' : 'bg-[#c8c8c8]'
                }`}
              >
                <div
                  className={`w-[20px] h-[20px] rounded-full bg-white shadow-xs transition-transform ${
                    favoritesOnly ? 'translate-x-[18px]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 4. Сортировка Dropdown */}
            <div className="bg-white rounded-[12px] p-3.5 rh-card-shadow space-y-2.5">
              <label className="text-[15.5px] font-bold text-[#2d3137] block">
                Сортировка
              </label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-[40px] pl-3 pr-8 rounded-[8px] bg-[#f4f4f4] hover:bg-[#ebebeb] text-[14px] text-[#2d3137] appearance-none focus:outline-none focus:ring-2 focus:ring-[#fddd55] transition-colors cursor-pointer"
                >
                  <option value="popular">По популярности</option>
                  <option value="price_asc">Сначала дешёвые</option>
                  <option value="price_desc">Сначала дорогие</option>
                  <option value="rating_desc">По высокой оценке</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#2d3137] stroke-[2.2] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 5. Название отеля Input */}
            <div className="bg-white rounded-[12px] p-3.5 rh-card-shadow space-y-2.5">
              <label className="text-[15.5px] font-bold text-[#2d3137] block">
                Название отеля
              </label>
              <input
                type="text"
                value={hotelNameFilter}
                onChange={(e) => setHotelNameFilter(e.target.value)}
                placeholder="Например, Hilton"
                className="w-full h-[40px] px-3 rounded-[8px] bg-[#f4f4f4] focus:bg-white text-[14px] text-[#2d3137] placeholder-[#afafaf] focus:outline-none focus:ring-2 focus:ring-[#fddd55] transition-colors"
              />
            </div>

            {/* 6. Питание Checkboxes with Info `i` Badges & Counts */}
            <div className="bg-white rounded-[12px] p-3.5 rh-card-shadow space-y-3">
              <label className="text-[15.5px] font-bold text-[#2d3137] block">
                Питание
              </label>
              {[
                {
                  code: 'RO',
                  label: 'Питание не включено',
                  count: facets.meal_counts?.RO ?? 329,
                },
                {
                  code: 'BB',
                  label: 'Завтрак включён',
                  count: facets.meal_counts?.BB ?? 329,
                },
                {
                  code: 'HB',
                  label: 'Завтрак + обед или ужин включены',
                  count: facets.meal_counts?.HB ?? 329,
                },
                {
                  code: 'FB',
                  label: 'Завтрак, обед и ужин включены',
                  count: facets.meal_counts?.FB ?? 329,
                },
                {
                  code: 'AI',
                  label: 'Всё включено',
                  count: facets.meal_counts?.AI ?? 329,
                },
              ].map((m) => {
                const checked = selectedMeals.includes(m.code);
                return (
                  <div
                    key={m.code}
                    onClick={() => toggleMealFilter(m.code)}
                    className="flex items-start justify-between gap-2 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        <RateHawkCheckbox
                          checked={checked}
                          onChange={() => {}}
                        />
                      </div>
                      <span className="text-[13.5px] text-[#2d3137] leading-[1.3]">
                        {m.label}{' '}
                        <InfoBadge title={`Тариф с питанием: ${m.label}`} />
                      </span>
                    </div>
                    {!checked && (
                      <span className="text-[12px] text-[#afafaf] shrink-0 mt-0.5">
                        {m.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 7. Количество звёзд Checkboxes */}
            <div className="bg-white rounded-[12px] p-3.5 rh-card-shadow space-y-3">
              <label className="text-[15.5px] font-bold text-[#2d3137] block">
                Количество звёзд
              </label>
              {[
                { stars: 5, count: facets.star_counts?.['5'] ?? 329 },
                { stars: 4, count: facets.star_counts?.['4'] ?? 1238 },
                { stars: 3, count: facets.star_counts?.['3'] ?? 1838 },
                { stars: 2, count: facets.star_counts?.['2'] ?? 240 },
                { stars: 0, count: facets.star_counts?.['0'] ?? 115 },
              ].map((row) => {
                const checked = selectedStars.includes(row.stars);
                return (
                  <div
                    key={row.stars}
                    onClick={() => toggleStarFilter(row.stars)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <RateHawkCheckbox checked={checked} onChange={() => {}} />
                      {row.stars === 0 ? (
                        <div className="flex items-center gap-1.5 text-[13.5px] text-[#2d3137]">
                          <Star className="w-[17px] h-[17px] text-[#F5A623] fill-current shrink-0" />
                          <span>или без звёзд</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: row.stars }).map((_, idx) => (
                            <Star
                              key={idx}
                              className="w-[17px] h-[17px] text-[#F5A623] fill-current"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {!checked && (
                      <span className="text-[12px] text-[#afafaf]">
                        {row.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 8. Условия отмены и оплаты */}
            <div className="bg-white rounded-[12px] p-3.5 rh-card-shadow space-y-3">
              <label className="text-[15.5px] font-bold text-[#2d3137] block">
                Оплата и отмена
              </label>
              <div
                onClick={() => setFreeCancelOnly(!freeCancelOnly)}
                className="flex items-center justify-between gap-2 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <RateHawkCheckbox
                    checked={freeCancelOnly}
                    onChange={() => {}}
                  />
                  <span className="text-[13.5px] text-[#2d3137]">
                    Бесплатная отмена{' '}
                    <InfoBadge title="Полный возврат средств при отмене до наступления штрафного периода" />
                  </span>
                </div>
              </div>

              {[
                { label: 'Оплата на сайте', count: 284 },
                { label: 'Оплата по безналу', count: 312 },
                { label: 'Оплата в отеле', count: 145 },
              ].map((item) => {
                const checked = selectedPaymentTypes.includes(item.label);
                return (
                  <div
                    key={item.label}
                    onClick={() =>
                      toggleArrayItem(setSelectedPaymentTypes, item.label)
                    }
                    className="flex items-center justify-between gap-2 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <RateHawkCheckbox checked={checked} onChange={() => {}} />
                      <span className="text-[13.5px] text-[#2d3137]">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#afafaf]">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 9. Бюджет / Цена за весь период */}
            <div className="bg-white rounded-[12px] p-3.5 rh-card-shadow space-y-2.5">
              <label className="text-[15.5px] font-bold text-[#2d3137] block">
                Цена, $
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={minPriceFilter}
                  onChange={(e) => setMinPriceFilter(e.target.value)}
                  placeholder="от 50"
                  className="w-full h-[38px] px-2.5 rounded-[8px] bg-[#f4f4f4] focus:bg-white text-[13.5px] text-[#2d3137] placeholder-[#afafaf] focus:outline-none focus:ring-2 focus:ring-[#fddd55]"
                />
                <input
                  type="number"
                  value={maxPriceFilter}
                  onChange={(e) => setMaxPriceFilter(e.target.value)}
                  placeholder="до 10000"
                  className="w-full h-[38px] px-2.5 rounded-[8px] bg-[#f4f4f4] focus:bg-white text-[13.5px] text-[#2d3137] placeholder-[#afafaf] focus:outline-none focus:ring-2 focus:ring-[#fddd55]"
                />
              </div>
            </div>

            {/* 10. Оценка по отзывам */}
            <div className="bg-white rounded-[12px] p-3.5 rh-card-shadow space-y-3">
              <label className="text-[15.5px] font-bold text-[#2d3137] block">
                Оценка по отзывам
              </label>
              {[
                { score: 9.0, label: 'Супер: 9+', count: 142 },
                { score: 8.0, label: 'Отлично: 8+', count: 268 },
                { score: 7.0, label: 'Хорошо: 7+', count: 315 },
                { score: 6.0, label: 'Достаточно хорошо: 6+', count: 329 },
              ].map((r) => {
                const checked = minRatingFilter === r.score;
                return (
                  <div
                    key={r.score}
                    onClick={() =>
                      setMinRatingFilter(checked ? null : r.score)
                    }
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <RateHawkCheckbox checked={checked} onChange={() => {}} />
                      <span className="text-[13.5px] text-[#2d3137]">
                        {r.label}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#afafaf]">
                      {r.count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 11. Удобства в отеле */}
            <div className="bg-white rounded-[12px] p-3.5 rh-card-shadow space-y-3">
              <label className="text-[15.5px] font-bold text-[#2d3137] block">
                Удобства в отеле
              </label>
              {[
                { label: 'Бесплатный интернет', count: 325 },
                { label: 'Трансфер', count: 290 },
                { label: 'Парковка', count: 310 },
                { label: 'Бассейн', count: 276 },
                { label: 'Подходит для детей', count: 248 },
                { label: 'Спа и велнес', count: 194 },
                { label: 'Собственный пляж', count: 112 },
                { label: 'Тренажёрный зал', count: 215 },
              ].map((am) => {
                const checked = selectedAmenities.includes(am.label);
                return (
                  <div
                    key={am.label}
                    onClick={() =>
                      toggleArrayItem(setSelectedAmenities, am.label)
                    }
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <RateHawkCheckbox checked={checked} onChange={() => {}} />
                      <span className="text-[13.5px] text-[#2d3137]">
                        {am.label}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#afafaf]">
                      {am.count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 12. Тип размещения & Тип кровати */}
            <div className="bg-white rounded-[12px] p-3.5 rh-card-shadow space-y-3">
              <label className="text-[15.5px] font-bold text-[#2d3137] block">
                Тип размещения
              </label>
              {[
                { label: 'Отели', count: 214 },
                { label: 'Курортные отели (Resorts)', count: 86 },
                { label: 'Виллы и бунгало', count: 64 },
                { label: 'Апартаменты', count: 48 },
              ].map((pt) => {
                const checked = selectedPropertyTypes.includes(pt.label);
                return (
                  <div
                    key={pt.label}
                    onClick={() =>
                      toggleArrayItem(setSelectedPropertyTypes, pt.label)
                    }
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <RateHawkCheckbox checked={checked} onChange={() => {}} />
                      <span className="text-[13.5px] text-[#2d3137]">
                        {pt.label}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#afafaf]">
                      {pt.count}
                    </span>
                  </div>
                );
              })}

              <div className="border-t border-[#f4f4f4] pt-2.5 space-y-2.5">
                <label className="text-[14.5px] font-bold text-[#2d3137] block">
                  Кровати в номере
                </label>
                {[
                  { id: 'double', label: 'Двуспальная кровать' },
                  { id: 'twin', label: '2 отдельные кровати' },
                ].map((b) => {
                  const checked = selectedBedTypes.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => toggleArrayItem(setSelectedBedTypes, b.id)}
                      className="flex items-center gap-2.5 cursor-pointer select-none"
                    >
                      <RateHawkCheckbox checked={checked} onChange={() => {}} />
                      <span className="text-[13.5px] text-[#2d3137]">
                        {b.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 13. Bottom Reset Filters Button (`--button-secondary-bg: #e5e5e5`) */}
            <button
              type="button"
              onClick={resetAllFilters}
              className="w-full py-3 rounded-[12px] bg-[#e5e5e5] hover:bg-[#c7c7c7] active:bg-[#b0b0b0] text-[14.5px] font-medium text-[#868686] hover:text-[#2d3137] transition-colors cursor-pointer"
            >
              Сбросить фильтры
            </button>
          </aside>

          {/* ================================================================= */}
          {/* COLUMN 2: HOTEL CARDS COLUMN (DEFAULT 800PX FIXED WIDTH)          */}
          {/* ================================================================= */}
          <div
            className={
              mapExpanded
                ? 'w-full lg:w-[280px] xl:w-[294px] shrink-0 space-y-2.5'
                : 'w-full max-w-[800px] min-[1101px]:w-[800px] shrink-0 space-y-3'
            }
          >
            {/* Header Card */}
            {mapExpanded ? (
              /* Compact Header Card for Expanded Map Split-View */
              <div className="bg-white rounded-[12px] p-3.5 rh-card-shadow">
                <h1 className="text-[18px] font-bold text-[#2d3137] leading-snug">
                  {cityLabel}:{' '}
                  {loading
                    ? 'ищем подходящие варианты'
                    : formatPluralVariants(totalCount || 329)}
                </h1>

                {activeFilterChips.length > 0 && (
                  <div className="mt-1.5 relative">
                    <div className="text-[13.5px] text-[#868686]">
                      с применёнными фильтрами:
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setShowCompactFiltersPopover(!showCompactFiltersPopover)
                      }
                      className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#e5e5e5] hover:bg-[#c7c7c7] text-[13px] font-medium text-[#2d3137] cursor-pointer"
                    >
                      <span>{activeFilterChips.length} фильтра</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#2d3137]" />
                    </button>

                    {showCompactFiltersPopover && (
                      <div className="mt-2 flex flex-wrap gap-1.5 pt-1">
                        {activeFilterChips.map((chip) => (
                          <span
                            key={chip.key}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#e5e5e5] text-[12.5px] text-[#2d3137]"
                          >
                            <span>{chip.label}</span>
                            <button
                              type="button"
                              onClick={chip.onRemove}
                              className="text-[#868686] hover:text-[#2d3137] cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Full Header Card for Standard List View */
              <div className="bg-white rounded-[12px] px-5 py-4 rh-card-shadow">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-[24px] font-bold text-[#2d3137] leading-tight tracking-tight">
                      {cityLabel}: {formatPluralVariants(totalCount || 329)}
                    </h1>
                    {sourceMode === 'mock' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#f8f1da] text-[#2d3137] text-[12px] font-medium">
                        Демо-данные
                      </span>
                    )}
                  </div>
                  {loading && (
                    <Loader2 className="w-5 h-5 animate-spin text-[#868686]" />
                  )}
                </div>

                {activeFilterChips.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[14.5px] text-[#868686]">
                      с применёнными фильтрами:
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {activeFilterChips.map((chip) => (
                        <span
                          key={chip.key}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#e5e5e5] text-[13.5px] text-[#2d3137]"
                        >
                          <span>{chip.label}</span>
                          <button
                            type="button"
                            onClick={chip.onRemove}
                            className="text-[#868686] hover:text-[#2d3137] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hotel Cards List */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((sk) =>
                  mapExpanded ? (
                    <div
                      key={sk}
                      className="bg-white rounded-[12px] p-3 h-[250px] rh-card-shadow animate-pulse space-y-2.5"
                    >
                      <div className="h-4 bg-[#e5e5e5] rounded w-3/4" />
                      <div className="h-[130px] bg-[#e5e5e5] rounded-[8px]" />
                      <div className="h-8 bg-[#e5e5e5] rounded w-full" />
                    </div>
                  ) : (
                    <div
                      key={sk}
                      className="bg-white rounded-[12px] h-[218px] rh-card-shadow animate-pulse flex overflow-hidden"
                    >
                      <div className="w-[272px] bg-[#e5e5e5] shrink-0" />
                      <div className="flex-1 p-4 space-y-3">
                        <div className="h-5 bg-[#e5e5e5] rounded w-2/3" />
                        <div className="h-4 bg-[#f4f4f4] rounded w-1/2" />
                        <div className="h-20 bg-[#f4f4f4] rounded-lg mt-4" />
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : fetchError ? (
              <div className="bg-white rounded-[12px] p-8 text-center rh-card-shadow space-y-3">
                <div className="text-[16px] font-bold text-[#2d3137]">
                  {fetchError}
                </div>
                <button
                  type="button"
                  onClick={fetchHotelResults}
                  className="px-5 py-2.5 rounded-[8px] bg-[#fddd55] hover:bg-[#ffd300] active:bg-[#fdc500] text-[#2d3137] text-[14px] font-semibold cursor-pointer"
                >
                  Повторить
                </button>
              </div>
            ) : filteredHotels.length === 0 ? (
              <div className="bg-white rounded-[12px] p-8 text-center rh-card-shadow space-y-2.5">
                <div className="text-[17px] font-bold text-[#2d3137]">
                  Отели по выбранным параметрам не найдены
                </div>
                <p className="text-[14px] text-[#868686]">
                  Сбросьте фильтры в левой панели, чтобы увидеть все доступные
                  варианты в направлении {cityLabel}.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-5 py-2.5 rounded-[8px] bg-[#fddd55] hover:bg-[#ffd300] active:bg-[#fdc500] text-[#2d3137] text-[14px] font-semibold cursor-pointer"
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedHotels.map((hotel, idx) => {
                  const imgs =
                    hotel.images && hotel.images.length > 0
                      ? hotel.images
                      : [FALLBACK_HOTEL_IMAGE];
                  const currentSlide = slideIndices[hotel.id] || 0;
                  const isFav = favorites[hotel.id];
                  const formattedPrice = Number(
                    hotel.total_price || 0
                  ).toLocaleString('ru-RU');
                  const formattedOld = Number(
                    hotel.old_price ||
                      Math.round((hotel.total_price || 0) * 1.11)
                  ).toLocaleString('ru-RU');
                  const paymentLabel =
                    idx % 2 === 0 ? 'Оплата на сайте' : 'Оплата по безналу';
                  const slidesCount = imgs.length || 10;

                  if (mapExpanded) {
                    /* ======================================================= */
                    /* COMPACT VERTICAL CARD FOR EXPANDED MAP (NO GRAY STROKE) */
                    /* ======================================================= */
                    return (
                      <div
                        key={hotel.id}
                        ref={(el) => {
                          cardRefs.current[hotel.id] = el;
                        }}
                        onMouseEnter={() => setSelectedHotelPin(hotel.id)}
                        className="bg-white rounded-[12px] p-3 pt-2.5 rh-card-shadow rh-card-shadow-hover"
                      >
                        {/* 1. Top Row: Stars + Name (#4086e4) + Address (#2d3137) | Green Ribbon Rating */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-[2px] mb-0.5">
                              {hotel.stars > 0 ? (
                                Array.from({ length: hotel.stars }).map(
                                  (_, i) => (
                                    <Star
                                      key={i}
                                      className="w-[11px] h-[11px] text-[#F5A623] fill-current shrink-0"
                                    />
                                  )
                                )
                              ) : (
                                <span className="text-[11px] font-medium text-[#868686]">
                                  Апартаменты
                                </span>
                              )}
                            </div>

                            <h3
                              onClick={() => handleOpenDetail(hotel)}
                              title={hotel.name}
                              className="text-[15.5px] font-bold text-[#4086e4] hover:underline cursor-pointer truncate leading-tight"
                            >
                              {hotel.name}
                            </h3>

                            <div className="text-[12.5px] text-[#2d3137] truncate mt-0.5">
                              {hotel.address}
                            </div>
                          </div>

                          {/* Green Rating Ribbon Badge */}
                          <div
                            style={{
                              clipPath:
                                'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)',
                            }}
                            className="-mt-2.5 w-[36px] h-[40px] bg-[#23A916] text-white font-bold text-[14.5px] flex items-center justify-center pb-1.5 shrink-0 rounded-t-[4px]"
                          >
                            {hotel.rating_label}
                          </div>
                        </div>

                        {/* 2. Middle Photo (`h-[132px]`) */}
                        <div
                          onClick={() => handleOpenDetail(hotel)}
                          className="relative h-[132px] w-full rounded-[8px] overflow-hidden bg-[#e5e5e5] cursor-pointer group"
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
                            <div className="w-full h-full flex items-center justify-center bg-[#e5e5e5] text-[13px] text-[#868686]">
                              Фото скрыто
                            </div>
                          )}

                          {/* Heart Button */}
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(e, hotel.id)}
                            className="absolute top-2 left-2 w-[30px] h-[30px] rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-sm z-10 cursor-pointer"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                isFav
                                  ? 'text-[#ce2121] fill-current'
                                  : 'text-[#2d3137]'
                              }`}
                            />
                          </button>

                          {/* Loyalty Pill `до 210 P` */}
                          <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-white/95 shadow-sm flex items-center gap-1 text-[12px] font-medium text-[#2d3137]">
                            <span>до {hotel.loyalty_points}</span>
                            <span className="w-4 h-4 rounded-full bg-[#4086e4] text-white text-[10px] font-bold flex items-center justify-center">
                              P
                            </span>
                          </div>

                          {/* Slide Counter `< 1 / 10 >` */}
                          {showImages && (
                            <div className="absolute bottom-1.5 inset-x-0 flex items-center justify-center gap-3 text-white text-[12.5px] font-medium bg-gradient-to-t from-black/60 to-transparent pt-3 pb-0.5">
                              <button
                                type="button"
                                onClick={(e) =>
                                  prevSlide(e, hotel.id, imgs.length)
                                }
                                className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span>
                                {currentSlide + 1} / {slidesCount}
                              </span>
                              <button
                                type="button"
                                onClick={(e) =>
                                  nextSlide(e, hotel.id, imgs.length)
                                }
                                className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 3. Bottom Price & `Подробнее` CTA Row */}
                        <div className="flex items-end justify-between gap-2 pt-2.5">
                          <div>
                            <div className="text-[12.5px] text-[#868686] leading-none">
                              {formattedOld} $
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[19px] font-bold text-[#2d3137] leading-tight">
                                {formattedPrice} $
                              </span>
                              <InfoBadge
                                title="Сравнить цены на Booking.com, Agoda и Trip.com"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOffersModalHotel(hotel);
                                }}
                              />
                            </div>
                            <div className="text-[11.5px] text-[#868686] leading-tight mt-0.5">
                              за {hotel.nights} ночей для {hotel.guests} гостей
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenDetail(hotel)}
                            className="px-4 py-2 rounded-[8px] bg-[#fddd55] hover:bg-[#ffd300] active:bg-[#fdc500] text-[#2d3137] text-[14px] font-medium transition-colors shrink-0 cursor-pointer"
                          >
                            Подробнее
                          </button>
                        </div>
                      </div>
                    );
                  }

                  /* ========================================================= */
                  /* STANDARD 800PX B2B CARD (SOFT SHADOW, NO GRAY STROKE)     */
                  /* ========================================================= */
                  return (
                    <div
                      key={hotel.id}
                      ref={(el) => {
                        cardRefs.current[hotel.id] = el;
                      }}
                      onMouseEnter={() => setSelectedHotelPin(hotel.id)}
                      className="w-full overflow-hidden flex flex-col md:flex-row bg-white rounded-[14px] rh-card-shadow rh-card-shadow-hover"
                    >
                      {/* 1. Left Photo Column (`md:w-[272px] shrink-0`) */}
                      <div
                        onClick={() => handleOpenDetail(hotel)}
                        className="w-full md:w-[272px] h-[205px] md:h-auto min-h-[214px] bg-[#e5e5e5] relative shrink-0 overflow-hidden cursor-pointer group"
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
                          <div className="w-full h-full flex items-center justify-center bg-[#e5e5e5] text-[13.5px] text-[#868686]">
                            Фото скрыто
                          </div>
                        )}

                        {/* Top-Left Circular Heart Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(e, hotel.id)}
                          className="absolute top-3 left-3 w-[32px] h-[32px] rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-sm z-10 cursor-pointer"
                        >
                          <Heart
                            className={`w-[17px] h-[17px] ${
                              isFav
                                ? 'text-[#ce2121] fill-current'
                                : 'text-[#2d3137]'
                            }`}
                          />
                        </button>

                        {/* Top-Right Loyalty Pill (`до 210 P`) */}
                        <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-white/95 shadow-sm flex items-center gap-1.5 text-[12.5px] font-medium text-[#2d3137]">
                          <span>до {hotel.loyalty_points}</span>
                          <span className="w-4 h-4 rounded-full bg-[#4086e4] text-white text-[10px] font-bold flex items-center justify-center">
                            P
                          </span>
                        </div>

                        {/* Bottom Slide Counter (`< 1 / 10 >`) */}
                        {showImages && (
                          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-4 text-white text-[13px] font-medium bg-gradient-to-t from-black/60 via-black/20 to-transparent pt-5 pb-0.5">
                            <button
                              type="button"
                              onClick={(e) =>
                                prevSlide(e, hotel.id, imgs.length)
                              }
                              className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
                            </button>
                            <span>
                              {currentSlide + 1} / {slidesCount}
                            </span>
                            <button
                              type="button"
                              onClick={(e) =>
                                nextSlide(e, hotel.id, imgs.length)
                              }
                              className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <ChevronRight className="w-4 h-4 stroke-[2.2]" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 2. Right Content Area (`flex-1 px-4 pt-3 pb-3.5`) */}
                      <div className="flex-1 min-w-0 px-4 pt-3 pb-3.5 flex flex-col justify-between">
                        {/* Top Section: Hotel Info on Left | Tripadvisor + Green Ribbon + Amenities on Right */}
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: Stars, #4086e4 Title, #2d3137 Address & Distance */}
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-[2px] mb-0.5">
                              {hotel.stars > 0 ? (
                                Array.from({ length: hotel.stars }).map(
                                  (_, i) => (
                                    <Star
                                      key={i}
                                      className="w-[12px] h-[12px] text-[#F5A623] fill-current shrink-0"
                                    />
                                  )
                                )
                              ) : (
                                <span className="text-[11.5px] font-semibold text-[#868686]">
                                  Апартаменты
                                </span>
                              )}
                            </div>

                            <h3
                              onClick={() => handleOpenDetail(hotel)}
                              title={hotel.name}
                              className="text-[17.5px] font-bold text-[#4086e4] hover:text-[#2e71cc] cursor-pointer truncate leading-[1.25]"
                            >
                              {hotel.name}
                            </h3>

                            <div
                              onClick={() => handleOpenDetail(hotel)}
                              className="text-[13.5px] text-[#2d3137] hover:underline cursor-pointer truncate mt-0.5 leading-[1.3]"
                            >
                              {hotel.address}
                            </div>

                            {hotel.distance_center_label && (
                              <div className="text-[13px] text-[#2d3137] truncate mt-0.5 leading-[1.25]">
                                {hotel.distance_center_label}
                              </div>
                            )}

                            {hotel.nearest_metro &&
                              hotel.nearest_metro !==
                                hotel.distance_center_label && (
                                <div className="text-[13px] text-[#2d3137] truncate leading-[1.25]">
                                  {hotel.nearest_metro}
                                </div>
                              )}
                          </div>

                          {/* Right: Tripadvisor Bubbles + Green Ribbon Badge + 5 Amenity Icons */}
                          <div className="shrink-0 flex flex-col items-end">
                            <div className="flex items-start gap-2.5">
                              <div className="flex flex-col items-end pt-0.5">
                                <TripadvisorRatingRow
                                  rating={Number(hotel.rating || 9.2)}
                                />
                                <div className="text-[12.5px] text-[#868686] mt-0.5 leading-none">
                                  {formatPluralReviews(hotel.reviews_count)}
                                </div>
                              </div>

                              {/* Signature RateHawk Green Rating Ribbon (`9,6`) */}
                              <div
                                style={{
                                  clipPath:
                                    'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)',
                                }}
                                className="-mt-3 w-[40px] h-[44px] bg-[#23A916] text-white font-bold text-[16px] flex items-center justify-center pb-1.5 shrink-0 rounded-t-[4px]"
                              >
                                {hotel.rating_label}
                              </div>
                            </div>

                            {/* 5 Amenity Icons Row */}
                            <div className="flex items-center gap-2 text-[#2d3137] mt-2">
                              <Wifi
                                className="w-[15px] h-[15px] stroke-[2.2]"
                                title="Бесплатный Wi-Fi"
                              />
                              <Car
                                className="w-[15px] h-[15px] stroke-[2]"
                                title="Трансфер"
                              />
                              <span
                                title="Парковка"
                                className="w-[15px] h-[15px] rounded-[3px] bg-[#2d3137] text-white text-[10px] font-bold flex items-center justify-center leading-none"
                              >
                                P
                              </span>
                              <Users
                                className="w-[15px] h-[15px] stroke-[2]"
                                title="Подходит для семей"
                              />
                              <PoolSwimmerIcon className="w-[16px] h-[15px]" />
                            </div>
                          </div>
                        </div>

                        {/* Subtle Horizontal Divider (`#f4f4f4`) */}
                        <div className="border-t border-[#f4f4f4] my-2.5" />

                        {/* Bottom Section: 3-Column Dense Room, Inclusions & Price Grid */}
                        <div className="grid grid-cols-12 gap-3 items-start">
                          {/* Col 1: Room Name & Bed Type */}
                          <div className="col-span-12 sm:col-span-4 min-w-0">
                            <div
                              onClick={() => handleOpenDetail(hotel)}
                              className="text-[14px] font-normal text-[#2d3137] leading-[1.3] line-clamp-2 cursor-pointer hover:text-[#4086e4]"
                            >
                              {hotel.room_type}
                            </div>
                            <div className="text-[13px] text-[#868686] mt-0.5 leading-[1.25] truncate">
                              {hotel.bed_type
                                ?.replace(' King', '')
                                .replace(' Twin', '')}
                            </div>
                          </div>

                          {/* Col 2: Meal, Cancellation, Payment */}
                          <div className="col-span-12 sm:col-span-4 space-y-1 min-w-0">
                            <div
                              className={`flex items-center gap-1.5 text-[13.5px] leading-[1.3] ${
                                hotel.meal_included
                                  ? 'text-[#1FA614]'
                                  : 'text-[#2d3137]'
                              }`}
                            >
                              <Utensils className="w-[14px] h-[14px] shrink-0 stroke-[2]" />
                              <span className="truncate">
                                {hotel.meal_label}
                              </span>
                            </div>

                            <div
                              className={`flex items-center gap-1.5 text-[13.5px] leading-[1.3] ${
                                hotel.free_cancellation
                                  ? 'text-[#1FA614]'
                                  : 'text-[#2d3137]'
                              }`}
                            >
                              <RotateCcw className="w-[14px] h-[14px] shrink-0 stroke-[2]" />
                              <span className="truncate">
                                {hotel.free_cancellation
                                  ? 'Беспл. отмена'
                                  : 'Без беспл. отмены'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[13.5px] text-[#2d3137] leading-[1.3]">
                              <CreditCard className="w-[14px] h-[14px] shrink-0 stroke-[2] text-[#2d3137]" />
                              <span className="truncate">{paymentLabel}</span>
                            </div>
                          </div>

                          {/* Col 3: Price Stack & `#fddd55` Yellow CTA Button */}
                          <div className="col-span-12 sm:col-span-4 flex flex-col sm:items-end justify-between">
                            <div className="sm:text-right">
                              <div className="text-[13.5px] text-[#868686] leading-none">
                                {formattedOld} $
                              </div>

                              <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                                <span className="text-[22px] font-bold text-[#2d3137] leading-none tracking-tight whitespace-nowrap">
                                  {formattedPrice} $
                                </span>
                                <InfoBadge
                                  title="Сравнить цены на Booking.com, Agoda и Trip.com"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOffersModalHotel(hotel);
                                  }}
                                />
                              </div>

                              <div className="text-[12.5px] text-[#868686] leading-tight mt-0.5">
                                за {hotel.nights} ночей для {hotel.guests}{' '}
                                гостей
                              </div>
                            </div>

                            <div className="mt-2.5 flex items-center gap-2 w-full sm:w-auto justify-end">
                              <button
                                type="button"
                                onClick={() => handleOpenDetail(hotel)}
                                className="w-full sm:w-auto px-4 py-2 rounded-[8px] bg-[#fddd55] hover:bg-[#ffd300] active:bg-[#fdc500] text-[#2d3137] text-[14px] font-medium transition-colors whitespace-nowrap text-center cursor-pointer"
                              >
                                Показать все номера
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination / Load More Button */}
                {remainingCount > 0 && (
                  <div className="pt-2 pb-4 flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 20)}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-[10px] bg-white hover:bg-[#fddd55] text-[#2d3137] text-[14px] font-semibold rh-card-shadow transition-all cursor-pointer"
                    >
                      Показать ещё {Math.min(20, remainingCount)} вариантов
                      (осталось {remainingCount})
                    </button>
                    <span className="text-[12.5px] text-[#868686]">
                      Показано {paginatedHotels.length} из{' '}
                      {filteredHotels.length} отелей в направлении {cityLabel}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* COLUMN 3: INTERACTIVE OPENSTREETMAP (HIDDEN <= 1100PX, GROWS >1100) */}
          {/* ================================================================= */}
          {!mapHidden && (
            <div
              className={`${
                mapExpanded
                  ? 'block w-full min-[1101px]:flex-1'
                  : 'hidden min-[1101px]:block min-[1101px]:flex-1'
              } min-w-0 min-[1101px]:sticky min-[1101px]:top-[64px]`}
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

      {/* Multi-Platform Hotel Offers Modal (`Смотреть цены` / Info `i` trigger) */}
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
