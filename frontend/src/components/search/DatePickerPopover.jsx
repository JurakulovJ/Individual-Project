import React, { useState, useRef, useEffect } from 'react';

// 14 consecutive months starting from October 2026 through November 2027 (matching Screenshots 2 & 3)
export const CALENDAR_MONTHS = [
  { key: '2026-10', year: 2026, month: 9, title: 'Октябрь', shortRu: 'окт.', flightShort: 'Окт', showYearBadge: true },
  { key: '2026-11', year: 2026, month: 10, title: 'Ноябрь', shortRu: 'нояб.', flightShort: 'Нояб', showYearBadge: false },
  { key: '2026-12', year: 2026, month: 11, title: 'Декабрь', shortRu: 'дек.', flightShort: 'Дек', showYearBadge: false },
  { key: '2027-01', year: 2027, month: 0, title: 'Январь', shortRu: 'янв.', flightShort: 'Янв', showYearBadge: true },
  { key: '2027-02', year: 2027, month: 1, title: 'Февраль', shortRu: 'февр.', flightShort: 'Фев', showYearBadge: false },
  { key: '2027-03', year: 2027, month: 2, title: 'Март', shortRu: 'мар.', flightShort: 'Мар', showYearBadge: false },
  { key: '2027-04', year: 2027, month: 3, title: 'Апрель', shortRu: 'апр.', flightShort: 'Апр', showYearBadge: false },
  { key: '2027-05', year: 2027, month: 4, title: 'Май', shortRu: 'мая', flightShort: 'Май', showYearBadge: false },
  { key: '2027-06', year: 2027, month: 5, title: 'Июнь', shortRu: 'июн.', flightShort: 'Июн', showYearBadge: false },
  { key: '2027-07', year: 2027, month: 6, title: 'Июль', shortRu: 'июл.', flightShort: 'Июл', showYearBadge: false },
  { key: '2027-08', year: 2027, month: 7, title: 'Август', shortRu: 'авг.', flightShort: 'Авг', showYearBadge: false },
  { key: '2027-09', year: 2027, month: 8, title: 'Сентябрь', shortRu: 'сент.', flightShort: 'Сен', showYearBadge: false },
  { key: '2027-10', year: 2027, month: 9, title: 'Октябрь', shortRu: 'окт.', flightShort: 'Окт', showYearBadge: false },
  { key: '2027-11', year: 2027, month: 10, title: 'Ноябрь', shortRu: 'нояб.', flightShort: 'Нояб', showYearBadge: false },
];

const WEEKDAYS_HEADER = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const WEEKDAYS_SHORT_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Monday-based weekday offset (0 = Monday ... 6 = Sunday)
function getStartOffsetMonday(year, month) {
  const jsDay = new Date(year, month, 1).getDay();
  return (jsDay + 6) % 7;
}

function toIsoDate(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function diffDays(isoStart, isoEnd) {
  if (!isoStart || !isoEnd) return 1;
  const d1 = new Date(`${isoStart}T00:00:00`);
  const d2 = new Date(`${isoEnd}T00:00:00`);
  return Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}

export function formatIsoForMode(isoStr, mode = 'hotel') {
  if (!isoStr) return '';
  const [yStr, mStr, dStr] = isoStr.split('-');
  const year = Number(yStr);
  const monthIdx = Number(mStr) - 1;
  const day = Number(dStr);
  const mMeta =
    CALENDAR_MONTHS.find((m) => m.year === year && m.month === monthIdx) ||
    CALENDAR_MONTHS[1];

  const jsDate = new Date(year, monthIdx, day);
  const dowMonday = (jsDate.getDay() + 6) % 7;

  if (mode === 'flight') {
    return `${day} ${mMeta.flightShort}, ${WEEKDAYS_SHORT_RU[dowMonday]}`;
  }
  if (mode === 'transfer') {
    return `${WEEKDAYS_SHORT_RU[dowMonday].toLowerCase()}, ${day} ${mMeta.shortRu}`;
  }
  return `${day} ${mMeta.shortRu} ${year} г.`;
}

export default function DatePickerPopover({
  mode = 'hotel', // 'hotel' | 'flight' | 'transfer'
  activeField = 'start', // 'start' | 'end'
  onSwitchField, // Callback to switch parent focus from 'start' -> 'end'
  initialStartIso = '2026-11-12',
  initialEndIso = '2026-11-19',
  onSelectCheckIn, // Called immediately on Step 1 (sets ONLY checkIn)
  onSelectCheckOut, // Called on Step 3 (sets ONLY checkOut + nights, then closes)
  onSelectSingle, // Called when mode === 'transfer'
  onClose,
}) {
  const [startIso, setStartIso] = useState(initialStartIso || '2026-11-12');
  const [endIso, setEndIso] = useState(
    activeField === 'end' ? null : initialEndIso || '2026-11-19'
  );
  const [hoveredIso, setHoveredIso] = useState(null);
  const [activeMonthKey, setActiveMonthKey] = useState('2026-11');

  const popoverRef = useRef(null);
  const rightScrollRef = useRef(null);
  const monthRefs = useRef({});

  // Close when clicking outside the calendar or date inputs
  useEffect(() => {
    const handleOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        // Let parent input click handlers handle switching if clicked inside parent container
        if (e.target.closest('[data-datepicker-trigger="true"]')) {
          return;
        }
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  // Scroll initially to November 2026 (or the month of startIso)
  useEffect(() => {
    const targetMonthKey = startIso ? startIso.slice(0, 7) : '2026-11';
    setActiveMonthKey(targetMonthKey);
    const el = monthRefs.current[targetMonthKey];
    if (el && rightScrollRef.current) {
      rightScrollRef.current.scrollTop = Math.max(0, el.offsetTop - 42);
    }
  }, []);

  const handleMonthSidebarClick = (mKey) => {
    setActiveMonthKey(mKey);
    const el = monthRefs.current[mKey];
    if (el && rightScrollRef.current) {
      rightScrollRef.current.scrollTo({
        top: Math.max(0, el.offsetTop - 42),
        behavior: 'smooth',
      });
    }
  };

  const handleRightPaneScroll = () => {
    if (!rightScrollRef.current) return;
    const scrollTop = rightScrollRef.current.scrollTop + 80;
    let currentKey = CALENDAR_MONTHS[0].key;
    for (const m of CALENDAR_MONTHS) {
      const el = monthRefs.current[m.key];
      if (el && el.offsetTop <= scrollTop) {
        currentKey = m.key;
      }
    }
    if (currentKey !== activeMonthKey) {
      setActiveMonthKey(currentKey);
    }
  };

  const handleDayClick = (clickedIso) => {
    // Single-date mode (Transfers)
    if (mode === 'transfer') {
      setStartIso(clickedIso);
      if (onSelectSingle) {
        onSelectSingle(formatIsoForMode(clickedIso, 'transfer'), clickedIso);
      }
      onClose();
      return;
    }

    // STEP 1: Selecting Check-In (Заезд / Туда) — DO NOT auto-set Check-Out!
    if (activeField === 'start') {
      setStartIso(clickedIso);
      setEndIso(null);
      setHoveredIso(null);

      if (onSelectCheckIn) {
        onSelectCheckIn(formatIsoForMode(clickedIso, mode), clickedIso);
      }
      // Immediately switch active focus highlight to Выезд (Обратно) input box
      if (onSwitchField) {
        onSwitchField('end');
      }
      return;
    }

    // STEP 3: Selecting Check-Out (Выезд / Обратно)
    if (activeField === 'end') {
      // Ignore clicks on dates <= startIso (they are disabled)
      if (startIso && clickedIso <= startIso) {
        return;
      }
      setEndIso(clickedIso);
      setHoveredIso(null);
      const nightsCount = diffDays(startIso, clickedIso);
      if (onSelectCheckOut) {
        onSelectCheckOut(
          formatIsoForMode(clickedIso, mode),
          clickedIso,
          nightsCount
        );
      }
      onClose();
    }
  };

  // Effective end of range for visual highlighting (either locked endIso or hoveredIso preview)
  const previewEndIso =
    activeField === 'end' && !endIso && hoveredIso && hoveredIso > startIso
      ? hoveredIso
      : endIso;

  return (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      className="absolute left-0 top-[56px] w-[335px] sm:w-[440px] h-[380px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex z-50 select-none"
    >
      {/* LEFT COLUMN: SCROLLABLE MONTHS SIDEBAR (SCREENSHOTS 2 & 3) */}
      <div className="w-[125px] sm:w-[155px] bg-[#F4F5F7] overflow-y-auto border-r border-gray-200 py-1 shrink-0">
        {CALENDAR_MONTHS.map((m) => {
          const isSelectedMonth = activeMonthKey === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => handleMonthSidebarClick(m.key)}
              className={`w-full px-3.5 py-2 text-left text-[13px] flex items-center justify-between transition-colors ${
                isSelectedMonth
                  ? 'bg-white font-semibold text-[#111827] shadow-2xs'
                  : 'text-[#374151] hover:bg-white/60 font-normal'
              }`}
            >
              <span>{m.title}</span>
              {m.showYearBadge && (
                <span className="text-[11px] text-gray-400 font-normal">
                  {m.year}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* RIGHT COLUMN: MULTI-MONTH VERTICAL SCROLLABLE CALENDAR */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Sticky Weekday Header: ПН ВТ СР ЧТ ПТ СБ ВС */}
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-gray-600 border-b border-gray-100 py-2.5 px-4 bg-white sticky top-0 z-10">
          {WEEKDAYS_HEADER.map((wd) => (
            <div key={wd}>{wd}</div>
          ))}
        </div>

        {/* Scrollable Consecutive Months Container */}
        <div
          ref={rightScrollRef}
          onScroll={handleRightPaneScroll}
          onMouseLeave={() => setHoveredIso(null)}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-6 relative"
        >
          {CALENDAR_MONTHS.map((m) => {
            const totalDays = getDaysInMonth(m.year, m.month);
            const startOffset = getStartOffsetMonday(m.year, m.month);

            return (
              <div
                key={m.key}
                ref={(el) => {
                  monthRefs.current[m.key] = el;
                }}
              >
                {/* Month Title aligned left */}
                <div className="text-[17px] font-bold text-[#111827] mb-2.5">
                  {m.title}
                </div>

                {/* Days Grid — zero horizontal gap so range bars connect seamlessly */}
                <div className="grid grid-cols-7 gap-y-1 gap-x-0 text-center text-[13px]">
                  {Array.from({ length: startOffset }).map((_, emptyIdx) => (
                    <div key={`empty-${m.key}-${emptyIdx}`} className="h-8" />
                  ))}

                  {Array.from({ length: totalDays }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const cellIso = toIsoDate(m.year, m.month, dayNum);

                    const isDisabled =
                      mode !== 'transfer' &&
                      activeField === 'end' &&
                      startIso &&
                      cellIso <= startIso;

                    const isStart = cellIso === startIso;
                    const isEnd =
                      mode !== 'transfer' &&
                      previewEndIso &&
                      cellIso === previewEndIso;
                    const isInRange =
                      mode !== 'transfer' &&
                      startIso &&
                      previewEndIso &&
                      cellIso > startIso &&
                      cellIso < previewEndIso;

                    let cellClasses =
                      'h-8 flex items-center justify-center transition-colors ';

                    if (isDisabled) {
                      cellClasses +=
                        'text-gray-300 cursor-not-allowed pointer-events-none';
                    } else if (isStart || isEnd) {
                      cellClasses +=
                        'bg-[#F6D04D] text-[#111827] font-bold rounded-[3px] cursor-pointer';
                    } else if (isInRange) {
                      cellClasses +=
                        'bg-[#EFEFEF] text-[#111827] font-normal cursor-pointer';
                    } else {
                      cellClasses +=
                        'text-[#111827] hover:bg-[#F6D04D]/45 rounded-[3px] cursor-pointer';
                    }

                    return (
                      <button
                        key={cellIso}
                        type="button"
                        disabled={isDisabled}
                        onMouseEnter={() => {
                          if (
                            mode !== 'transfer' &&
                            activeField === 'end' &&
                            !isDisabled
                          ) {
                            setHoveredIso(cellIso);
                          }
                        }}
                        onClick={() => handleDayClick(cellIso)}
                        className={cellClasses}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
