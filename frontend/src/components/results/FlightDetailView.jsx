import React, { useState } from 'react';
import {
  ArrowLeft,
  Plane,
  Luggage,
  Briefcase,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { getFlightProviderOffers } from '../../services/deeplinks';

export default function FlightDetailView({
  flight,
  initialTariff = null,
  searchParams,
  onBackToResults,
  onCreateB2BOrder,
}) {
  const [selectedTariffId, setSelectedTariffId] = useState(
    initialTariff?.id || flight?.tariffs?.[0]?.id
  );
  const [logoBroken, setLogoBroken] = useState(false);

  if (!flight) return null;

  const out = flight.outbound_leg || {};
  const ret = flight.return_leg || {};
  const activeTariff =
    flight.tariffs?.find((t) => t.id === selectedTariffId) ||
    flight.tariffs?.[0] || {
      name: 'Basic',
      price: flight.min_price,
      price_label: `${flight.min_price} $`,
      baggage_included: flight.baggage_included,
    };

  const directOffers = getFlightProviderOffers(
    flight,
    activeTariff.price,
    searchParams
  );

  return (
    <div className="min-h-screen bg-[#F4F5F7] py-5 px-4">
      <div className="max-w-[1120px] mx-auto space-y-5">
        {/* Top Breadcrumb (`← Назад к результатам поиска`) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToResults}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-[13px] font-semibold text-[#111827] shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#2563EB]" />
            <span>Назад к результатам поиска рейсов</span>
          </button>

          <div className="text-[12px] text-[#6B7280]">
            Пассажиров: {searchParams?.flightPassengers || 1} • Класс:{' '}
            {searchParams?.cabinClass || 'Эконом'}
          </div>
        </div>

        {/* 1. HEADER & TARIFF SELECTOR */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#3B424C] text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                style={{ backgroundColor: flight.airline_logo_bg || '#073590' }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs overflow-hidden shrink-0"
              >
                {flight.airline_logo_url && !logoBroken ? (
                  <img
                    src={flight.airline_logo_url}
                    alt={flight.airline_name}
                    onError={() => setLogoBroken(true)}
                    className="w-8 h-8 object-contain bg-white rounded-lg p-0.5"
                  />
                ) : (
                  <span>{flight.carrier_code}</span>
                )}
              </div>
              <div>
                <h1 className="text-[17px] font-bold leading-tight">
                  {flight.airline_name} • {out.origin_code} ⇄{' '}
                  {out.destination_code}
                </h1>
                <p className="text-[11px] text-gray-300">
                  {flight.validating_carrier} • Рейсы {out.flight_number} /{' '}
                  {ret.flight_number}
                </p>
              </div>
            </div>

            {flight.ticketing_time_limit && (
              <span className="px-3 py-1 rounded-full bg-white/15 text-[12px] font-semibold">
                Тайм-лимит: {flight.ticketing_time_limit}
              </span>
            )}
          </div>

          {/* Detailed Outbound & Return Breakdown */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5 border-b border-gray-100">
            {/* OUTBOUND LEG */}
            <div className="rounded-xl bg-[#F8F9FA] border border-gray-200/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md bg-[#FFF8DB] border border-[#F6D04D] text-[11px] font-bold text-[#111827]">
                  Туда • {out.date_label}
                </span>
                <span className="text-[12px] font-semibold text-[#374151]">
                  Рейс {out.flight_number} • {out.aircraft || 'Airbus A321neo'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                  <div className="text-[22px] font-extrabold text-[#111827] leading-none">
                    {out.departure_time}
                  </div>
                  <div className="text-[12px] font-bold text-[#2563EB] mt-1">
                    {out.origin_code}
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    {out.origin_terminal || 'Терминал 1'}
                  </div>
                </div>

                <div className="flex-1 px-3 text-center">
                  <div className="text-[11px] text-[#6B7280] mb-1 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{out.duration_label}</span>
                  </div>
                  <div className="relative h-[2px] bg-gray-300 w-full flex items-center justify-center">
                    <Plane className="w-4 h-4 text-[#111827] bg-[#F8F9FA] px-0.5" />
                  </div>
                  <div className="text-[11px] font-semibold text-[#16A34A] mt-1">
                    {out.stops_label}
                  </div>
                  {out.stops_subtext && (
                    <div className="text-[10px] text-[#6B7280]">
                      {out.stops_subtext}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-[22px] font-extrabold text-[#111827] leading-none">
                    {out.arrival_time}
                    {out.next_day && (
                      <sup className="text-[11px] text-[#D97706] ml-0.5">
                        {out.next_day}
                      </sup>
                    )}
                  </div>
                  <div className="text-[12px] font-bold text-[#2563EB] mt-1">
                    {out.destination_code}
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    {out.destination_terminal || 'Терминал 2'}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200/70 text-[11px] text-[#4B5563]">
                {out.route_subtext}
              </div>
            </div>

            {/* RETURN LEG */}
            <div className="rounded-xl bg-[#F8F9FA] border border-gray-200/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md bg-gray-200/80 text-[11px] font-bold text-[#111827]">
                  Обратно • {ret.date_label}
                </span>
                <span className="text-[12px] font-semibold text-[#374151]">
                  Рейс {ret.flight_number} • {ret.aircraft || 'Airbus A321neo'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                  <div className="text-[22px] font-extrabold text-[#111827] leading-none">
                    {ret.departure_time}
                  </div>
                  <div className="text-[12px] font-bold text-[#2563EB] mt-1">
                    {ret.origin_code}
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    {ret.origin_terminal || 'Терминал 2'}
                  </div>
                </div>

                <div className="flex-1 px-3 text-center">
                  <div className="text-[11px] text-[#6B7280] mb-1 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{ret.duration_label}</span>
                  </div>
                  <div className="relative h-[2px] bg-gray-300 w-full flex items-center justify-center">
                    <Plane className="w-4 h-4 text-[#111827] bg-[#F8F9FA] px-0.5 -scale-x-100" />
                  </div>
                  <div className="text-[11px] font-semibold text-[#16A34A] mt-1">
                    {ret.stops_label}
                  </div>
                  {ret.stops_subtext && (
                    <div className="text-[10px] text-[#6B7280]">
                      {ret.stops_subtext}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-[22px] font-extrabold text-[#111827] leading-none">
                    {ret.arrival_time}
                    {ret.next_day && (
                      <sup className="text-[11px] text-[#D97706] ml-0.5">
                        {ret.next_day}
                      </sup>
                    )}
                  </div>
                  <div className="text-[12px] font-bold text-[#2563EB] mt-1">
                    {ret.destination_code}
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    {ret.destination_terminal || 'Терминал 1'}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200/70 text-[11px] text-[#4B5563]">
                {ret.route_subtext}
              </div>
            </div>
          </div>

          {/* Cabin, Baggage & Tariff Switcher */}
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
            <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#374151]">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#16A34A]">
                <Briefcase className="w-4 h-4" />
                Ручная кладь: 1×8 кг (55×40×23 см)
              </span>
              <span
                className={`inline-flex items-center gap-1.5 font-medium ${
                  activeTariff.baggage_included
                    ? 'text-[#16A34A]'
                    : 'text-[#6B7280]'
                }`}
              >
                <Luggage className="w-4 h-4" />
                {activeTariff.baggage_included
                  ? `Багаж включён: 1×${activeTariff.baggage_weight || '23'} кг`
                  : 'Регистрируемый багаж не включён (тариф Basic)'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#374151]">
                <RefreshCw className="w-3.5 h-3.5 text-[#2563EB]" />
                {activeTariff.refundable
                  ? 'Гибкий обмен и возврат'
                  : 'Обмен со сбором перевозчика'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {flight.tariffs?.map((t) => {
                const isSelected = t.id === activeTariff.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTariffId(t.id)}
                    className={`px-4 py-2 rounded-xl text-[12px] font-bold border transition-all ${
                      isSelected
                        ? 'bg-[#FFF8DB] border-[#F6D04D] text-[#111827] shadow-2xs'
                        : 'bg-gray-50 border-gray-200 text-[#4B5563] hover:bg-gray-100'
                    }`}
                  >
                    Тариф {t.name} • {t.price_label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. FLIGHT PRICE COMPARISON BLOCK (`Где купить этот билет без посредников`) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-[20px] font-bold text-[#111827]">
                Где купить этот билет без посредников
              </h2>
              <p className="text-[12px] text-[#6B7280] mt-0.5">
                Прямые ссылки на маршрут {out.origin_code} ⇄{' '}
                {out.destination_code} с предзаполненными датами и числом
                пассажиров
              </p>
            </div>

            {onCreateB2BOrder && (
              <button
                type="button"
                onClick={() => onCreateB2BOrder(flight, activeTariff)}
                className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-[12px] font-semibold text-[#374151] self-start sm:self-auto"
              >
                Выписать по безналу (B2B заказ)
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
            {directOffers.map((offer) => (
              <div
                key={offer.provider}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  offer.is_cheapest || offer.provider_type === 'official_airline'
                    ? 'bg-[#FFFDF5] hover:bg-[#FFF9E2]'
                    : 'bg-white hover:bg-gray-50/70'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[16px] font-extrabold text-[#111827]">
                      {offer.provider}
                    </span>
                    {offer.provider_type === 'official_airline' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1D4ED8] text-[11px] font-bold">
                        <ShieldCheck className="w-3 h-3" /> Официальный перевозчик
                      </span>
                    )}
                    {offer.is_cheapest && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#16A34A] text-white text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Выгодно
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#4B5563]">
                    {offer.badge} • Тариф {activeTariff.name} •{' '}
                    {activeTariff.baggage_included
                      ? 'Багаж 23 кг включён'
                      : 'Ручная кладь 8 кг'}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="text-[20px] font-extrabold text-[#111827] leading-none">
                      {Number(offer.price).toLocaleString('ru-RU', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      $
                    </div>
                    <div className="text-[10px] text-[#6B7280] mt-1">
                      за всех пассажиров, туда-обратно
                    </div>
                  </div>

                  <a
                    href={offer.deep_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-[42px] px-5 rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] font-bold text-[13px] inline-flex items-center gap-1.5 transition-all whitespace-nowrap shadow-2xs"
                  >
                    <span>{offer.short_cta}</span>
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

