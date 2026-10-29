import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MONTHS_RU = [
  { name: 'Октябрь 2026', short: 'окт.', flightShort: 'Окт', year: 2026, month: 9, days: 31, startOffset: 3 },
  { name: 'Ноябрь 2026', short: 'нояб.', flightShort: 'Нояб', year: 2026, month: 10, days: 30, startOffset: 6 },
  { name: 'Декабрь 2026', short: 'дек.', flightShort: 'Дек', year: 2026, month: 11, days: 31, startOffset: 1 },
  { name: 'Январь 2027', short: 'янв.', flightShort: 'Янв', year: 2027, month: 0, days: 31, startOffset: 4 },
  { name: 'Февраль 2027', short: 'февр.', flightShort: 'Фев', year: 2027, month: 1, days: 28, startOffset: 0 },
];

const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAY_SHORT_FLIGHT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function DatePickerPopover({
  mode = 'hotel', // 'hotel' | 'flight' | 'transfer'
  activeField = 'start', // 'start' | 'end'
  onSelectRange,
  onSelectSingle,
  onClose,
}) {
  const [monthIdx, setMonthIdx] = useState(1); // Default November 2026
  const [selectingStep, setSelectingStep] = useState(activeField === 'end' ? 'end' : 'start');
  const [startDay, setStartDay] = useState(12);
  const [endDay, setEndDay] = useState(19);

  const currentMonth = MONTHS_RU[monthIdx];

  const formatHotelDate = (day, mObj) => `${day} ${mObj.short} ${mObj.year} г.`;
  const formatFlightDate = (day, mObj) => {
    const dow = (mObj.startOffset + day - 1) % 7;
    return `${day} ${mObj.flightShort}, ${WEEKDAY_SHORT_FLIGHT[dow]}`;
  };
  const formatTransferDate = (day, mObj) => {
    const dow = (mObj.startOffset + day - 1) % 7;
    return `${WEEKDAYS_RU[dow].toLowerCase()}, ${day} ${mObj.short}`;
  };

  const handleDayClick = (day) => {
    if (mode === 'transfer') {
      if (onSelectSingle) {
        onSelectSingle(formatTransferDate(day, currentMonth));
      }
      onClose();
      return;
    }

    if (selectingStep === 'start') {
      const nextEnd = Math.min(currentMonth.days, day + (mode === 'hotel' ? 7 : 3));
      setStartDay(day);
      setEndDay(nextEnd);
      setSelectingStep('end');
      if (onSelectRange) {
        if (mode === 'hotel') {
          onSelectRange(
            formatHotelDate(day, currentMonth),
            formatHotelDate(nextEnd, currentMonth),
            Math.max(1, nextEnd - day)
          );
        } else {
          onSelectRange(
            formatFlightDate(day, currentMonth),
            formatFlightDate(nextEnd, currentMonth)
          );
        }
      }
    } else {
      const finalStart = day < startDay ? day : startDay;
      const finalEnd = day < startDay ? startDay : Math.max(startDay + 1, day);
      setStartDay(finalStart);
      setEndDay(finalEnd);
      if (onSelectRange) {
        if (mode === 'hotel') {
          onSelectRange(
            formatHotelDate(finalStart, currentMonth),
            formatHotelDate(finalEnd, currentMonth),
            Math.max(1, finalEnd - finalStart)
          );
        } else {
          onSelectRange(
            formatFlightDate(finalStart, currentMonth),
            formatFlightDate(finalEnd, currentMonth)
          );
        }
      }
      onClose();
    }
  };

  const applyQuickDuration = (nights) => {
    const s = startDay || 12;
    const e = Math.min(currentMonth.days, s + nights);
    setEndDay(e);
    if (onSelectRange) {
      if (mode === 'hotel') {
        onSelectRange(
          formatHotelDate(s, currentMonth),
          formatHotelDate(e, currentMonth),
          Math.max(1, e - s)
        );
      } else {
        onSelectRange(
          formatFlightDate(s, currentMonth),
          formatFlightDate(e, currentMonth)
        );
      }
    }
    onClose();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute left-0 top-[56px] w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 select-none"
    >
      {/* Header: Step Indicator + Month Switcher */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827]">
          <Calendar className="w-4 h-4 text-[#7C3AED]" />
          <span>
            {mode === 'transfer'
              ? 'Выберите дату подачи'
              : selectingStep === 'start'
              ? '1. Выберите дату заезда / вылета'
              : '2. Выберите дату выезда / возврата'}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] text-gray-400 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
          disabled={monthIdx === 0}
          className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4 text-gray-700" />
        </button>
        <span className="text-[13px] font-bold text-[#111827]">
          {currentMonth.name}
        </span>
        <button
          type="button"
          onClick={() =>
            setMonthIdx((i) => Math.min(MONTHS_RU.length - 1, i + 1))
          }
          disabled={monthIdx === MONTHS_RU.length - 1}
          className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-400 mb-1">
        {WEEKDAYS_RU.map((wd) => (
          <div key={wd} className="py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-[12px]">
        {Array.from({ length: currentMonth.startOffset }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-8" />
        ))}
        {Array.from({ length: currentMonth.days }).map((_, idx) => {
          const day = idx + 1;
          const isStart = day === startDay;
          const isEnd = mode !== 'transfer' && day === endDay;
          const isInRange =
            mode !== 'transfer' && day > startDay && day < endDay;

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              className={`h-8 rounded-lg font-medium transition-all flex items-center justify-center ${
                isStart || isEnd
                  ? 'bg-[#F6D04D] text-[#111827] font-bold shadow-xs ring-1 ring-[#111827]/20'
                  : isInRange
                  ? 'bg-[#FFFBEB] text-[#111827]'
                  : 'text-[#111827] hover:bg-gray-100'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Quick Presets Footer */}
      {mode !== 'transfer' && (
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1">
          {[
            { label: '1 ночь', nights: 1 },
            { label: '3 ночи', nights: 3 },
            { label: '7 ночей', nights: 7 },
            { label: '14 ночей', nights: 14 },
          ].map((preset) => (
            <button
              key={preset.nights}
              type="button"
              onClick={() => applyQuickDuration(preset.nights)}
              className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-[#FFFBEB] hover:text-[#111827] text-[11px] font-medium text-gray-600 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

