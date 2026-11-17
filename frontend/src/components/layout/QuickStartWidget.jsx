import React, { useState } from 'react';
import { CheckCircle2, X, Sparkles, ArrowRight } from 'lucide-react';

export default function QuickStartWidget({ onNavigateToStep }) {
  const [isOpen, setIsOpen] = useState(false);

  const steps = [
    {
      id: 1,
      title: 'Протестировать AI Travel Ассистент',
      desc: 'Соберите комбинированный тур (Перелет + Отель + Трансфер) одним запросом.',
      completed: false,
      actionLabel: 'Открыть AI Поиск',
      target: 'ai',
    },
    {
      id: 2,
      title: 'Сравнить тарифы на Авиабилеты и Отели',
      desc: 'Перейдите в выдачу рейсов Ryanair/Air Europa или отелей Нью-Йорка на карте.',
      completed: false,
      actionLabel: 'Смотреть выдачу отелей',
      target: 'hotels',
    },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Popover Panel when clicked */}
      {isOpen && (
        <div className="mb-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-[#1C2026] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#F6D04D]" />
              <span className="text-xs font-bold">Быстрый старт в системе</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className="p-3 rounded-xl bg-[#F4F5F7] border border-gray-200/70 space-y-1.5"
              >
                <div className="text-xs font-bold text-[#111827]">
                  {step.id}. {step.title}
                </div>
                <p className="text-[11px] text-[#6B7280] leading-relaxed">
                  {step.desc}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToStep(step.target);
                    setIsOpen(false);
                  }}
                  className="pt-1 text-[11px] font-bold text-[#2563EB] hover:underline flex items-center gap-1"
                >
                  <span>{step.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exact Floating Pill Button matching Reference Screenshots */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-[46px] px-4.5 rounded-full bg-[#fddd55] hover:bg-[#ffd300] active:bg-[#fdc500] text-[#2d3137] font-medium text-[14.5px] shadow-[0_4px_14px_rgba(45,49,55,0.16)] flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer"
      >
        <span className="w-[20px] h-[20px] rounded-full border-[1.8px] border-[#2d3137] flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-3 h-3 text-[#2d3137] stroke-current"
            strokeWidth="3"
            fill="none"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span>Быстрый старт</span>

        {/* Top-Right Notification Counter Badge "2" */}
        <span className="absolute -top-1.5 -right-1 w-[21px] h-[21px] rounded-full bg-white text-[#868686] shadow-xs text-[11.5px] font-semibold flex items-center justify-center leading-none">
          2
        </span>
      </button>
    </div>
  );
}

