import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  CheckCircle2,
  ArrowLeft,
  Star,
  Loader2,
} from 'lucide-react';
import { searchTransfers } from '../../services/api';

export default function TransferResultsView({
  searchParams,
  onBackToDashboard,
  onSelectTransfer,
}) {
  const [transfers, setTransfers] = useState([]);
  const [routeLabel, setRouteLabel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    searchTransfers({
      tripType: searchParams.transferTripType,
      pickupLocation: searchParams.transferFrom,
      dropoffLocation: searchParams.transferTo,
      date: searchParams.transferDate,
      pickupTime: searchParams.transferTime,
      passengers: searchParams.transferPassengers || 2,
    })
      .then((data) => {
        if (mounted) {
          setTransfers(data.items || []);
          setRouteLabel(data.route_label || '');
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [
    searchParams.transferTripType,
    searchParams.transferFrom,
    searchParams.transferTo,
    searchParams.transferDate,
    searchParams.transferTime,
    searchParams.transferPassengers,
  ]);

  return (
    <div className="min-h-screen bg-[#F4F5F7] py-6 px-4">
      <div className="max-w-[1220px] mx-auto space-y-5">
        {/* Top Summary Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-medium text-[#111827] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Назад к поиску</span>
            </button>
            <div>
              <h1 className="text-[18px] font-bold text-[#111827]">
                Трансферы: {routeLabel || 'Аэропорт Барселона (BCN) → Центр города / Отель'}
              </h1>
              <p className="text-[12px] text-[#6B7280]">
                Дата подачи: {searchParams.transferDate || 'пт, 30 окт.'} в{' '}
                {searchParams.transferTime || '12:00'} •{' '}
                {searchParams.transferPassengers || 2} взрослых
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            Фиксированная цена • Встреча с табличкой
          </span>
        </div>

        {/* Transfer Cards */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin text-[#6B7280]" />
            <span>Поиск доступных трансферов...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {transfers.map((tr) => (
              <div
                key={tr.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200/80 flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex flex-col sm:flex-row items-center gap-5 flex-1">
                  <img
                    src={tr.image}
                    alt={tr.vehicle_class}
                    className="w-48 h-28 object-cover rounded-xl bg-gray-100 shrink-0"
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[17px] font-bold text-[#111827]">
                        {tr.vehicle_class}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-bold">
                        <Star className="w-3 h-3 fill-current" />{' '}
                        {tr.carrier_rating}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280]">{tr.models}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#374151] pt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-gray-500" /> до{' '}
                        {tr.capacity} пассажиров
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-gray-500" />{' '}
                        {tr.baggage_allowance} мест багажа
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />{' '}
                        {tr.free_waiting_time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-2 border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
                  <div>
                    <div className="text-xs text-gray-400 line-through">
                      {tr.old_price} $
                    </div>
                    <div className="text-[22px] font-extrabold text-[#2563EB] leading-none">
                      {tr.price} $
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      за автомобиль • {tr.duration}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectTransfer(tr)}
                    className="px-6 py-2.5 rounded-xl bg-[#F6D04D] hover:bg-[#F5C400] text-[#111827] font-semibold text-xs transition-all"
                  >
                    Выбрать трансфер
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
