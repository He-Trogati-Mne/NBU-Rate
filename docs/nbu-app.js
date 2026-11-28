(function() {
        'use strict';

        if (typeof Chart === 'undefined') {
            window.Chart = class {
                constructor() { this.destroy = () => {}; }
                update() {}
            };
        }

        // =============== CONFIG ===============
        const DATA          = 'https://raw.githubusercontent.com/He-Trogati-Mne/nbu-rate-data/main/data';
        const DATA_JSDELIVR = 'https://cdn.jsdelivr.net/gh/He-Trogati-Mne/nbu-rate-data@main/data';
        const BASE_DATA_URL = DATA;

        const COINGECKO_FALLBACK = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,tether,binancecoin,solana,usd-coin,ripple,cardano,dogecoin,avalanche-2,tron,the-open-network,chainlink,polkadot,litecoin,dai,wrapped-bitcoin,uniswap,near,aptos,arbitrum,optimism,sui,stellar&order=market_cap_desc&per_page=25&page=1&sparkline=true&price_change_percentage=24h';

        const URLS = {
            nbu:     `${BASE_DATA_URL}/nbu.json`,
            history: `${BASE_DATA_URL}/nbu-history.json`,
            crypto:  `${BASE_DATA_URL}/crypto.json`
        };
        const URLS_RAW = {
            history: `${DATA}/nbu-history.json`
        };

        const CORS_PROXY = 'https://nbu-rate.nightmod.workers.dev/?url=';
        const NBU_HISTORY = 'https://bank.gov.ua/NBU_Exchange/exchange_site';

        const FLAG_CODES = {
            UAH:'ua', USD:'us', EUR:'eu', GBP:'gb', PLN:'pl', CNY:'cn', CHF:'ch', JPY:'jp',
            CAD:'ca', AUD:'au', TRY:'tr', SEK:'se', NOK:'no', DKK:'dk', CZK:'cz',
            HUF:'hu', RON:'ro', ILS:'il', KRW:'kr', SGD:'sg', HKD:'hk', NZD:'nz',
            MXN:'mx', INR:'in', TND:'tn', EGP:'eg', DZD:'dz', AED:'ae', SAR:'sa',
            AZN:'az', GEL:'ge', KZT:'kz', MYR:'my', THB:'th', MDL:'md', ZAR:'za', RSD:'rs'
        };
        const METAL_COLORS = { XAU:'#D4AF37', XAG:'#8a8a8a', XPT:'#D8D8DC', XPD:'#B8BCC8', XDR:'#7C83B8' };

        const CRYPTO_COLORS = {
            BTC:'#F7931A', ETH:'#627EEA', USDT:'#26A17B', BNB:'#F3BA2F',
            SOL:'#9945FF', USDC:'#2775CA', XRP:'#00AAE4', ADA:'#0033AD',
            DOGE:'#C2A633', AVAX:'#E84142', TRX:'#FF060A', TON:'#0098EA',
            GRAM:'#0098EA', LINK:'#2A5ADA', DOT:'#E6007A', LTC:'#345D9D',
            SHIB:'#FFA409', DAI:'#F5AC37', WBTC:'#F09242', UNI:'#FF007A',
            NEAR:'#00C1DE', APT:'#00D9A5', ARB:'#12AAFF', OP:'#FF0420',
            SUI:'#4DA2FF', XLM:'#14B6E7'
        };
        const HIDDEN_CRYPTO = new Set(['SHIB']);

        const CURRENCIES = [
            'USD','EUR','GBP','PLN','CNY','CHF','JPY','CAD','AUD','TRY',
            'SEK','NOK','DKK','CZK','HUF','RON','ILS','KRW','SGD','HKD',
            'NZD','MXN','INR','TND','EGP','DZD','AED','SAR','AZN','GEL',
            'KZT','MYR','THB','MDL','ZAR','RSD','XDR','XAU','XAG','XPT','XPD'
        ];

        const CARD_RATE_ORDER = ['USD', 'EUR', 'GBP', 'PLN'];

        // =============== BANKS CONFIG ===============
        const BANKS_CONFIG = [
            { id: 'privat',          nameUk: 'ПриватБанк',     nameEn: 'PrivatBank',      logo: 'bank/privat.png',          letter: 'П' },
            { id: 'mono',            nameUk: 'МоноБанк',       nameEn: 'MonoBank',        logo: 'bank/mono.png',            letter: 'М', fullBleed: true },
            { id: 'oschad',          nameUk: 'Ощадбанк',       nameEn: 'Oschadbank',      logo: 'bank/oschad.png',          letter: 'О' },
            { id: 'pumb',            nameUk: 'ПУМБ',           nameEn: 'PUMB',            logo: 'bank/pumb.png',            letter: 'П' },
            { id: 'raif',            nameUk: 'Райффайзен',     nameEn: 'Raiffeisen',      logo: 'bank/raif.png',            letter: 'Р' },
            { id: 'ukrsib',          nameUk: 'УкрСиббанк',     nameEn: 'UkrSibbank',      logo: 'bank/ukrsib.png',          letter: 'У' },
            { id: 'sense',           nameUk: 'Sense Bank',     nameEn: 'Sense Bank',      logo: 'bank/sense.png',           letter: 'S' },
            { id: 'otp',             nameUk: 'ОТП Банк',       nameEn: 'OTP Bank',        logo: 'bank/otp.png',             letter: 'О' },
            { id: 'ukrexim',         nameUk: 'Укрексімбанк',   nameEn: 'UkrEximBank',     logo: 'bank/ukrexim.png',         letter: 'У' },
            { id: 'ukrgas',          nameUk: 'Укргазбанк',     nameEn: 'UkrGasBank',      logo: 'bank/ukrgas.png',          letter: 'У' },
            { id: 'a-bank',          nameUk: 'А-Банк',         nameEn: 'A-Bank',          logo: 'bank/a-bank.png',          letter: 'А' },
            { id: 'kredo',           nameUk: 'Кредобанк',      nameEn: 'KredoBank',       logo: 'bank/kredo.png',           letter: 'К' },
            { id: 'tas',             nameUk: 'Таскомбанк',     nameEn: 'TAScombank',      logo: 'bank/tas.png',             letter: 'Т' },
            { id: 'credit-agricole', nameUk: 'Креді Агріколь', nameEn: 'Credit Agricole', logo: 'bank/credit-agricole.png', letter: 'C' },
            { id: 'pinbank',         nameUk: 'Перший інвестиційний банк', nameEn: 'First Investment Bank', logo: 'bank/pinbank.png', letter: 'П' },
            { id: 'procredit',       nameUk: 'ПроКредит Банк', nameEn: 'ProCredit Bank',  logo: 'bank/procredit.png',       letter: 'П' },
            { id: 'pravex',          nameUk: 'Правекс Банк',   nameEn: 'Pravex Bank',     logo: 'bank/pravex.png',          letter: 'П' },
            { id: 'idea',            nameUk: 'Ідея Банк',      nameEn: 'Idea Bank',       logo: 'bank/idea.png',            letter: 'І' },
            { id: 'piraeus',         nameUk: 'Піреус Банк',    nameEn: 'Piraeus Bank',    logo: 'bank/piraeus.png',         letter: 'П' },
            { id: 'universal',       nameUk: 'Універсал Банк', nameEn: 'Universal Bank',  logo: 'bank/universal.png',       letter: 'У' },
            { id: 'pivdenny',        nameUk: 'Банк Південний', nameEn: 'Bank Pivdenny',   logo: 'bank/pivdenny.png',        letter: 'П' },
            { id: 'credit-dnipro',   nameUk: 'Банк Кредит Дніпро', nameEn: 'Credit Dnipro Bank', logo: 'bank/credit-dnipro.png', letter: 'К' },
            { id: 'mtb',             nameUk: 'МТБ Банк',       nameEn: 'MTB Bank',        logo: 'bank/mtb.png',             letter: 'М' },
            { id: 'vostok',          nameUk: 'Банк Восток',    nameEn: 'Bank Vostok',     logo: 'bank/vostok.png',          letter: 'В' },
            { id: 'accord',          nameUk: 'Акордбанк',      nameEn: 'Accordbank',      logo: 'bank/accord.png',          letter: 'А' },
            { id: 'lviv',            nameUk: 'Банк Львів',     nameEn: 'Bank Lviv',       logo: 'bank/lviv.png',            letter: 'Л' },
            { id: 'globus',          nameUk: 'Глобус Банк',    nameEn: 'Globus Bank',     logo: 'bank/globus.png',          letter: 'Г' },
            { id: 'alliance',        nameUk: 'Банк Альянс',    nameEn: 'Bank Alliance',   logo: 'bank/alliance.png',        letter: 'А' },
            { id: 'industrial',      nameUk: 'Індустріалбанк', nameEn: 'Industrialbank',  logo: 'bank/industrial.png',      letter: 'І' },
            { id: 'radabank',        nameUk: 'Радабанк',       nameEn: 'Radabank',        logo: 'bank/radabank.png',        letter: 'Р' },
            { id: 'mib',             nameUk: 'Міжнародний Інвестиційний Банк', nameEn: 'International Investment Bank', logo: 'bank/mib.png', letter: 'М' },
            { id: 'asvio',           nameUk: 'Асвіо Банк',     nameEn: 'Asvio Bank',      logo: 'bank/asvio.png',           letter: 'А' },
            { id: 'komin',           nameUk: 'Комінбанк',      nameEn: 'Kominbank',       logo: 'bank/komin.png',           letter: 'К' },
            { id: 'krystal',         nameUk: 'Кристалбанк',    nameEn: 'Krystalbank',     logo: 'bank/krystal.png',         letter: 'К' },
            { id: 'agroprosperis',   nameUk: 'Агропросперіс Банк', nameEn: 'Agroprosperis Bank', logo: 'bank/agroprosperis.png', letter: 'А' },
            { id: 'clearing',        nameUk: 'Банк Кліринговий Дім', nameEn: 'Clearing House Bank', logo: 'bank/clearing.png', letter: 'Б' },
            { id: 'poltava',         nameUk: 'Полтава-Банк',   nameEn: 'Poltava-Bank',    logo: 'bank/poltava.png',         letter: 'П' },
            { id: 'polikom',         nameUk: 'Полікомбанк',    nameEn: 'Polikombank',     logo: 'bank/polikom.png',         letter: 'П' },
            { id: 'unex',            nameUk: 'Юнекс Банк',     nameEn: 'Unex Bank',       logo: 'bank/unex.png',            letter: 'Ю' },
            { id: 'altbank',         nameUk: 'Альтбанк',       nameEn: 'Altbank',         logo: 'bank/altbank.png',         letter: 'А' },
            { id: 'sky',             nameUk: 'Скай Банк',      nameEn: 'Sky Bank',        logo: 'bank/sky.png',             letter: 'С' },
            { id: 'ukrcapital',      nameUk: 'Банк Український капітал', nameEn: 'Ukrainian Capital Bank', logo: 'bank/ukrcapital.png', letter: 'У' },
            { id: 'bank34',          nameUk: 'Банк 3/4',       nameEn: 'Bank 3/4',        logo: 'bank/bank34.png',          letter: 'Б' },
            { id: 'avangard',        nameUk: 'Банк Авангард',  nameEn: 'Bank Avangard',   logo: 'bank/avangard.png',        letter: 'А' },
            { id: 'bizbank',         nameUk: 'Бізбанк',        nameEn: 'Bizbank',         logo: 'bank/bizbank.png',         letter: 'Б' },
            { id: 'metabank',        nameUk: 'МетаБанк',       nameEn: 'MetaBank',        logo: 'bank/metabank.png',        letter: 'М' },
            { id: 'oksi',            nameUk: 'Оксі Банк',      nameEn: 'Oksi Bank',       logo: 'bank/oksi.png',            letter: 'О' },
            { id: 'grant',           nameUk: 'Банк Грант',     nameEn: 'Bank Grant',      logo: 'bank/grant.png',           letter: 'Б' },
            { id: 'family',          nameUk: 'Банк Фамільний', nameEn: 'Family Bank',     logo: 'bank/family.png',          letter: 'Б' },
            { id: 'trust-capital',   nameUk: 'Банк Траст-капітал', nameEn: 'Trust-Capital Bank', logo: 'bank/trust-capital.png', letter: 'Б' }
        ];

        const TRANSLATIONS = {
            uk: {
                hero_title: 'Курс НБУ', hero_subtitle: 'Офіційні курси валют, конвертер та історія з 2003 року',
                section_converter: 'Конвертер', section_analytics: 'Аналітика',
                section_card_rates: 'Курс Валют по картах', section_crypto: 'Криптовалюта',
                privacy_title: 'Політика конфіденційності',
                privacy_h_what: 'Які дані ми збираємо', privacy_p_what: 'Сайт «Курс НБУ» не потребує реєстрації та не запитує ім’я чи email. Хостинг і зовнішні сервіси можуть обробляти технічні дані запитів (наприклад IP-адресу).',
                privacy_h_stored: 'Що зберігається', privacy_p_stored: 'Усі налаштування (тема, мова, вибір валют) зберігаються локально у браузері через <code>localStorage</code>.',
                privacy_h_external: 'Зовнішні запити', privacy_p_external: 'Курси валют читаються з публічного репозиторію на GitHub, який оновлюється з офіційних сайтів та API банків (<code>bank.gov.ua</code>, <code>api.privatbank.ua</code>, <code>api.monobank.ua</code>, <code>api.coingecko.com</code>). Логотипи та прапори завантажуються з файлів цього сайту; для відсутніх зображень використовуються текстові позначення.',
                label_from: 'З валюти', label_to: 'У валюту', settings_title: 'Налаштування',
                settings_language: 'Мова', settings_theme: 'Тема', settings_a11y: 'Доступність', settings_advanced: 'Додатково',
                precise_rate: 'Точний курс (4 знаки)', precise_rate_desc: 'Показувати 44.6743 замість 44.67',
                theme_light: 'Світла', theme_dark: 'Темна', theme_system: 'Системна', theme_custom: 'Власна',
                color_bg: 'Фон', color_text: 'Текст', color_accent: 'Акцент', color_reset: 'Скинути', color_preset_label: 'Швидкі пресети:',
                a11y_cvd: 'Режим для дальтоніків', a11y_cvd_desc: 'Замінює кольори та додає символи', a11y_symbols: 'Символи замість кольору', a11y_symbols_desc: 'Додає ▲▼● та текстові мітки',
                a11y_underline: 'Підкреслювати зміну курсу', a11y_underline_desc: 'Стрілки ↑↓→ підкреслені — видно без кольору', a11y_font: 'Великий шрифт', a11y_font_desc: 'Розмір тексту інтерфейсу (100–150%)',
                period_1d: '1 День', period_5d: '5 Днів', period_7d: '7 Днів', period_1m: '1 Місяць', period_6m: '6 Міс.', period_1y: '1 Рік', period_5y: '5 Років', period_max: 'Макс.',
                picker_title_from: 'З валюти', picker_title_to: 'У валюту', picker_search: 'Пошук (USD, Долар...)',
                status_loading: 'Завантаження курсів...', status_loading_n: 'Завантажено {n}/{total} валют...', status_updated: 'Курс НБУ на {date}',
                status_error: 'Помилка завантаження', status_rate_limited: 'Забагато запитів, спробуйте пізніше', status_cors: 'Не вдалося отримати дані (мережа/проксі)',
                no_data: 'Дані ще не завантажені', insufficient_data: 'Недостатньо даних', buy_label: 'Купівля', sell_label: 'Продаж',
                min_label: 'Мін', max_label: 'Макс', current_label: 'Зараз',
                load_error: 'Не вдалося завантажити', no_data_short: 'Немає даних', bank_unknown_rate: 'Невідомо', bank_privat: 'ПриватБанк', bank_mono: 'МоноБанк',
                autoplay_15s: 'Авто 15с',
                USD:'Долар США', EUR:'Євро', GBP:'Фунт стерлінгів', PLN:'Польський злотий', CNY:'Китайський юань', CHF:'Швейцарський франк', JPY:'Японська єна',
                CAD:'Канадський долар', AUD:'Австралійський долар', TRY:'Турецька ліра', SEK:'Шведська крона', NOK:'Норвезька крона', DKK:'Данська крона',
                CZK:'Чеська крона', HUF:'Угорський форинт', RON:'Румунський лей', ILS:'Ізраїльський шекель', KRW:'Південнокорейська вона', SGD:'Сінгапурський долар',
                HKD:'Гонконгський долар', NZD:'Новозеландський долар', MXN:'Мексиканське песо', INR:'Індійська рупія', TND:'Туніський динар', EGP:'Єгипетський фунт',
                DZD:'Алжирський динар', AED:'Дирхам ОАЕ', SAR:'Саудівський ріял', AZN:'Азербайджанський манат', GEL:'Грузинський ларі', KZT:'Казахстанський теньге', MYR:'Малайзійський ринггіт', THB:'Таїландський бат',
                MDL:'Молдовський лей', ZAR:'Південноафриканський ренд', RSD:'Сербський динар', XDR:'СПЗ (спеціальні права запозичення)', XAU:'Золото (тройська унція)', XAG:'Срібло (тройська унція)', XPT:'Платина (тройська унція)', XPD:'Паладій (тройська унція)', UAH:'Українська гривня'
            },
            en: {
                hero_title: 'NBU Rate', hero_subtitle: 'Official exchange rates, converter and history since 2003',
                section_converter: 'Converter', section_analytics: 'Analytics', section_card_rates: 'Card Rates', section_crypto: 'Cryptocurrency',
                privacy_title: 'Privacy Policy', privacy_h_what: 'What data we collect', privacy_p_what: 'NBU Rate does not require registration or ask for your name or email. Hosting and external services may process technical request data (such as IP addresses).',
                privacy_h_stored: 'What is stored', privacy_p_stored: 'All settings (theme, language, currency selection) are stored locally in your browser via <code>localStorage</code>.',
                privacy_h_external: 'External requests', privacy_p_external: 'Exchange rates are read from a public GitHub repository updated from official bank websites and APIs (<code>bank.gov.ua</code>, <code>api.privatbank.ua</code>, <code>api.monobank.ua</code>, <code>api.coingecko.com</code>). Logos and flags are served from this site; missing images use text labels.',
                label_from: 'From', label_to: 'To', settings_title: 'Settings', settings_language: 'Language',
                settings_theme: 'Theme', settings_a11y: 'Accessibility', settings_advanced: 'Advanced',
                precise_rate: 'Precise rate (4 decimals)', precise_rate_desc: 'Show 44.6743 instead of 44.67',
                theme_light: 'Light', theme_dark: 'Dark', theme_system: 'System', theme_custom: 'Custom',
                color_bg: 'Background', color_text: 'Text', color_accent: 'Accent', color_reset: 'Reset', color_preset_label: 'Quick presets:',
                a11y_cvd: 'Colorblind mode', a11y_cvd_desc: 'Replaces colors and adds symbols', a11y_symbols: 'Symbols instead of color', a11y_symbols_desc: 'Adds ▲▼● and text labels',
                a11y_underline: 'Underline rate changes', a11y_underline_desc: '↑↓→ arrows underlined', a11y_font: 'Large font', a11y_font_desc: 'Interface text size (100–150%)',
                period_1d: '1 Day', period_5d: '5 Days', period_7d: '7 Days', period_1m: '1 Month', period_6m: '6 Mos', period_1y: '1 Year', period_5y: '5 Years', period_max: 'Max',
                picker_title_from: 'From', picker_title_to: 'To', picker_search: 'Search (USD, Dollar...)',
                status_loading: 'Loading rates...', status_loading_n: 'Loaded {n}/{total} currencies...', status_updated: 'NBU rate for {date}',
                status_error: 'Loading error', status_rate_limited: 'Too many requests, try later', status_cors: 'Failed to fetch (network/proxy)',
                no_data: 'Data not loaded yet', insufficient_data: 'Not enough data', buy_label: 'Buy', sell_label: 'Sell',
                min_label: 'Min', max_label: 'Max', current_label: 'Now',
                load_error: 'Failed to load', no_data_short: 'No data', bank_unknown_rate: 'Unknown', bank_privat: 'PrivatBank', bank_mono: 'MonoBank',
                autoplay_15s: 'Auto 15s',
                USD:'US Dollar', EUR:'Euro', GBP:'British Pound', PLN:'Polish Zloty', CNY:'Chinese Yuan', CHF:'Swiss Franc', JPY:'Japanese Yen',
                CAD:'Canadian Dollar', AUD:'Australian Dollar', TRY:'Turkish Lira', SEK:'Swedish Krona', NOK:'Norwegian Krone', DKK:'Danish Krone',
                CZK:'Czech Koruna', HUF:'Hungarian Forint', RON:'Romanian Leu', ILS:'Israeli Shekel', KRW:'South Korean Won', SGD:'Singapore Dollar',
                HKD:'Hong Kong Dollar', NZD:'New Zealand Dollar', MXN:'Mexican Peso', INR:'Indian Rupee', TND:'Tunisian Dinar', EGP:'Egyptian Pound',
                DZD:'Algerian Dinar', AED:'UAE Dirham', SAR:'Saudi Riyal', AZN:'Azerbaijani Manat', GEL:'Georgian Lari', KZT:'Kazakhstani Tenge',
                MYR:'Malaysian Ringgit', THB:'Thai Baht', MDL:'Moldovan Leu', ZAR:'South African Rand', RSD:'Serbian Dinar', XDR:'SDR (Special Drawing Rights)',
                XAU:'Gold (troy ounce)', XAG:'Silver (troy ounce)', XPT:'Platinum (troy ounce)', XPD:'Palladium (troy ounce)', UAH:'Ukrainian Hryvnia'
            }
        };

        const CHART_COLORS = {
            USD:'#1a73e8',EUR:'#34a853',GBP:'#ea4335',PLN:'#fbbc04',CNY:'#ff6d01',CHF:'#d93025',JPY:'#bc002d',CAD:'#d80621',
            AUD:'#00008b',TRY:'#e30a17',SEK:'#006AA7',NOK:'#BA0C2F',DKK:'#C60C30',CZK:'#11457E',HUF:'#477050',RON:'#002B7F',
            ILS:'#0038B8',KRW:'#CD2E3A',SGD:'#EF3340',HKD:'#DE2910',NZD:'#7a7a7a',MXN:'#006847',INR:'#FF9933',TND:'#E70013',
            EGP:'#C8102E',DZD:'#006233',AED:'#00732F',SAR:'#165d31',AZN:'#00B5E2',GEL:'#DA291C',KZT:'#00AFCA',MYR:'#CC0001',
            THB:'#A51931',MDL:'#003DA5',ZAR:'#007A4D',RSD:'#C6363C',XDR:'#7C83B8',XAU:'#D4AF37',XAG:'#8a8a8a',XPT:'#D8D8DC',XPD:'#B8BCC8'
        };

        const PRESETS = {
            midnight:{bg:'#0f172a',text:'#e2e8f0',accent:'#38bdf8'}, nord:{bg:'#2e3440',text:'#eceff4',accent:'#88c0d0'},
            dracula:{bg:'#282a36',text:'#f8f8f2',accent:'#bd93f9'}, sepia:{bg:'#f4ecd8',text:'#3b2f1e',accent:'#8b5a2b'},
            forest:{bg:'#0f2417',text:'#d1fae5',accent:'#4ade80'}, rose:{bg:'#fff1f2',text:'#4c0519',accent:'#e11d48'}
        };
        const PRESET_ICONS = { midnight:'color-fvcn/blue.ico', nord:'color-fvcn/lightblue.ico', dracula:'color-fvcn/purple.ico', sepia:'color-fvcn/brown.ico', forest:'color-fvcn/green.ico', rose:'color-fvcn/red.ico' };
        const DEFAULT_FAVICON = 'favicon.ico';
        const DEFAULT_CUSTOM = {bg:'#1a1a1a',text:'#e8eaed',accent:'#8ab4f8'};
        const DEFAULT_A11Y = {cvd:false,palette:'universal',font:100,symbols:true,underline:false};

        const THEME_KEY = 'nbu_site_theme_v2';
        const CUSTOM_COLORS_KEY = 'nbu_site_custom_colors_v2';
        const A11Y_KEY = 'nbu_site_a11y_v2';
        const LANG_KEY = 'nbu_site_lang_v1';
        const PRECISE_KEY = 'nbu_site_precise_v1';
        const PRESET_KEY = 'nbu_site_preset_v1';
        const CACHE_KEY_PREFIX = 'nbu_site_cache_';
        const CACHE_TTL = 15 * 60 * 1000;
        const HISTORY_CACHE_KEY = 'nbu_site_history_v16';
        const HISTORY_CACHE_TTL = 12 * 60 * 60 * 1000;
        const HISTORY_FORMAT_VERSION = 2;
        const START_DATE = '20030101';
        const REQUEST_TIMEOUT = 30000;
        const CONCURRENCY = 6;
        const CAROUSEL_INTERVAL = 15000;

        let currentLang = safeLS.getItem(LANG_KEY) || 'uk';
        let showPreciseRate = true;
        let currentCurrency = 'USD';
        let currentPeriod = 'MAX';
        let currentCryptoPeriod = 'MAX';
        let activeCryptoCoin = null;
        let activeCryptoModalPeriod = '1Y';
        let chartInstance = null;
        let cardChartInstance = null;
        let cryptoChartInstance = null;
        let liveRates = {};
        let historicalRates = {};
        let cryptoCoins = [];
        let cryptoDataMap = {};
        let latestDate = '';
        let liveDate = '';
        let liveUpdatedAt = 0, liveSyncedAt = 0, liveFromCache = true;
        let liveLoadPromise = null, initialLoadPromise = null, pollPromise = null;
        let cryptoLoadPromise = null, cryptoUpdatedAt = 0;
        let bankLoadPromise = null, lastBankPoll = 0;
        const BANK_POLL_INTERVAL = 30 * 60 * 1000;
        const bankMeta = {};
        let pickerTarget = null;
        let historyLoading = false;
        let fullHistoryReady = false;
        const bankCarouselState = { current: 0, total: 0, autoplay: true, paused: false, timer: null };

        const $ = (s) => document.querySelector(s);
        const $$ = (s) => document.querySelectorAll(s);

        function t(key, vars) {
            const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.uk;
            let str = dict[key] || key;
            if (vars) Object.keys(vars).forEach(k => str = str.replace(`{${k}}`, vars[k]));
            return str;
        }
        function currencyName(code) { return t(code) || code; }
        function currentDecimals() { return showPreciseRate ? 4 : 2; }
        function bankDisplayName(bank) { return currentLang === 'en' ? bank.nameEn : bank.nameUk; }

        function flagUrl(code) {
            const f = FLAG_CODES[code];
            return f ? `./flags/${f}.png` : null;
        }
        function flagHtml(code, cssClass = 'rate-flag') {
            if (code in METAL_COLORS) return `<span class="flag-metal-wrap" style="width:26px;height:18px;background:${METAL_COLORS[code]};"></span>`;
            const url = flagUrl(code);
            if (!url) return `<span class="${cssClass}-fallback">${code}</span>`;
            return `<img class="${cssClass}" src="${url}" alt="${code}" width="26" height="18" loading="lazy" decoding="async" onerror="this.style.display='none'">`;
        }
        let cryptoLogoMap={};let cryptoLogoLoad;
        function loadCryptoLogos(){return cryptoLogoLoad||(cryptoLogoLoad=fetch('./crypto-logos.json').then(r=>r.ok?r.json():{}).then(data=>{cryptoLogoMap=Object.fromEntries(Object.entries(data||{}).filter(([k,v])=>/^[A-Z0-9]{1,16}$/.test(k)&&typeof v==='string'&&/^crypto-logos\/[A-Za-z0-9._-]+\.(png|svg|webp|jpg|ico)$/i.test(v)));}).catch(()=>{}));}
        function cryptoIcon(symbol, imageUrl = null) {
            const sym = String(symbol || '').toUpperCase();
            const safe=/^[A-Z0-9]{1,16}$/.test(sym)?sym:'?';
            const fallbackColor=CRYPTO_COLORS[safe]||'#666';
            const local=cryptoLogoMap[safe]||'';
            const candidates=window.NbuLogos.candidates('crypto',safe,local);
            if(candidates.length)return `<img class="crypto-icon" src="${candidates[0]}" data-symbol="${safe}" data-local="${local}" data-color="${fallbackColor}" alt="${safe}" width="24" height="24" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="window.NbuLogos.cryptoError(this)">`;
            return `<span class="crypto-icon-fallback" style="background:${fallbackColor}" aria-label="${safe}">${safe.charAt(0)}</span>`;
        }

        function sparklineSvg(history, color, width = 300, height = 60) {
            const dates = Object.keys(history || {}).sort();
            if (dates.length < 2) return `<div class="sparkline-empty">—</div>`;
            const values = dates.map(d => history[d]).filter(v => typeof v === 'number' && !isNaN(v));
            if (values.length < 2) return `<div class="sparkline-empty">—</div>`;
            const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
            const padY = 4, usableH = height - padY * 2;
            const points = values.map((v, i) => [(i / (values.length - 1)) * width, padY + (1 - (v - min) / range) * usableH]);
            const linePath = 'M ' + points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L ');
            const fillPath = `${linePath} L ${width},${height} L 0,${height} Z`;
            const uid = 'sg' + Math.random().toString(36).slice(2, 8);
            return `<svg class="sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
                <defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.35"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
                <path d="${fillPath}" fill="url(#${uid})" stroke="none"/>
                <path d="${linePath}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
            </svg>`;
        }
        function hexToRgb(hex) {
            if (!hex) return null;
            hex = String(hex).replace('#', '').trim();
            if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
            if (hex.length !== 6 || !/^[0-9a-f]{6}$/i.test(hex)) return null;
            const num = parseInt(hex, 16);
            return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
        }
        function hexToRgba(hex, alpha) { const c = hexToRgb(hex); return c ? `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})` : hex; }
        function rgbToHex({r,g,b}) { return '#' + [r,g,b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2,'0')).join(''); }
        function mixHex(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return (!A || !B) ? a : rgbToHex({ r: A.r + (B.r - A.r) * t, g: A.g + (B.g - A.g) * t, b: A.b + (B.b - A.b) * t }); }
        function luminance(hex) { const c = hexToRgb(hex); return c ? (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255 : 0.5; }

        function setFavicon(presetName) {
            const theme = safeLS.getItem(THEME_KEY) || 'system';
            const useIcon = (theme === 'custom' && presetName && PRESET_ICONS[presetName]) ? PRESET_ICONS[presetName] : DEFAULT_FAVICON;
            let link = document.getElementById('favicon-link');
            if (!link) {
                link = document.createElement('link');
                link.id = 'favicon-link';
                link.rel = 'icon';
                link.type = 'image/x-icon';
                document.head.appendChild(link);
            }
            if (link.getAttribute('href') !== useIcon) link.href = useIcon;
        }

        async function fetchWithTimeout(url, timeout, retries = 2) {
            let lastErr;
            for (let attempt = 0; attempt <= retries; attempt++) {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), timeout);
                try {
                    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
                    clearTimeout(timer);
                    if (!res.ok && res.status >= 500) throw new Error('HTTP ' + res.status);
                    return res;
                } catch (e) {
                    clearTimeout(timer);
                    lastErr = e;
                    if (attempt < retries) await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
                }
            }
            throw lastErr;
        }
        async function proxiedFetch(targetUrl) {
            const url = CORS_PROXY + encodeURIComponent(targetUrl) + '&_=' + Date.now();
            return fetchWithTimeout(url, REQUEST_TIMEOUT);
        }

        function cacheKey(source) { return CACHE_KEY_PREFIX + source; }
        function loadLiveCache(source, allowStale = false) {
            try {
                const raw = safeLS.getItem(cacheKey(source)); if (!raw) return null;
                const c = JSON.parse(raw);
                if (!allowStale && Date.now() - c.timestamp > CACHE_TTL) return null;
                return c.data;
            } catch { return null; }
        }
        function saveLiveCache(source, data, updatedAt = 0) {
            try { safeLS.setItem(cacheKey(source), JSON.stringify({ timestamp: Date.now(), updatedAt, data })); } catch (e) {}
        }
        function cachedSnapshot(source) {
            try { return JSON.parse(safeLS.getItem(cacheKey(source)) || 'null'); } catch (_) { return null; }
        }
        function dataTimestamp(value) {
            if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : 0;
            const ms = Date.parse(value || '');
            return Number.isFinite(ms) ? ms : 0;
        }
        // Fetch both mirrors independently; the primary wins ties. A CDN response
        // is not assumed to be current just because the HTTP request succeeded.
        async function fetchFeedCandidates(name, timeout = 12000) {
            const urls = [`${DATA}/${name}.json`, `${DATA_JSDELIVR}/${name}.json`];
            const results = await Promise.all(urls.map(async url => {
                try {
                    const res = await fetchWithTimeout(`${url}?t=${Date.now()}`, timeout, 0);
                    return res.ok ? await res.json() : null;
                } catch (_) { return null; }
            }));
            return results.filter(x => x && typeof x === 'object');
        }
        function chooseNewest(candidates) {
            return candidates.reduce((best, next) => !best || next.updatedAt > best.updatedAt ? next : best, null);
        }
        function loadHistoryCache() {
            try {
                const raw = safeLS.getItem(HISTORY_CACHE_KEY); if (!raw) return null;
                const c = JSON.parse(raw);
                if (Date.now() - c.timestamp > HISTORY_CACHE_TTL) return null;
                if ((c.formatVersion || 1) < HISTORY_FORMAT_VERSION) {
                    safeLS.removeItem(HISTORY_CACHE_KEY);
                    return null;
                }
                return c.data;
            } catch { return null; }
        }
        function saveHistoryCache(data) {
            try { safeLS.setItem(HISTORY_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), formatVersion: HISTORY_FORMAT_VERSION, data })); } catch (e) {}
        }

        function refreshBankLogosForTheme() {
            $$('#bank-track .bank-slide-logo').forEach(img=>{
                const bank=BANKS_CONFIG.find(b=>b.id===img.dataset.bankId);if(!bank)return;
                const asset=bankLogoAsset(bank);img.className='bank-slide-logo '+asset.classes;
                img.parentElement?.classList.toggle('is-full-bleed',asset.classes.includes('full-bleed'));
                if(img.getAttribute('src')!==asset.src)img.src=asset.src;
            });
        }

        function applyTheme(theme, customColors) {
            const root = document.documentElement;
            root.setAttribute('data-theme', theme);
            let scheme = theme;
            if (theme === 'custom' && customColors) {
                const bg = hexToRgb(customColors.bg) ? customColors.bg : DEFAULT_CUSTOM.bg;
                const text = hexToRgb(customColors.text) ? customColors.text : DEFAULT_CUSTOM.text;
                const accent = hexToRgb(customColors.accent) ? customColors.accent : DEFAULT_CUSTOM.accent;
                const isDark = luminance(bg) < 0.5; scheme = isDark ? 'dark' : 'light';
                const acRgb = hexToRgb(accent);
                root.style.setProperty('--bg', bg); root.style.setProperty('--bg-elev', isDark ? mixHex(bg, '#fff', 0.06) : mixHex(bg, '#000', 0.02));
                root.style.setProperty('--surface-1', isDark ? mixHex(bg, '#fff', 0.03) : mixHex(bg, '#000', 0.02));
                root.style.setProperty('--surface-2', isDark ? mixHex(bg, '#fff', 0.06) : mixHex(bg, '#000', 0.04));
                root.style.setProperty('--text', text); root.style.setProperty('--text-muted', mixHex(text, bg, 0.45));
                root.style.setProperty('--text-faint', mixHex(text, bg, 0.65)); root.style.setProperty('--accent', accent);
                root.style.setProperty('--accent-text', luminance(accent) < 0.55 ? '#ffffff' : '#0a0e14');
                root.style.setProperty('--accent-glow', `rgba(${acRgb.r}, ${acRgb.g}, ${acRgb.b}, 0.25)`);
                root.style.setProperty('--border', isDark ? mixHex(bg, '#fff', 0.15) : mixHex(bg, '#000', 0.12));
                root.style.setProperty('--border-strong', isDark ? mixHex(bg, '#fff', 0.25) : mixHex(bg, '#000', 0.2));
                root.style.setProperty('--hover', isDark ? mixHex(bg, '#fff', 0.08) : mixHex(bg, '#000', 0.05));
                root.style.setProperty('--positive', isDark ? '#56d68b' : '#0d652d'); root.style.setProperty('--negative', isDark ? '#ff6b6b' : '#c5221f');
            } else {
                ['--bg','--bg-elev','--surface-1','--surface-2','--text','--text-muted','--text-faint','--accent','--accent-text','--accent-glow','--border','--border-strong','--hover','--positive','--negative'].forEach(v => root.style.removeProperty(v));
                if (theme === 'system') scheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            root.setAttribute('data-scheme', scheme);
            if (window.nbuUpdateSystemBars) window.nbuUpdateSystemBars();
            $$('#theme-switch button').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === theme));
            const panel = $('#custom-colors-panel'); if (panel) panel.style.display = theme === 'custom' ? 'block' : 'none';
            refreshBankLogosForTheme();
        }

        function initTheme() {
            const theme = safeLS.getItem(THEME_KEY) || 'system';
            const custom = JSON.parse(safeLS.getItem(CUSTOM_COLORS_KEY) || 'null') || DEFAULT_CUSTOM;
            applyTheme(theme, custom);
            $('#color-bg').value = custom.bg; $('#hex-bg').value = custom.bg.toUpperCase();
            $('#color-text').value = custom.text; $('#hex-text').value = custom.text.toUpperCase();
            $('#color-accent').value = custom.accent; $('#hex-accent').value = custom.accent.toUpperCase();
            $$('#theme-switch button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const th = btn.dataset.theme; safeLS.setItem(THEME_KEY, th);
                    const c = JSON.parse(safeLS.getItem(CUSTOM_COLORS_KEY) || 'null') || DEFAULT_CUSTOM;
                    applyTheme(th, c); setFavicon(safeLS.getItem(PRESET_KEY)); renderChart(); renderCryptoCards();
                    if ($('#crypto-chart-modal').classList.contains('visible')) renderCryptoModalChart();
                });
            });
            ['bg','text','accent'].forEach(name => {
                const picker = $(`#color-${name}`), text = $(`#hex-${name}`);
                picker.addEventListener('input', () => { text.value = picker.value.toUpperCase(); saveCustomColors(); });
                text.addEventListener('input', () => {
                    let v = text.value.trim(); if (!v.startsWith('#')) v = '#' + v;
                    if (hexToRgb(v)) { picker.value = v.toLowerCase(); saveCustomColors(); }
                });
            });
            $$('.preset-swatch').forEach(btn => {
                btn.addEventListener('click', () => {
                    const presetName = btn.dataset.preset; const p = PRESETS[presetName]; if (!p) return;
                    $('#color-bg').value = p.bg; $('#hex-bg').value = p.bg.toUpperCase();
                    $('#color-text').value = p.text; $('#hex-text').value = p.text.toUpperCase();
                    $('#color-accent').value = p.accent; $('#hex-accent').value = p.accent.toUpperCase();
                    const colors = { bg: p.bg, text: p.text, accent: p.accent };
                    safeLS.setItem(CUSTOM_COLORS_KEY, JSON.stringify(colors));
                    safeLS.setItem(THEME_KEY, 'custom'); safeLS.setItem(PRESET_KEY, presetName);
                    applyTheme('custom', colors); $$('#theme-switch button').forEach(b => b.classList.toggle('active', b.dataset.theme === 'custom'));
                    $('#custom-colors-panel').style.display = 'block'; setFavicon(presetName); renderChart(); renderCryptoCards();
                    if ($('#crypto-chart-modal').classList.contains('visible')) renderCryptoModalChart();
                });
            });
            $('#reset-colors').addEventListener('click', () => {
                $('#color-bg').value = DEFAULT_CUSTOM.bg; $('#hex-bg').value = DEFAULT_CUSTOM.bg.toUpperCase();
                $('#color-text').value = DEFAULT_CUSTOM.text; $('#hex-text').value = DEFAULT_CUSTOM.text.toUpperCase();
                $('#color-accent').value = DEFAULT_CUSTOM.accent; $('#hex-accent').value = DEFAULT_CUSTOM.accent.toUpperCase();
                safeLS.removeItem(PRESET_KEY); saveCustomColors(); setFavicon(null);
            });
        }
        function saveCustomColors() {
            const colors = { bg: $('#color-bg').value, text: $('#color-text').value, accent: $('#color-accent').value };
            safeLS.setItem(CUSTOM_COLORS_KEY, JSON.stringify(colors));
            if ((safeLS.getItem(THEME_KEY) || 'system') === 'custom') { applyTheme('custom', colors); renderChart(); renderCryptoCards(); }
        }

        function getA11y() {
            try {
                const stored = JSON.parse(safeLS.getItem(A11Y_KEY) || 'null') || {};
                if (typeof stored.font === 'boolean') stored.font = stored.font ? 125 : 100;
                return { ...DEFAULT_A11Y, ...stored };
            } catch { return { ...DEFAULT_A11Y }; }
        }
        function applyA11y(a) {
            const root = document.documentElement; const v = { ...DEFAULT_A11Y, ...a };
            root.setAttribute('data-a11y-cvd', v.cvd ? 'true' : 'false'); root.setAttribute('data-a11y-palette', v.palette);
            root.setAttribute('data-a11y-symbols', (v.cvd || v.symbols) ? 'true' : 'false'); root.setAttribute('data-a11y-underline', v.underline ? 'true' : 'false');
            const fontSize = parseInt(v.font, 10) || 100;
            root.style.setProperty('--a11y-font-scale', (fontSize / 100).toFixed(2));
            const cvd = $('#a11y-cvd-toggle'); if (cvd) cvd.checked = v.cvd;
            const sym = $('#a11y-symbols-toggle'); if (sym) sym.checked = v.symbols;
            const und = $('#a11y-underline-toggle'); if (und) und.checked = v.underline;
            const slider = $('#a11y-font-slider'); if (slider) slider.value = fontSize;
            const label = $('#a11y-font-value'); if (label) label.textContent = fontSize + '%';
            $$('input[name="palette"]').forEach(r => r.checked = (r.value === v.palette));
            const list = $('#palette-list'); if (list) list.classList.toggle('visible', v.cvd);
        }
        function initA11y() {
            applyA11y(getA11y());
            function save() {
                const slider = $('#a11y-font-slider');
                const v = {
                    cvd: $('#a11y-cvd-toggle')?.checked || false,
                    palette: document.querySelector('input[name="palette"]:checked')?.value || 'universal',
                    font: slider ? parseInt(slider.value, 10) : 100,
                    symbols: $('#a11y-symbols-toggle')?.checked || false,
                    underline: $('#a11y-underline-toggle')?.checked || false
                };
                safeLS.setItem(A11Y_KEY, JSON.stringify(v)); applyA11y(v); renderChart(); renderCryptoCards(); if ($('#crypto-chart-modal').classList.contains('visible')) renderCryptoModalChart();
            }
            ['a11y-cvd-toggle','a11y-symbols-toggle','a11y-underline-toggle'].forEach(id => { const el = $('#' + id); if (el) el.addEventListener('change', save); });
            const slider = $('#a11y-font-slider');
            if (slider) {
                let rafId = null;
                slider.addEventListener('input', () => {
                    const label = $('#a11y-font-value'); if (label) label.textContent = slider.value + '%';
                    if (rafId) return;
                    rafId = requestAnimationFrame(() => {
                        rafId = null;
                        document.documentElement.style.setProperty('--a11y-font-scale', (parseInt(slider.value, 10) / 100).toFixed(2));
                    });
                });
                slider.addEventListener('change', save);
            }
            $$('input[name="palette"]').forEach(r => r.addEventListener('change', save));
        }

        function initPreciseRate() {
            const stored = safeLS.getItem(PRECISE_KEY);
            showPreciseRate = stored === null ? true : stored === 'true';
            const toggle = $('#precise-rate-toggle');
            if (toggle) {
                toggle.checked = showPreciseRate;
                toggle.addEventListener('change', () => {
                    showPreciseRate = toggle.checked; safeLS.setItem(PRECISE_KEY, showPreciseRate ? 'true' : 'false');
                    if (Object.keys(liveRates).length > 0) renderCards(liveRates);
                    initBankCarousel(); convert();
                    if (Object.keys(historicalRates).length > 0) renderChart();
                    renderCryptoCards();
                    if ($('#crypto-chart-modal').classList.contains('visible')) renderCryptoModalChart();
                });
            }
        }

        function applyTranslations() {
            document.documentElement.setAttribute('lang', currentLang);
            document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
            document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
            const si = $('#picker-search'); if (si) si.placeholder = t('picker_search');
            $$('.period-btn').forEach(btn => { btn.textContent = t('period_' + btn.dataset.period.toLowerCase()); });
            $$('#theme-switch button').forEach(btn => { btn.textContent = t('theme_' + btn.dataset.theme); });
            $$('#lang-switch button').forEach(btn => { btn.classList.toggle('active', btn.dataset.lang === currentLang); });
            if (Object.keys(liveRates).length > 0) {
                renderCards(liveRates);
                const d = liveDate || formatDate(latestDate);
                if (d) updateLiveStatus();
            }
            if ($('#picker-modal').classList.contains('visible')) renderPickerList($('#picker-search').value);
            if ($('#crypto-chart-modal').classList.contains('visible')) renderCryptoModalChart();
            updateBankNamesForLanguage();
            fxTranslate();
        }
        function initLanguage() {
            $$('#lang-switch button').forEach(btn => {
                btn.addEventListener('click', () => {
                    currentLang = btn.dataset.lang; safeLS.setItem(LANG_KEY, currentLang);
                    applyTranslations(); renderChart(); renderCryptoCards(); initBankCarousel();
                });
            });
        }

        function setStatus(text, state = '') {
            const el = $('#hero-status'), txt = $('#status-text');
            if (!el || !txt) return;
            el.classList.remove('loading', 'error'); if (state) el.classList.add(state);
            txt.textContent = text;
            if (state) el.removeAttribute('title');
        }
        function updateLiveStatus(state = '') {
            const en = currentLang === 'en';
            const locale = en ? 'en-GB' : 'uk-UA';
            const zone = { timeZone: 'Europe/Kyiv' };
            const valid = ms => Number.isFinite(ms) && ms > 0;
            const dateKey = ms => new Intl.DateTimeFormat('en-CA', { ...zone, year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date(ms));
            const time = ms => new Intl.DateTimeFormat(locale, { ...zone, hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).format(new Date(ms));
            const full = ms => new Intl.DateTimeFormat(locale, { ...zone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).format(new Date(ms));
            const short = ms => !valid(ms) ? '—' : dateKey(ms) === dateKey(Date.now()) ? time(ms) : full(ms);
            const offline = navigator.onLine === false;
            const checking = !offline && (state === 'loading' || !!liveLoadPromise);
            const failed = offline || (!checking && (state === 'error' || liveFromCache || !valid(liveSyncedAt)));
            const label = liveDate ? t('status_updated', {date: formatDate(toRateDateIso(liveDate))}) : failed ? t('status_error') : t('status_loading');
            setStatus(label, failed ? 'error' : checking ? 'loading' : '');
            const el = $('#hero-status'); if (!el) return;
            const details = $('#status-details'), notice = $('#status-notice');
            $('#status-sync-time').textContent = `${en ? 'Last sync' : 'Синхронізація'}: ${short(liveSyncedAt)}`;
            $('#status-data-time').textContent = `${en ? 'Updated' : 'Оновлено'}: ${short(liveUpdatedAt)}`;
            details.hidden = !liveDate && !valid(liveSyncedAt) && !valid(liveUpdatedAt);
            notice.hidden = !failed && !checking;
            notice.textContent = offline ? (en ? 'Offline · not synced' : 'Немає інтернету · не синхронізовано') : failed ? (en ? 'Not synced' : 'Не синхронізовано') : checking ? (en ? 'Synchronizing…' : 'Синхронізація…') : '';
            el.title = [en ? 'Last successful sync' : 'Остання успішна синхронізація', valid(liveSyncedAt) ? full(liveSyncedAt) : '—', en ? 'Source data updated' : 'Оновлення даних у джерелі', valid(liveUpdatedAt) ? full(liveUpdatedAt) : '—', en ? 'Kyiv time' : 'Час Києва'].join('\n');
        }
        function formatDate(iso) { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; }
        function formatNumber(num, decimals = null) {
            const n = Number(num);
            if (num == null || num === '' || isNaN(n)) return '—';
            const d = decimals == null ? currentDecimals() : decimals;
            return n.toLocaleString('uk-UA', { minimumFractionDigits: d, maximumFractionDigits: d });
        }
        function formatCryptoUsd(num) {
            const n = Number(num);
            if (!Number.isFinite(n)) return '—';
            let d = 2;
            if (n > 0 && n < 0.01) d = 6;
            else if (n < 1) d = 4;
            else if (n < 100 && showPreciseRate) d = 4;
            return '$' + n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
        }

        function normalizeNbuSnapshot(raw, updatedAt = 0) {
            const arr = Array.isArray(raw) ? raw : raw?.data;
            if (!Array.isArray(arr)) return null;
            const rows = arr.map(item => ({cc:String(item?.cc || '').toUpperCase(),
                name:t(item?.cc || '') || item?.txt, rate:Number(item?.rate),
                date:toRateDateIso(item?.exchangedate || item?.date), hasBuySell:false}))
                .filter(r => /^[A-Z]{3}$/.test(r.cc) && Number.isFinite(r.rate) && r.rate > 0 && r.date);
            const dates = [...new Set(rows.map(r => r.date))].sort().reverse();
            // Require both main currencies on the same published date; never mix dates.
            for (const date of dates) {
                const rates = rows.filter(r => r.date === date);
                if (!rates.some(r => r.cc === 'USD') || !rates.some(r => r.cc === 'EUR')) continue;
                return {date, rates, updatedAt:dataTimestamp(updatedAt || raw?.updatedAt)};
            }
            return null;
        }
        function isNewerNbu(next, previous) {
            return !previous || next.date > previous.date ||
                (next.date === previous.date && next.updatedAt >= previous.updatedAt);
        }
        function applyNbuSnapshot(snapshot) {
            liveRates = Object.fromEntries(snapshot.rates.map(r => [r.cc, r]));
            liveDate = formatDate(snapshot.date);
            liveUpdatedAt = snapshot.updatedAt;
        }
        async function loadLiveRates(source) {
            if (liveLoadPromise) return liveLoadPromise;
            liveLoadPromise = (async () => {
                const cached = cachedSnapshot(source);
                const local = normalizeNbuSnapshot(cached?.data, cached?.updatedAt);
                if (local && !liveSyncedAt) liveSyncedAt = dataTimestamp(cached?.timestamp);
                let previous = normalizeNbuSnapshot(Object.values(liveRates), liveUpdatedAt);
                if (local && isNewerNbu(local, previous)) { previous = local; applyNbuSnapshot(local); }
                const feeds = await fetchFeedCandidates(source);
                let best = null;
                for (const raw of feeds) {
                    const next = normalizeNbuSnapshot(raw);
                    if (next && (!best || next.date > best.date || (next.date === best.date && next.updatedAt > best.updatedAt))) best = next;
                }
                if (navigator.onLine !== false && best && isNewerNbu(best, previous)) {
                    applyNbuSnapshot(best);
                    liveSyncedAt = Date.now(); liveFromCache = false;
                    saveLiveCache(source, best.rates, best.updatedAt);
                } else {
                    liveFromCache = true;
                    if (!previous) throw new Error('No valid NBU snapshot');
                }
                return liveRates;
            })();
            try { return await liveLoadPromise; } finally { liveLoadPromise = null; }
        }

        async function fetchHistoryForCurrency(valcode) {
            const end = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const apiUrl = `${NBU_HISTORY}?start=${START_DATE}&end=${end}&valcode=${valcode}&sort=exchangedate&order=desc&json`;
            const res = await proxiedFetch(apiUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const history = {};
            data.forEach(item => {
                const [day, month, year] = item.exchangedate.split('.');
                const iso = `${year}-${month}-${day}`;
                if (!history[iso]) history[iso] = {};
                const units = Number(item.units) > 0 ? Number(item.units) : 1;
                history[iso][valcode.toUpperCase()] = item.rate / units;
            });
            return history;
        }

        function toRateDateIso(date) {
            if (typeof date !== 'string') return '';
            const value = date.trim();
            const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
            const iso = match ? `${match[3]}-${match[2]}-${match[1]}` : value;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
            const parsed = new Date(iso + 'T00:00:00Z');
            return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === iso ? iso : '';
        }

        function mergeHistory(base, recent) {
            for (const [date, rates] of Object.entries(recent || {})) {
                if (!base[date]) base[date] = {};
                Object.assign(base[date], rates);
            }
            return base;
        }

        function mergeLiveIntoHistory() {
            const iso = toRateDateIso(liveDate);
            if (!iso) return;
            const current = {};
            Object.values(liveRates).forEach(r => {
                if (toRateDateIso(r.date) === iso && Number(r.rate) > 0) current[r.cc] = Number(r.rate);
            });
            mergeHistory(historicalRates, {[iso]:current});
            latestDate = Object.keys(historicalRates).sort().pop() || '';
        }
        async function refreshRecentHistoryIfNeeded() {
            const iso = toRateDateIso(liveDate);
            if (!iso) return;
            const previousDay = new Date(Date.parse(iso + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10);
            const prev = historicalRates[previousDay];
            if (!prev || Object.keys(liveRates).some(code => !(Number(prev[code]) > 0))) {
                try { mergeHistory(historicalRates, await fetchRecentHistory()); }
                catch (e) { console.warn('NBU recent history unavailable:', e.message); }
            }
            mergeLiveIntoHistory();
            if (fullHistoryReady) saveHistoryCache(historicalRates);
        }

        async function fetchRecentHistory() {
            const iso = toRateDateIso(liveDate);
            const end = iso ? new Date(iso + 'T00:00:00Z') : new Date();
            const start = new Date(end.getTime() - 7 * 86400000);
            const fmt = d => d.toISOString().slice(0, 10).replace(/-/g, '');
            const apiUrl = `${NBU_HISTORY}?start=${fmt(start)}&end=${fmt(end)}&sort=exchangedate&order=desc&json`;
            const res = await proxiedFetch(apiUrl);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            const history = {};
            (Array.isArray(data) ? data : []).forEach(item => {
                if (!item || !item.exchangedate || !item.cc) return;
                const [day, month, year] = item.exchangedate.split('.');
                const iso = `${year}-${month}-${day}`;
                if (!history[iso]) history[iso] = {};
                const units = Number(item.units) > 0 ? Number(item.units) : 1;
                history[iso][item.cc] = item.rate / units;
            });
            return history;
        }

        async function loadWithConcurrency(items, limit, fn, onProgress) {
            let index = 0, done = 0; const total = items.length;
            const workers = Array(Math.min(limit, items.length)).fill(0).map(async () => {
                while (true) {
                    const i = index++; if (i >= items.length) return;
                    try { await fn(items[i], i); } catch (e) {}
                    done++; if (onProgress) onProgress(done, total);
                }
            });
            await Promise.all(workers);
        }

        async function loadHistoryNBU(silent = false) {
            const cached = loadHistoryCache();
            if (cached && Object.keys(cached).length > 0) {
                historicalRates = mergeHistory(cached, historicalRates);
                const dates = Object.keys(historicalRates).sort();
                latestDate = dates[dates.length - 1];
                fullHistoryReady = true;
                return;
            }

            for (const urlBase of [URLS_RAW.history, `${DATA_JSDELIVR}/nbu-history.json`]) {
                try {
                    const res = await fetchWithTimeout(`${urlBase}?t=${Date.now()}`, REQUEST_TIMEOUT, 1);
                    if (!res.ok) continue;
                    const json = await res.json();
                    if ((json.formatVersion || 1) < HISTORY_FORMAT_VERSION) continue;
                    const data = json.data || {};
                    if (Object.keys(data).length === 0) continue;
                    historicalRates = mergeHistory(data, historicalRates);
                    saveHistoryCache(historicalRates);
                    const dates = Object.keys(historicalRates).sort();
                    latestDate = dates[dates.length - 1] || '';
                    fullHistoryReady = true;
                    return;
                } catch (e) {}
            }

            await loadWithConcurrency(CURRENCIES, CONCURRENCY, async (code) => {
                const history = await fetchHistoryForCurrency(code.toLowerCase());
                Object.keys(history).forEach(date => {
                    if (!historicalRates[date]) historicalRates[date] = {};
                    Object.assign(historicalRates[date], history[date]);
                });
            }, silent ? null : (done, total) => {
                setStatus(t('status_loading_n', {n: done, total}), 'loading');
            });
            saveHistoryCache(historicalRates);
            const dates = Object.keys(historicalRates).sort();
            latestDate = dates[dates.length - 1] || '';
            fullHistoryReady = true;
        }

        async function loadAll() {
            if (initialLoadPromise) return initialLoadPromise;
            initialLoadPromise = loadAllInternal();
            try { return await initialLoadPromise; } finally { initialLoadPromise = null; }
        }
        async function loadAllInternal() {
            const container = $('#current-rates');
            setStatus(t('status_loading'), 'loading');

            // Lower-page modules are independent of the converter; let the initial
            // screen paint first on slow phones without losing any functionality.
            const loadSecondarySections = () => { loadCrypto(); initBankCarousel(); };
            if ('requestIdleCallback' in window) {
                requestIdleCallback(loadSecondarySections, { timeout: 1300 });
            } else {
                setTimeout(loadSecondarySections, 100);
            }

            const saved = cachedSnapshot('nbu');
            const stale = normalizeNbuSnapshot(saved?.data, saved?.updatedAt);
            if (stale) {
                if (!liveSyncedAt) liveSyncedAt = dataTimestamp(saved?.timestamp);
                if (isNewerNbu(stale, normalizeNbuSnapshot(Object.values(liveRates), liveUpdatedAt))) applyNbuSnapshot(stale);
                if (Object.keys(liveRates).length > 0) {
                    const cachedHistory = loadHistoryCache();
                    if (cachedHistory && Object.keys(cachedHistory).length > 0) {
                        historicalRates = cachedHistory;
                        fullHistoryReady = true;
                        const dates = Object.keys(historicalRates).sort();
                        latestDate = dates[dates.length - 1];
                    }
                    renderCards(liveRates);
                    initConverter(liveRates);
                    fxRefreshAll();
                }
            }

            try {
                updateLiveStatus('loading');
                await loadLiveRates('nbu');
                updateLiveStatus();
                if (Object.keys(liveRates).length === 0) throw new Error('Empty');

                renderCards(liveRates);
                initConverter(liveRates);
                await refreshRecentHistoryIfNeeded();
                renderCards(liveRates);
                fxRefreshAll(); if (!liveFromCache) fxCheckAlert();

                updateLiveStatus();

                if (!fullHistoryReady) {
                    if (!historyLoading) {
                        historyLoading = true;
                        loadHistoryNBU(true)
                            .then(async () => {
                                await refreshRecentHistoryIfNeeded();
                                renderChart();
                                fxUpdateHistoric();
                                renderCards(liveRates);
                                updateLiveStatus();
                            })
                            .catch(() => { renderChart(); })
                            .finally(() => { historyLoading = false; });
                    }
                } else {
                    renderChart();
                    renderCards(liveRates);
                }
            } catch (err) {
                updateLiveStatus();
                if (Object.keys(liveRates).length > 0) return;
                liveFromCache = true; updateLiveStatus('error');
                container.innerHTML = `<p style="color:var(--negative);grid-column:1/-1;text-align:center;padding:20px;">${t('status_error')}<br><small style="opacity:0.7;">${err.message}</small></p>`;
            }
        }

        function renderCards(rates) {
            const container = $('#current-rates');
            const allDates = Object.keys(historicalRates).filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)).sort();
            const rateDateIso = toRateDateIso(liveDate);
            const prevDate = allDates.filter(date => rateDateIso && date < rateDateIso).pop();
            const prevRates = prevDate ? historicalRates[prevDate] : null;

            let html = ''; const dec = currentDecimals();
            const eps = 0.5 * Math.pow(10, -dec);
            CURRENCIES.forEach(code => {
                const item = rates[code]; if (!item) return;
                let direction = 'flat', delta = null, symbol = '●', label = 'Без змін', text = (0).toFixed(dec);
                if (prevRates && Number(prevRates[code]) > 0 && Number(item.rate) > 0 &&
                    (!item.date || toRateDateIso(item.date) === rateDateIso)) {
                    delta = Number(item.rate) - Number(prevRates[code]);
                    if (delta > eps)       { direction='up';   symbol='▲'; label='Зростання'; text='+'+delta.toFixed(dec); }
                    else if (delta < -eps) { direction='down'; symbol='▼'; label='Падіння';   text=delta.toFixed(dec); }
                }
                const rateClass = direction === 'up' ? 'up' : direction === 'down' ? 'down' : '';
                html += `<div class="rate-card ${code === currentCurrency ? 'active' : ''}" data-currency="${code}">
                    <div class="rate-card-head">${flagHtml(code)}<span class="rate-code">${code}</span></div>
                    <div class="rate-name">${currencyName(code)}</div>
                    <div class="rate-value ${rateClass}">${formatNumber(item.rate, dec)} ₴</div>
                    ${direction !== 'flat' ? `<div class="rate-change ${direction}"><span>${symbol}</span><span>${text}</span><span class="change-label">${label}</span></div>` : ''}
                </div>`;
            });
            container.innerHTML = html;
            container.querySelectorAll('.rate-card').forEach(card => {
                card.addEventListener('click', () => {
                    currentCurrency = card.dataset.currency;
                    container.querySelectorAll('.rate-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    renderChart();
                });
            });
        }

        // =============== BANK CAROUSEL ===============
        // Improve the original transparent-logo processing without changing source assets.
        const BANK_OPTIMIZED = {"privat":{"light":{"src":"bank/optimized/privat-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/privat-light.png","classes":"full-bleed"}},"mono":{"light":{"src":"bank/optimized/mono-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/mono-light.png","classes":"full-bleed"}},"oschad":{"light":{"src":"bank/optimized/oschad-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/oschad-light.png","classes":"full-bleed"}},"pumb":{"light":{"src":"bank/optimized/pumb-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/pumb-light.png","classes":"full-bleed"}},"raif":{"light":{"src":"bank/optimized/raif-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/raif-light.png","classes":"full-bleed"}},"ukrsib":{"light":{"src":"bank/optimized/ukrsib-light.png","classes":""},"dark":{"src":"bank/optimized/ukrsib-dark.png","classes":""}},"sense":{"light":{"src":"bank/optimized/sense-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/sense-light.png","classes":"full-bleed"}},"otp":{"light":{"src":"bank/optimized/otp-light.png","classes":""},"dark":{"src":"bank/optimized/otp-dark.png","classes":""}},"ukrexim":{"light":{"src":"bank/optimized/ukrexim-light.png","classes":""},"dark":{"src":"bank/optimized/ukrexim-dark.png","classes":""}},"ukrgas":{"light":{"src":"bank/optimized/ukrgas-light.png","classes":""},"dark":{"src":"bank/optimized/ukrgas-dark.png","classes":""}},"a-bank":{"light":{"src":"bank/optimized/a-bank-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/a-bank-light.png","classes":"full-bleed"}},"kredo":{"light":{"src":"bank/optimized/kredo-light.png","classes":""},"dark":{"src":"bank/optimized/kredo-dark.png","classes":""}},"tas":{"light":{"src":"bank/optimized/tas-light.png","classes":"is-rect-card"},"dark":{"src":"bank/optimized/tas-light.png","classes":"is-rect-card"}},"credit-agricole":{"light":{"src":"bank/optimized/credit-agricole-light.png","classes":""},"dark":{"src":"bank/optimized/credit-agricole-dark.png","classes":""}},"pinbank":{"light":{"src":"bank/optimized/pinbank-light.png","classes":""},"dark":{"src":"bank/optimized/pinbank-dark.png","classes":""}},"procredit":{"light":{"src":"bank/optimized/procredit-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/procredit-light.png","classes":"full-bleed"}},"pravex":{"light":{"src":"bank/optimized/pravex-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/pravex-light.png","classes":"full-bleed"}},"idea":{"light":{"src":"bank/optimized/idea-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/idea-light.png","classes":"full-bleed"}},"piraeus":{"light":{"src":"bank/optimized/piraeus-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/piraeus-light.png","classes":"full-bleed"}},"universal":{"light":{"src":"bank/optimized/universal-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/universal-light.png","classes":"full-bleed"}},"pivdenny":{"light":{"src":"bank/optimized/pivdenny-light.png","classes":""},"dark":{"src":"bank/optimized/pivdenny-dark.png","classes":""}},"credit-dnipro":{"light":{"src":"bank/optimized/credit-dnipro-light.png","classes":""},"dark":{"src":"bank/optimized/credit-dnipro-dark.png","classes":""}},"mtb":{"light":{"src":"bank/optimized/mtb-light.png","classes":"is-rect-card"},"dark":{"src":"bank/optimized/mtb-light.png","classes":"is-rect-card"}},"vostok":{"light":{"src":"bank/optimized/vostok-light.png","classes":""},"dark":{"src":"bank/optimized/vostok-dark.png","classes":""}},"accord":{"light":{"src":"bank/optimized/accord-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/accord-light.png","classes":"full-bleed"}},"lviv":{"light":{"src":"bank/optimized/lviv-light.png","classes":""},"dark":{"src":"bank/optimized/lviv-dark.png","classes":""}},"globus":{"light":{"src":"bank/optimized/globus-light.png","classes":""},"dark":{"src":"bank/optimized/globus-dark.png","classes":""}},"alliance":{"light":{"src":"bank/optimized/alliance-light.png","classes":""},"dark":{"src":"bank/optimized/alliance-dark.png","classes":""}},"industrial":{"light":{"src":"bank/optimized/industrial-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/industrial-light.png","classes":"full-bleed"}},"radabank":{"light":{"src":"bank/optimized/radabank-light.png","classes":""},"dark":{"src":"bank/optimized/radabank-dark.png","classes":""}},"mib":{"light":{"src":"bank/optimized/mib-light.png","classes":""},"dark":{"src":"bank/optimized/mib-dark.png","classes":""}},"asvio":{"light":{"src":"bank/optimized/asvio-light.png","classes":""},"dark":{"src":"bank/optimized/asvio-dark.png","classes":""}},"komin":{"light":{"src":"bank/optimized/komin-light.png","classes":""},"dark":{"src":"bank/optimized/komin-dark.png","classes":""}},"krystal":{"light":{"src":"bank/optimized/krystal-light.png","classes":""},"dark":{"src":"bank/optimized/krystal-dark.png","classes":""}},"agroprosperis":{"light":{"src":"bank/optimized/agroprosperis-light.png","classes":""},"dark":{"src":"bank/optimized/agroprosperis-dark.png","classes":""}},"clearing":{"light":{"src":"bank/optimized/clearing-light.png","classes":""},"dark":{"src":"bank/optimized/clearing-dark.png","classes":""}},"poltava":{"light":{"src":"bank/optimized/poltava-light.png","classes":""},"dark":{"src":"bank/optimized/poltava-dark.png","classes":""}},"polikom":{"light":{"src":"bank/optimized/polikom-light.png","classes":""},"dark":{"src":"bank/optimized/polikom-dark.png","classes":""}},"unex":{"light":{"src":"bank/optimized/unex-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/unex-light.png","classes":"full-bleed"}},"altbank":{"light":{"src":"bank/optimized/altbank-light.png","classes":""},"dark":{"src":"bank/optimized/altbank-dark.png","classes":""}},"sky":{"light":{"src":"bank/optimized/sky-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/sky-light.png","classes":"full-bleed"}},"ukrcapital":{"light":{"src":"bank/optimized/ukrcapital-light.png","classes":"full-bleed"},"dark":{"src":"bank/optimized/ukrcapital-light.png","classes":"full-bleed"}},"bank34":{"light":{"src":"bank/optimized/bank34-light.png","classes":""},"dark":{"src":"bank/optimized/bank34-dark.png","classes":""}},"avangard":{"light":{"src":"bank/optimized/avangard-light.png","classes":"is-rect-card"},"dark":{"src":"bank/optimized/avangard-light.png","classes":"is-rect-card"}},"bizbank":{"light":{"src":"bank/optimized/bizbank-light.png","classes":""},"dark":{"src":"bank/optimized/bizbank-dark.png","classes":""}},"metabank":{"light":{"src":"bank/optimized/metabank-light.png","classes":""},"dark":{"src":"bank/optimized/metabank-dark.png","classes":""}},"oksi":{"light":{"src":"bank/optimized/oksi-light.png","classes":""},"dark":{"src":"bank/optimized/oksi-dark.png","classes":""}},"grant":{"light":{"src":"bank/optimized/grant-light.png","classes":""},"dark":{"src":"bank/optimized/grant-dark.png","classes":""}},"family":{"light":{"src":"bank/optimized/family-light.png","classes":""},"dark":{"src":"bank/optimized/family-dark.png","classes":""}},"trust-capital":{"light":{"src":"bank/optimized/trust-capital-light.png","classes":""},"dark":{"src":"bank/optimized/trust-capital-dark.png","classes":""}}};
        function bankLogoAsset(bank){return BANK_OPTIMIZED[bank.id]?.[document.documentElement.dataset.scheme==='dark'?'dark':'light']||{src:bank.logo,classes:bank.fullBleed?'full-bleed':''};}
        window.__checkBankLogo = function(){};

        function normalizeBankData(bankId, parsed) {
            if (!parsed) return null;
            if (Array.isArray(parsed)) {
                const out = {};
                if (bankId === 'privat') {
                    parsed.forEach(item => {
                        let cc = String(item.ccy || '').toUpperCase();
                        if (cc === 'PLZ') cc = 'PLN';
                        if (CARD_RATE_ORDER.includes(cc)) {
                            out[cc] = { buy: Number(item.buy), sell: Number(item.sale) };
                        }
                    });
                } else if (bankId === 'mono') {
                    const ISO = { 840: 'USD', 978: 'EUR', 826: 'GBP', 985: 'PLN' };
                    parsed.forEach(item => {
                        if (item.currencyCodeB !== 980) return;
                        const cc = ISO[item.currencyCodeA];
                        if (!cc) return;
                        const buy = item.rateBuy;
                        const sell = item.rateSell;
                        if (buy != null || sell != null) {
                            out[cc] = { buy: Number(buy), sell: Number(sell) };
                        }
                    });
                }
                return Object.keys(out).length ? out : null;
            }
            return (typeof parsed === 'object') ? parsed : null;
        }

        async function getAvailableBankIds() {
            const cacheK = CACHE_KEY_PREFIX + 'bank_ids_v1';
            try {
                const raw = safeLS.getItem(cacheK);
                if (raw) {
                    const c = JSON.parse(raw);
                    if (Date.now() - c.timestamp < 5 * 60 * 1000 && Array.isArray(c.ids) && c.ids.length > 0) {
                        return new Set(c.ids);
                    }
                }
            } catch {}

            const saveIds = (ids) => {
                try { safeLS.setItem(cacheK, JSON.stringify({ timestamp: Date.now(), ids })); } catch {}
                return new Set(ids);
            };

            try {
                const res = await fetchWithTimeout('https://api.github.com/repos/He-Trogati-Mne/nbu-rate-data/contents/data?ref=main', 8000, 0);
                if (res.ok) {
                    const list = await res.json();
                    if (Array.isArray(list)) {
                        const ids = list
                            .filter(it => it && typeof it.name === 'string' && it.name.endsWith('.json'))
                            .map(it => it.name.slice(0, -5));
                        if (ids.length > 0) return saveIds(ids);
                    }
                }
            } catch {}

            try {
                const res = await fetchWithTimeout('https://data.jsdelivr.com/v1/packages/gh/He-Trogati-Mne/nbu-rate-data@main?structure=flat', 8000, 0);
                if (res.ok) {
                    const json = await res.json();
                    const ids = (json.files || [])
                        .map(f => String(f.name || ''))
                        .filter(n => n.startsWith('/data/') && n.endsWith('.json'))
                        .map(n => n.slice(6, -5));
                    if (ids.length > 0) return saveIds(ids);
                }
            } catch {}

            return new Set(BANKS_CONFIG.map(b => b.id));
        }

        async function fetchBankData(bank, previous = null, previousMeta = {}, health = null) {
            const h=health?.data?.[bank.id];
            const rejected=at=>dataTimestamp(h?.updatedAt)>0 && dataTimestamp(h.updatedAt)===dataTimestamp(at) && (h.officialSource===false || h.status==='suspicious');
            if (rejected(previousMeta.updatedAt)) previous=null;
            const feeds = await fetchFeedCandidates(bank.id, 8000);
            const candidates = feeds.map(json => {
                if (/(^|[./])minfin\.com\.ua(?:[/:]|$)/i.test(json.source || '') || rejected(json.updatedAt)) return null;
                const data = normalizeBankData(bank.id, json.data || json);
                if (!data || !CARD_RATE_ORDER.some(c => Number(data[c]?.buy) > 0 && Number(data[c]?.sell) > 0)) return null;
                return {data, updatedAt:dataTimestamp(json.updatedAt), rateType:json.rateType || null, source:json.source || null};
            }).filter(Boolean);
            const best = chooseNewest(candidates);
            const oldStamp = dataTimestamp(previousMeta.updatedAt);
            if (best && (!previous || best.updatedAt >= oldStamp)) {
                bankMeta[bank.id] = {updatedAt:best.updatedAt, rateType:best.rateType, source:best.source, cached:false};
                return best.data;
            }
            if (previous) bankMeta[bank.id] = {...previousMeta, updatedAt:oldStamp, cached:true};
            return previous;
        }

        function bankSyncLabel(id) {
            const m=bankMeta[id]||{}, at=dataTimestamp(m.updatedAt), en=currentLang==='en';
            const saved=m.cached || !at || Date.now()-at>7200000;
            const label=saved?(en?'Saved data':'Збережені дані'):(en?'Last collection':'Останній збір');
            return label+' · '+(at?new Date(at).toLocaleString(en?'en-GB':'uk-UA',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Kyiv'}):'—');
        }
        function renderBankSlide(bank, data) {
            const name = bankDisplayName(bank);
            const valid = value => value != null && value !== '' && Number.isFinite(Number(value)) && Number(value) > 0;
            if (!CARD_RATE_ORDER.some(c => valid(data?.[c]?.buy) || valid(data?.[c]?.sell))) return '';
            const cardsHtml = CARD_RATE_ORDER.map(c => {
                const r = data?.[c];
                const hasBuy = valid(r?.buy), hasSell = valid(r?.sell);
                const missing = !hasBuy && !hasSell;
                const buy = hasBuy ? Number(r.buy).toFixed(currentDecimals()) : t('bank_unknown_rate');
                const sell = hasSell ? Number(r.sell).toFixed(currentDecimals()) : t('bank_unknown_rate');
                const cracks = missing ? `<svg class="bank-glass-cracks" viewBox="0 0 160 112" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".85" stroke-linecap="round" stroke-linejoin="round"><path d="M160 6L130 21 117 45 91 58 77 82 45 93 23 112M117 45L142 55 151 80 160 88M117 45L104 22 78 12 65 0M117 45L125 72 112 94 116 112M91 58L60 43 31 48 0 32M77 82L85 103 83 112M130 21L145 27 160 23M60 43L49 16 31 0M45 93L14 90 0 98"/><path opacity=".45" d="M117 45L133 40 142 55 125 72 91 58 104 22 117 45M60 43L77 82 45 93 31 48Z"/></g><path d="M117 45L142 55 125 72Z M77 82L45 93 60 43Z" fill="currentColor" opacity=".09"/></svg>` : '';
                return `
                    <div class="bank-rate-card${missing ? ' is-unavailable' : ''}">
                        ${cracks}
                        <div class="bank-rate-head">${flagHtml(c, 'rate-flag')}<span>${c}</span></div>
                        <div class="rate-bs">
                            <div class="bs-row"><span class="bs-label" data-i18n="buy_label">${t('buy_label')}</span><span class="bs-val ${hasBuy ? 'buy' : 'is-missing'}" ${hasBuy ? '' : 'data-i18n="bank_unknown_rate"'}>${buy}</span></div>
                            <div class="bs-row"><span class="bs-label" data-i18n="sell_label">${t('sell_label')}</span><span class="bs-val ${hasSell ? 'sell' : 'is-missing'}" ${hasSell ? '' : 'data-i18n="bank_unknown_rate"'}>${sell}</span></div>
                        </div>
                        ${missing ? `<span class="bank-rate-unavailable-note"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 4.5v4M8 11v.5"/></svg><span data-i18n="no_data_short">${t('no_data_short')}</span></span>` : ''}
                    </div>`;
            }).join('');

            const asset=bankLogoAsset(bank);
            const wrapClass = 'bank-logo-wrap'+(asset.classes.includes('full-bleed')?' is-full-bleed':'');
            const imgClass = 'bank-slide-logo '+asset.classes;
            const presetAttr = bank.fullBleed ? ' data-preset-full-bleed="1"' : '';
            return `
                <div class="bank-slide" data-bank-id="${bank.id}">
                    <div class="bank-slide-inner">
                        <div class="bank-slide-header">
                            <div class="${wrapClass}">
                                <span class="bank-logo-fallback">${bank.letter || 'Б'}</span>
                                <img class="${imgClass}" src="${asset.src}" alt="${name}" width="64" height="64"
                                     data-bank-id="${bank.id}"${presetAttr}
                                     loading="lazy" decoding="async"
                                     onerror="this.style.display='none';if(this.previousElementSibling)this.previousElementSibling.style.display='flex';">
                            </div>
                            <div style="min-width:0;text-align:center"><span class="bank-slide-name">${name}</span><small class="bank-slide-sync" style="display:block;font-size:11px;font-weight:400;color:var(--text-muted)">${bankSyncLabel(bank.id)}</small></div>
                        </div>
                        <div class="bank-slide-rates">${cardsHtml}</div>
                    </div>
                </div>`;
        }

        async function initBankCarousel() {
            if (bankLoadPromise) return bankLoadPromise;
            bankLoadPromise = refreshBankCarousel();
            try { return await bankLoadPromise; } finally { bankLoadPromise = null; }
        }
        async function refreshBankCarousel() {
            const track = $('#bank-track');
            if (!track) return;

            if (!bankCarouselState.total) track.innerHTML = `<div class="bank-slide active"><div class="bank-slide-inner"><div class="bank-slide-header"><div class="skeleton-shape" style="width:54px;height:54px;border-radius:14px;"></div><div class="skeleton-shape" style="width:140px;height:18px;"></div></div><div class="bank-slide-rates"><div class="skeleton-shape" style="height:82px;"></div><div class="skeleton-shape" style="height:82px;"></div></div></div></div>`;

            const [availableIds, healthFeeds] = await Promise.all([getAvailableBankIds(),fetchFeedCandidates('bank-health',8000)]);
            const health=healthFeeds.filter(x=>dataTimestamp(x.checkedAt)).sort((a,b)=>dataTimestamp(b.checkedAt)-dataTimestamp(a.checkedAt))[0]||null;
            let bankCache = null;
            try { bankCache = JSON.parse(safeLS.getItem('nbu_site_banks_cache_v2') || 'null'); } catch (_) {}
            const activeBanks = BANKS_CONFIG.filter(b => availableIds.has(b.id) || bankCache?.banks?.[b.id] || fxBankData[b.id]);
            const results = [];
            await loadWithConcurrency(activeBanks, 6, async bank => {
                const previous = fxBankData[bank.id] || bankCache?.banks?.[bank.id] || null;
                const meta = bankMeta[bank.id] || bankCache?.meta?.[bank.id] || {};
                const data = await fetchBankData(bank, previous, meta, health);
                if (data) results.push({bank,data});
            });
            const visible = activeBanks.map(bank => results.find(r => r.bank.id === bank.id)).filter(r => r && CARD_RATE_ORDER.some(c => r.data[c]));
            fxBankData = Object.fromEntries(visible.map(r => [r.bank.id, r.data]));
            if (visible.length) safeLS.setItem('nbu_site_banks_cache_v2', JSON.stringify({timestamp:Date.now(), banks:fxBankData, meta:bankMeta}));
            const count = $('#fx-bank-count');
            if (count) {
                delete count.dataset.cachedAt;
                const cachedCount = visible.filter(r => bankMeta[r.bank.id]?.cached).length;
                count.dataset.cachedCount = String(cachedCount);
            }
            lastBankPoll = Date.now();
            fxDrawBanks();

            if (visible.length === 0) {
                track.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);">${t('no_data')}</div>`;
                return;
            }

            track.innerHTML = visible.map(r => renderBankSlide(r.bank, r.data)).join('');
            bankCarouselState.total = visible.length;
            if (bankCarouselState.current >= visible.length) bankCarouselState.current = 0;

            const dots = $('#bank-dots');
            if (dots) {
                dots.innerHTML = visible.map((r, i) =>
                    `<button class="carousel-dot${i === bankCarouselState.current ? ' active' : ''}" data-index="${i}" aria-label="${bankDisplayName(r.bank)}"></button>`
                ).join('');
            }

            setActiveSlide(bankCarouselState.current);
            startAutoplay();
        }

        function setActiveSlide(index) {
            const track = $('#bank-track');
            if (!track) return;

            bankCarouselState.current = index;
            const bankCounter = document.getElementById('bank-mobile-counter');
            if (bankCounter) {
                const label = currentLang === 'en' ? 'Bank' : 'Банк';
                bankCounter.textContent = `${label} ${index + 1} / ${bankCarouselState.total}`;
            }
            track.style.transform = `translateX(-${index * 100}%)`;

            track.querySelectorAll('.bank-slide').forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });

            $$('#bank-dots .carousel-dot').forEach((d, i) => {
                const isActive = i === index;
                d.classList.toggle('active', isActive);
                d.classList.remove('animating');
                if (isActive && bankCarouselState.autoplay) {
                    // Restart progress without synchronous layout reads.
                    requestAnimationFrame(() => requestAnimationFrame(() => {
                        if (d.isConnected && d.classList.contains('active') && bankCarouselState.autoplay) d.classList.add('animating');
                    }));
                }
            });
        }

        function goToBank(index) {
            if (bankCarouselState.total === 0) return;
            const total = bankCarouselState.total;
            setActiveSlide(((index % total) + total) % total);
        }
        function nextBank() { goToBank(bankCarouselState.current + 1); }
        function prevBank() { goToBank(bankCarouselState.current - 1); }

        function startAutoplay() {
            stopAutoplay();
            if (!bankCarouselState.autoplay) return;

            const activeDot = $('#bank-dots .carousel-dot.active');
            if (activeDot) {
                activeDot.classList.remove('animating');
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    if (activeDot.isConnected && activeDot.classList.contains('active') && bankCarouselState.autoplay) activeDot.classList.add('animating');
                }));
            }

            bankCarouselState.timer = setInterval(() => {
                if (!bankCarouselState.paused) nextBank();
            }, CAROUSEL_INTERVAL);
        }

        function stopAutoplay() {
            if (bankCarouselState.timer) { clearInterval(bankCarouselState.timer); bankCarouselState.timer = null; }
            $$('#bank-dots .carousel-dot').forEach(d => d.classList.remove('animating'));
        }

        function restartAutoplay() { if (bankCarouselState.autoplay) startAutoplay(); }

        function toggleAutoplay() {
            bankCarouselState.autoplay = !bankCarouselState.autoplay;
            const btn = $('#bank-autoplay-btn');
            if (btn) {
                btn.classList.toggle('active', bankCarouselState.autoplay);
                btn.setAttribute('aria-pressed', String(bankCarouselState.autoplay));
                const pause = btn.querySelector('.icon-pause');
                const play  = btn.querySelector('.icon-play');
                if (pause) pause.style.display = bankCarouselState.autoplay ? '' : 'none';
                if (play)  play.style.display  = bankCarouselState.autoplay ? 'none' : '';
            }
            if (bankCarouselState.autoplay) startAutoplay(); else stopAutoplay();
        }

        function setupBankCarouselEvents() {
            $('#bank-prev')?.addEventListener('click', () => { prevBank(); restartAutoplay(); });
            $('#bank-next')?.addEventListener('click', () => { nextBank(); restartAutoplay(); });
            $('#bank-autoplay-btn')?.addEventListener('click', toggleAutoplay);
            $('#bank-dots')?.addEventListener('click', (e) => {
                const dot = e.target.closest('.carousel-dot');
                if (!dot) return;
                const idx = parseInt(dot.dataset.index, 10);
                if (!isNaN(idx)) { goToBank(idx); restartAutoplay(); }
            });
            const carousel = $('#bank-carousel');
            carousel?.addEventListener('mouseenter', () => { bankCarouselState.paused = true; });
            carousel?.addEventListener('mouseleave', () => { bankCarouselState.paused = false; });
            const viewport = carousel?.querySelector('.bank-carousel-viewport');
            if (viewport) {
                let startX = 0;
                viewport.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
                viewport.addEventListener('touchend', e => {
                    const dx = e.changedTouches[0].clientX - startX;
                    if (Math.abs(dx) > 50) { if (dx < 0) nextBank(); else prevBank(); restartAutoplay(); }
                }, { passive: true });
            }
        }
        function updateBankNamesForLanguage() {
            $$('#bank-track .bank-slide').forEach(slide => {
                const bank = BANKS_CONFIG.find(b => b.id === slide.dataset.bankId);
                const nameEl = slide.querySelector('.bank-slide-name');
                if (nameEl && bank) nameEl.textContent = bankDisplayName(bank);
                const syncEl=slide.querySelector('.bank-slide-sync'); if(syncEl&&bank)syncEl.textContent=bankSyncLabel(bank.id);
            });
        }

        // =============== CRYPTO ===============
        function normalizeCryptoData(raw) {
            if (!raw) return [];
            let list = [];
            if (Array.isArray(raw)) {
                list = raw;
            } else if (typeof raw === 'object') {
                if (Array.isArray(raw.data?.coins)) list = raw.data.coins;
                else if (Array.isArray(raw.data)) list = raw.data;
                else if (Array.isArray(raw.coins)) list = raw.coins;
                else if (Array.isArray(raw.rates)) list = raw.rates;
                else if (raw.data && typeof raw.data === 'object') {
                    list = Object.entries(raw.data).map(([key, val]) =>
                        (val && typeof val === 'object') ? { symbol: val.symbol || key, name: val.name || key, ...val } : null
                    ).filter(Boolean);
                } else {
                    list = Object.entries(raw).map(([key, val]) =>
                        (val && typeof val === 'object') ? { symbol: val.symbol || key, name: val.name || key, ...val } : null
                    ).filter(Boolean);
                }
            }
            return list.map(c => {
                if (!c || typeof c !== 'object') return null;
                const sym = String(c.symbol || c.code || '').toUpperCase();
                if (!sym || HIDDEN_CRYPTO.has(sym)) return null;
                const price = Number(c.current_price ?? c.price ?? c.usd ?? c.rate ?? 0);
                const change24h = Number(c.price_change_percentage_24h ?? c.change24h ?? c.usd_24h_change ?? 0) || 0;
                const hist = {};
                if (Array.isArray(c.sparkline_in_7d?.price)) {
                    const now = Date.now();
                    c.sparkline_in_7d.price.forEach((p, i) => {
                        const d = new Date(now - (c.sparkline_in_7d.price.length - i) * 3600 * 1000).toISOString().slice(0, 10);
                        const numVal = Number(p);
                        if (!isNaN(numVal)) hist[d] = numVal;
                    });
                }
                if (c.history && typeof c.history === 'object') {
                    Object.entries(c.history).forEach(([k, v]) => {
                        const numVal = Number(v);
                        if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isFinite(numVal) && numVal > 0) hist[k] = numVal;
                    });
                }
                return {
                    symbol: sym,
                    name: c.name || sym,
                    image: c.image || null,
                    price,
                    change24h,
                    history: hist
                };
            }).filter(c => c && !isNaN(c.price) && c.price > 0);
        }

        async function loadCrypto() {
            if (cryptoLoadPromise) return cryptoLoadPromise;
            cryptoLoadPromise = refreshCrypto();
            try { return await cryptoLoadPromise; } finally { cryptoLoadPromise = null; }
        }
        async function refreshCrypto() {
            const grid = $('#crypto-grid'); if (!grid) return;
            try {
                await loadCryptoLogos();
                const cached = cachedSnapshot('crypto');
                const local = normalizeCryptoData(cached?.data);
                if (!cryptoCoins.length && local.length) {
                    cryptoCoins = local; cryptoUpdatedAt = dataTimestamp(cached?.updatedAt);
                    cryptoDataMap = Object.fromEntries(local.map(c => [c.symbol,c]));
                    renderCryptoCards();
                }
                const feeds = await fetchFeedCandidates('crypto');
                const candidates = feeds.map(raw => ({raw, updatedAt:dataTimestamp(raw.updatedAt), historyAt:dataTimestamp(raw.historyCheckedAt), normalized:normalizeCryptoData(raw)})).filter(x => x.normalized.length);
                const best = chooseNewest(candidates);
                if (best) {
                    // Quotes and backfill are independent. A mirror with a newer
                    // quote can have older history; never discard missing dates.
                    const previous = cryptoCoins.length ? cryptoCoins : local;
                    const historyBySymbol = new Map();
                    const addHistory = coins => coins.forEach(c => {
                        const prior = historyBySymbol.get(c.symbol) || {};
                        historyBySymbol.set(c.symbol, {...prior, ...c.history});
                    });
                    addHistory(previous);
                    [...candidates].sort((a,b)=>(a.historyAt || a.updatedAt)-(b.historyAt || b.updatedAt)).forEach(x=>addHistory(x.normalized));
                    const quoteBase = !cryptoCoins.length || best.updatedAt >= cryptoUpdatedAt ? best.normalized : cryptoCoins;
                    const quoteDate = new Date(Math.max(cryptoUpdatedAt || 0,best.updatedAt || 0)).toISOString().slice(0,10);
                    cryptoCoins = quoteBase.map(c=>{
                        const history = {...historyBySymbol.get(c.symbol)};
                        // The newest quote owns its current-day observation.
                        if (c.history?.[quoteDate] > 0) history[quoteDate] = c.history[quoteDate];
                        return {...c,history};
                    });
                    cryptoUpdatedAt = Math.max(cryptoUpdatedAt || 0,best.updatedAt);
                    saveLiveCache('crypto', {coins:cryptoCoins}, cryptoUpdatedAt);
                } else if (!cryptoCoins.length) {
                    // Preserve the existing public crypto fallback only when the repository and local cache are unavailable.
                    const res = await fetchWithTimeout(COINGECKO_FALLBACK, REQUEST_TIMEOUT, 0);
                    if (res.ok) cryptoCoins = normalizeCryptoData(await res.json());
                }
                if (!cryptoCoins.length) throw new Error('Empty crypto data');
                cryptoDataMap = Object.fromEntries(cryptoCoins.map(c => [c.symbol,c]));
                if (activeCryptoCoin && cryptoDataMap[activeCryptoCoin.symbol]) activeCryptoCoin = cryptoDataMap[activeCryptoCoin.symbol];
                renderCryptoCards();
                if ($('#crypto-chart-modal')?.classList.contains('visible')) renderCryptoModalChart();
                fxUpdateMulti(); fxDrawSpread();
            } catch (e) {
                console.warn('[Crypto]', e);
                if (!cryptoCoins.length) grid.innerHTML = `<p style="color:var(--negative);grid-column:1/-1;text-align:center;padding:20px;">${t('load_error')}</p>`;
            }
        }

        function getCryptoHistoryForPeriod(coin, period) {
            const full = coin.history || {}; const dates = Object.keys(full).sort();
            if (dates.length === 0) return {};
            if (period === '1D') {
                const lastDates = dates.slice(-3);
                const out = {};
                lastDates.forEach(d => { out[d] = full[d]; });
                return out;
            }
            const now = new Date(); const start = new Date(now);
            switch (period) {
                case '5D': start.setDate(now.getDate() - 5); break;
                case '7D': start.setDate(now.getDate() - 7); break;
                case '1M': start.setMonth(now.getMonth() - 1); break;
                case '6M': start.setMonth(now.getMonth() - 6); break;
                case '1Y': start.setFullYear(now.getFullYear() - 1); break;
                case '5Y': start.setFullYear(now.getFullYear() - 5); break;
                default: return full;
            }
            const startStr = start.toISOString().slice(0, 10); const filtered = {};
            dates.forEach(d => { if (d >= startStr) filtered[d] = full[d]; });
            return filtered;
        }

        function renderCryptoCards() {
            const grid = $('#crypto-grid');
            if (!grid || cryptoCoins.length === 0) return;
            let html = '';
            cryptoCoins.forEach(c => {
                const ch = Number(c.change24h) || 0;
                const changeClass = ch > 0 ? 'up' : ch < 0 ? 'down' : '';
                const symbol = ch > 0 ? '▲' : ch < 0 ? '▼' : '●';
                const color = chartAccessibleColor(CRYPTO_COLORS[c.symbol] || '#F7931A');
                const history = getCryptoHistoryForPeriod(c, currentCryptoPeriod);
                const spark = sparklineSvg(history, color);
                html += `<div class="crypto-market-shell"><div class="rate-card crypto-card" tabindex="0" role="button" data-crypto="${c.symbol}">
                    <div class="rate-card-head">${cryptoIcon(c.symbol, c.image)}<span class="rate-code">${c.symbol}</span></div>
                    <div class="rate-name">${c.name}</div>
                    <div class="rate-value ${changeClass}">${formatCryptoUsd(c.price)}</div>
                    ${spark}
                    <div class="rate-change ${changeClass}"><span>${symbol}</span><span>${ch.toFixed(2)}%</span></div>
                </div><a class="market-stock-link crypto-buy-link" href="#crypto-exchanges" data-coin="${c.symbol}"><span>${currentLang === 'en' ? 'Buy on an exchange' : 'Купити на біржі'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h6v6m0-6-9 9M19 13v6H5V5h6"/></svg></a></div>`;
            });
            grid.innerHTML = html;
            grid.querySelectorAll('.crypto-card').forEach(card => {
                card.addEventListener('click', () => {
                    const symbol = card.dataset.crypto; const coin = cryptoDataMap[symbol];
                    if (coin) openCryptoChart(coin);
                });
                card.addEventListener('keydown', event => {
                    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); card.click(); }
                });
            });
            grid.querySelectorAll('.crypto-buy-link').forEach(link => {
                link.addEventListener('click', event => {
                    event.preventDefault();
                    const target = $('#crypto-exchanges');
                    const label = $('#crypto-exchange-selection');
                    const coin = link.dataset.coin;
                    if (label) {
                        label.dataset.marketUk = 'Обрана монета: ' + coin + '. Перевірте її наявність на біржі.';
                        label.dataset.marketEn = 'Selected asset: ' + coin + '. Check its availability on the exchange.';
                        label.textContent = currentLang === 'en' ? label.dataset.marketEn : label.dataset.marketUk;
                    }
                    target?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
                });
            });
        }

        function openCryptoChart(coin) {
            activeCryptoCoin = coin;
            const totalDates = Object.keys(coin.history || {}).length;
            activeCryptoModalPeriod = totalDates > 90 ? '1Y' : 'MAX';
            $$('#crypto-modal-period-switcher .period-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.period === activeCryptoModalPeriod);
            });
            $('#crypto-chart-modal').classList.add('visible');
            renderCryptoModalChart();
        }

        function renderCryptoModalChart() {
            if(!chartLibrarySettled){if(!cryptoRenderQueued){cryptoRenderQueued=true;loadChartLibrary().then(()=>{cryptoRenderQueued=false;if($('#crypto-chart-modal')?.classList.contains('visible'))renderCryptoModalChart();});}return;}
            const coin = activeCryptoCoin;
            if (!coin) return;

            const title = $('#crypto-chart-title');
            const iconWrap = $('#crypto-chart-icon');
            const badge = $('#crypto-chart-badge');
            const stats = $('#crypto-chart-stats');
            const canvas = $('#cryptoChart');
            const ctx = canvas.getContext('2d');
            const cryptoLargeText = $('#crypto-chart-modal').classList.contains('crypto-text-large');
            const cryptoTickSize = cryptoLargeText ? 17 : 14;

            if (iconWrap) iconWrap.innerHTML = cryptoIcon(coin.symbol, coin.image);
            title.textContent = `${coin.name} (${coin.symbol}) — ${formatCryptoUsd(coin.price)}`;

            const history = getCryptoHistoryForPeriod(coin, activeCryptoModalPeriod);
            const dates = Object.keys(history).sort();
            const values = dates.map(d => history[d]);
            const coverage = $('#crypto-history-coverage');
            if (coverage) {
                const allDates = Object.keys(coin.history || {}).sort();
                const en = document.documentElement.lang === 'en';
                coverage.textContent = allDates.length
                    ? (en ? 'Available USD history: ' : 'Доступна історія USD: ') + formatDate(allDates[0]) + ' — ' + formatDate(allDates[allDates.length - 1]) + ' · ' + allDates.length.toLocaleString(en?'en-US':'uk-UA') + (en?' daily points':' денних точок') + (dates.length < 2 ? (en?' · Not enough data for this period':' · Недостатньо даних за цей період'):'')
                    : (en ? 'USD history unavailable' : 'Історія USD недоступна');
            }

            if (values.length >= 2 && values[0] > 0) {
                const first = values[0], last = values[values.length - 1];
                const pct = ((last - first) / first) * 100;
                const dir = pct > 0.01 ? 'up' : pct < -0.01 ? 'down' : 'flat';
                const sym = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '●';
                badge.className = `rate-change crypto-heading-change ${dir}`;
                badge.innerHTML = `<span>${sym}</span><span>${pct > 0 ? '+' : ''}${pct.toFixed(2)}%</span>`;
                badge.style.display = 'inline-flex';
            } else {
                badge.style.display = 'none';
            }

            if (values.length >= 1) {
                const minVal = Math.min(...values);
                const maxVal = Math.max(...values);
                stats.innerHTML = `<span><small>${t('min_label')}</small><strong>${formatCryptoUsd(minVal)}</strong></span><span><small>${t('max_label')}</small><strong>${formatCryptoUsd(maxVal)}</strong></span><span class="crypto-stat-now"><small>${t('current_label')}</small><strong>${formatCryptoUsd(coin.price)}</strong></span>`;
            } else {
                stats.innerHTML = '';
            }

            if (cryptoChartInstance) cryptoChartInstance.destroy();

            const color = chartAccessibleColor(CRYPTO_COLORS[coin.symbol] || '#1a73e8');
            const styles = getComputedStyle(document.documentElement);
            const textMuted = styles.getPropertyValue('--text-muted').trim() || '#5a6472';
            const borderCol = styles.getPropertyValue('--border').trim() || '#e1e5ea';
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 580);
            gradient.addColorStop(0, hexToRgba(color, 0.28));
            gradient.addColorStop(1, hexToRgba(color, 0));

            // MAX may only contain a few months of data. Showing MM.YYYY for
            // every day produces identical, crowded labels on small phones.
            const cryptoDateSpanDays = dates.length > 1
                ? (Date.parse(dates[dates.length - 1]) - Date.parse(dates[0])) / 86400000
                : 0;
            const labels = dates.map(d => {
                const [y, m, day] = d.split('-');
                return cryptoDateSpanDays > 370 ? `${m}.${y.slice(2)}` : `${day}.${m}`;
            });
            const cryptoPlotWidth = canvas.parentElement?.getBoundingClientRect().width || window.innerWidth;
            const cryptoMobileTicks = cryptoPlotWidth < 460 ? 3 : cryptoPlotWidth < 710 ? 4 : cryptoPlotWidth < 980 ? 6 : 9;
            const cryptoXAxisFont = cryptoPlotWidth < 460 ? (cryptoLargeText ? 13 : 12) : cryptoTickSize;

            cryptoChartInstance = new Chart(ctx, {
                type: 'line', plugins: [nbuPointerPlugin],
                data: {
                    labels,
                    datasets: [{
                        label: `${coin.symbol} / USD`,
                        data: values,
                        borderColor: color,
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.25,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: color,
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 3,
                        borderWidth: 2.5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    interaction: { mode: 'index', axis: 'x', intersect: false },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.88)',
                            padding: 12,
                            cornerRadius: 10,
                            displayColors: false,
                            callbacks: {
                                title: (items) => {
                                    const idx = items[0]?.dataIndex;
                                    return idx != null && dates[idx] ? formatDate(dates[idx]) : '';
                                },
                                label: (c) => formatCryptoUsd(c.parsed.y)
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: { color: borderCol, drawTicks: false },
                            border: { display: false },
                            ticks: {
                                color: textMuted,
                                font: { size: cryptoTickSize, weight: '600' },
                                padding: 12,
                                callback: (v) => formatCryptoUsd(v)
                            }
                        },
                        x: {
                            grid: { display: false },
                            border: { display: false },
                            ticks: {
                                color: textMuted,
                                font: { size: cryptoXAxisFont, weight: '600' },
                                autoSkip: true,
                                autoSkipPadding: cryptoPlotWidth < 460 ? 18 : 12,
                                maxTicksLimit: Math.min(cryptoMobileTicks, cryptoLargeText ? 6 : 9),
                                minRotation: 0,
                                maxRotation: 0,
                                padding: 10
                            }
                        }
                    }
                }
            });
        }

        function getFilteredData(period) {
            const dates = Object.keys(historicalRates).sort(); if (dates.length === 0) return dates;
            const now = new Date(); const start = new Date(now);
            switch (period) {
                case '1D': start.setDate(now.getDate() - 1); break; case '5D': start.setDate(now.getDate() - 5); break;
                case '1M': start.setMonth(now.getMonth() - 1); break; case '1Y': start.setFullYear(now.getFullYear() - 1); break;
                case '5Y': start.setFullYear(now.getFullYear() - 5); break; default: return dates;
            }
            const startStr = start.toISOString().slice(0, 10);
            return dates.filter(d => d >= startStr);
        }
        function chartAccessibleColor(original) {
            const root=document.documentElement;
            return root.dataset.a11yCvd==='true' ? (getComputedStyle(root).getPropertyValue('--a11y-up').trim() || original) : original;
        }
        // Use real canvas bounds, not stale CSS/flex dimensions, for pointer coordinates.
        const nbuPointerPlugin={id:'nbuPointerCoordinates',beforeEvent(chart,args){
            const ev=args.event, native=ev.native, r=chart.canvas.getBoundingClientRect();
            if(!native||!r.width||!r.height||ev.type==='mouseout')return;
            const p=native.touches?.[0]||native.changedTouches?.[0]||native;
            if(!Number.isFinite(p.clientX)||!Number.isFinite(p.clientY))return;
            ev.x=(p.clientX-r.left)*chart.width/r.width;
            ev.y=(p.clientY-r.top)*chart.height/r.height;
            const a=chart.chartArea;
            args.inChartArea=!!a&&ev.x>=a.left&&ev.x<=a.right&&ev.y>=a.top&&ev.y<=a.bottom;
        }};
        let chartDates=[],chartLibraryPromise=null,chartLibrarySettled=false;
        function loadChartLibrary(){if(chartLibraryPromise)return chartLibraryPromise;chartLibraryPromise=new Promise(resolve=>{const script=document.createElement('script');script.src='./chart.umd.min.js';script.async=true;const finish=()=>{chartLibrarySettled=true;if(typeof Chart?.register==='function')Chart.register(historicEventsPlugin);resolve();};script.onload=finish;script.onerror=finish;document.head.append(script);});return chartLibraryPromise;}
        let chartRenderQueued=false,cryptoRenderQueued=false;
        function renderChart() {
            if(!chartLibrarySettled){if(!chartRenderQueued){chartRenderQueued=true;loadChartLibrary().then(()=>{chartRenderQueued=false;renderChart();});}return;}
            const container = $('#chart-container'); if (!container) return;
            fxUpdateHistoric();
            let cv = container.querySelector('#rateChart');
            if (!cv) { container.innerHTML = '<canvas id="rateChart"></canvas>'; cv = container.querySelector('#rateChart'); }
            const ctx = cv.getContext('2d');
            // Avoid a completely blank graph when the historical feed is not ready.
            const chartNotice = (() => {
                let notice = container.querySelector('.fx-chart-notice');
                if(!notice){ notice=document.createElement('div');notice.className='fx-chart-notice';container.appendChild(notice); }
                return notice;
            })();
            const styles = getComputedStyle(document.documentElement);
            const textMuted = styles.getPropertyValue('--text-muted').trim() || '#5a6472';
            const borderCol = styles.getPropertyValue('--border').trim() || '#e1e5ea';

            const allDatesForPeriod = getFilteredData(currentPeriod);
            const points = allDatesForPeriod
                .map(d => ({ date: d, value: historicalRates[d]?.[currentCurrency] }))
                .filter(p => p.value != null && typeof p.value === 'number' && p.value > 0);

            if (points.length < 2) {
                chartNotice.textContent = currentLang === 'en'
                    ? 'Historical chart data is not available yet. Check the connection or switch the period.'
                    : 'Наразі немає даних для графіка. Перевірте з’єднання або змініть період.';
                chartNotice.classList.add('visible');
                if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
                ctx.clearRect(0, 0, cv.width, cv.height);
                ctx.font = '15px system-ui'; ctx.fillStyle = textMuted; ctx.textAlign = 'center';
                ctx.fillText(t('insufficient_data'), cv.width / 2, cv.height / 2);
                return;
            }

            chartNotice.classList.remove('visible');
            chartDates=points.map(p=>p.date);
            const labels = points.map(p => {
                const [y, m, day] = p.date.split('-');
                if (currentPeriod === 'MAX' || currentPeriod === '5Y') return `${m}.${y}`;
                return `${day}.${m}`;
            });
            const data = points.map(p => p.value);
            const color = chartAccessibleColor(CHART_COLORS[currentCurrency] || '#1a73e8');
            const gradient = ctx.createLinearGradient(0, 0, 0, cv.height);
            gradient.addColorStop(0, hexToRgba(color, 0.28)); gradient.addColorStop(1, hexToRgba(color, 0));
            const dec = currentDecimals();

            if (chartInstance && chartInstance.data && chartInstance.data.datasets.length) {
                chartInstance.data.labels = labels;
                chartInstance.data.datasets[0].data = data;
                chartInstance.data.datasets[0].label = `${currentCurrency} / UAH`;
                chartInstance.data.datasets[0].borderColor = color;
                chartInstance.data.datasets[0].backgroundColor = gradient;
                chartInstance.data.datasets[0].pointHoverBackgroundColor = color;
                chartInstance.options.plugins.tooltip.callbacks.title = items => formatDate(points[items[0]?.dataIndex]?.date);
                chartInstance.options.scales.y.ticks.callback = (v) => v.toFixed(dec) + ' ' + window.nbuUAHText;
                chartInstance.options.plugins.tooltip.callbacks.label = (c) => `${c.parsed.y.toFixed(dec)} ${window.nbuUAHText}`;
                chartInstance.update('none');
                return;
            }

            chartInstance = new Chart(ctx, {
                type: 'line',
                plugins: [nbuPointerPlugin],
                data: { labels, datasets: [{ label: `${currentCurrency} / UAH`, data, borderColor: color, backgroundColor: gradient, tension: 0.35, fill: true, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: color, pointHoverBorderColor: '#fff', pointHoverBorderWidth: 3, borderWidth: 2.5 }] },
                options: { responsive: true, maintainAspectRatio: false, onClick: fxChartSelect, animation: false, interaction: { mode: 'index', axis: 'x', intersect: false }, plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.85)', padding: 12, cornerRadius: 10, displayColors: false, callbacks: { title: items => formatDate(points[items[0]?.dataIndex]?.date), label: (c) => `${c.parsed.y.toFixed(dec)} ${window.nbuUAHText}` } } }, scales: { y: { beginAtZero: false, grid: { color: borderCol, drawTicks: false }, border: { display: false }, ticks: { color: textMuted, font: { size: 11 }, padding: 8, callback: (v) => v.toFixed(dec) + ' ' + window.nbuUAHText } }, x: { grid: { display: false }, border: { display: false }, ticks: { color: textMuted, font: { size: 11 }, maxTicksLimit: 8, padding: 6 } } } }
            });
        }

        function openPicker(target) {
            pickerTarget = target; $('#picker-title').textContent = t(target === 'from' ? 'picker_title_from' : 'picker_title_to');
            renderPickerList(''); $('#picker-modal').classList.add('visible'); $('#picker-search').value = '';
            setTimeout(() => $('#picker-search').focus(), 200);
        }
        function renderPickerList(query) {
            const list = $('#picker-list'); const q = query.trim().toLowerCase();
            const options = [{ code: 'UAH', name: currencyName('UAH') }, ...CURRENCIES.map(c => ({ code: c, name: currencyName(c) }))];
            const filtered = options.filter(opt => !q || opt.code.toLowerCase().includes(q) || opt.name.toLowerCase().includes(q));
            list.innerHTML = filtered.map(opt => {
                let flag;
                if (opt.code in METAL_COLORS) flag = `<span class="flag-metal-wrap" style="width:32px;height:22px;background:${METAL_COLORS[opt.code]};"></span>`;
                else { const url = flagUrl(opt.code); flag = url ? `<img class="rate-flag" src="${url}" alt="" width="26" height="18" loading="lazy" decoding="async" onerror="this.style.display='none'">` : ''; }
                return `<div class="picker-item" data-value="${opt.code}" style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;cursor:pointer;transition:background-color 0.15s;">${flag}<span style="font-weight:800;font-family:ui-monospace,monospace;font-size:14px;color:var(--accent);min-width:46px;">${opt.code}</span><span style="font-size:14px;color:var(--text-muted);">${opt.name}</span></div>`;
            }).join('');
            list.querySelectorAll('.picker-item').forEach(el => {
                el.addEventListener('mouseenter', () => el.style.background = 'var(--hover)');
                el.addEventListener('mouseleave', () => el.style.background = '');
                el.addEventListener('click', () => { setPickerValue(pickerTarget, el.dataset.value); $('#picker-modal').classList.remove('visible'); convert(); });
            });
        }
        function setPickerValue(target, code) {
            const picker = $(`#conv-${target}-picker`); picker.dataset.value = code; picker.querySelector('.code').textContent = code;
            picker.querySelectorAll('img.flag-mini, span.flag-metal-wrap').forEach(n => n.remove());
            if (code in METAL_COLORS) {
                const s = document.createElement('span'); s.className = 'flag-metal-wrap'; s.style.cssText = `width:28px;height:20px;background:${METAL_COLORS[code]};`; picker.insertBefore(s, picker.firstChild);
            } else {
                const url = flagUrl(code);
                if (url) {
                    const img = document.createElement('img'); img.className = 'flag-mini'; img.src = url;
                    img.width = 28; img.height = 20; img.loading = 'lazy'; img.decoding = 'async';
                    img.onerror = function() { this.style.display = 'none'; }; picker.insertBefore(img, picker.firstChild);
                }
            }
        }
        function convert() {
            const from = $('#conv-from-picker').dataset.value, to = $('#conv-to-picker').dataset.value;
            const amount = parseFloat($('#conv-from').value) || 0;
            function rateOf(code) { if (code === 'UAH') return 1; const r = liveRates[code]; return r ? (r.rate ?? 0) : 0; }
            fxSyncUrl();
            const rateFrom = rateOf(from), rateTo = rateOf(to);
            if (!rateFrom || !rateTo) { $('#conv-result').textContent = '—'; $('#conv-detail').textContent = t('no_data'); return; }
            const dec = currentDecimals(); const result = (amount * rateFrom) / rateTo * (1 - fxFee());
            $('#conv-to').value = result.toFixed(dec); $('#conv-result').textContent = `${formatNumber(amount, 2)} ${from} = ${formatNumber(result, dec)} ${to}`;
            let detail = '';
            if (from !== 'UAH' && to !== 'UAH') detail = `1 ${from} = ${(rateFrom / rateTo).toFixed(dec)} ${to} · 1 ${to} = ${(rateTo / rateFrom).toFixed(dec)} ${from}`;
            else if (from === 'UAH' && to !== 'UAH') detail = `1 ${to} = ${rateTo.toFixed(dec)} ₴`;
            else if (from !== 'UAH' && to === 'UAH') detail = `1 ${from} = ${rateFrom.toFixed(dec)} ₴`;
            $('#conv-detail').textContent = detail + (fxFee() ? ` · ${fxT('feeApplied')} ${fxNum(fxFee()*100,1)}%` : '');
            fxUpdateMulti();
        }
        function initConverter(rates) {
            ['#conv-swap','#conv-from-picker','#conv-to-picker','#copy-result'].forEach(sel => {
                const el = $(sel); if (!el) return; const clone = el.cloneNode(true); el.parentNode.replaceChild(clone, el);
            });
            $('#conv-from').oninput = convert;
            $('#conv-swap').addEventListener('click', () => { const f = $('#conv-from-picker').dataset.value; const t2 = $('#conv-to-picker').dataset.value; setPickerValue('from', t2); setPickerValue('to', f); convert(); });
            $('#conv-from-picker').addEventListener('click', () => openPicker('from'));
            $('#conv-to-picker').addEventListener('click', () => openPicker('to'));
            $('#copy-result').addEventListener('click', async () => {
                const text = $('#conv-result').textContent;
                try { await navigator.clipboard.writeText(text); const btn = $('#copy-result'); btn.classList.add('copied'); const svg = btn.innerHTML; btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'; setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = svg; }, 1500); } catch (e) {}
            });
            convert();
        }

        function handlePrivacyAnchor() {
            if (window.location.hash !== '#privacy') return;
            const p = document.getElementById('privacy'); if (!p) return;
            p.open = true; setTimeout(() => p.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
        }

        // ===== Connected calculators, history insights, bank comparison, PWA and alerts =====
        // All financial data is read from the same NBU, bank and crypto sources as the original page.
        const FX_LABELS = {
            uk: {
                quick:'Швидко',fee:'Додаткова комісія (вручну)',feeHint:'Для обміну та банківського розрахунку',
                multititle:'Одразу в кількох валютах',multihelp:'Курс НБУ · USDT — спотовий орієнтир, не P2P',share:'↗ Поділитися розрахунком',
                whatif:'А що, якби купили тоді?',whatifhelp:'Виберіть дату або натисніть на графік. Оцінка за НБУ, без комісій та інфляції.',histdate:'Дата покупки',histamount:'Початково, ₴',histcurrency:'Валюта',
                banktitle:'Порівняння курсів банків',bankhelp:'Найкраща купівля банком — найвища; найкращий продаж банком — найнижчий. Лише доступні котирування.',currency:'Валюта',
                bankcalc:'Калькулятор за картковим курсом',buycurrency:'Купити валюту',sellcurrency:'Продати валюту',bank:'Банк',bankamount:'Сума у валюті',bankresulttitle:'Разом у гривнях',
                spread:'Спред: НБУ, банки та USDT',p2p:'P2P USDT/UAH — введіть реальну пропозицію для порівняння:',
                tools:'Зручні інструменти',installtitle:'Встановити як застосунок',installhelp:'Швидкий доступ із головного екрана телефона',installbtn:'Встановити застосунок',
                alerttitle:'Сповіщення про курс',alerthelp:'Перевірка лише поки вкладка відкрита',above:'Вище або =',below:'Нижче або =',setalert:'Увімкнути',clearalert:'Видалити',
                extensionlabel:'Розширення для браузера',extensiontitle:'Курс НБУ завжди під рукою',extensionhelp:'Перевіряйте курси, не відкриваючи сайт. Праворуч — схематичне прев’ю.',
                loading:'Завантаження курсів…',missing:'Дані поки недоступні',initial:'Початок',now:'Зараз',change:'Зміна',bought:'Куплено валюти',lastQuote:'Найближчий доступний курс на',
                bestbuy:'Банк купує',bestsell:'Банк продає',bankname:'Банк',best:'Найкращий',
                nbu:'НБУ',bankBuyVsNbu:'Банк купує / НБУ',bankSellVsNbu:'Банк продає / НБУ',usdtSpot:'USDT (спот), ₴',
                statusBank:'Банків із доступним курсом',p2pCompare:'Відхилення P2P від НБУ',spotDisclaimer:'USDT/UAH оцінено як USDT/USD × USD/UAH НБУ; це НЕ котирування P2P.',
                noBank:'Для цієї валюти поки немає підтверджених курсів банків',feeApplied:'з урахуванням комісії',
                alertRequired:'Вкажіть коректний додатний поріг.',alertSaved:'Сповіщення налаштовано; спрацює при перетині порога у відкритій вкладці.',
                alertRemoved:'Сповіщення вимкнено.',alertCrossed:'Курс перетнув заданий поріг!',alertPermission:'Браузер не дозволив сповіщення — показуватиметься індикатор на сторінці.',
                installHttps:'Для PWA відкрийте сайт через HTTPS або localhost (не file://).',installManual:'У меню браузера оберіть «Встановити застосунок»; на iOS: Поділитися → На початковий екран.',
                installed:'Застосунок уже встановлено.',installReady:'Застосунок готовий до встановлення.',shareCopied:'Посилання на розрахунок скопійовано.',shareFailed:'Скопіюйте URL з адресного рядка.',
                evFixed:'Фіксація курсу НБУ',evRevalue:'Зміна офіційного курсу',evFlex:'Керована гнучкість'
            },
            en: {
                quick:'Quick amounts',fee:'Extra fee (manual)',feeHint:'Applied to estimates and bank calculations',
                multititle:'Multiple currencies at once',multihelp:'NBU reference · USDT spot proxy, not P2P',share:'↗ Share calculation',
                whatif:'What if you had bought back then?',whatifhelp:'Choose a date or click the chart. NBU estimates, excluding fees and inflation.',histdate:'Purchase date',histamount:'Initial amount, ₴',histcurrency:'Currency',
                banktitle:'Compare bank exchange rates',bankhelp:'Best bank buy is highest; best bank sell is lowest. Available quotes only.',currency:'Currency',
                bankcalc:'Card exchange calculator',buycurrency:'Buy currency',sellcurrency:'Sell currency',bank:'Bank',bankamount:'Currency amount',bankresulttitle:'Total in hryvnia',
                spread:'Spread: NBU, banks & USDT',p2p:'P2P USDT/UAH — enter an observed offer to compare:',
                tools:'Useful tools',installtitle:'Install as an app',installhelp:'Open from your phone’s home screen',installbtn:'Install app',
                alerttitle:'Rate alerts',alerthelp:'Only checked while the tab is open',above:'At or above',below:'At or below',setalert:'Enable',clearalert:'Clear',
                extensionlabel:'Browser extensions',extensiontitle:'NBU Rate at your fingertips',extensionhelp:'See rates without opening the site. Right: schematic preview.',
                loading:'Loading rates…',missing:'Data unavailable',initial:'Initially',now:'Today',change:'Change',bought:'Currency acquired',lastQuote:'Closest available quote on',
                bestbuy:'Bank buys',bestsell:'Bank sells',bankname:'Bank',best:'Best',
                nbu:'NBU',bankBuyVsNbu:'Bank buy / NBU',bankSellVsNbu:'Bank sell / NBU',usdtSpot:'USDT (spot), ₴',
                statusBank:'Banks with available quotes',p2pCompare:'P2P vs NBU difference',spotDisclaimer:'USDT/UAH is estimated as USDT/USD × NBU USD/UAH; this is NOT a P2P offer.',
                noBank:'No verified bank quotes available for this currency',feeApplied:'including fee',
                alertRequired:'Enter a valid positive threshold.',alertSaved:'Alert set. It will fire on crossing while this tab is open.',
                alertRemoved:'Alert disabled.',alertCrossed:'The exchange rate crossed your threshold!',alertPermission:'Notifications blocked; an in-page indicator will be shown.',
                installHttps:'PWA needs HTTPS or localhost (not file://).',installManual:'Use your browser’s “Install app” menu; on iOS: Share → Add to Home Screen.',
                installed:'App already installed.',installReady:'App is ready to install.',shareCopied:'Calculation link copied.',shareFailed:'Copy the URL from your address bar.',
                evFixed:'NBU fixed exchange rate',evRevalue:'Official rate adjustment',evFlex:'Managed flexibility'
            }
        };
        const fxT = key => (FX_LABELS[currentLang] || FX_LABELS.uk)[key] || key;
        const FX_EVENTS = [
            {date:'2022-02-24', key:'evFixed'},
            {date:'2022-07-21', key:'evRevalue'},
            {date:'2023-10-04', key:'evFlex'}
        ];
        let fxBankData = {};
        let fxBankMode = 'buy';
        let fxAlert = null;
        let fxAlertNotice = '';
        let fxLastPolledRate = null;
        let fxAlertTriggered = false;
        const FX_ALERT_KEY = 'nbu_site_rate_alert_v1';
        const FX_FEE_KEY = 'nbu_site_manual_fee_v1';
        const FX_P2P_KEY = 'nbu_site_manual_p2p_v1';
        // Reuse the site's existing image-flag renderer, not platform-dependent emoji.
        function fxMultiIcon(code) {
            return code === 'USDT' ? cryptoIcon('USDT') : flagHtml(code, 'fx-rate-flag');
        }
        const fxRate = code => code === 'UAH' ? 1 : Number(liveRates[code]?.rate) || 0;
        const fxUsdt = () => {
            const usd = fxRate('USD'), quote = Number(cryptoDataMap.USDT?.price);
            return usd > 0 && quote > 0 ? usd * quote : 0;
        };
        function fxPercent(num) { return Number.isFinite(num) ? `${num >= 0 ? '+' : ''}${num.toFixed(2)}%` : '—'; }
        function fxFee() { return Number($('#fx-fee')?.value || 0) / 100; }
        function fxNum(value, digits = 2) { return Number.isFinite(value) ? value.toLocaleString(currentLang === 'en' ? 'en-US' : 'uk-UA', {minimumFractionDigits:digits,maximumFractionDigits:digits}) : '—'; }
        function fxCurrencySource(code) { return code === 'USDT' ? fxUsdt() : fxRate(code); }
        function fxUpdateMulti() {
            const node = $('#fx-multi-list'); if (!node) return;
            const from = $('#conv-from-picker')?.dataset.value || 'USD';
            const amount = Number($('#conv-from')?.value) || 0;
            const source = fxRate(from);
            const targets = ['UAH','USD','EUR','PLN','GBP','USDT'].filter(code => code !== from).slice(0,5);
            node.innerHTML = targets.map(code => {
                const r = fxCurrencySource(code);
                const value = source > 0 && r > 0 ? amount * source / r * (1 - fxFee()) : NaN;
                return `<div class="fx-list-item"><span class="fx-symbol"><span class="fx-flag">${fxMultiIcon(code)}</span>${code}</span><span class="fx-num">${fxNum(value,code === 'USDT' ? 3 : 2)}</span></div>`;
            }).join('');
        }
        const FX_CONVERTER_SESSION_KEY = 'nbu_converter_session_v1';
        function fxCalculationParams() {
            return {from: $('#conv-from-picker').dataset.value,
                    to: $('#conv-to-picker').dataset.value,
                    amount: String(Math.min(1e12, Math.max(0, Number($('#conv-from').value) || 0)))};
        }
        function fxCleanUrl() {
            const url = new URL(location.href);
            ['from','to','amount'].forEach(key => url.searchParams.delete(key));
            const clean = url.pathname + url.search + url.hash;
            if (clean !== location.pathname + location.search + location.hash) {
                history.replaceState(history.state, '', clean);
            }
        }
        function fxSyncUrl() {
            try { sessionStorage.setItem(FX_CONVERTER_SESSION_KEY, JSON.stringify(fxCalculationParams())); } catch (_) {}
            try { fxCleanUrl(); } catch (_) {}
        }
        function fxShareUrl() {
            const url = new URL(location.href);
            for (const [key,value] of Object.entries(fxCalculationParams())) url.searchParams.set(key,value);
            return url.href;
        }
        async function fxShare() {
            const url = fxShareUrl();
            try {
                if (navigator.share) await navigator.share({title:document.title,url});
                else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
                else throw new Error('clipboard');
                $('#fx-share').textContent = '✓ ' + fxT('shareCopied');
                setTimeout(() => { const btn = $('#fx-share'); if(btn) btn.textContent = fxT('share'); },1800);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    // The address bar stays clean; offer the actual calculation link.
                    window.prompt(currentLang === 'en' ? 'Copy calculation link:' : 'Скопіюйте посилання на розрахунок:',url);
                }
            }
        }
        function fxRestoreUrl() {
            const p = new URLSearchParams(location.search);
            let state = {};
            if (['from','to','amount'].some(key => p.has(key))) {
                state = Object.fromEntries(p.entries());
            } else {
                try { state = JSON.parse(sessionStorage.getItem(FX_CONVERTER_SESSION_KEY) || '{}') || {}; } catch (_) {}
            }
            const {from,to} = state;
            const amount = Number(state.amount);
            if (from === 'UAH' || CURRENCIES.includes(from)) setPickerValue('from',from);
            if (to === 'UAH' || CURRENCIES.includes(to)) setPickerValue('to',to);
            if (state.amount != null && state.amount !== '' && Number.isFinite(amount) && amount >= 0) $('#conv-from').value = Math.min(amount,1e12);
            fxSyncUrl();
        }
        function fxEventsDraw() {
            const el=$('#fx-events'); if(!el) return;
            el.innerHTML=FX_EVENTS.map(e=>`<button class="fx-event" type="button" data-fx-date="${e.date}" title="${e.date}">${e.date.slice(0,4)} · ${fxT(e.key)}</button>`).join('');
            el.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
                $('#fx-hdate').value=btn.dataset.fxDate;
                currentPeriod='MAX';
                $$('#period-switcher .period-btn').forEach(b=>b.classList.toggle('active',b.dataset.period==='MAX'));
                renderChart();fxUpdateHistoric();
            }));
        }
        function fxHistoryPoints(currency) {
            return Object.keys(historicalRates).sort().filter(d=>Number(historicalRates[d]?.[currency])>0).map(d=>({date:d,rate:Number(historicalRates[d][currency])}));
        }
        function fxUpdateHistoric() {
            const dest=$('#fx-history-result'); if(!dest)return;
            const code=$('#fx-hcurrency').value, amount=Math.max(0,Number($('#fx-hamount').value)||0);
            const available=fxHistoryPoints(code);
            const today=fxRate(code);
            if(!available.length || !(today>0)){
                dest.innerHTML=`<span class="fx-help">${fxT('missing')}</span>`;
                $('#fx-history-note').textContent='';return;
            }
            const date=$('#fx-hdate').value || available[0].date;
            // Last available NBU quote on or before requested date; otherwise first known quote.
            let lo=0,hi=available.length-1,idx=-1;
            while(lo<=hi){const m=(lo+hi)>>1;if(available[m].date<=date){idx=m;lo=m+1;}else hi=m-1;}
            if(idx<0)idx=0;
            const at=available[idx];
            const quantity=amount/at.rate;
            const current=quantity*today;
            const gain=current-amount;
            const percent=amount>0?100*gain/amount:0;
            const positive=gain>=0;
            dest.innerHTML=`<div class="fx-stat"><div class="fx-stat-label">${fxT('initial')}</div><div class="fx-stat-value">${fxNum(amount)} ₴</div></div><div class="fx-stat"><div class="fx-stat-label">${fxT('now')}</div><div class="fx-stat-value accent">${fxNum(current)} ₴</div></div><div class="fx-stat"><div class="fx-stat-label">${fxT('change')}</div><div class="fx-stat-value" style="color:var(${positive?'--positive':'--negative'})">${fxPercent(percent)}<small style="display:block;font-size:12px">${gain>=0?'+':''}${fxNum(gain)} ₴</small></div></div>`;
            $('#fx-history-note').textContent=`${fxT('lastQuote')} ${at.date}: 1 ${code} = ${fxNum(at.rate,4)} ₴ · ${fxT('bought')}: ${fxNum(quantity,4)} ${code}`;
            $$('#fx-events .fx-event').forEach(b=>b.classList.toggle('active',b.dataset.fxDate===date));
            
        }
        function fxValidBankQuote(raw) {
            const r=Number(raw);
            return Number.isFinite(r) && r>0 ? r : null;
        }
        function fxBankQuotes() {
            const code=$('#fx-bank-currency')?.value || 'USD';
            return BANKS_CONFIG.map(b=>{
                const r=fxBankData[b.id]?.[code];
                const buy=fxValidBankQuote(r?.buy), sell=fxValidBankQuote(r?.sell);
                return (buy!=null||sell!=null)?{bank:b,buy,sell}:null;
            }).filter(Boolean);
        }
        function fxDrawBanks() {
            const wrap=$('#fx-bank-comparison'); if(!wrap)return;
            const rows=fxBankQuotes();
            const buys=rows.filter(r=>r.buy!=null).map(r=>r.buy), sells=rows.filter(r=>r.sell!=null).map(r=>r.sell);
            const maxBuy=buys.length?Math.max(...buys):null, minSell=sells.length?Math.min(...sells):null;
            rows.sort((a,b)=>(a.sell??Infinity)-(b.sell??Infinity));
            if(!rows.length){wrap.innerHTML=`<p class="fx-help" style="padding:16px">${fxT('noBank')}</p>`;$('#fx-bank-count').textContent='';fxBankSelect();fxBankCalc();fxDrawSpread();return;}
            wrap.innerHTML=`<table class="fx-table"><thead><tr><th>${fxT('bankname')}</th><th>${fxT('bestbuy')}, ₴</th><th>${fxT('bestsell')}, ₴</th></tr></thead><tbody>${rows.map(r=>{
                const bn=bankDisplayName(r.bank).replace(/&/g,'&amp;').replace(/</g,'&lt;');
                const formatted=(v,best)=>v==null?'—':(v===best?`<span class="fx-best" title="${fxT('best')}">${fxNum(v,4)} ★</span>`:fxNum(v,4));
                return `<tr><td><span class="fx-bank-ident"><span class="fx-bank-mark"><span aria-hidden="true">${r.bank.letter || 'Б'}</span><img src="${bankLogoAsset(r.bank).src}" alt="" width="26" height="26" loading="lazy" decoding="async" onerror="this.style.display='none'" /></span><span class="fx-bank-name">${bn}</span></span></td><td>${formatted(r.buy,maxBuy)}</td><td>${formatted(r.sell,minSell)}</td></tr>`;
            }).join('')}</tbody></table>`;
            $('#fx-bank-count').textContent=`${fxT('statusBank')}: ${rows.length}` + (Number($('#fx-bank-count').dataset.cachedCount) > 0 ? ` · ${currentLang==='en'?'Cached':'З кешу'}: ${$('#fx-bank-count').dataset.cachedCount}` : '');
            fxBankSelect();fxBankCalc();fxDrawSpread();
        }
        function fxBankSelect() {
            const select=$('#fx-bank-select');if(!select)return;
            const old=select.value;
            const quotes=fxBankQuotes();
            select.innerHTML=quotes.map(q=>`<option value="${q.bank.id}">${bankDisplayName(q.bank)}</option>`).join('');
            if(quotes.some(q=>q.bank.id===old))select.value=old;
        }
        function fxBankCalc() {
            const dest=$('#fx-bank-result');if(!dest)return;
            const code=$('#fx-bank-currency').value, id=$('#fx-bank-select').value;
            const value=fxValidBankQuote(fxBankData[id]?.[code]?.[fxBankMode==='buy'?'sell':'buy']);
            const amt=Math.max(0,Number($('#fx-bank-amount').value)||0), fee=fxFee();
            const total=value==null?NaN:amt*value*(fxBankMode==='buy'?(1+fee):(1-fee));
            dest.textContent=Number.isFinite(total)?fxNum(total)+' ₴':'—';
            $('#fx-bank-formula').textContent=value==null?fxT('noBank'):`${fxNum(amt)} ${code} × ${fxNum(value,4)} ₴ ${fee?'· '+fxT('feeApplied')+' '+fxNum(fee*100,1)+'%':''}`;
        }
        function fxDrawSpread() {
            const el=$('#fx-spread-stats');if(!el)return;
            const code=$('#fx-bank-currency').value, nbu=fxRate(code);
            const quotes=fxBankQuotes();
            const buys=quotes.filter(q=>q.buy!=null).map(q=>q.buy), sells=quotes.filter(q=>q.sell!=null).map(q=>q.sell);
            const bestBuy=buys.length?Math.max(...buys):NaN;
            const bestSell=sells.length?Math.min(...sells):NaN;
            const spot=fxUsdt();
            const stats=[
                {name:fxT('nbu')+' '+code, value:nbu>0?fxNum(nbu,4)+' ₴':'—'},
                {name:fxT('bankBuyVsNbu'),value:nbu>0&&Number.isFinite(bestBuy)?fxPercent((bestBuy/nbu-1)*100):'—'},
                {name:fxT('bankSellVsNbu'),value:nbu>0&&Number.isFinite(bestSell)?fxPercent((bestSell/nbu-1)*100):'—'},
                {name:fxT('usdtSpot'),value:spot>0?fxNum(spot,4)+' ₴':'—'}
            ];
            el.innerHTML=stats.map(s=>`<div class="fx-tile"><span class="fx-help">${s.name}</span><strong>${s.value}</strong></div>`).join('');
            const p2p=Number($('#fx-p2p-rate').value);
            $('#fx-p2p-result').textContent=(p2p>0 && fxRate('USD')>0?`${fxT('p2pCompare')}: ${fxPercent((p2p/fxRate('USD')-1)*100)} · `:'')+fxT('spotDisclaimer');
        }
        function fxRefreshAll() {
            fxUpdateMulti();fxUpdateHistoric();fxDrawBanks();fxWidgetRates();fxRenderAlert();
        }
        function fxWidgetRates() {
            [['USD','#fx-widget-rate'],['EUR','#fx-widget-eur'],['PLN','#fx-widget-pln']].forEach(([code,selector])=>{
                const r=fxRate(code), el=$(selector);if(el)el.textContent=r>0?fxNum(r,4)+(code==='USD'?' ₴':''):'—';
            });
        }
        function fxTranslate() {
            $$('[data-fx]').forEach(el=>{el.textContent=fxT(el.dataset.fx);});
            fxEventsDraw();fxRefreshAll();
            fxPwaRender();
        }
        function fxSaveAlert() {
            const curr=$('#fx-alert-currency').value,rule=$('#fx-alert-rule').value,threshold=Number($('#fx-alert-threshold').value);
            if(!(threshold>0)||!Number.isFinite(threshold)){$('#fx-alert-status').textContent=fxT('alertRequired');return;}
            fxAlert={curr,rule,threshold,lastRate:fxRate(curr)||null};
            fxAlertTriggered=false;
            safeLS.setItem(FX_ALERT_KEY,JSON.stringify(fxAlert));
            fxAlertNotice=fxT('alertSaved');
            fxRenderAlert();
            // Browsers require a user gesture for permissions.
            if('Notification' in window && Notification.permission==='default'){
                Notification.requestPermission().then(permission=>{
                    if(permission!=='granted'){$('#fx-alert-status').textContent=fxT('alertPermission');}
                }).catch(()=>{});
            }
        }
        function fxRenderAlert() {
            if(!$('#fx-alert-status'))return;
            if(fxAlert){
                $('#fx-alert-currency').value=fxAlert.curr;
                $('#fx-alert-rule').value=fxAlert.rule;
                $('#fx-alert-threshold').value=fxAlert.threshold;
                $('#fx-alert-status').textContent=fxAlertNotice||`${fxAlert.curr}/UAH ${fxAlert.rule==='above'?'≥':'≤'} ${fxNum(fxAlert.threshold,4)} ₴`;
            }else $('#fx-alert-status').textContent=fxAlertNotice;
        }
        function fxClearAlert() {
            fxAlert=null;fxAlertNotice=fxT('alertRemoved');fxAlertTriggered=false;
            safeLS.removeItem(FX_ALERT_KEY);fxRenderAlert();fxRestoreFavicon();
        }
        function fxBadgeFavicon() {
            try {
                const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
                const c=canvas.getContext('2d');
                c.fillStyle='#1a73e8';c.beginPath();c.roundRect(2,2,60,60,15);c.fill();
                c.fillStyle='#fff';c.font=window.nbuUAHNeedsVector?'bold 22px sans-serif':'bold 45px sans-serif';c.textAlign='center';c.fillText(window.nbuUAHText,32,48);
                c.fillStyle='#ef4444';c.beginPath();c.arc(51,12,12,0,Math.PI*2);c.fill();
                $('#favicon-link').href=canvas.toDataURL('image/png');
            }catch(_){}
        }
        function fxRestoreFavicon() {try {setFavicon(safeLS.getItem(PRESET_KEY));}catch(_){$('#favicon-link').href='favicon.ico';}}
        function fxCheckAlert() {
            if(!fxAlert)return;
            const value=fxRate(fxAlert.curr);
            if(!(value>0))return;
            const old=Number(fxAlert.lastRate);
            const crossed=old>0&&(fxAlert.rule==='above'?(old<fxAlert.threshold&&value>=fxAlert.threshold):(old>fxAlert.threshold&&value<=fxAlert.threshold));
            fxAlert.lastRate=value;
            safeLS.setItem(FX_ALERT_KEY,JSON.stringify(fxAlert));
            if(!crossed)return;
            fxAlertTriggered=true;fxAlertNotice=fxT('alertCrossed');fxBadgeFavicon();fxRenderAlert();
            if('Notification' in window && Notification.permission==='granted'){
                try {new Notification('Курс НБУ',{body:`${fxAlert.curr}/UAH: ${fxNum(value,4)} ₴ · ${fxT('alertCrossed')}`,icon:'favicon.ico',tag:'nbu-rate-threshold'});}catch(_){}
            }
        }
        async function fxPollRates(force = false) {
            if (navigator.onLine === false) { liveFromCache = true; updateLiveStatus('error'); return; }
            if (document.hidden || initialLoadPromise) return;
            if (pollPromise) return pollPromise;
            pollPromise = (async () => {
                const secondary = [loadCrypto()];
                if (force || Date.now() - lastBankPoll >= BANK_POLL_INTERVAL) secondary.push(initBankCarousel());
                try {
                    updateLiveStatus('loading');
                    await loadLiveRates('nbu');
                    updateLiveStatus();
                    await refreshRecentHistoryIfNeeded();
                    renderCards(liveRates); convert(); fxRefreshAll(); renderChart(); updateLiveStatus();
                    if (!liveFromCache) fxCheckAlert();
                } catch (e) { updateLiveStatus(); console.warn('NBU sync:', e.message); }
                await Promise.allSettled(secondary);
            })();
            try { return await pollPromise; } finally { pollPromise = null; }
        }

        // PWA install prompt is supported on Chromium (including Android Chrome).
        // iOS uses the browser Share menu instead of beforeinstallprompt.
        let fxPwaDeferredPrompt = null;
        let fxPwaChoiceHandled = false;
        function fxPwaIsInstalled() {
            return window.matchMedia('(display-mode: standalone)').matches ||
                   window.matchMedia('(display-mode: fullscreen)').matches ||
                   window.navigator.standalone === true;
        }
        function fxPwaPlatform() {
            return window.nbuDeviceInfo?.device || 'desktop';
        }
        function fxPwaBrowser() {
            return window.nbuDeviceInfo?.browser || 'other';
        }
        function fxPwaRender() {
            const guide = document.getElementById('fx-pwa-guide');
            const status = document.getElementById('fx-pwa-status');
            const button = document.getElementById('fx-pwa-install');
            const label = document.getElementById('fx-pwa-button-label');
            const chip = document.getElementById('fx-pwa-device');
            if (!guide || !button || !label || !status) return;
            const en = currentLang === 'en';
            const platform = fxPwaPlatform();
            const browser = fxPwaBrowser();
            const name = ({edge:'Edge',firefox:'Firefox',chrome:'Chrome',safari:'Safari',other: en ? 'Browser':'Браузер'})[browser];
            if (chip) chip.textContent = (platform === 'ios' ? 'iPhone / iPad' : platform === 'android' ? 'Android' : en ? 'Desktop' : 'Комп’ютер') + ' · ' + name;
            if (fxPwaIsInstalled()) {
                button.disabled = true;
                label.textContent = en ? 'Already installed' : 'Уже встановлено';
                guide.textContent = en ? 'The app is running in its own window.' : 'Застосунок відкрито в окремому вікні.';
                status.textContent = '';
                return;
            }
            button.disabled = false;
            const hasPrompt = Boolean(fxPwaDeferredPrompt);
            label.textContent = hasPrompt ? (en ? 'Install app' : 'Встановити застосунок') : (en ? 'How to install' : 'Як встановити');
            if (!window.isSecureContext || location.protocol === 'file:') {
                guide.textContent = en ? 'Open the published site over HTTPS; a local file cannot be installed.' :
                    'Відкрийте опублікований сайт через HTTPS. З локального файлу встановлення недоступне.';
                return;
            }
            // Different browsers do not necessarily support the same kind of standalone installation.
            if (platform === 'ios') {
                guide.innerHTML = en ?
                    '<strong>iOS:</strong> open Share → Add to Home Screen → Add. If this option is missing in your browser, use Safari. Choose “Open as Web App” where available.' :
                    '<strong>iPhone / iPad:</strong> натисніть «Поділитися» → «На початковий екран» → «Додати». Якщо пункту немає, відкрийте сайт у Safari. Увімкніть «Відкрити як вебзастосунок», якщо доступно.';
            } else if (platform === 'android' && browser === 'firefox') {
                guide.innerHTML = en ?
                    '<strong>Firefox for Android:</strong> open the browser menu ⋮ → Install / Add to Home screen. Firefox may create a shortcut rather than a standalone app.' :
                    '<strong>Firefox на Android:</strong> відкрийте меню ⋮ → «Встановити» / «На головний екран». Firefox може створити ярлик замість окремого застосунку.';
            } else if (platform === 'android' && browser === 'edge') {
                guide.innerHTML = en ?
                    '<strong>Edge for Android:</strong> open the ⋯ menu → Add to phone / Add to Home screen. A browser shortcut may be created instead of a standalone app.' :
                    '<strong>Edge на Android:</strong> меню ⋯ → «Додати на телефон» / «На головний екран». Може створюватися ярлик, а не окремий застосунок.';
            } else if (platform === 'android') {
                guide.innerHTML = en ?
                    '<strong>Android / Chrome:</strong> tap Install above when offered, or open ⋮ → Install app. Keep Chrome up to date.' :
                    '<strong>Android / Chrome:</strong> натисніть «Встановити застосунок» або ⋮ → «Встановити застосунок». Оновіть Chrome, якщо такого пункту немає.';
            } else if (browser === 'firefox') {
                guide.innerHTML = en ?
                    '<strong>Firefox on desktop:</strong> use a bookmark or browser-supported web app feature if available. Firefox does not offer the same install prompt as Chrome/Edge on all systems.' :
                    '<strong>Firefox на ПК:</strong> створіть закладку або використайте функцію вебзастосунків, якщо є у вашій версії. Стандартне вікно встановлення доступне не всюди.';
            } else {
                guide.innerHTML = en ?
                    '<strong>Chrome / Edge on desktop:</strong> use the install icon in the address bar, or open the browser menu → Install app.' :
                    '<strong>Chrome / Edge на ПК:</strong> натисніть значок установлення в адресному рядку або відкрийте меню браузера → «Встановити застосунок».';
            }
            if (!fxPwaChoiceHandled) status.textContent = '';
        }
        function fxPwaInit() {
            const btn = document.getElementById('fx-pwa-install');
            if (!btn) return;
            btn.addEventListener('click', async () => {
                const platform = fxPwaPlatform();
                if (fxPwaIsInstalled()) return;
                if (!fxPwaDeferredPrompt) {
                    fxPwaRender();
                    const guide = document.getElementById('fx-pwa-guide');
                    guide.scrollIntoView({behavior:'smooth', block:'nearest'});
                    const pwaStatus = document.getElementById('fx-pwa-status');
                    pwaStatus.textContent = currentLang === 'en' ? 'Checking installation files…' : 'Перевіряємо файли застосунку…';
                    try {
                        const m = document.querySelector('link[rel="manifest"]');
                        if (!m) throw new Error('manifest');
                        const result = await fetch(m.href, {cache:'no-store'});
                        if (!result.ok) throw new Error('manifest HTTP ' + result.status);
                        const manifest = await result.json();
                        const base = new URL(m.href, location.href);
                        const required = ['192x192','512x512'];
                        for (const dimensions of required) {
                            const icon = (manifest.icons || []).find(i => i.sizes?.split(/\s+/).includes(dimensions) && !(i.purpose || 'any').includes('maskable'));
                            if (!icon) throw new Error('icon ' + dimensions);
                            const response = await fetch(new URL(icon.src,base), {cache:'no-store'});
                            if (!response.ok || !(response.headers.get('content-type') || '').startsWith('image/')) throw new Error('icon ' + dimensions + ' HTTP ' + response.status);
                        }
                        pwaStatus.textContent = currentLang === 'en' ?
                            'App files are available. If Chrome still offers only a shortcut, clear this site’s saved data, reopen it and retry.' :
                            'Файли застосунку доступні. Якщо Chrome пропонує лише ярлик, очистіть дані цього сайту, відкрийте його знову й повторіть.';
                    } catch (err) {
                        pwaStatus.textContent = (currentLang === 'en' ? 'Install files unavailable: ' : 'Файли для встановлення недоступні: ') + String(err.message || err);
                    }
                    return;
                }
                const prompt = fxPwaDeferredPrompt;
                fxPwaDeferredPrompt = null;
                try {
                    await prompt.prompt();
                    const outcome = await prompt.userChoice;
                    fxPwaChoiceHandled = true;
                    document.getElementById('fx-pwa-status').textContent = outcome.outcome === 'accepted' ?
                        (currentLang === 'en' ? 'Follow the browser’s installation instructions.' : 'Підтвердьте встановлення у браузері.') :
                        (currentLang === 'en' ? 'Installation cancelled. You can install from the browser menu.' : 'Встановлення скасовано. Можна встановити через меню браузера.');
                } catch (_) { /* Browser can decline the prompt; manual install remains available. */ }
                fxPwaRender();
            });
            window.addEventListener('beforeinstallprompt', ev => {
                ev.preventDefault();
                fxPwaDeferredPrompt = ev;
                fxPwaChoiceHandled = false;
                fxPwaRender();
            });
            window.addEventListener('appinstalled', () => { fxPwaDeferredPrompt = null; fxPwaRender(); });
            fxPwaRender();
            // PWA lifecycle is managed by the shared auto-updater at the end of the page.
        }

        function fxInit() {
            fxRestoreUrl();
            const fee=Number(safeLS.getItem(FX_FEE_KEY));
            if(Number.isFinite(fee) && fee>=0 && fee<=3)$('#fx-fee').value=fee;
            $('#fx-fee-value').textContent=fxNum(Number($('#fx-fee').value),1)+'%';
            $('#fx-fee').addEventListener('input',()=>{
                $('#fx-fee-value').textContent=fxNum(Number($('#fx-fee').value),1)+'%';
                safeLS.setItem(FX_FEE_KEY,$('#fx-fee').value);
                convert();fxUpdateMulti();fxBankCalc();
            });
            $$('[data-quick]').forEach(btn=>btn.addEventListener('click',()=>{
                const val=btn.dataset.quick;
                $('#conv-from').value=Math.max(0, val.startsWith('+')?(Number($('#conv-from').value)||0)+Number(val.slice(1)):Number(val));
                convert();
            }));
            $('#fx-share').addEventListener('click',fxShare);
            $('#fx-hdate').value='2020-01-01';
            $('#fx-hdate').max=new Date().toISOString().slice(0,10);
            $('#fx-hcurrency').value=currentCurrency;
            ['#fx-hdate','#fx-hamount','#fx-hcurrency'].forEach(sel=>$(sel).addEventListener('input',()=>{fxUpdateHistoric();if(chartInstance?.draw)chartInstance.draw();}));
            $('#fx-bank-currency').addEventListener('change',fxDrawBanks);
            $('#fx-bank-select').addEventListener('change',fxBankCalc);
            $('#fx-bank-amount').addEventListener('input',fxBankCalc);
            $$('#fx-mode-switch button').forEach(b=>b.addEventListener('click',()=>{
                fxBankMode=b.dataset.mode;
                $$('#fx-mode-switch button').forEach(x=>x.classList.toggle('active',x===b));
                fxBankCalc();
            }));
            $('#fx-p2p-rate').value=safeLS.getItem(FX_P2P_KEY)||'';
            $('#fx-p2p-rate').addEventListener('input',()=>{
                safeLS.setItem(FX_P2P_KEY,$('#fx-p2p-rate').value);
                fxDrawSpread();
            });
            try {const cached=JSON.parse(safeLS.getItem(FX_ALERT_KEY)||'null');if(cached&&['USD','EUR','PLN','GBP'].includes(cached.curr)&&['above','below'].includes(cached.rule)&&Number(cached.threshold)>0){fxAlert=cached;}}catch(_){}
            $('#fx-alert-save').addEventListener('click',fxSaveAlert);
            $('#fx-alert-clear').addEventListener('click',fxClearAlert);
            fxTranslate();
            fxPwaInit();
            // This is a foreground-tab monitor, not background push messaging.
            setInterval(() => fxPollRates(), 5 * 60 * 1000);
            document.addEventListener('visibilitychange', () => { if (!document.hidden) fxPollRates(); });
            window.addEventListener('offline', () => { liveFromCache = true; updateLiveStatus('error'); });
            window.addEventListener('online', () => fxPollRates(true));
        }
        // Visual annotations remain chart-native and adapt to existing theme and zoom.
        const historicEventsPlugin = {
            id:'nbuHistoricEvents',
            afterDatasetsDraw(chart){
                if(chart.canvas.id!=='rateChart' || !chart.getDatasetMeta(0)?.data.length)return;
                const points=chart.getDatasetMeta(0).data;
                const dates=chartDates;
                if(!dates.length || dates.length!==points.length)return;
                const ctx=chart.ctx,area=chart.chartArea,style=getComputedStyle(document.documentElement),accent=style.getPropertyValue('--accent').trim()||'#1a73e8';
                ctx.save();
                const selected=$('#fx-hdate')?.value;
                let selectedIdx=-1;
                if(selected){for(let i=dates.length-1;i>=0;i--){if(dates[i]<=selected){selectedIdx=i;break;}}}
                if(selectedIdx>=0){const pt=points[selectedIdx];ctx.strokeStyle=accent;ctx.setLineDash([4,5]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(pt.x,area.top);ctx.lineTo(pt.x,area.bottom);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.fillStyle=accent;ctx.arc(pt.x,pt.y,4,0,Math.PI*2);ctx.fill();}
                FX_EVENTS.forEach((ev,index)=>{
                    if(ev.date<dates[0]||ev.date>dates[dates.length-1])return;
                    const idx=dates.findIndex(d=>d>=ev.date);
                    if(idx<0)return;
                    const pt=points[idx];ctx.setLineDash([3,4]);ctx.strokeStyle=style.getPropertyValue('--text-faint').trim()||'#888';ctx.lineWidth=1;
                    ctx.beginPath();ctx.moveTo(pt.x,area.top);ctx.lineTo(pt.x,area.bottom);ctx.stroke();ctx.setLineDash([]);
                    ctx.beginPath();ctx.arc(pt.x,area.top+9,6,0,Math.PI*2);ctx.fillStyle=accent;ctx.fill();ctx.font='bold 9px system-ui';ctx.fillStyle=style.getPropertyValue('--accent-text').trim()||'#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(index+1),pt.x,area.top+9);
                });
                ctx.restore();
            }
        };

        function fxChartSelect(event, elements, chart){
            if(!chart?.scales?.x)return;
            const dates=chartDates;
            const idx=Math.max(0,Math.min(dates.length-1,Math.round(chart.scales.x.getValueForPixel(event.x))));
            if(dates[idx]){$('#fx-hdate').value=dates[idx];$('#fx-hcurrency').value=currentCurrency;fxUpdateHistoric();chart.draw();}
        }

        document.addEventListener('DOMContentLoaded', async () => {
            // The deferred Chart.js script has finished before DOMContentLoaded.
            // If it could not load, the existing canvas fallback handles the charts.
            // Chart.js is requested only after a chart is needed.
            initTheme(); initA11y(); initLanguage(); initPreciseRate(); applyTranslations(); fxInit(); handlePrivacyAnchor();
            window.addEventListener('hashchange', handlePrivacyAnchor);

            $$('#period-switcher .period-btn').forEach(btn => {
                btn.addEventListener('click', () => { $$('#period-switcher .period-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); currentPeriod = btn.dataset.period; renderChart(); });
            });

            $$('#crypto-period-switcher .period-btn').forEach(btn => {
                btn.addEventListener('click', () => { $$('#crypto-period-switcher .period-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); currentCryptoPeriod = btn.dataset.period; renderCryptoCards(); });
            });

            $$('#crypto-modal-period-switcher .period-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    $$('#crypto-modal-period-switcher .period-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    activeCryptoModalPeriod = btn.dataset.period;
                    renderCryptoModalChart();
                });
            });

            $('#picker-close').addEventListener('click', () => $('#picker-modal').classList.remove('visible'));
            $('#picker-modal').addEventListener('click', (e) => { if (e.target.id === 'picker-modal') $('#picker-modal').classList.remove('visible'); });
            $('#picker-search').addEventListener('input', (e) => renderPickerList(e.target.value));

            const modal = $('#settings-modal');
            const settingsBtn = $('#open-settings');
            settingsBtn.addEventListener('click', () => { modal.classList.add('visible'); settingsBtn.classList.add('open'); });
            if (new URLSearchParams(location.search).get('settings') === '1') settingsBtn.click();
            function closeSettings() { modal.classList.remove('visible'); settingsBtn.classList.remove('open'); }
            $('#close-settings').addEventListener('click', closeSettings);
            modal.addEventListener('click', (e) => { if (e.target === modal) closeSettings(); });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeSettings();
                    $('#picker-modal').classList.remove('visible');
                    $('#card-chart-modal').classList.remove('visible');
                    $('#crypto-chart-modal').classList.remove('visible');
                }
            });

            $('#card-chart-close').addEventListener('click', () => { $('#card-chart-modal').classList.remove('visible'); if (cardChartInstance) { cardChartInstance.destroy(); cardChartInstance = null; } });
            $('#card-chart-modal').addEventListener('click', (e) => { if (e.target.id === 'card-chart-modal') { $('#card-chart-modal').classList.remove('visible'); if (cardChartInstance) { cardChartInstance.destroy(); cardChartInstance = null; } } });

            // Accessible crypto chart controls. Expansion and font sizing do not change the data.
            const cryptoModal = $('#crypto-chart-modal');
            const cryptoExpand = $('#crypto-chart-expand');
            const cryptoTextsize = $('#crypto-chart-textsize');
            function updateCryptoControlLabels() {
                const english = currentLang === 'en';
                $('#crypto-chart-expand-label').textContent = cryptoModal.classList.contains('crypto-expanded') ? (english ? 'Restore' : 'Згорнути') : (english ? 'Expand' : 'Розгорнути');
                $('#crypto-chart-text-label').textContent = cryptoModal.classList.contains('crypto-text-large') ? (english ? 'Normal text' : 'Звичайний текст') : (english ? 'Larger text' : 'Більший текст');
                $('#crypto-chart-hint').textContent = english ? 'Hover or tap the chart to view exchange rates by date.' : 'Наведіть курсор або торкніться графіка, щоб побачити курс на дату.';
                cryptoExpand.setAttribute('aria-pressed', String(cryptoModal.classList.contains('crypto-expanded')));
                cryptoTextsize.setAttribute('aria-pressed', String(cryptoModal.classList.contains('crypto-text-large')));
                cryptoExpand.setAttribute('aria-label', $('#crypto-chart-expand-label').textContent);
                cryptoTextsize.setAttribute('aria-label', $('#crypto-chart-text-label').textContent);
            }
            cryptoExpand.addEventListener('click', () => {
                cryptoModal.classList.toggle('crypto-expanded');
                updateCryptoControlLabels();
                requestAnimationFrame(() => cryptoChartInstance?.resize());
            });
            cryptoTextsize.addEventListener('click', () => {
                cryptoModal.classList.toggle('crypto-text-large');
                updateCryptoControlLabels();
                if (activeCryptoCoin) renderCryptoModalChart();
            });
            updateCryptoControlLabels();
            $('#crypto-chart-close').addEventListener('click', () => { $('#crypto-chart-modal').classList.remove('visible'); if (cryptoChartInstance) { cryptoChartInstance.destroy(); cryptoChartInstance = null; } });
            $('#crypto-chart-modal').addEventListener('click', (e) => { if (e.target.id === 'crypto-chart-modal') { $('#crypto-chart-modal').classList.remove('visible'); if (cryptoChartInstance) { cryptoChartInstance.destroy(); cryptoChartInstance = null; } } });

            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                const theme = safeLS.getItem(THEME_KEY) || 'system';
                if (theme === 'system') { const c = JSON.parse(safeLS.getItem(CUSTOM_COLORS_KEY) || 'null') || DEFAULT_CUSTOM; applyTheme('system', c); }
            });

            setupBankCarouselEvents();
            await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
            await loadAll();
        });

        window.__nbu = {
            get liveRates()        { return liveRates; },
            get historicalRates()  { return historicalRates; },
            get fullHistoryReady() { return fullHistoryReady; },
            get latestDate()       { return latestDate; },
            get liveDate()         { return liveDate; },
            get historyLoading()   { return historyLoading; },
            get liveUpdatedAt() { return liveUpdatedAt; },
            get liveSyncedAt() { return liveSyncedAt; },
            refreshLiveRates: () => fxPollRates(true)
        };
    })();
