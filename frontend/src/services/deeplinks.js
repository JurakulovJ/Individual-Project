const RU_MONTHS = {
  янв: '01',
  фев: '02',
  мар: '03',
  апр: '04',
  мая: '05',
  май: '05',
  июн: '06',
  июл: '07',
  авг: '08',
  сен: '09',
  окт: '10',
  ноя: '11',
  дек: '12',
};

const CITY_IATA_MAP = {
  стамбул: 'IST',
  istanbul: 'IST',
  ташкент: 'TAS',
  tashkent: 'TAS',
  барселона: 'BCN',
  barcelona: 'BCN',
  лондон: 'LON',
  london: 'LON',
  'нью-йорк': 'JFK',
  'new york': 'JFK',
  дубай: 'DXB',
  dubai: 'DXB',
  париж: 'CDG',
  paris: 'CDG',
  рим: 'FCO',
  rome: 'FCO',
  анталья: 'AYT',
  antalya: 'AYT',
  пхукет: 'HKT',
  phuket: 'HKT',
  токио: 'HND',
  tokyo: 'HND',
  бали: 'DPS',
  bali: 'DPS',
  мадрид: 'MAD',
  madrid: 'MAD',
  берлин: 'BER',
  berlin: 'BER',
  амстердам: 'AMS',
  amsterdam: 'AMS',
  алматы: 'ALA',
  almaty: 'ALA',
  самарканд: 'SKD',
  samarkand: 'SKD',
  москва: 'SVO',
  moscow: 'SVO',
};

export function resolveIata(raw, fallback = 'IST') {
  if (!raw) return fallback;
  const str = String(raw).trim();
  const codeMatch = str.match(/\b([A-Z]{3})\b/);
  if (codeMatch) return codeMatch[1].toUpperCase();
  const lower = str.toLowerCase();
  for (const [k, v] of Object.entries(CITY_IATA_MAP)) {
    if (lower.includes(k)) return v;
  }
  if (/^[a-zA-Z]{3}$/.test(str)) return str.toUpperCase();
  return fallback;
}

export function toIsoDate(rawStr, fallback = '2026-11-12') {
  if (!rawStr) return fallback;
  const s = String(rawStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const lower = s.toLowerCase();
  const dayMatch = lower.match(/\b(\d{1,2})\b/);
  const yearMatch = lower.match(/\b(202\d)\b/);
  const day = dayMatch ? String(dayMatch[1]).padStart(2, '0') : '12';
  const year = yearMatch ? yearMatch[1] : '2026';
  let month = '11';
  for (const [k, mVal] of Object.entries(RU_MONTHS)) {
    if (lower.includes(k)) {
      month = mVal;
      break;
    }
  }
  return `${year}-${month}-${day}`;
}

export function isoToYyMmDd(isoDate) {
  const parts = String(isoDate || '2026-11-12').split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[0].slice(2)}${parts[1]}${parts[2]}`;
  }
  return '261112';
}

export function getHotelProviderOffers(
  hotel,
  searchParams = {},
  priceMultiplier = 1,
  overrideMealLabel = null
) {
  const hotelName = (hotel?.name || 'Grand Hotel').replace(/\.\.\.$/, '').trim();
  const city =
    hotel?.city_en ||
    hotel?.city ||
    searchParams?.selectedCityShort ||
    (searchParams?.hotelDestination || 'Istanbul').split(',')[0].trim() ||
    'Istanbul';

  const checkIn = toIsoDate(
    searchParams?.checkInIso || searchParams?.checkIn,
    '2026-11-12'
  );
  const checkOut = toIsoDate(
    searchParams?.checkOutIso || searchParams?.checkOut,
    '2026-11-19'
  );
  const adults = Math.max(
    1,
    Number(searchParams?.adults || 2) + Number(searchParams?.children || 0)
  );
  const rooms = Math.max(1, Number(searchParams?.rooms || 1));

  const basePrice = Math.round(
    Number(hotel?.total_price ?? hotel?.price ?? 2450) * priceMultiplier
  );

  const ss = encodeURIComponent(`${hotelName} ${city}`.trim());
  const cityEnc = encodeURIComponent(city);
  const nameEnc = encodeURIComponent(hotelName);
  const agodaQuery = encodeURIComponent(`${hotelName} ${city} agoda`.trim());

  const mealLabel =
    overrideMealLabel || hotel?.meal_label || 'Завтрак включён (BB)';
  const cancelLabel =
    hotel?.free_cancellation !== false
      ? 'Бесплатная отмена'
      : 'Специальный тариф';

  const seed =
    String(hotel?.id || hotelName)
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 4;

  const mults = [
    [1.015, 1.0, 1.032, 1.02],
    [1.0, 1.018, 1.028, 1.012],
    [1.022, 1.008, 1.0, 1.015],
    [1.014, 1.024, 1.03, 1.0],
  ][seed];

  const offers = [
    {
      provider: 'Booking.com',
      provider_slug: 'booking',
      price: Math.round(basePrice * mults[0]),
      currency: 'USD',
      meal_label: mealLabel,
      cancellation_label: cancelLabel,
      deep_link: `https://www.booking.com/searchresults.ru.html?ss=${ss}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}&no_rooms=${rooms}&selected_currency=USD`,
      is_cheapest: false,
    },
    {
      provider: 'Agoda',
      provider_slug: 'agoda',
      price: Math.round(basePrice * mults[1]),
      currency: 'USD',
      meal_label: mealLabel,
      cancellation_label: cancelLabel,
      deep_link: `https://www.google.com/travel/hotels/${cityEnc}?q=${agodaQuery}&dates=${checkIn}_${checkOut}&ap=MAA`,
      is_cheapest: false,
    },
    {
      provider: 'Hotels.com (Expedia)',
      provider_slug: 'hotels_com',
      price: Math.round(basePrice * mults[2]),
      currency: 'USD',
      meal_label: mealLabel,
      cancellation_label: cancelLabel,
      deep_link: `https://www.hotels.com/Hotel-Search?destination=${ss}&startDate=${checkIn}&endDate=${checkOut}&adults=${adults}&rooms=${rooms}`,
      is_cheapest: false,
    },
    {
      provider: 'Trip.com',
      provider_slug: 'trip',
      price: Math.round(basePrice * mults[3]),
      currency: 'USD',
      meal_label: mealLabel,
      cancellation_label: cancelLabel,
      deep_link: `https://www.trip.com/hotels/list?cityName=${cityEnc}&checkin=${checkIn}&checkout=${checkOut}&adult=${adults}&crn=${rooms}&keyword=${nameEnc}`,
      is_cheapest: false,
    },
  ];

  offers.sort((a, b) => a.price - b.price);
  offers[0].is_cheapest = true;
  return offers;
}

export function getFlightProviderOffers(
  flight,
  selectedTariffPrice = null,
  searchParams = {}
) {
  const out = flight?.outbound_leg || {};
  const ret = flight?.return_leg || {};
  const orig = resolveIata(
    out.origin_code || searchParams?.flightOrigin,
    'BCN'
  );
  const dest = resolveIata(
    out.destination_code || searchParams?.flightDestination,
    'LON'
  );
  const dep = toIsoDate(
    searchParams?.flightDepIso ||
    searchParams?.flightDepDate ||
    out.date_label,
    '2026-11-19'
  );
  const retDate = toIsoDate(
    searchParams?.flightRetIso ||
    searchParams?.flightRetDate ||
    ret.date_label,
    '2026-11-26'
  );
  const isOneWay = searchParams?.flightTripType === 'one-way';
  const depYyMmDd = isoToYyMmDd(dep);
  const retYyMmDd = isoToYyMmDd(retDate);
  const adults = Math.max(1, Number(searchParams?.flightPassengers || 1));

  const cabinMap = {
    эконом: 'economy',
    премиум: 'premiumeconomy',
    бизнес: 'business',
    первый: 'first',
  };
  const cabinClass =
    cabinMap[String(searchParams?.cabinClass || 'эконом').toLowerCase()] ||
    'economy';

  const basePrice = Number(selectedTariffPrice ?? flight?.min_price ?? 273.63);
  const airlineName = flight?.airline_name || 'Turkish Airlines';
  const airlineEnc = encodeURIComponent(airlineName);

  const googleUrl = isOneWay
    ? `https://www.google.com/travel/flights?q=Flights+from+${orig}+to+${dest}+on+${dep}+${airlineEnc}&curr=USD&hl=ru`
    : `https://www.google.com/travel/flights?q=Flights+from+${orig}+to+${dest}+on+${dep}+return+${retDate}+${airlineEnc}&curr=USD&hl=ru`;

  const skyscannerUrl = isOneWay
    ? `https://www.skyscanner.com/transport/flights/${orig.toLowerCase()}/${dest.toLowerCase()}/${depYyMmDd}/?adults=${adults}&cabinclass=${cabinClass}&rtn=0`
    : `https://www.skyscanner.com/transport/flights/${orig.toLowerCase()}/${dest.toLowerCase()}/${depYyMmDd}/${retYyMmDd}/?adults=${adults}&cabinclass=${cabinClass}&rtn=1`;

  const kayakUrl = isOneWay
    ? `https://www.kayak.com/flights/${orig}-${dest}/${dep}/${adults}adults?sort=bestflight_a`
    : `https://www.kayak.com/flights/${orig}-${dest}/${dep}/${retDate}/${adults}adults?sort=bestflight_a`;

  const tripUrl = isOneWay
    ? `https://www.trip.com/flights/showfarefirst?dcity=${orig.toLowerCase()}&acity=${dest.toLowerCase()}&ddate=${dep}&triptype=ow&class=y&lowpricesource=searchform&quantity=${adults}`
    : `https://www.trip.com/flights/showfarefirst?dcity=${orig.toLowerCase()}&acity=${dest.toLowerCase()}&ddate=${dep}&rdate=${retDate}&triptype=rt&class=y&lowpricesource=searchform&quantity=${adults}`;

  const offers = [
    {
      provider: `${airlineName} (Официальный тариф)`,
      short_cta: 'Купить на сайте авиакомпании',
      provider_type: 'official_airline',
      badge: 'Прямой тариф перевозчика без наценки',
      price: Number(basePrice.toFixed(2)),
      currency: 'USD',
      deep_link: googleUrl,
      is_cheapest: false,
    },
    {
      provider: 'Skyscanner Direct',
      short_cta: 'Открыть на Skyscanner',
      provider_type: 'ota',
      badge: 'Лучшая цена по маршруту',
      price: Number((basePrice * 0.985).toFixed(2)),
      currency: 'USD',
      deep_link: skyscannerUrl,
      is_cheapest: true,
    },
    {
      provider: 'Kayak',
      short_cta: 'Открыть на Kayak',
      provider_type: 'ota',
      badge: 'Сравнение прямых касс',
      price: Number((basePrice * 0.995).toFixed(2)),
      currency: 'USD',
      deep_link: kayakUrl,
      is_cheapest: false,
    },
    {
      provider: 'Trip.com',
      short_cta: 'Открыть на Trip.com',
      provider_type: 'ota',
      badge: 'Мгновенная выписка билета',
      price: Number((basePrice * 1.012).toFixed(2)),
      currency: 'USD',
      deep_link: tripUrl,
      is_cheapest: false,
    },
  ];

  return offers;
}

export function getTransferProviderOffers(transfer, searchParams = {}) {
  const pickupRaw = (
    searchParams?.transferFrom || 'Istanbul Airport (IST)'
  ).trim();
  const dropoffRaw = (
    searchParams?.transferTo || 'Sultanahmet City Center'
  ).trim();
  const pickup = encodeURIComponent(pickupRaw);
  const dropoff = encodeURIComponent(dropoffRaw);
  const wpQuery = encodeURIComponent(
    `Welcome Pickups transfer ${pickupRaw} to ${dropoffRaw}`
  );
  const basePrice = Math.round(Number(transfer?.price || 68));

  return [
    {
      provider: 'Jayride',
      provider_slug: 'jayride',
      badge: 'Лучшая цена',
      price: Math.round(basePrice * 0.95),
      currency: 'USD',
      deep_link: `https://www.jayride.com/airport-transfer?pickup=${pickup}&dropoff=${dropoff}`,
      is_cheapest: true,
    },
    {
      provider: 'KiwiTaxi',
      provider_slug: 'kiwitaxi',
      badge: 'Фиксированный тариф',
      price: basePrice,
      currency: 'USD',
      deep_link: `https://kiwitaxi.com/en/search?from=${pickup}&to=${dropoff}`,
      is_cheapest: false,
    },
    {
      provider: 'Welcome Pickups',
      provider_slug: 'welcomepickups',
      badge: 'Встреча с табличкой',
      price: Math.round(basePrice * 1.05),
      currency: 'USD',
      deep_link: `https://www.google.com/search?q=${wpQuery}&btnI=1`,
      is_cheapest: false,
    },
  ];
}

