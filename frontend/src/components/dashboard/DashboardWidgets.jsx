import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Layers,
  Compass,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

export default function DashboardWidgets({
  dashboardSummary,
  loadingSummary,
  onRefreshSummary,
  onSelectCuratedRoute,
  onOpenAIMode,
}) {
  const [showAIShowcase, setShowAIShowcase] = useState(true);

  const payment = dashboardSummary?.order_status?.payment_info || {
    not_due_amount: 0,
    payment_required_amount: 0,
    overdue_amount: 0,
    total_amount: 0,
  };
  const freeCancel = dashboardSummary?.order_status?.free_cancellation || {
    expiring_24h: 0,
    expiring_4d: 0,
  };
  const autoCancel = dashboardSummary?.order_status?.auto_cancellation || {
    expiring_24h: 0,
    expiring_4d: 0,
  };
  const fin = dashboardSummary?.financial_info || {
    unpaid_orders_total: 0,
    overdue_debt: 0,
    unpaid_non_refundable: 0,
    unpaid_refundable: 0,
    contract_limit: 0,
    overpayment: 0,
    deposit: 0,
    credit_limit: 0,
  };

  const formatAmt = (val) => {
    if (!val || Number(val) === 0) return '0 $';
    return `${Number(val).toLocaleString('ru-RU')} $`;
  };

  const hasAmount = Number(payment.total_amount) > 0;

  return (
    <div className="max-w-[1220px] mx-auto px-4 py-8 space-y-10">
      {/* ===================================================================== */}
      {/* ZONE 1: OPERATIONAL OVERVIEW (LIVE FROM GET /api/v1/dashboard/summary) */}
      {/* ===================================================================== */}
      <div className="space-y-6">
        {/* Section: Состояние заказов */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-[22px] font-bold text-[#111827] tracking-tight">
                Состояние заказов
              </h2>
              <button
                type="button"
                onClick={onRefreshSummary}
                title="Обновить данные"
                className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-900 shadow-2xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingSummary ? 'animate-spin text-[#6B7280]' : ''
                    }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
            {/* Card 1: Информация об оплате (6 cols) */}
            <div className="md:col-span-2 lg:col-span-6 bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between">
              <h3 className="text-[16px] font-bold text-[#111827] mb-4">
                Информация об оплате
              </h3>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-auto">
                {/* Left Status List */}
                <div className="w-full sm:w-[60%] space-y-2.5 text-[13px]">
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg">
                    <div className="flex items-center gap-2.5 text-[#6B7280]">
                      <span className="w-3 h-3 rounded-[3px] bg-[#A78BFA] shrink-0" />
                      <span>Срок оплаты не наступил</span>
                    </div>
                    <span className="font-semibold text-[#111827]">
                      {formatAmt(payment.not_due_amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg">
                    <div className="flex items-center gap-2.5 text-[#6B7280]">
                      <span className="w-3 h-3 rounded-[3px] bg-[#93C5FD] shrink-0" />
                      <span>Требуется оплата</span>
                    </div>
                    <span className="font-semibold text-[#111827]">
                      {formatAmt(payment.payment_required_amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#FDF2F2]">
                    <div className="flex items-center gap-2.5 text-[#9CA3AF]">
                      <span className="w-3 h-3 rounded-[3px] bg-[#F8B4B4] shrink-0" />
                      <span>Просроченная оплата</span>
                    </div>
                    <span className="font-bold text-[#DC2626]">
                      {formatAmt(payment.overdue_amount)}
                    </span>
                  </div>
                </div>

                {/* Right SVG Donut Chart */}
                <div className="relative w-[132px] h-[132px] flex items-center justify-center shrink-0">
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      stroke="#EFEFEF"
                      strokeWidth="7"
                    />
                    {hasAmount && (
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="transparent"
                        stroke="#93C5FD"
                        strokeWidth="7"
                        strokeDasharray="210 264"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[14px] font-semibold text-[#111827]">
                      {formatAmt(payment.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Бесплатная отмена (3 cols) */}
            <div className="md:col-span-1 lg:col-span-3 bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between">
              <h3 className="text-[16px] font-bold text-[#111827] mb-3">
                Бесплатная отмена
              </h3>

              <div className="divide-y divide-gray-100 my-auto">
                <div className="py-3.5 flex items-center gap-4">
                  <span
                    className={`text-[28px] font-medium leading-none ${freeCancel.expiring_24h > 0
                        ? 'text-[#111827] font-bold'
                        : 'text-[#6B7280]'
                      }`}
                  >
                    {freeCancel.expiring_24h}
                  </span>
                  <span className="text-[13px] text-[#6B7280] leading-snug">
                    заканчивается через 24 часа
                  </span>
                </div>
                <div className="py-3.5 flex items-center gap-4">
                  <span
                    className={`text-[28px] font-medium leading-none ${freeCancel.expiring_4d > 0
                        ? 'text-[#111827] font-bold'
                        : 'text-[#6B7280]'
                      }`}
                  >
                    {freeCancel.expiring_4d}
                  </span>
                  <span className="text-[13px] text-[#6B7280] leading-snug">
                    заканчивается через 4 рабочих дня
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Автоотмена (3 cols) */}
            <div className="md:col-span-1 lg:col-span-3 bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between">
              <h3 className="text-[16px] font-bold text-[#111827] mb-3">
                Автоотмена
              </h3>

              <div className="divide-y divide-gray-100 my-auto">
                <div className="py-3.5 flex items-center gap-4">
                  <span
                    className={`text-[28px] font-medium leading-none ${autoCancel.expiring_24h > 0
                        ? 'text-[#111827] font-bold'
                        : 'text-[#6B7280]'
                      }`}
                  >
                    {autoCancel.expiring_24h}
                  </span>
                  <span className="text-[13px] text-[#6B7280] leading-snug">
                    заканчивается через 24 часа
                  </span>
                </div>
                <div className="py-3.5 flex items-center gap-4">
                  <span
                    className={`text-[28px] font-medium leading-none ${autoCancel.expiring_4d > 0
                        ? 'text-[#111827] font-bold'
                        : 'text-[#6B7280]'
                      }`}
                  >
                    {autoCancel.expiring_4d}
                  </span>
                  <span className="text-[13px] text-[#6B7280] leading-snug">
                    заканчивается через 4 рабочих дня
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Финансовая информация */}
        <div className="space-y-4 pt-2">
          <h2 className="text-[22px] font-bold text-[#111827] tracking-tight">
            Финансовая информация
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Card: Неоплаченные заказы */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100 space-y-5">
              <h3 className="text-[16px] font-bold text-[#111827]">
                Неоплаченные заказы
              </h3>

              <div className="grid grid-cols-2 gap-6 pb-5 border-b border-gray-100">
                <div>
                  <div className="text-[28px] font-bold text-[#111827] leading-tight">
                    {formatAmt(fin.unpaid_orders_total)}
                  </div>
                  <div className="text-[13px] text-[#374151] mt-1">
                    Сумма неоплаченных заказов
                  </div>
                </div>
                <div>
                  <div className="text-[28px] font-bold text-[#111827] leading-tight">
                    {formatAmt(fin.overdue_debt)}
                  </div>
                  <div className="text-[13px] text-[#374151] mt-1">
                    Просроченный долг
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[28px] font-bold text-[#111827] leading-tight">
                    {formatAmt(fin.unpaid_non_refundable)}
                  </div>
                  <div className="text-[13px] text-[#374151] mt-1 leading-snug">
                    Сумма неоплаченных невозвратных заказов
                  </div>
                </div>
                <div>
                  <div className="text-[28px] font-bold text-[#111827] leading-tight">
                    {formatAmt(fin.unpaid_refundable)}
                  </div>
                  <div className="text-[13px] text-[#374151] mt-1 leading-snug">
                    Сумма неоплаченных возвратных заказов
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Лимиты по контракту */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100 space-y-5">
              <h3 className="text-[16px] font-bold text-[#111827]">
                Лимиты по контракту
              </h3>

              <div className="grid grid-cols-2 gap-6 pb-5 border-b border-gray-100">
                <div>
                  <div className="text-[28px] font-bold text-[#DC2626] leading-tight">
                    {formatAmt(fin.contract_limit)}
                  </div>
                  <div className="text-[13px] text-[#374151] mt-1 leading-snug">
                    Лимит новых невозвратных заказов
                  </div>
                </div>
                <div>
                  <div className="text-[28px] font-bold text-[#111827] leading-tight">
                    {formatAmt(fin.overpayment)}
                  </div>
                  <div className="text-[13px] text-[#374151] mt-1">
                    Переплата
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[28px] font-bold text-[#111827] leading-tight">
                    {formatAmt(fin.deposit)}
                  </div>
                  <div className="text-[13px] text-[#374151] mt-1">Депозит</div>
                </div>
                <div>
                  <div className="text-[28px] font-bold text-[#111827] leading-tight">
                    {formatAmt(fin.credit_limit)}
                  </div>
                  <div className="text-[13px] text-[#374151] mt-1">
                    Кредитный лимит
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
