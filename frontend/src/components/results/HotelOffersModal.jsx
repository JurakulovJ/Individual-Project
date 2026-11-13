import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Utensils,
  RotateCcw,
  Star,
  Loader2,
  Building2,
} from 'lucide-react';
import { getHotelOffers, getHotelOfferRedirect } from '../../services/api';

const PLATFORM_BADGE_STYLE = {
  booking: { bg: '#003580', text: '#FFFFFF', short: 'B.' },
  agoda: { bg: '#5392F9', text: '#FFFFFF', short: 'Ag' },
  tripcom: { bg: '#287DFA', text: '#FFFFFF', short: 'Tr' },
};

export default function HotelOffersModal({
  hotel,
  searchParams,
  onClose,
  onOpenFullDetail,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offersData, setOffersData] = useState(null);
  const [redirectingProvider, setRedirectingProvider] = useState(null);

  const adultsCount =
    (Number(searchParams?.adults) || 2) + (Number(searchParams?.children) || 0);
  const roomsCount = Number(searchParams?.rooms) || 1;

  const loadOffers = useCallback(async () => {
    if (!hotel?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getHotelOffers(hotel.id, {
        checkIn: searchParams?.checkIn,
        checkOut: searchParams?.checkOut,
        adults: adultsCount,
        rooms: roomsCount,
        hotelName: hotel.name,
        city: hotel.city_en || hotel.city,
      });
      setOffersData(data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Не удалось загрузить предложения партнёров. Попробуйте повторить запрос.'
      );
    } finally {
      setLoading(false);
    }
  }, [
    hotel?.id,
    hotel?.name,
    hotel?.city_en,
    hotel?.city,
    searchParams?.checkIn,
    searchParams?.checkOut,
    adultsCount,
    roomsCount,
  ]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const handlePlatformRedirect = async (offer) => {
    setRedirectingProvider(offer.provider);
    try {
      const res = await getHotelOfferRedirect(hotel.id, offer.provider, {
        checkIn: offersData?.check_in || searchParams?.checkIn,
        checkOut: offersData?.check_out || searchParams?.checkOut,
        adults: adultsCount,
        rooms: roomsCount,
        hotelName: hotel.name,
        city: hotel.city_en || hotel.city,
        deepLink: offer.deep_link || undefined,
      });
      const targetUrl = res?.target_url;
      if (targetUrl) {
        const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
        if (win) win.opener = null;
      }
    } catch {
      // Fallback if network fails momentarily
      if (offer.deep_link) {
        window.open(offer.deep_link, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setRedirectingProvider(null);
    }
  };

  if (!hotel) return null;

  const offers = offersData?.offers || [];
  const isMock = offersData?.source === 'mock';
  const partialErrors = offersData?.errors || [];
  const taContent = offersData?.tripadvisor_content;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 bg-[#FAFAFA]">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {hotel.stars > 0 && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: hotel.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 text-[#F59E0B] fill-current"
                    />
                  ))}
                </div>
              )}
              {isMock && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                  Демо-данные
                </span>
              )}
            </div>
            <h3 className="text-[18px] font-extrabold text-[#111827] leading-snug truncate">
              {hotel.name}
            </h3>
            <p className="text-[12px] text-[#6B7280] truncate">
              {hotel.address} • {offersData?.nights || hotel.nights || 7} ночей,{' '}
              {adultsCount} гостей
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Partial Provider Errors Warning */}
          {partialErrors.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">
                  Частичный ответ внешних платформ:
                </div>
                {partialErrors.map((err, i) => (
                  <div key={i}>
                    • {err.provider}: {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1. LOADING SKELETON STATE */}
          {loading ? (
            <div className="space-y-3" data-testid="offers-skeleton">
              {[1, 2, 3].map((sk) => (
                <div
                  key={sk}
                  className="p-4 rounded-xl border border-gray-200 animate-pulse flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                  <div className="w-32 h-10 bg-gray-200 rounded-xl shrink-0" />
                </div>
              ))}
            </div>
          ) : error ? (
            /* 2. ERROR STATE WITH RETRY BUTTON */
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-6 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
              <div className="text-sm font-bold text-[#111827]">{error}</div>
              <button
                type="button"
                onClick={loadOffers}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] text-xs font-bold shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Повторить</span>
              </button>
            </div>
          ) : offers.length === 0 ? (
            /* 3. EMPTY STATE WITH RETRY BUTTON */
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center space-y-3">
              <Building2 className="w-8 h-8 text-gray-400 mx-auto" />
              <div className="text-sm font-bold text-[#111827]">
                На выбранные даты офферы не найдены
              </div>
              <button
                type="button"
                onClick={loadOffers}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] text-xs font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Повторить</span>
              </button>
            </div>
          ) : (
            /* 4. AGGREGATED PARTNER OFFERS LIST */
            <div className="space-y-2.5">
              {offers.map((offer) => {
                const style = PLATFORM_BADGE_STYLE[offer.provider] || {
                  bg: '#1F2937',
                  text: '#FFFFFF',
                  short: offer.provider_label?.slice(0, 2) || 'OT',
                };
                const isBusy = redirectingProvider === offer.provider;

                return (
                  <div
                    key={offer.provider}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 ${
                      offer.is_cheapest
                        ? 'bg-[#FFFDF5] border-[#F6D04D] shadow-2xs'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Left Platform Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        style={{
                          backgroundColor: style.bg,
                          color: style.text,
                        }}
                        className="w-10 h-10 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs mt-0.5"
                      >
                        {style.short}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-extrabold text-[#111827]">
                            {offer.provider_label}
                          </span>
                          {offer.is_cheapest && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#16A34A] text-white text-[10.5px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Дешевле всего</span>
                            </span>
                          )}
                        </div>

                        <div className="text-[12px] text-[#374151] font-medium truncate">
                          {offer.room_name}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px]">
                          <span className="inline-flex items-center gap-1 text-[#16A34A] font-medium">
                            <Utensils className="w-3 h-3" />
                            <span>{offer.meal_label}</span>
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 ${
                              offer.free_cancellation
                                ? 'text-[#16A34A] font-medium'
                                : 'text-[#6B7280]'
                            }`}
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>
                              {offer.free_cancellation
                                ? 'Бесплатная отмена'
                                : 'Спецтариф'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Price (Per Night + Total) & Redirect Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-gray-100">
                      <div className="text-left sm:text-right">
                        <div className="text-[12px] font-semibold text-[#4B5563]">
                          {Number(offer.price_per_night || 0).toLocaleString(
                            'ru-RU'
                          )}{' '}
                          $ <span className="text-[11px] font-normal">/ ночь</span>
                        </div>
                        <div className="text-[19px] font-extrabold text-[#111827] leading-tight whitespace-nowrap">
                          Итого:{' '}
                          {Number(offer.total_price || 0).toLocaleString(
                            'ru-RU'
                          )}{' '}
                          $
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handlePlatformRedirect(offer)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] disabled:opacity-60 text-[#111827] text-[12.5px] font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <span>Перейти на {offer.provider_label}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Optional Tripadvisor Content Summary */}
          {taContent && (
            <div className="rounded-xl bg-[#F9FAFB] border border-gray-200/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-[#111827]">
                  Контент и отзывы Tripadvisor • Оценка {taContent.rating || '9.2'} (
                  {taContent.num_reviews} отзывов)
                </div>
                <p className="text-[#4B5563] line-clamp-2">
                  {taContent.description}
                </p>
              </div>
              {taContent.web_url && (
                <a
                  href={taContent.web_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2563EB] hover:underline font-semibold shrink-0 inline-flex items-center gap-1"
                >
                  <span>Отзывы</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-[#6B7280]">
            Бронирование завершается напрямую на официальном сайте выбранной платформы
          </span>
          {onOpenFullDetail && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullDetail(hotel);
              }}
              className="text-[12px] font-bold text-[#2563EB] hover:underline cursor-pointer"
            >
              Все категории номеров и фото отеля →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

