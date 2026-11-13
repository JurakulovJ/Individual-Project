# Официальные провайдеры и API-адаптеры TravelAI (`docs/PROVIDERS.md`)

Данный документ описывает архитектуру слоя интеграций с официальными API отельных платформ и авиакомпаний в монорепозитории **TravelAI** (`backend/app/adapters/`).

---

## 1. Архитектурные принципы

1. **Единые контракты (`HotelProvider` и `FlightProvider`)**:
   - Отели (`HotelProvider` в `backend/app/adapters/base.py`):
     - `search_hotels(query, check_in, check_out, adults, rooms, currency) -> List[NormalizedHotel]`
     - `get_offers(hotel_id, check_in, check_out, adults, rooms, currency) -> List[NormalizedHotelOffer]`
     - `build_redirect_url(hotel_id, check_in, check_out, adults, rooms, ...) -> RedirectResponseSchema`
   - Авиарейсы (`FlightProvider` в `backend/app/adapters/base.py`):
     - `search_flights(origin, destination, departure_date, return_date, adults, cabin_class, currency) -> List[NormalizedFlightOffer]`
     - `build_redirect_url(flight_id, origin, destination, departure_date, return_date, adults, ...) -> RedirectResponseSchema`
2. **Активация строго через `.env` (`ProviderRegistry`)**:
   - Каждый адаптер проверяет наличие своих официальных ключей через метод `is_enabled() -> bool`.
   - Если `USE_MOCK_PROVIDERS=true` или ни один live-провайдер не сконфигурирован в `.env`, `ProviderRegistry` автоматически активирует `MockAdapter` и помечает ответы полем `"source": "mock"`.
   - При добавлении ключей конкретного провайдера в `backend/.env` и установке `USE_MOCK_PROVIDERS=false` этот провайдер включается автоматически без изменений кода.
3. **Никакого парсинга и приёма платежей**:
   - Приложение не использует неофициальные скрейперы.
   - Приложение не принимает банковские карты: бронирование выполняется путём безопасного редиректа (`GET .../redirect`) на официальную страницу бронирования платформы или авиакомпании.
4. **Надёжность (`AsyncHttpHelper`)**:
   - Все внешние вызовы выполняются через асинхронный `httpx.AsyncClient` с таймаутами (`HTTP_TIMEOUT_SECONDS=12.0`), 1–2 повторами при сетевых сбоях/5xx, экспоненциальным backoff при `HTTP 429 Too Many Requests`, in-memory `TTLCache` (10–15 минут) и автоматической маскировкой секретов в логах (`_scrub_text`).

---

## 2. Сводная таблица провайдеров

| Провайдер | Категория | Класс адаптера | Статус доступа | Статус реализации | Переменные `.env` | Лимиты / Квоты |
|---|---|---|---|---|---|---|
| **MockAdapter** | Отели + Авиа | `MockAdapter` (`mock_provider.py`) | Встроен локально | **Полная** (`source="mock"`) | `USE_MOCK_PROVIDERS=true` (или пустые ключи) | Без лимитов |
| **Booking.com Demand API v3.1** | Отели (Цены + Поиск) | `BookingDemandAdapter` (`booking_demand_adapter.py`) | Требует одобрения партнёрской заявки | **Полная** (v3.1 `POST /accommodations/search` + redirect) | `BOOKING_DEMAND_API_TOKEN`, `BOOKING_AFFILIATE_ID` | **50 запросов / мин** (RateLimiter + HTTP 429 backoff) |
| **Agoda Affiliate Lite API** | Отели (Цены + Deep-Link) | `AgodaAdapter` (`agoda_adapter.py`) | Требует одобрения партнёрской заявки | **Полная** (`POST /affiliateservice/lt_v1` + partner search redirect) | `AGODA_SITE_ID`, `AGODA_API_KEY` | Зависит от партнёрского уровня (TTL-кэш 10 мин) |
| **Trip.com Partner / Alliance API** | Отели (Цены + Поиск) | `TripComAdapter` (`tripcom_adapter.py`) | Закрытый партнёрский доступ (по заявке) | **Каркас (`# TODO`)** + рабочий официальный редирект (`link_type="search"`) | `TRIPCOM_ALLIANCE_ID`, `TRIPCOM_SID`, `TRIPCOM_API_KEY` | Устанавливается контрактом Alliance |
| **Tripadvisor Content API v1** | Отели (**Только контент**, без цен) | `TripadvisorContentAdapter` (`tripadvisor_adapter.py`) | Открытая регистрация разработчика | **Полная** (`/location/search`, `/details`, `/photos`, `/reviews`) | `TRIPADVISOR_API_KEY`, `TRIPADVISOR_DAILY_QUOTA` | **5 000 вызовов / мес** бесплатно (дневной счётчик + кэш 15 мин) |
| **Lufthansa Group Open API** | Авиа (LH, LX, OS, SN) | `LufthansaGroupAdapter` (`lufthansa_adapter.py`) | Public API — открытая регистрация; Partner API — по заявке | **Полная** для OAuth2 + Public API (`schedules`, `flightstatus`, `seatmaps`, `airports`); Partner API по флагу `is_partner_enabled()` | `LUFTHANSA_CLIENT_ID`, `LUFTHANSA_CLIENT_SECRET`, `LUFTHANSA_PARTNER_ID` | Public API: 1 000 вызовов/день, 5/сек |
| **Turkish Airlines NDC** | Авиа (TK) | `TurkishAirlinesNDCAdapter` (`lufthansa_adapter.py`) | Требует одобрения в NDC Portal | **Каркас (`# TODO`)** + рабочий редирект на `turkishairlines.com` | `TURKISH_AIRLINES_API_KEY`, `TURKISH_AIRLINES_API_SECRET` | По условиям NDC sandbox |
| **Transavia Developer API** | Авиа (HV/TO) | `TransaviaAdapter` (`lufthansa_adapter.py`) | Открытая / партнёрская подписка | **Каркас (`# TODO`)** + рабочий редирект на `transavia.com` | `TRANSAVIA_API_KEY` | По тарифу подписки API |
| **Amadeus Self-Service** | Устаревший (`@deprecated`) | `AmadeusAdapter` (`amadeus_adapter.py`) | **Закрывается 17.07.2026** | **Отключён по умолчанию** (`DEPRECATED = True`), безопасная заглушка | `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET` | Не используется |

---

## 3. Подробное описание каждого провайдера

### 3.1 Booking.com Demand API v3.1 (`BookingDemandAdapter`)
- **Файл**: [`backend/app/adapters/booking_demand_adapter.py`](../backend/app/adapters/booking_demand_adapter.py)
- **Официальная документация**: [https://developers.booking.com/demand/docs/open-api/demand-api](https://developers.booking.com/demand/docs/open-api/demand-api)
- **Портал получения ключей**: [https://admin.booking.com/partner/](https://admin.booking.com/partner/) (требуется статус *Managed Affiliate Partner*).
- **Что реализовано**:
  - Авторизация через заголовки `Authorization: Bearer <BOOKING_DEMAND_API_TOKEN>` и `X-Affiliate-Id: <BOOKING_AFFILIATE_ID>`.
  - Вызов подтверждённого эндпоинта `POST https://demandapi.booking.com/3.1/accommodations/search` с передачей `checkin`, `checkout`, `booker`, `currency`, `guests` (`number_of_adults`, `number_of_rooms`) и `city` / `accommodations`.
  - Клиентский ограничитель частоты запросов `SlidingWindowRateLimiter(max_requests=50, window_seconds=60.0)` и обработка ответа `HTTP 429` (`RateLimitException`).
  - Генерация партнёрской ссылки (`link_type="deep_link"` при наличии `url` из API или `link_type="search"` на `https://www.booking.com/searchresults.html` с `aid=<BOOKING_AFFILIATE_ID>`).

### 3.2 Agoda Affiliate Lite API (`AgodaAdapter`)
- **Файл**: [`backend/app/adapters/agoda_adapter.py`](../backend/app/adapters/agoda_adapter.py)
- **Официальная документация**: [https://developer.pps.agoda.com](https://developer.pps.agoda.com) / [http://affiliate.agoda.com](http://affiliate.agoda.com)
- **Портал получения ключей**: [https://partners.agoda.com](https://partners.agoda.com)
- **Что реализовано**:
  - Авторизация по официальной схеме Agoda Affiliate API: заголовок `Authorization: <AGODA_SITE_ID>:<AGODA_API_KEY>`.
  - Запрос `POST https://affiliateapi7643.agoda.com/affiliateservice/lt_v1` с блоком `criteria` (`checkInDate`, `checkOutDate`, `cityId` / `hotelId`, `adults`, `rooms`, `currency`).
  - Возврат `landingURL` (`link_type="deep_link"`) либо резервного партнёрского URL `https://www.agoda.com/partners/partnersearch.aspx` с `cid=<AGODA_SITE_ID>` (`link_type="search"`).

### 3.3 Trip.com Partner / Alliance API (`TripComAdapter`)
- **Файл**: [`backend/app/adapters/tripcom_adapter.py`](../backend/app/adapters/tripcom_adapter.py)
- **Официальная документация и портал**: [https://alliance.trip.com](https://alliance.trip.com)
- **Статус**:
  - Полная спецификация JSON-полей поиска цен открывается только после подписания партнёрского договора и выдачи доступа в закрытый кабинет Trip.com Alliance.
  - В соответствии с жёсткими правилами проекта («не выдумывать эндпоинты и поля»), методы `search_hotels` и `get_offers` оформлены как чистый каркас с `# TODO` и инструкцией по подключению после получения sandbox-доступа.
  - Метод `build_redirect_url` полностью реализован и формирует официальную партнёрскую ссылку поиска `https://www.trip.com/hotels/list` с подстановкой города, отеля, дат, числа гостей и параметров `Allianceid` / `SID` (`link_type="search"`).

### 3.4 Tripadvisor Content API v1 (`TripadvisorContentAdapter`)
- **Файл**: [`backend/app/adapters/tripadvisor_adapter.py`](../backend/app/adapters/tripadvisor_adapter.py)
- **Официальная документация**: [https://tripadvisor-content-api.readme.io/reference/overview](https://tripadvisor-content-api.readme.io/reference/overview)
- **Портал получения ключей**: [https://www.tripadvisor.com/developers](https://www.tripadvisor.com/developers) (открытая регистрация).
- **Важное архитектурное ограничение**:
  - Официальный Tripadvisor Content API **НЕ возвращает цены на номера и ссылки прямого бронирования**.
  - Поэтому `TripadvisorContentAdapter` **НЕ реализует `HotelProvider`** и используется исключительно для обогащения карточки отеля контентом (`TripadvisorContentData`: описание, рейтинг, число отзывов, фотографии и отзывы).
- **Что реализовано**:
  - Вызовы подтверждённых эндпоинтов:
    - `GET /api/v1/location/search`
    - `GET /api/v1/location/{locationId}/details`
    - `GET /api/v1/location/{locationId}/photos`
    - `GET /api/v1/location/{locationId}/reviews`
  - Контроль бесплатной квоты (`TRIPADVISOR_DAILY_QUOTA=160` вызовов в сутки из расчёта 5 000 вызовов/мес) + агрессивное кэширование на 15 минут.

### 3.5 Lufthansa Group Open API (`LufthansaGroupAdapter`) и каркасы авиакомпаний
- **Файл**: [`backend/app/adapters/lufthansa_adapter.py`](../backend/app/adapters/lufthansa_adapter.py)
- **Официальная документация**:
  - Lufthansa Group (Lufthansa, SWISS, Austrian, Brussels Airlines): [https://developer.lufthansa.com/docs](https://developer.lufthansa.com/docs)
  - Turkish Airlines NDC: [https://developer.turkishairlines.com](https://developer.turkishairlines.com)
  - Transavia API: [https://developer.transavia.com](https://developer.transavia.com)
- **Что реализовано в `LufthansaGroupAdapter`**:
  - OAuth 2.0 Client Credentials (`POST https://api.lufthansa.com/v1/oauth/token` с `client_id`, `client_secret`, `grant_type=client_credentials`) и автоматическим кэшированием токена до истечения `expires_in`.
  - Полная поддержка открытых эндпоинтов **Public API**:
    - Расписания рейсов: `GET /v1/operations/schedules/{origin}/{destination}/{fromDateTime}?directFlights=0`
    - Статус рейса: `GET /v1/operations/flightstatus/{flightNumber}/{date}`
    - Схема мест: `GET /v1/operations/seatmaps/{flightNumber}/{origin}/{destination}/{date}/{cabinClass}`
    - Справочник аэропортов: `GET /v1/mds-references/airports/{airportCode}`
  - Разделение уровней доступа: прямые партнёрские тарифы и deep-link (`link_type="deep_link"`) включаются при наличии `LUFTHANSA_PARTNER_ID` (`is_partner_enabled() == True`). В режиме Public API формируется официальная ссылка на поиск рейса `https://www.lufthansa.com/xx/en/flight-search` (`link_type="search"`).
- **Каркасы `TurkishAirlinesNDCAdapter` и `TransaviaAdapter`**:
  - Содержат `# TODO` для подключения NDC AirShopping / Flight Offers API после выдачи sandbox-ключей и уже сейчас формируют рабочие редиректы (`link_type="search"`) на официальные сайты `turkishairlines.com` и `transavia.com`.

### 3.6 Устаревший Amadeus Self-Service (`AmadeusAdapter`)
- **Файл**: [`backend/app/adapters/amadeus_adapter.py`](../backend/app/adapters/amadeus_adapter.py)
- **Причина вывода из эксплуатации**: Amadeus официально объявил о закрытии портала **Amadeus for Developers Self-Service 17 июля 2026 года**.
- **Текущий статус**: Помечен `@deprecated` (`DEPRECATED = True`, `SUNSET_DATE = "2026-07-17"`), исключён из активного пула `ProviderRegistry`, никогда не вызывает падений бэкенда даже при пустых ключах.

