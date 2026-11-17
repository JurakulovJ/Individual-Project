import React, { useState, useRef } from 'react';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Star,
  Heart,
  Wifi,
  Car,
  Users,
  RotateCcw,
  Maximize2,
  Bath,
  Wind,
  Lock,
  BedDouble,
  MoreVertical,
  ListPlus,
  ExternalLink,
  CheckCircle2,
  Umbrella,
} from 'lucide-react';
import { getHotelProviderOffers } from '../../services/deeplinks';
import HotelOffersModal from './HotelOffersModal';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80',
];

const RECENTLY_VIEWED_HOTELS = [
  {
    id: 'recent-1',
    name: 'Courtyard By Marriott Bali Seminyak Resort',
    stars: 5,
    dates: '03.03.27 — 10.03.27, 2 гостя',
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'recent-2',
    name: 'Palette Hotel Seminyak',
    stars: 2,
    dates: '03.03.27 — 10.03.27, 2 гостя',
    image:
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'recent-3',
    name: 'Jin Jiang Pine City Hotel',
    stars: 4,
    dates: '15.11.26 — 17.11.26, 2 гостя',
    image:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80',
  },
];

const SAMPLE_REVIEWS = [
  {
    author: 'E1ljah-T',
    flag: '🇷🇺',
    text: 'Отличный сервис, приветливый и обходительный обслуживающий персонал. Чисто, уютно и комфортно. Есть всё необходимое и даже больше. Остались очень довольны, хочется вернуться и остановиться именно на этой вилле. Рекомендую.',
  },
  {
    author: 'G M',
    flag: '🇺🇿',
    text: 'Спасибо персоналу за классный сервис! Очень просторные номера, вкусные завтраки и удобное расположение рядом с пляжем и ресторанами. Всё замечательно!',
  },
];

function InfoBadge({ title }) {
  return (
    <span
      title={title}
      className="w-[15px] h-[15px] rounded-full bg-[#e5e5e5] text-[#868686] hover:bg-[#c8c8c8] hover:text-[#2d3137] text-[10px] font-bold inline-flex items-center justify-center shrink-0 select-none cursor-pointer transition-colors"
    >
      i
    </span>
  );
}

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

export default function HotelDetailView({
  hotel,
  searchParams,
  onBackToResults,
  onCreateB2BOrder,
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [bedFilter, setBedFilter] = useState('all');
  const [mealFilter, setMealFilter] = useState('all');
  const [cancelFilter, setCancelFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [refreshingRates, setRefreshingRates] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [selectedTariffForModal, setSelectedTariffForModal] = useState(null);

  const openPartnerModalForTariff = (roomCat, tariff) => {
    setSelectedTariffForModal({
      roomTitle: roomCat.title,
      mealLabel: tariff.mealLabel,
      freeCancel: tariff.freeCancel,
      basePrice: tariff.agentPrice,
    });
    setShowOffersModal(true);
  };

  const roomsSectionRef = useRef(null);

  if (!hotel) return null;

  const baseAgentPrice = Math.round(Number(hotel.total_price || 886));
  const formattedBasePrice = baseAgentPrice.toLocaleString('ru-RU');
  const basePoints = hotel.loyalty_points || 8;

  // Build 7 photos for the 1 + 6 Mosaic Grid
  const gallery = Array.from({ length: 7 }).map(
    (_, idx) =>
      hotel.images?.[idx % (hotel.images?.length || 1)] ||
      FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]
  );

  const ratingScore = Number(hotel.rating || 9.4);
  const ratingWord =
    ratingScore >= 9.0
      ? 'Супер'
      : ratingScore >= 8.4
        ? 'Отлично'
        : 'Очень хорошо';

  const currentReview = SAMPLE_REVIEWS[reviewIdx % SAMPLE_REVIEWS.length];

  const isBaliOrBeach =
    String(hotel.city || '')
      .toLowerCase()
      .includes('бали') ||
    String(hotel.city || '')
      .toLowerCase()
      .includes('кута') ||
    String(hotel.address || '')
      .toLowerCase()
      .includes('seminyak') ||
    String(hotel.address || '')
      .toLowerCase()
      .includes('bali');

  const nearbyPlaces = isBaliOrBeach
    ? [
        { name: 'Пляж Дабл Сикс', dist: '1,2 км' },
        { name: 'Пляж Семиньяк', dist: '1,2 км' },
        { name: 'Пляж Легиан', dist: '1,3 км' },
        { name: 'Пляж Кута', dist: '2 км' },
        { name: 'Пляж Батубелиг', dist: '3,4 км' },
      ]
    : [
        { name: hotel.nearest_metro || 'Станция метро Центр', dist: '520 м' },
        { name: 'Центральный сквер и бульвар', dist: '850 м' },
        { name: 'Деловой и торговый квартал', dist: '1,1 км' },
        { name: 'Площадь Независимости', dist: '1,6 км' },
        { name: 'Исторический музей', dist: '1,7 км' },
      ];

  // Build structured Room Categories & B2B Tariff Rows matching Reference Screenshot
  const roomCategories = [
    {
      id: 'villa-premium',
      title: isBaliOrBeach
        ? 'Двухместная вилла Premium с 1 комнатой'
        : hotel.room_type || 'Двухместный номер Standard / Superior',
      area: isBaliOrBeach ? '295 м²' : '37 м²',
      photo: gallery[0],
      photosCount: 4,
      specs: [
        'Собственная ванная комната',
        'Сейф',
        'Минибар',
        'Высокоскоростной доступ в Интернет',
        'Кондиционер',
      ],
      tariffs: [
        {
          id: 't-1',
          subName: isBaliOrBeach
            ? 'Premium Villa, 1 Bedroom, Private Pool (Villa 7) non-refundable'
            : 'King Guest Room — Спецтариф',
          bedType: 'double',
          roomInfo: '1 комната',
          smoking: 'Для некурящих',
          mealCode: 'RO',
          mealLabel: 'RO — Без питания',
          freeCancel: false,
          cancelText: 'Нет',
          cancelSub: null,
          clientPrice: Math.round(baseAgentPrice * 1.112),
          agentPrice: baseAgentPrice,
          paymentType: 'card',
          paymentLabel: 'Картой',
          points: basePoints,
        },
        {
          id: 't-2',
          subName: isBaliOrBeach
            ? 'Premium Villa, 1 Bedroom, Private Pool — Breakfast Included'
            : 'King Guest Room BB (Тип кровати может измениться)',
          bedType: 'double',
          roomInfo: '1 комната',
          smoking: 'Для некурящих',
          mealCode: 'BB',
          mealLabel: 'BB — Завтрак включён',
          freeCancel: true,
          cancelText: '0 $',
          cancelSub: 'до 3 мар',
          clientPrice: Math.round(baseAgentPrice * 1.18),
          agentPrice: Math.round(baseAgentPrice * 1.06),
          paymentType: 'invoice',
          paymentLabel: 'Безнал или картой',
          points: basePoints + 3,
        },
      ],
    },
    {
      id: 'deluxe-suite',
      title: isBaliOrBeach
        ? 'Двухместная вилла Deluxe Garden с бассейном'
        : 'Улучшенный двухместный номер Deluxe Panoramic',
      area: isBaliOrBeach ? '340 м²' : '46 м²',
      photo: gallery[3],
      photosCount: 6,
      specs: [
        'Собственная ванная комната',
        'Сейф',
        'Кофемашина',
        'Высокоскоростной доступ в Интернет',
        'Кондиционер',
      ],
      tariffs: [
        {
          id: 't-3',
          subName: 'Deluxe Double / Twin Room with Terrace',
          bedType: 'twin',
          roomInfo: '2 отдельные кровати или 1 King',
          smoking: 'Для некурящих',
          mealCode: 'BB',
          mealLabel: 'BB — Завтрак включён',
          freeCancel: true,
          cancelText: '0 $',
          cancelSub: 'до 3 мар',
          clientPrice: Math.round(baseAgentPrice * 1.29),
          agentPrice: Math.round(baseAgentPrice * 1.16),
          paymentType: 'invoice',
          paymentLabel: 'Безнал или картой',
          points: basePoints + 6,
        },
        {
          id: 't-4',
          subName: 'Deluxe Suite Half Board (Завтрак + ужин)',
          bedType: 'double',
          roomInfo: '1 большая двуспальная кровать',
          smoking: 'Для некурящих',
          mealCode: 'HB',
          mealLabel: 'HB — Завтрак + ужин',
          freeCancel: true,
          cancelText: '0 $',
          cancelSub: 'до 3 мар',
          clientPrice: Math.round(baseAgentPrice * 1.38),
          agentPrice: Math.round(baseAgentPrice * 1.24),
          paymentType: 'card',
          paymentLabel: 'Картой',
          points: basePoints + 9,
        },
      ],
    },
  ];

  // Filter tariffs by selected dropdowns
  const filteredCategories = roomCategories
    .map((cat) => {
      const matchingTariffs = cat.tariffs.filter((t) => {
        if (bedFilter !== 'all' && t.bedType !== bedFilter) return false;
        if (mealFilter !== 'all' && t.mealCode !== mealFilter) return false;
        if (cancelFilter === 'free' && !t.freeCancel) return false;
        if (cancelFilter === 'nonref' && t.freeCancel) return false;
        if (paymentFilter !== 'all' && t.paymentType !== paymentFilter)
          return false;
        return true;
      });
      return { ...cat, tariffs: matchingTariffs };
    })
    .filter((cat) => cat.tariffs.length > 0);

  const comparisonOffers = getHotelProviderOffers(
    hotel,
    searchParams,
    1.0,
    'BB — Завтрак включён'
  );

  const scrollToRooms = () => {
    roomsSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleRefreshPrices = () => {
    setRefreshingRates(true);
    setTimeout(() => {
      setRefreshingRates(false);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#2d3137] py-3.5 px-3 sm:px-5">
      <div className="max-w-[1260px] mx-auto">
        {/* ================================================================= */}
        {/* 1. TOP BREADCRUMB BAR (`🔍 Новый поиск` | `Главная > Кута > ...`) */}
        {/* ================================================================= */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            type="button"
            onClick={onBackToResults}
            className="h-[34px] px-3 rounded-[8px] bg-white rh-card-shadow text-[13px] font-medium text-[#4086e4] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-[#4086e4]" />
            <span>Новый поиск</span>
          </button>

          <nav
            aria-label="Breadcrumb"
            className="min-h-[34px] px-3.5 py-1.5 rounded-[8px] bg-white rh-card-shadow inline-flex flex-wrap items-center gap-1.5 text-[13px]"
          >
            <button
              type="button"
              onClick={onBackToResults}
              className="text-[#4086e4] hover:underline cursor-pointer"
            >
              Главная
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#afafaf]" />
            <button
              type="button"
              onClick={onBackToResults}
              className="text-[#4086e4] hover:underline cursor-pointer"
            >
              {hotel.city || 'Кута'}
            </button>
            <span className="text-[#868686]">
              • {searchParams?.checkIn || '3 мар, ср'} —{' '}
              {searchParams?.checkOut || '10 мар, ср'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#afafaf]" />
            <span className="text-[#2d3137] font-medium truncate max-w-[260px]">
              {hotel.name}
            </span>
          </nav>
        </div>

        {/* ================================================================= */}
        {/* 2. TWO-COLUMN LAYOUT: MAIN CONTENT (LEFT) + RECENTLY VIEWED (RIGHT) */}
        {/* ================================================================= */}
        <div className="flex flex-col xl:flex-row items-start gap-4">
          {/* =============================================================== */}
          {/* LEFT MAIN COLUMN (`flex-1 min-w-0`)                             */}
          {/* =============================================================== */}
          <div className="flex-1 min-w-0 w-full space-y-3">
            {/* BLOCK A: HOTEL HEADER + 7-PHOTO MOSAIC GALLERY */}
            <div className="bg-white rounded-[14px] p-5 rh-card-shadow">
              {/* Top Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({
                      length: Math.max(1, hotel.stars || 4),
                    }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-[13px] h-[13px] text-[#F5A623] fill-current"
                      />
                    ))}
                    {hotel.eco_certified && (
                      <span className="ml-1.5 px-2 py-0.5 rounded bg-[#e8f7ee] text-[#1FA614] text-[11px] font-semibold">
                        🌿 Экоотель
                      </span>
                    )}
                  </div>

                  {/* Hotel Title */}
                  <h1 className="text-[24px] sm:text-[26px] font-bold text-[#2d3137] leading-tight">
                    {hotel.name}
                  </h1>

                  {/* Address + Show on Map */}
                  <div className="text-[13.5px] text-[#2d3137] mt-1 flex flex-wrap items-center gap-1.5">
                    <span>{hotel.address}</span>
                    <span className="text-[#868686]">•</span>
                    <button
                      type="button"
                      onClick={onBackToResults}
                      className="text-[#4086e4] hover:underline font-normal cursor-pointer"
                    >
                      Показать на карте
                    </button>
                  </div>

                  {/* Distance from Center & Beach */}
                  <div className="text-[13px] text-[#868686] mt-0.5">
                    {hotel.distance_center_label || '4,1 км от центра'}{' '}
                    {hotel.nearest_metro
                      ? `• ${hotel.nearest_metro}`
                      : '• 1,2 км от пляжа Дабл Сикс'}
                  </div>
                </div>

                {/* Right Price & CTA Block */}
                <div className="flex flex-col sm:items-end shrink-0">
                  <div className="text-[#2d3137] leading-none">
                    <span className="text-[15px] font-semibold">от </span>
                    <span className="text-[22px] font-bold">
                      {formattedBasePrice} $
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsFavorite(!isFavorite)}
                      className="w-[38px] h-[38px] rounded-full bg-[#f4f4f4] hover:bg-[#e5e5e5] flex items-center justify-center text-[#2d3137] transition-colors cursor-pointer"
                    >
                      <Heart
                        className={`w-[18px] h-[18px] ${
                          isFavorite
                            ? 'text-[#ce2121] fill-current'
                            : 'text-[#868686]'
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={scrollToRooms}
                      className="h-[38px] px-4 rounded-[8px] bg-[#fddd55] hover:bg-[#ffd300] active:bg-[#fdc500] text-[#2d3137] text-[14px] font-medium transition-colors cursor-pointer"
                    >
                      Посмотреть цены
                    </button>
                  </div>

                  <div className="text-[12px] text-[#2d3137] mt-1.5 flex items-center gap-1">
                    <span>Вы получите</span>
                    <span className="text-[#4086e4] font-semibold">
                      {basePoints}
                    </span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#4086e4] text-white text-[9px] font-bold inline-flex items-center justify-center">
                      P
                    </span>
                  </div>
                </div>
              </div>

              {/* 7-PHOTO MOSAIC GALLERY (1 Large Left + 3x2 Grid Right with `+24 фото`) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 h-auto md:h-[348px]">
                {/* Left Large Photo */}
                <div className="md:col-span-5 h-[240px] md:h-full rounded-[10px] overflow-hidden bg-[#e5e5e5]">
                  <img
                    src={gallery[0]}
                    alt={hotel.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGES[0];
                    }}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                  />
                </div>

                {/* Right 3x2 Grid of 6 Photos */}
                <div className="md:col-span-7 grid grid-cols-3 grid-rows-2 gap-2 h-[240px] md:h-full">
                  {gallery.slice(1, 7).map((imgUrl, idx) => {
                    const isLast = idx === 5;
                    return (
                      <div
                        key={idx}
                        className="relative h-full w-full rounded-[10px] overflow-hidden bg-[#e5e5e5] cursor-pointer group"
                      >
                        <img
                          src={imgUrl}
                          alt={`${hotel.name} ${idx + 2}`}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              FALLBACK_IMAGES[(idx + 1) % FALLBACK_IMAGES.length];
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {isLast && (
                          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                            <span className="text-white text-[16px] font-bold">
                              +{hotel.slides_total || 24} фото
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ============================================================= */}
            {/* BLOCK B: 3 INFO CARDS (REVIEWS | POPULAR AMENITIES | NEARBY)  */}
            {/* ============================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: Rating & Guest Review */}
              <div className="bg-white rounded-[12px] p-4 rh-card-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-2.5">
                    <div
                      style={{
                        clipPath:
                          'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)',
                      }}
                      className="w-[38px] h-[42px] bg-[#23A916] text-white font-bold text-[15px] flex items-center justify-center pb-1.5 shrink-0 rounded-t-[4px]"
                    >
                      {hotel.rating_label || '9,4'}
                    </div>
                    <div>
                      <div className="text-[15px] font-bold text-[#2d3137] leading-tight">
                        {ratingWord}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowOffersModal(true)}
                        className="text-[12.5px] text-[#4086e4] hover:underline cursor-pointer"
                      >
                        {hotel.reviews_count || 930} отзывов
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 text-[13px] font-semibold text-[#2d3137]">
                    <span>{currentReview.flag}</span>
                    <span>{currentReview.author}</span>
                  </div>

                  <p className="text-[12.5px] text-[#2d3137] leading-[1.42] mt-1.5 line-clamp-5">
                    {currentReview.text}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setReviewIdx(
                        (prev) =>
                          (prev - 1 + SAMPLE_REVIEWS.length) %
                          SAMPLE_REVIEWS.length
                      )
                    }
                    className="w-8 h-8 rounded-full bg-[#f4f4f4] hover:bg-[#e5e5e5] flex items-center justify-center text-[#868686] hover:text-[#2d3137] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReviewIdx((prev) => (prev + 1) % SAMPLE_REVIEWS.length)
                    }
                    className="w-8 h-8 rounded-full bg-[#f4f4f4] hover:bg-[#e5e5e5] flex items-center justify-center text-[#2d3137] cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOffersModal(true)}
                    className="flex-1 h-8 rounded-[8px] bg-[#e5e5e5] hover:bg-[#c7c7c7] text-[13px] font-medium text-[#2d3137] transition-colors cursor-pointer"
                  >
                    Читать все отзывы • {SAMPLE_REVIEWS.length}
                  </button>
                </div>
              </div>

              {/* Card 2: Популярные удобства */}
              <div className="bg-white rounded-[12px] p-4 rh-card-shadow flex flex-col justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-[#2d3137] mb-3">
                    Популярные удобства
                  </h3>
                  <div className="space-y-2.5 text-[13.5px] text-[#2d3137]">
                    <div className="flex items-center gap-2.5">
                      <Wifi className="w-4 h-4 text-[#2d3137] shrink-0" />
                      <span>Бесплатный интернет</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Car className="w-4 h-4 text-[#2d3137] shrink-0" />
                      <span>Трансфер</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-[3px] bg-[#2d3137] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        P
                      </span>
                      <span>Парковка</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-[#2d3137] shrink-0" />
                      <span>Подходит для детей</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <PoolSwimmerIcon className="w-4 h-4 text-[#2d3137] shrink-0" />
                      <span>Бассейн</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={scrollToRooms}
                  className="w-full h-8 rounded-[8px] bg-[#e5e5e5] hover:bg-[#c7c7c7] text-[13px] font-medium text-[#2d3137] mt-4 transition-colors cursor-pointer"
                >
                  Все удобства • 71
                </button>
              </div>

              {/* Card 3: Что есть рядом */}
              <div className="bg-white rounded-[12px] p-4 rh-card-shadow flex flex-col justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-[#2d3137] mb-3">
                    Что есть рядом
                  </h3>
                  <div className="space-y-2.5 text-[13.5px] text-[#2d3137]">
                    {nearbyPlaces.map((pl, idx) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        <Umbrella className="w-4 h-4 text-[#868686] shrink-0" />
                        <span className="truncate">
                          {pl.name} • {pl.dist}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onBackToResults}
                  className="w-full h-8 rounded-[8px] bg-[#e5e5e5] hover:bg-[#c7c7c7] text-[13px] font-medium text-[#2d3137] mt-4 transition-colors cursor-pointer"
                >
                  Смотреть на карте • 59
                </button>
              </div>
            </div>

            {/* ============================================================= */}
            {/* BLOCK C: CITIZENSHIP ALERT BANNER & REPORT CONTENT LINK       */}
            {/* ============================================================= */}
            <div className="bg-white rounded-[10px] px-4 py-3 rh-card-shadow flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-[#4086e4] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                i
              </span>
              <p className="text-[12.5px] text-[#2d3137] leading-snug">
                Обратите внимание: тарифы и стоимость проживания могут
                отличаться в зависимости от гражданства гостей и ценовой
                политики отеля. При поиске вы выбрали гражданство гостей:{' '}
                {searchParams?.citizenship || 'Узбекистан'}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-[12.5px] text-[#4086e4] hover:underline cursor-pointer"
              >
                Пожаловаться на контент?
              </button>
            </div>

            {/* ============================================================= */}
            {/* BLOCK D: CHECK-IN / CHECK-OUT SUMMARY BAR (`Изменить`)        */}
            {/* ============================================================= */}
            <div className="bg-white rounded-[12px] px-5 py-4 rh-card-shadow flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-8 sm:gap-14">
                <div>
                  <div className="text-[13.5px] font-bold text-[#2d3137]">
                    Заезд
                  </div>
                  <div className="text-[13.5px] mt-0.5">
                    <span className="text-[#4086e4] font-semibold">
                      {searchParams?.checkIn || '3 мар 2027, ср'}
                    </span>{' '}
                    <span className="text-[#868686]">С 15:00 до 23:00</span>
                  </div>
                </div>

                <div>
                  <div className="text-[13.5px] font-bold text-[#2d3137]">
                    Выезд
                  </div>
                  <div className="text-[13.5px] mt-0.5">
                    <span className="text-[#4086e4] font-semibold">
                      {searchParams?.checkOut || '10 мар 2027, ср'}
                    </span>{' '}
                    <span className="text-[#868686]">До 12:00</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onBackToResults}
                className="px-4 py-2 rounded-[8px] bg-[#e5e5e5] hover:bg-[#c7c7c7] text-[13.5px] font-medium text-[#2d3137] transition-colors cursor-pointer"
              >
                Изменить
              </button>
            </div>

            {/* ============================================================= */}
            {/* BLOCK E: ДОСТУПНЫЕ НОМЕРА + FILTER BAR + B2B TARIFF TABLE     */}
            {/* ============================================================= */}
            <div
              ref={roomsSectionRef}
              className="bg-white rounded-[14px] p-5 rh-card-shadow space-y-4"
            >
              <div>
                <h2 className="text-[20px] font-bold text-[#2d3137]">
                  Доступные номера
                </h2>
                <div className="text-[13px] text-[#868686] mt-0.5">
                  На {hotel.nights || 7} ночей, для {hotel.guests || 2} взрослых
                </div>
              </div>

              {/* Warm Cream 4-Dropdown Filter Box (`#fdf3dc`) */}
              <div className="bg-[#fdf3dc] rounded-[12px] p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1. Кровати */}
                <div className="bg-white rounded-[8px] px-3.5 py-1.5 rh-card-shadow relative">
                  <div className="text-[11px] text-[#868686]">Кровати</div>
                  <select
                    value={bedFilter}
                    onChange={(e) => setBedFilter(e.target.value)}
                    className="w-full text-[13.5px] text-[#2d3137] bg-transparent appearance-none focus:outline-none pr-5 cursor-pointer"
                  >
                    <option value="all">все варианты</option>
                    <option value="double">Двуспальная кровать</option>
                    <option value="twin">2 отдельные кровати</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#2d3137] absolute right-3 bottom-2.5 pointer-events-none" />
                </div>

                {/* 2. Питание */}
                <div className="bg-white rounded-[8px] px-3.5 py-1.5 rh-card-shadow relative">
                  <div className="text-[11px] text-[#868686]">Питание</div>
                  <select
                    value={mealFilter}
                    onChange={(e) => setMealFilter(e.target.value)}
                    className="w-full text-[13.5px] text-[#2d3137] bg-transparent appearance-none focus:outline-none pr-5 cursor-pointer"
                  >
                    <option value="all">все варианты</option>
                    <option value="RO">RO — Без питания</option>
                    <option value="BB">BB — Завтрак включён</option>
                    <option value="HB">HB — Завтрак + ужин</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#2d3137] absolute right-3 bottom-2.5 pointer-events-none" />
                </div>

                {/* 3. Условия отмены */}
                <div className="bg-white rounded-[8px] px-3.5 py-1.5 rh-card-shadow relative">
                  <div className="text-[11px] text-[#868686]">
                    Условия отмены
                  </div>
                  <select
                    value={cancelFilter}
                    onChange={(e) => setCancelFilter(e.target.value)}
                    className="w-full text-[13.5px] text-[#2d3137] bg-transparent appearance-none focus:outline-none pr-5 cursor-pointer"
                  >
                    <option value="all">все варианты</option>
                    <option value="free">Бесплатная отмена</option>
                    <option value="nonref">Без бесплатной отмены</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#2d3137] absolute right-3 bottom-2.5 pointer-events-none" />
                </div>

                {/* 4. Оплата */}
                <div className="bg-white rounded-[8px] px-3.5 py-1.5 rh-card-shadow relative">
                  <div className="text-[11px] text-[#868686]">Оплата</div>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="w-full text-[13.5px] text-[#2d3137] bg-transparent appearance-none focus:outline-none pr-5 cursor-pointer"
                  >
                    <option value="all">все варианты</option>
                    <option value="card">Картой</option>
                    <option value="invoice">Безнал или картой</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#2d3137] absolute right-3 bottom-2.5 pointer-events-none" />
                </div>
              </div>

              {/* `↻ Обновить цены` Full-Width Gray Button */}
              <button
                type="button"
                onClick={handleRefreshPrices}
                className="w-full py-2.5 rounded-[8px] bg-[#e5e5e5] hover:bg-[#c7c7c7] text-[13.5px] font-medium text-[#2d3137] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw
                  className={`w-4 h-4 ${refreshingRates ? 'animate-spin' : ''}`}
                />
                <span>Обновить цены</span>
              </button>

              {/* ROOM CATEGORY GROUPS + DARK-HEADER B2B TARIFF TABLES */}
              <div className="space-y-7 pt-2">
                {filteredCategories.map((roomCat) => (
                  <div key={roomCat.id} className="space-y-3">
                    {/* Room Header: Thumbnail + Title + Spec Pills */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
                      <div className="relative w-[96px] h-[68px] rounded-[8px] overflow-hidden bg-[#e5e5e5] shrink-0">
                        <img
                          src={roomCat.photo}
                          alt={roomCat.title}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = FALLBACK_IMAGES[0];
                          }}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-white/90 text-[10px] font-semibold text-[#2d3137]">
                          {roomCat.photosCount} фото
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-[17.5px] font-bold text-[#2d3137] leading-snug">
                          {roomCat.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4f4f4] text-[12px] text-[#2d3137]">
                            <Maximize2 className="w-3 h-3 text-[#2d3137]" />
                            {roomCat.area}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4f4f4] text-[12px] text-[#2d3137]">
                            <Bath className="w-3 h-3 text-[#2d3137]" />
                            Собственная ванная комната
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4f4f4] text-[12px] text-[#2d3137]">
                            <Lock className="w-3 h-3 text-[#2d3137]" />
                            Сейф
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4f4f4] text-[12px] text-[#2d3137]">
                            <Wifi className="w-3 h-3 text-[#2d3137]" />
                            Высокоскоростной доступ в Интернет
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4f4f4] text-[12px] text-[#2d3137]">
                            <Wind className="w-3 h-3 text-[#2d3137]" />
                            Кондиционер
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tariff Table (`Номер | Питание | Отмена | Цены партнёров | Тип оплаты | Бронирование`) */}
                    <div className="overflow-x-auto rounded-[8px]">
                      <div className="min-w-[760px]">
                        {/* Dark Table Header (`#2d3137`) */}
                        <div className="bg-[#2d3137] text-white text-[12px] font-medium grid grid-cols-12 items-center px-3.5 py-2.5">
                          <div className="col-span-3">Номер</div>
                          <div className="col-span-1 border-l border-white/15 pl-2.5">
                            Питание
                          </div>
                          <div className="col-span-2 border-l border-white/15 pl-2.5">
                            Отмена
                          </div>
                          <div className="col-span-2 border-l border-white/15 pl-2.5">
                            Цены партнёров
                          </div>
                          <div className="col-span-2 border-l border-white/15 pl-2.5">
                            Тип оплаты
                          </div>
                          <div className="col-span-2 border-l border-white/15 pl-2.5 text-center">
                            Бронирование
                          </div>
                        </div>

                        {/* Table Rows */}
                        <div className="divide-y divide-[#f4f4f4]">
                          {roomCat.tariffs.map((t) => {
                            const pBooking = t.agentPrice;
                            const pAgoda = Math.round(t.agentPrice * 1.03);
                            const pTrip = Math.round(t.agentPrice * 1.06);

                            return (
                              <div
                                key={t.id}
                                className="grid grid-cols-12 items-center px-3.5 py-3.5 hover:bg-[#fafafa] transition-colors"
                              >
                                {/* Col 1: Номер (`col-span-3`) */}
                                <div className="col-span-3 pr-2.5 min-w-0">
                                  <div className="flex items-center gap-1.5 text-[12px] text-[#868686]">
                                    <BedDouble className="w-4 h-4 text-[#2d3137] shrink-0" />
                                    <span>1 номер</span>
                                  </div>
                                  <div
                                    title={t.subName}
                                    className="text-[13px] text-[#868686] truncate mt-0.5"
                                  >
                                    {t.subName}
                                  </div>
                                  <div className="text-[12.5px] text-[#2d3137] mt-0.5 truncate">
                                    {t.roomInfo}
                                  </div>
                                  <div className="text-[12.5px] text-[#2d3137] truncate">
                                    {t.smoking}
                                  </div>
                                </div>

                                {/* Col 2: Питание (`col-span-1`) */}
                                <div className="col-span-1 border-l border-[#f4f4f4] pl-2.5 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[13.5px] font-semibold text-[#1FA614]">
                                      {t.mealCode}
                                    </span>
                                    <InfoBadge title={t.mealLabel} />
                                  </div>
                                </div>

                                {/* Col 3: Отмена (`col-span-2`) */}
                                <div className="col-span-2 border-l border-[#f4f4f4] pl-2.5 min-w-0">
                                  {t.freeCancel ? (
                                    <div>
                                      <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#1FA614]">
                                        <span>{t.cancelText}</span>
                                        <InfoBadge title="Бесплатная отмена без штрафа" />
                                      </div>
                                      <div className="text-[12px] text-[#1FA614]">
                                        {t.cancelSub}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-[13.5px] text-[#2d3137]">
                                      <span>Нет</span>
                                      <InfoBadge title="Невозвратный тариф" />
                                    </div>
                                  )}
                                </div>

                                {/* Col 4: Цены у официальных партнёров (`col-span-2`) */}
                                <div
                                  onClick={() =>
                                    openPartnerModalForTariff(roomCat, t)
                                  }
                                  className="col-span-2 border-l border-[#f4f4f4] pl-2.5 pr-1 min-w-0 cursor-pointer group"
                                >
                                  <div className="flex items-center gap-1 text-[15px] font-bold text-[#2d3137] group-hover:text-[#4086e4] transition-colors">
                                    <span className="truncate">
                                      от {pBooking.toLocaleString('ru-RU')} $
                                    </span>
                                    <InfoBadge title="Нажмите для сравнения цен у всех официальных партнёров" />
                                  </div>
                                  <div className="text-[11px] text-[#868686] leading-tight mt-0.5 space-y-0.5">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="truncate">Booking:</span>
                                      <span className="font-semibold text-[#2d3137] shrink-0">
                                        {pBooking.toLocaleString('ru-RU')} $
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="truncate">Agoda:</span>
                                      <span className="font-medium text-[#2d3137] shrink-0">
                                        {pAgoda.toLocaleString('ru-RU')} $
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="truncate">Trip.com:</span>
                                      <span className="font-medium text-[#2d3137] shrink-0">
                                        {pTrip.toLocaleString('ru-RU')} $
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Col 5: Тип оплаты (`col-span-2`) */}
                                <div className="col-span-2 border-l border-[#f4f4f4] pl-2.5 pr-2 min-w-0">
                                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#1FA614]">
                                    <span className="leading-snug">
                                      {t.paymentLabel}
                                    </span>
                                    <InfoBadge title={t.paymentLabel} />
                                  </div>
                                  <div className="text-[11.5px] text-[#868686] mt-0.5">
                                    Без скрытых сборов
                                  </div>
                                </div>

                                {/* Col 6: Action (`col-span-2` — `Забронировать` fits cleanly without covering text) */}
                                <div className="col-span-2 border-l border-[#f4f4f4] pl-2.5 flex flex-col items-center justify-center min-w-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openPartnerModalForTariff(roomCat, t)
                                    }
                                    className="w-full max-w-[132px] px-3 py-2 rounded-[8px] bg-[#fddd55] hover:bg-[#ffd300] active:bg-[#fdc500] text-[#2d3137] text-[13px] font-semibold transition-colors cursor-pointer text-center truncate"
                                  >
                                    Забронировать
                                  </button>
                                  <div className="flex items-center gap-0.5 text-[11.5px] text-[#4086e4] font-semibold mt-1">
                                    <span>Вы получите {t.points}</span>
                                    <span className="w-3.5 h-3.5 rounded-full bg-[#4086e4] text-white text-[9px] font-bold inline-flex items-center justify-center">
                                      P
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* RIGHT SIDEBAR COLUMN (`Вы недавно смотрели`, `w-[270px]`)       */}
          {/* =============================================================== */}
          <aside className="w-full xl:w-[270px] shrink-0 space-y-2.5">
            <div className="text-[14px] font-semibold text-[#2d3137] px-0.5">
              Вы недавно смотрели
            </div>

            <div className="space-y-2.5">
              {RECENTLY_VIEWED_HOTELS.map((item) => (
                <div
                  key={item.id}
                  onClick={onBackToResults}
                  className="bg-white rounded-[12px] overflow-hidden rh-card-shadow rh-card-shadow-hover flex h-[80px] cursor-pointer"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-[80px] h-full object-cover shrink-0"
                  />
                  <div className="p-2.5 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-[1.5px]">
                        {Array.from({ length: item.stars }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-2.5 h-2.5 text-[#F5A623] fill-current"
                          />
                        ))}
                      </div>
                      <div className="text-[12.5px] font-semibold text-[#2d3137] leading-tight line-clamp-2 mt-0.5">
                        {item.name}
                      </div>
                    </div>
                    <div className="text-[11px] text-[#868686] truncate">
                      {item.dates}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onBackToResults}
              className="w-full py-2.5 rounded-[10px] bg-[#e5e5e5] hover:bg-[#c7c7c7] text-[13.5px] font-medium text-[#2d3137] transition-colors cursor-pointer"
            >
              Показать ещё 3
            </button>
          </aside>
        </div>
      </div>

      {/* Multi-Platform Offers Modal */}
      {showOffersModal && (
        <HotelOffersModal
          hotel={hotel}
          selectedTariff={selectedTariffForModal}
          searchParams={searchParams}
          onClose={() => {
            setShowOffersModal(false);
            setSelectedTariffForModal(null);
          }}
        />
      )}
    </div>
  );
}
