import React, { useState } from 'react';
import {
  ArrowLeft,
  Star,
  MapPin,
  Wifi,
  Sparkles,
  Car,
  Utensils,
  Dumbbell,
  Users,
  ShieldCheck,
  Clock,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  Leaf,
  Building2,
} from 'lucide-react';
import { getHotelProviderOffers } from '../../services/deeplinks';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80',
];

const ROOM_CATEGORIES = [
  {
    id: 'standard',
    title: 'Standard / Superior King',
    bed: '1 большая двуспальная кровать King (28 м²)',
    multiplier: 1.0,
    perks: 'Вид на город • Рабочая зона • Кофемашина',
  },
  {
    id: 'deluxe',
    title: 'Deluxe Panoramic View',
    bed: '1 кровать King или 2 Twin • Панорамный вид (36 м²)',
    multiplier: 1.18,
    perks: 'Панорамные окна • Халаты и тапочки • Ранний заезд по запросу',
  },
  {
    id: 'suite',
    title: 'Executive Luxury Suite',
    bed: 'Спальня King + отдельная гостиная (54 м²)',
    multiplier: 1.42,
    perks: 'Доступ в Executive Lounge • VIP-приветствие',
  },
];

const MEAL_OPTIONS = [
  { code: 'RO', label: 'RO — Без питания', addMult: 0.94 },
  { code: 'BB', label: 'BB — Завтрак включён', addMult: 1.0 },
  { code: 'HB', label: 'HB — Завтрак + ужин', addMult: 1.12 },
  { code: 'AI', label: 'AI — Всё включено', addMult: 1.26 },
];

export default function HotelDetailView({
  hotel,
  searchParams,
  onBackToResults,
  onCreateB2BOrder,
}) {
  const [selectedRoomId, setSelectedRoomId] = useState('standard');
  const [selectedMealCode, setSelectedMealCode] = useState(
    hotel?.meal_plan || 'BB'
  );

  if (!hotel) return null;

  const gallery = [0, 1, 2, 3, 4].map(
    (idx) => hotel.images?.[idx] || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]
  );

  const activeRoom =
    ROOM_CATEGORIES.find((r) => r.id === selectedRoomId) || ROOM_CATEGORIES[0];
  const activeMeal =
    MEAL_OPTIONS.find((m) => m.code === selectedMealCode) || MEAL_OPTIONS[1];

  const combinedMultiplier = activeRoom.multiplier * activeMeal.addMult;

  const comparisonOffers = getHotelProviderOffers(
    hotel,
    searchParams,
    combinedMultiplier,
    activeMeal.label
  );

  const ratingWord =
    Number(hotel.rating) >= 9.0
      ? 'Превосходно'
      : Number(hotel.rating) >= 8.4
        ? 'Отлично'
        : 'Очень хорошо';

  const amenityItems = [
    { icon: Wifi, label: 'Бесплатный высокоскоростной Wi-Fi' },
    { icon: Sparkles, label: 'Спа-центр, хаммам и крытый бассейн' },
    { icon: Car, label: 'Индивидуальный трансфер от/до аэропорта' },
    { icon: Utensils, label: 'Панорамный ресторан и лаунж-бар' },
    { icon: Dumbbell, label: 'Круглосуточный фитнес-центр' },
    { icon: Building2, label: 'Охраняемая частная парковка' },
    { icon: Users, label: 'Семейные и смежные номера' },
    { icon: ShieldCheck, label: 'Круглосуточная стойка регистрации 24/7' },
  ];

  const ctaLabelForProvider = (name) => {
    if (name.includes('Booking')) return 'Перейти на Booking.com';
    if (name.includes('Agoda')) return 'Перейти на Agoda';
    if (name.includes('Hotels.com')) return 'Перейти на Hotels.com';
    if (name.includes('Trip.com')) return 'Перейти на Trip.com';
    return `Перейти на ${name}`;
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] py-5 px-4">
      <div className="max-w-[1220px] mx-auto space-y-5">
        {/* Top Breadcrumb (`← Назад к результатам поиска`) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToResults}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-[13px] font-semibold text-[#111827] shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#2563EB]" />
            <span>Назад к результатам поиска</span>
          </button>

          <div className="text-[12px] text-[#6B7280]">
            {searchParams?.checkIn || '12 нояб. 2026 г.'} —{' '}
            {searchParams?.checkOut || '19 нояб. 2026 г.'} •{' '}
            {searchParams?.rooms || 1} номер,{' '}
            {(searchParams?.adults || 2) + (searchParams?.children || 0)} гостей
          </div>
        </div>

        {/* 1. HEADER & 5-PHOTO MOSAIC GALLERY */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {hotel.stars > 0 ? (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: hotel.stars }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-[#F59E0B] fill-current"
                      />
                    ))}
                  </div>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-xs font-semibold text-gray-600">
                    Апартаменты / Бутик
                  </span>
                )}
                {hotel.eco_certified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                    <Leaf className="w-3 h-3 fill-current" /> Эко-сертификат
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] text-[11px] font-bold">
                  до +{hotel.loyalty_points || 110} P баллов
                </span>
              </div>

              <h1 className="text-[24px] sm:text-[26px] font-extrabold text-[#111827] leading-tight">
                {hotel.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#4B5563]">
                <span className="inline-flex items-center gap-1 text-[#2563EB] font-medium">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {hotel.address}
                </span>
                <span>• {hotel.distance_center_label}</span>
                <span>• {hotel.nearest_metro}</span>
              </div>
            </div>

            {/* Green Review Score Badge */}
            <div className="flex items-center gap-3 bg-[#F8F9FA] border border-gray-200/80 rounded-xl px-4 py-2.5 shrink-0 self-start">
              <div className="text-right">
                <div className="text-[14px] font-bold text-[#111827]">
                  {ratingWord}
                </div>
                <div className="text-[11px] text-[#6B7280]">
                  {Number(hotel.reviews_count || 1420).toLocaleString('ru-RU')}{' '}
                  проверенных отзывов
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#16A34A] text-white font-extrabold text-[17px] flex items-center justify-center shadow-sm">
                {hotel.rating_label}
              </div>
            </div>
          </div>

          {/* 5-Photo Mosaic Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2.5 h-auto md:h-[340px] rounded-xl overflow-hidden">
            <div className="md:col-span-2 md:row-span-2 h-[220px] md:h-full overflow-hidden bg-gray-100">
              <img
                src={gallery[0]}
                alt={hotel.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_IMAGES[0];
                }}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            {gallery.slice(1, 5).map((imgUrl, idx) => (
              <div
                key={idx}
                className="hidden md:block h-full overflow-hidden bg-gray-100"
              >
                <img
                  src={imgUrl}
                  alt={`${hotel.name} ${idx + 2}`}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGES[(idx + 1) % 5];
                  }}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 2. FULL HOTEL INFORMATION & AMENITIES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-[18px] font-bold text-[#111827]">
              Об отеле и условиях проживания
            </h2>
            <p className="text-[13px] text-[#374151] leading-relaxed">
              {hotel.description ||
                `Отель ${hotel.name} расположен в удобной локации города ${hotel.city} (${hotel.distance_center_label}). Гостям предлагаются современные просторные номера с кондиционером, премиальными ортопедическими матрасами, круглосуточным обслуживанием номеров и высокоскоростным интернетом.`}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl bg-[#F8F9FA] border border-gray-100 p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                  <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Время заезда</span>
                </div>
                <div className="text-[15px] font-bold text-[#111827] mt-0.5">
                  с {hotel.check_in_time || '14:00'}
                </div>
              </div>
              <div className="rounded-xl bg-[#F8F9FA] border border-gray-100 p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                  <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Время выезда</span>
                </div>
                <div className="text-[15px] font-bold text-[#111827] mt-0.5">
                  до {hotel.check_out_time || '12:00'}
                </div>
              </div>
              <div className="rounded-xl bg-[#F8F9FA] border border-gray-100 p-3 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                  <RotateCcw className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Отмена брони</span>
                </div>
                <div className="text-[13px] font-bold text-[#16A34A] mt-0.5">
                  Бесплатная отмена
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-[18px] font-bold text-[#111827]">
              Удобства и сервис в отеле
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {amenityItems.map((am, i) => {
                const IconComp = am.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 text-[12px] text-[#374151]"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#FFF8DB] border border-[#F6D04D]/60 flex items-center justify-center shrink-0">
                      <IconComp className="w-3.5 h-3.5 text-[#111827]" />
                    </div>
                    <span className="leading-snug">{am.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. ROOM CATEGORIES & AVAILABLE MEAL PLANS */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-[19px] font-bold text-[#111827]">
                Выберите категорию номера и тип питания
              </h2>
              <p className="text-[12px] text-[#6B7280] mt-0.5">
                Тарифы партнёров ниже пересчитываются автоматически под выбранный номер
              </p>
            </div>

            {/* Meal Plan Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {MEAL_OPTIONS.map((m) => {
                const active = selectedMealCode === m.code;
                return (
                  <button
                    key={m.code}
                    type="button"
                    onClick={() => setSelectedMealCode(m.code)}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all border ${
                      active
                        ? 'bg-[#FFF8DB] border-[#F6D04D] text-[#111827] shadow-2xs'
                        : 'bg-white border-gray-200 text-[#4B5563] hover:bg-gray-50'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {ROOM_CATEGORIES.map((rm) => {
              const isSelected = selectedRoomId === rm.id;
              const estPrice = Math.round(
                Number(hotel.total_price || 2400) *
                  rm.multiplier *
                  activeMeal.addMult
              ).toLocaleString('ru-RU');
              return (
                <div
                  key={rm.id}
                  onClick={() => setSelectedRoomId(rm.id)}
                  className={`rounded-xl p-4 cursor-pointer border transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#FFFDF5] border-2 border-[#F6D04D] shadow-sm'
                      : 'bg-[#F8F9FA] border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-bold text-[#111827]">
                        {rm.title}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#6B7280]">{rm.bed}</p>
                    <p className="text-[11px] text-[#16A34A] font-medium pt-1">
                      {rm.perks}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-200/70 flex items-baseline justify-between">
                    <span className="text-[11px] text-[#6B7280]">
                      за {hotel.nights || 7} ночей от
                    </span>
                    <span className="text-[17px] font-extrabold text-[#111827]">
                      {estPrice} $
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. PRICE COMPARISON BLOCK (`Сравнение цен у официальных партнёров`) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-[20px] font-bold text-[#111827]">
                Сравнение цен у официальных партнёров
              </h2>
              <p className="text-[12px] text-[#6B7280] mt-0.5">
                Прямой переход на страницу отеля {hotel.name} с предзаполненными датами и гостями (без посредников)
              </p>
            </div>

            {onCreateB2BOrder && (
              <button
                type="button"
                onClick={() => onCreateB2BOrder(hotel)}
                className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-[12px] font-semibold text-[#374151] self-start sm:self-auto"
              >
                Оформить по безналу (B2B счёт)
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
            {comparisonOffers.map((offer) => (
              <div
                key={offer.provider}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  offer.is_cheapest
                    ? 'bg-[#FFFDF5] hover:bg-[#FFF9E2]'
                    : 'bg-white hover:bg-gray-50/70'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[16px] font-extrabold text-[#111827]">
                      {offer.provider}
                    </span>
                    {offer.is_cheapest && (
                      <span className="px-2 py-0.5 rounded-md bg-[#16A34A] text-white text-[11px] font-bold">
                        Выгодно • Лучшая цена
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#374151] flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium">{activeRoom.title}</span>
                    <span>• {offer.meal_label}</span>
                    <span className="text-[#16A34A] font-medium">
                      • {offer.cancellation_label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="text-[20px] font-extrabold text-[#111827] leading-none">
                      {Number(offer.price).toLocaleString('ru-RU')} $
                    </div>
                    <div className="text-[10px] text-[#6B7280] mt-1">
                      за {hotel.nights || 7} ночей, с налогами
                    </div>
                  </div>

                  <a
                    href={offer.deep_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`h-[42px] px-5 rounded-xl font-bold text-[13px] inline-flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      offer.is_cheapest
                        ? 'bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] shadow-sm'
                        : 'bg-[#F6D04D]/90 hover:bg-[#F5C400] text-[#111827]'
                    }`}
                  >
                    <span>{ctaLabelForProvider(offer.provider)}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

