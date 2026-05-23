import { useEffect } from "react"
import {
  Check,
  Bot,
  Sparkles,
  MessageCircle,
  Minus,
  Gift,
  Server,
  Users,
  HelpCircle,
} from "lucide-react"

const TG_URL = "https://t.me/swefd"
const CALL_URL = "https://calendar.app.google/r1cfQvmWEtc9yGCa9"

export function Offer() {
  useEffect(() => {
    const prev = document.title
    document.title =
      "Календар у Telegram для UA Well Community — Webspirio"
    return () => {
      document.title = prev
    }
  }, [])

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <Hero />
      <PointAB />
      <MemberTypes />
      <Tiers />
      <TierMatrix />
      <ZohoAddon />
      <Comparison />
      <Roadmap />
      <Stages />
      <Support />
      <Hosting />
      <Payment />
      <OutOfScope />
      <AboutDeveloper />
      <FAQ />
      <FinalCTA />
    </div>
  )
}

function CTA({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string
  children: React.ReactNode
  variant?: "primary" | "secondary"
  className?: string
}) {
  const base =
    "inline-flex items-center justify-center h-12 px-6 text-base font-semibold rounded-xl transition-all"
  const styles =
    variant === "primary"
      ? "bg-[#0088CC] text-white hover:bg-[#006FA8] shadow-sm hover:shadow-md"
      : "border border-neutral-300 text-neutral-900 hover:bg-neutral-50"
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </a>
  )
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-[#0088CC] mb-3">
      {children}
    </p>
  )
}

function Hero() {
  return (
    <section className="relative px-6 pt-20 pb-24 sm:pt-32 sm:pb-32 bg-gradient-to-b from-sky-50 via-white to-white">
      <div className="max-w-4xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-[#0088CC] text-xs font-semibold uppercase tracking-wider mb-6">
          <Bot className="size-3.5" /> Telegram-бот · Mini App · Синхронізація календарів
        </span>
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
          Календар подій
          <br />
          у Telegram
          <br />
          <span className="text-[#0088CC]">для UA Well Community</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
          Бот, Mini App та автоматична синхронізація з Google, Apple, Outlook
          для бізнес-клубу в Мюнхені й Аугсбурзі — за 3–7 тижнів.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <CTA href={CALL_URL}>Забронювати безкоштовну консультацію</CTA>
          <CTA href={TG_URL} variant="secondary">
            Написати в Telegram
          </CTA>
        </div>
      </div>
    </section>
  )
}

function PointAB() {
  const pointA = [
    "Календар у Google Sheets, розсилається раз на місяць у месенджерах.",
    "RSVP — листуванням з менеджером, переноситься в Sheets вручну.",
    "Нагадування — щосуботи + за день, руками менеджера.",
    "Платні події: скриншот оплати → менеджер вручну підтверджує.",
    "Zoom-лінк = 20–30 особистих повідомлень.",
    "Аналітики відвідуваності й no-show немає.",
  ]
  const pointB = [
    "Mini App у Telegram: усі заходи, реєстрація одним тапом.",
    "Підписка на календар → події у Google / Apple / Outlook автоматично.",
    "Нагадування: 24 год + 1 год + (онлайн) 15 хв з Zoom-лінком.",
    "Платні події: правило «скасування за 7 днів», статуси автоматично.",
    "Кастомна розсилка адміна — одним кліком усім записаним.",
    "Аналітика: відвідуваність, no-show, повертаність.",
  ]
  return (
    <section className="px-6 py-16 sm:py-24 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <Kicker>Контекст</Kicker>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-12">
          Куди ми йдемо
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-neutral-200 shadow-sm">
            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                Точка А
              </span>
              <span className="text-sm text-neutral-400">— поточний стан</span>
            </div>
            <ul className="space-y-3 text-neutral-700 text-sm sm:text-base leading-relaxed">
              {pointA.map((t, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="text-neutral-300 flex-shrink-0 mt-1">·</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#0088CC]/30 ring-1 ring-[#0088CC]/10 shadow-sm">
            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-sm font-bold uppercase tracking-wider text-[#0088CC]">
                Точка Б
              </span>
              <span className="text-sm text-neutral-400">— автоматизовано</span>
            </div>
            <ul className="space-y-3 text-neutral-700 text-sm sm:text-base leading-relaxed">
              {pointB.map((t, i) => (
                <li key={i} className="flex gap-2.5">
                  <Check className="size-4 text-[#0088CC] flex-shrink-0 mt-1" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

type TierFeature = { title: string; detail?: string }

type Tier = {
  name: string
  price: string
  duration: string
  tagline: string
  included: TierFeature[]
  notIncluded?: { title: string; availableIn: string }[]
  bonus?: { title: string; detail: string }
  featured?: boolean
  badge?: string
  proAccent?: boolean
}

function Tiers() {
  const tiers: Tier[] = [
    {
      name: "Старт",
      price: "€2 200",
      duration: "3–4 тижні",
      tagline: "Базова автоматизація календаря",
      included: [
        {
          title: "Telegram-бот для анонсів у топіки",
          detail:
            "Анонси автоматично потрапляють у потрібний топік супергрупи за типом події (нетворкінг, мастермайнд, онлайн тощо).",
        },
        {
          title: "Mini App: список і календарна сітка",
          detail:
            "Учасники бачать усі заходи прямо в Telegram, без встановлень і реєстрацій.",
        },
        {
          title: "Створення одноразових і повторюваних подій",
          detail:
            "Серії: щотижня, щомісяця або кастомне правило (RRULE). Редагування серії не зачіпає подій з реєстраціями.",
        },
        {
          title: "Обмеження місць + лист очікування",
          detail:
            "Адмін задає капасіті, система автоматично переводить надлишок у waitlist і пропонує місце наступному при звільненні.",
        },
        {
          title: "Платні події (готівка / банк)",
          detail:
            "Адмін підтверджує оплату вручну. Правило «скасування за 7 днів до події» — автоматичне.",
        },
        {
          title: "Кнопка «Додати в календар» на кожній події",
          detail:
            "Google / Apple / Outlook — одноразова копія події в календар користувача.",
        },
        {
          title: "Авто-нагадування за 24 години",
          detail:
            "Один фіксований офсет для всіх подій. Йде в Telegram DM зареєстрованим учасникам.",
        },
        {
          title: "Розгортання, домен, SSL, моніторинг",
          detail:
            "Налаштування на вашому сервері, домен, сертифікат, цілодобовий моніторинг доступності.",
        },
      ],
      notIncluded: [
        {
          title: "Автоматична синхронізація з календарями",
          availableIn: "Розширений",
        },
        {
          title: "Розширені нагадування (1 год, Zoom-лінк за 15 хв)",
          availableIn: "Розширений",
        },
        { title: "Кастомні розсилки атендам", availableIn: "Розширений" },
        { title: "Аналітика", availableIn: "Розширений" },
      ],
    },
    {
      name: "Розширений",
      price: "€3 000",
      duration: "4–5 тижнів",
      tagline: "Підписка + розсилки + базова аналітика + члени",
      included: [
        { title: "Усе зі «Старту»" },
        {
          title: "Персональна підписка на календар",
          detail:
            "Учасник один раз додає посилання у Google / Apple / Outlook — далі всі його майбутні події, зміни, скасування синхронізуються автоматично.",
        },
        {
          title: "Конфігуровані нагадування",
          detail:
            "Адмін обирає коли нагадувати: 24 год + 1 год + (для онлайн) 15 хв з автоматичною вставкою Zoom-посилання.",
        },
        {
          title: "Авто-сповіщення при змінах події",
          detail:
            "Якщо адмін змінює час, локацію або скасовує захід — усі учасники миттєво отримують ping у Telegram.",
        },
        {
          title: "Кастомна розсилка адмінів",
          detail:
            "Один екран: текст, «надіслати зараз» або в певний час, опція «також опублікувати в топіку». Підходить для Zoom-лінків, змін локації, посилань на матеріали.",
        },
        {
          title: "Прев'ю отримувачів перед розсилкою",
          detail:
            "Адмін бачить імена й кількість тих, хто отримає повідомлення, до натискання «Надіслати».",
        },
        {
          title: "Типи учасників (Start / Standard / Business)",
          detail:
            "Адмін позначає кожного учасника тарифом. Події можна обмежити за тарифом — наприклад, ексклюзивні зустрічі лише для Business. Заблоковані учасники бачать причину й пропозицію апгрейду.",
        },
        {
          title: "Таблиця учасників із відвідуваністю",
          detail:
            "Адмін бачить таблицю всіх учасників з кількістю подій, на які кожен реєструвався і фактично прийшов. Сортування за активністю, no-show, типом.",
        },
        {
          title: "Базова аналітика для адмінів",
          detail:
            "Кількість зареєстрованих, відвідуваність по подіях, місячний звіт у Telegram DM останньої п'ятниці місяця.",
        },
      ],
      notIncluded: [
        {
          title: "Сторінка профілю учасника (біо, локація, компанія)",
          availableIn: "Pro",
        },
        {
          title: "Пошук і каталог учасників",
          availableIn: "Pro",
        },
        {
          title: "Нагадування про продовження членства",
          availableIn: "Pro",
        },
        {
          title: "Повна аналітика (когорти, no-show, активність менеджерів)",
          availableIn: "Pro",
        },
        { title: "Експорт у CSV", availableIn: "Pro" },
        {
          title: "Архітектурний резерв під франчайзі та CRM",
          availableIn: "Pro",
        },
        { title: "Аудит-лог усіх дій адміна", availableIn: "Pro" },
      ],
      featured: true,
      badge: "РЕКОМЕНДУЄМО",
    },
    {
      name: "Pro",
      price: "€4 200",
      duration: "5–7 тижнів",
      tagline: "Платформенний фундамент",
      included: [
        { title: "Усе з «Розширеного»" },
        {
          title: "Сторінка профілю учасника",
          detail:
            "Кожен учасник має профіль із біо, що він/вона робить, у якій компанії, де базується (Мюнхен / Аугсбург / інше), Telegram. Учасник редагує свій профіль сам, адмін — будь-який.",
        },
        {
          title: "Пошук і каталог учасників",
          detail:
            "Mini App має вкладку «Учасники»: пошук за іменем, компанією, локацією, типом. Тап на учасника → відкривається профіль. Корисно для нетворкінгу та підготовки менеджера до зустрічей.",
        },
        {
          title: "Нагадування про продовження членства",
          detail:
            "За 30 і 7 днів до закінчення членства учасник отримує DM від бота; менеджер одночасно отримує нотифікацію в адмін-чаті, щоб мати змогу зателефонувати. Зменшує невимушений churn.",
        },
        {
          title: "Когортна аналітика",
          detail:
            "Хто з тих, хто прийшов у місяці M, повертається в наступні 3 місяці. Відстеження утримання учасників.",
        },
        {
          title: "Розрізи за типами заходів",
          detail:
            "Середня відвідуваність, % no-show, агрегована оцінка по кожному типу (нетворкінг, мастермайнд, онлайн, спорт тощо).",
        },
        {
          title: "Відстеження no-show + активність менеджерів",
          detail:
            "Список учасників з ≥3 пропусками за 90 днів. Скільки заходів і розсилок створив кожен менеджер. Корисно при розширенні команди.",
        },
        {
          title: "Експорт усіх даних у CSV",
          detail:
            "Реєстрації, події, відвідуваність, профілі — для імпорту в Excel / Power BI / податковий облік.",
        },
        {
          title: "Архітектурний резерв під майбутні фази",
          detail:
            "Поля для мульти-юрособи й франчайзингу зарезервовані. Готовність до email-логіну, повноцінних карток учасників і реферальної програми у Фазі 2 — без додаткових витрат на міграцію (економія ~€2–3K у Фазі 2).",
        },
        {
          title: "Аудит-лог усіх дій адміна",
          detail:
            "Хто, коли, що змінив у подіях, реєстраціях, розсилках, профілях. Потрібно для compliance і безпеки даних.",
        },
      ],
      bonus: {
        title: "Фундамент для Фази 2 — економія ~€2–3K у наступному раунді",
        detail:
          "Архітектурний резерв (мульти-юрособа, аудит-лог, готовність до логіну, профілі учасників) у Pro — це робота, яку інакше довелося б робити з нуля у Фазі 2. + 1 місяць «Преміум» підтримки в подарунок (€120).",
      },
      proAccent: true,
    },
  ]
  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto">
        <Kicker>Тарифи</Kicker>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
          Три варіанти Фази 1
        </h2>
        <p className="text-neutral-600 mb-12 max-w-2xl leading-relaxed">
          Усі тарифи покривають базу: бот, Mini App, реєстрацію, повторювані
          події, платні події. Різниця — у глибині автоматизації, типах
          учасників, профілях, аналітиці та архітектурному резерві під майбутні
          фази.
        </p>
        <div className="grid md:grid-cols-3 gap-6 md:gap-5 lg:gap-6 items-stretch">
          {tiers.map((t) => (
            <TierCard key={t.name} {...t} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TierCard({
  name,
  price,
  duration,
  tagline,
  included,
  notIncluded,
  bonus,
  featured,
  badge,
  proAccent,
}: Tier) {
  const border = featured
    ? "border-[#0088CC] ring-2 ring-[#0088CC]/20"
    : proAccent
      ? "border-amber-200"
      : "border-neutral-200"
  const bg = proAccent
    ? "bg-gradient-to-b from-amber-50/40 to-white"
    : "bg-white"
  return (
    <div
      className={`relative flex flex-col p-7 sm:p-8 rounded-2xl border shadow-sm ${border} ${bg} ${featured ? "md:scale-[1.02] md:z-10" : ""}`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#FFB800] text-white text-xs font-bold uppercase tracking-wider shadow-sm whitespace-nowrap">
          {badge}
        </span>
      )}
      <h3 className="text-2xl font-bold">{name}</h3>
      <p className="text-sm text-neutral-500 mt-1">{tagline}</p>
      <div className="mt-6">
        <span className="text-4xl font-extrabold">{price}</span>
        <span className="block text-sm text-neutral-500 mt-1">
          Термін: {duration}
        </span>
      </div>

      <div className="mt-8 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
          Що включено
        </p>
        <ul className="space-y-3.5">
          {included.map((f, i) => (
            <li key={i} className="flex gap-2.5">
              <Check className="size-5 shrink-0 text-[#0088CC] mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-900 leading-snug">
                  {f.title}
                </p>
                {f.detail && (
                  <p className="text-xs text-neutral-600 leading-relaxed mt-1">
                    {f.detail}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {bonus && (
          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex gap-2.5">
              <Gift className="size-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900 leading-snug">
                  {bonus.title}
                </p>
                <p className="text-xs text-amber-800 leading-relaxed mt-1">
                  {bonus.detail}
                </p>
              </div>
            </div>
          </div>
        )}

        {notIncluded && notIncluded.length > 0 && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Не включено
            </p>
            <ul className="space-y-2">
              {notIncluded.map((f, i) => (
                <li key={i} className="flex gap-2.5">
                  <Minus className="size-4 shrink-0 text-neutral-300 mt-0.5" />
                  <div className="flex-1 text-xs text-neutral-500 leading-relaxed">
                    <span>{f.title}</span>
                    <span className="text-neutral-400">
                      {" "}
                      — доступно в «{f.availableIn}»
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <CTA href={CALL_URL} className="mt-8 w-full">
        Обговорити
      </CTA>
    </div>
  )
}

type CellValue = boolean | string

function TierMatrix() {
  const groups: { title: string; rows: [string, CellValue, CellValue, CellValue][] }[] = [
    {
      title: "Бот і Mini App (база)",
      rows: [
        ["Telegram-бот, що публікує анонси у топіки", true, true, true],
        ["Mini App: список і календарна сітка", true, true, true],
        ["RSVP в один клік", true, true, true],
        ["Обмеження кількості місць + лист очікування", true, true, true],
        ["Повторювані події (щотижня / щомісяця / кастомне правило)", true, true, true],
        ["Платні події + правило «скасування за 7 днів»", true, true, true],
        ["Розгортання, домен, SSL, моніторинг 24/7", true, true, true],
      ],
    },
    {
      title: "Календарна інтеграція",
      rows: [
        ["Кнопка «Додати в календар» (Google / Apple / Outlook)", true, true, true],
        [
          "Автоматична синхронізація — особиста підписка на календар",
          false,
          true,
          true,
        ],
      ],
    },
    {
      title: "Нагадування",
      rows: [
        ["Авто-нагадування за 24 години", true, true, true],
        ["Додаткове нагадування за 1 годину", false, true, true],
        ["Спеціальне нагадування для онлайн-зустрічей (15 хв з Zoom)", false, true, true],
        ["Авто-сповіщення при змінах події (час / локація / скасування)", false, true, true],
      ],
    },
    {
      title: "Розсилки адмінів",
      rows: [
        ["Кастомна розсилка атендам у Telegram DM", false, true, true],
        ["Планувальник «надіслати в певний час»", false, true, true],
        ["Опція «також опублікувати в топіку»", false, true, true],
        ["Прев'ю отримувачів перед надсиланням", false, true, true],
      ],
    },
    {
      title: "Учасники та членство",
      rows: [
        [
          "Типи учасників (Start / Standard / Business) + обмеження подій за типом",
          false,
          true,
          true,
        ],
        [
          "Таблиця учасників із кількістю відвідуваних подій",
          false,
          true,
          true,
        ],
        [
          "Сторінка профілю учасника (біо, що робить, локація, компанія)",
          false,
          false,
          true,
        ],
        ["Пошук і каталог учасників у Mini App", false, false, true],
        [
          "Нагадування про продовження членства (учаснику + менеджеру)",
          false,
          false,
          true,
        ],
      ],
    },
    {
      title: "Аналітика для адмінів",
      rows: [
        ["RSVP та відвідуваність по подіях", false, true, true],
        ["Місячний звіт адміну в Telegram DM", false, true, true],
        ["Когортна аналітика (повертаність учасників)", false, false, true],
        ["Розрізи за типами заходів (no-show, оцінки)", false, false, true],
        ["Відстеження no-show (≥3 пропуски за 90 днів)", false, false, true],
        ["Активність менеджерів (створені події, розсилки)", false, false, true],
        ["Експорт у CSV", false, false, true],
      ],
    },
    {
      title: "Архітектурний резерв",
      rows: [
        ["Поля для мульти-юрособи / франчайзингу", false, false, true],
        ["Аудит-лог усіх дій адміна", false, false, true],
        [
          "Готовність до email-логіну (Фаза 2 без додаткових витрат)",
          false,
          false,
          true,
        ],
      ],
    },
    {
      title: "Бонуси",
      rows: [
        ["Тестування на 2–3 демо-подіях", true, true, true],
        ["Навчання адміністраторів", true, true, true],
        [
          "Фундамент Фази 2 (економія ~€2–3K у наступному раунді)",
          false,
          false,
          true,
        ],
        [
          "1 місяць «Преміум» підтримки в подарунок (€120)",
          false,
          false,
          true,
        ],
      ],
    },
  ]

  const Cell = ({ v }: { v: CellValue }) => {
    if (v === true)
      return (
        <span className="inline-flex items-center justify-center">
          <Check className="size-5 text-[#0088CC]" />
        </span>
      )
    if (v === false)
      return (
        <span className="inline-flex items-center justify-center">
          <Minus className="size-5 text-neutral-300" />
        </span>
      )
    return <span className="text-xs text-neutral-700">{v}</span>
  }

  return (
    <section className="px-6 py-16 sm:py-20">
      <div className="max-w-6xl mx-auto">
        <Kicker>Деталі тарифів</Kicker>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          Що саме відрізняється між тарифами
        </h2>
        <p className="text-neutral-600 mb-10 max-w-3xl leading-relaxed">
          База однакова в усіх тарифах. Відмінності — у глибині автоматизації
          нагадувань, можливостях розсилок, аналітиці й архітектурному резерві
          під майбутні фази.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 shadow-sm">
          <table className="w-full min-w-[720px] border-collapse">
            <thead className="sticky top-0">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-100 w-[40%]">
                  Функція
                </th>
                <th className="px-4 py-4 text-center bg-neutral-100 w-[20%]">
                  <p className="text-sm font-bold text-neutral-900">Старт</p>
                  <p className="text-xs text-neutral-500 mt-0.5">€2 200</p>
                </th>
                <th className="px-4 py-4 text-center bg-sky-50 ring-2 ring-[#0088CC]/30 w-[20%]">
                  <p className="text-sm font-bold text-[#0088CC]">Розширений</p>
                  <p className="text-xs text-neutral-600 mt-0.5">€3 000</p>
                </th>
                <th className="px-4 py-4 text-center bg-amber-50/60 w-[20%]">
                  <p className="text-sm font-bold text-neutral-900">Pro</p>
                  <p className="text-xs text-neutral-500 mt-0.5">€4 200</p>
                </th>
              </tr>
            </thead>
            {groups.map((g) => (
              <tbody key={g.title}>
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-700 bg-neutral-100/70 border-y border-neutral-200"
                  >
                    {g.title}
                  </td>
                </tr>
                {g.rows.map(([feature, a, b, c], i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-neutral-50/40"}
                  >
                    <td className="px-4 py-3 text-sm text-neutral-800 align-middle">
                      {feature}
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <Cell v={a} />
                    </td>
                    <td className="px-4 py-3 text-center align-middle bg-sky-50/40">
                      <Cell v={b} />
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <Cell v={c} />
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
        <p className="text-xs text-neutral-500 mt-6 italic leading-relaxed text-center">
          Усі тарифи включають аналіз вимог, тестування, навчання, розгортання
          й місяць безкоштовної гарантії на критичні баги.
        </p>
      </div>
    </section>
  )
}

function ZohoAddon() {
  return (
    <section className="px-6 py-16 sm:py-20 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-2xl bg-white border border-neutral-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0">
              <div className="size-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Sparkles className="size-6 text-amber-600" />
              </div>
            </div>
            <div className="flex-1">
              <Kicker>Опціонально</Kicker>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight">
                Міст із ZOHO, HubSpot або KeyCRM
              </h3>
              <p className="text-neutral-700 mb-4 leading-relaxed">
                Якщо ви залишите ZOHO (HubSpot, KeyCRM) для воронки продажів,
                ми побудуємо міст: ліди з CRM → картка учасника в календарі,
                RSVPs → активність назад у CRM.
              </p>
              <p className="text-neutral-700 mb-6 leading-relaxed">
                <strong>Від €700.</strong> Точний скоуп обговорюємо на дзвінку — інколи
                інтеграція не потрібна, іноді односторонньої вистачає, іноді
                потрібен повний двосторонній міст із дедуплікацією.
              </p>
              <CTA href={CALL_URL} variant="secondary">
                Обговорити інтеграцію
              </CTA>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Comparison() {
  const rows: Array<[string, string, string]> = [
    ["Час до запуску", "1–4 тижні налаштування", "3–7 тижнів Фази 1"],
    [
      "Ціна",
      "ZOHO CRM: €15–50/міс/користувача · HubSpot Sales: $20–150/місце · KeyCRM: $19/міс база + 1% з продажів",
      "Капекс €2 200–4 200 на Фазі 1, потім €40–120/міс підтримка",
    ],
    [
      "Швидкість мінімального запуску",
      "✅ Швидше для базової воронки",
      "⚠️ Повільніше у Фазі 1, але одразу під ваш workflow",
    ],
    [
      "Воронка продажів",
      "Універсальна; ваші 9 етапів і €40-кваліфікатор — компроміс або кастомізація під SaaS",
      "9 етапів воронки, €40-зустріч, ручна кваліфікація — без компромісів",
    ],
    [
      "Мульти-юрособа (3+) + Lexware",
      "Через сторонні конектори (Zapier, n8n); консолідація обмежена",
      "Закладено в архітектурі; пряма інтеграція з Lexware у Фазі 2",
    ],
    [
      "Універсальність під німецький податковий контекст",
      "⚠️ Слабкий (Lexware не є першокласним інтегратором)",
      "✅ Сильний (Lexware-aware з Фази 2)",
    ],
    [
      "Ringostat (IP-телефонія)",
      "KeyCRM — нативно; ZOHO/HubSpot — лише через сторонні модулі",
      "Нативна інтеграція у Фазі 3",
    ],
    [
      "Telegram / WhatsApp як основний канал",
      "Зазвичай — окрема надбудова (Wati, Charles), окрема підписка",
      "Telegram — у ядрі. WhatsApp — свідомо відкладено через високу вартість Business API",
    ],
    [
      "Реферальна програма (§45.1 вашого ТЗ)",
      "Як правило, не вбудована — потрібен Zapier + кастомний код",
      "Першокласна функція з Фази 2",
    ],
    [
      "Внутрішня книга несписуваних витрат",
      "Не вкладається — SaaS-CRM не передбачає «тіньового» обліку",
      "Окремий контур, доступний лише адміну",
    ],
    [
      "Франчайзингова модель",
      "ZOHO/HubSpot — окремі портали / окремі акаунти; складна модель прав",
      "Поля для мульти-юрособи зарезервовані з Фази 1 (у тарифі Pro)",
    ],
    [
      "Власність даних",
      "У вендора; експорт є, але міграція пізніше — болюча",
      "Ваші. Postgres, можна забрати в будь-який момент",
    ],
    [
      "Передбачуваність витрат",
      "Зростає з командою. При 10 менеджерах ZOHO ~€1 800–6 000/рік, HubSpot — більше",
      "Капекс по фазах + €40–120/міс підтримка",
    ],
  ]

  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto">
        <Kicker>Порівняння</Kicker>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">
          Vendor CRM vs власна платформа
        </h2>
        <p className="text-neutral-600 mb-10 max-w-3xl leading-relaxed">
          Ми не «проти SaaS». ZOHO, HubSpot, KeyCRM — добрі продукти. Питання
          в тому, що з вашим конкретним стеком (3 юрособи, Lexware, Ringostat,
          мульти-міста) вони покривають, а що ні.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 shadow-sm">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-neutral-100">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 w-1/4"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-700">
                  ZOHO / HubSpot / KeyCRM
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#0088CC] bg-sky-50">
                  Власна платформа
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([k, v1, v2], i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? "bg-white" : "bg-neutral-50/60"}
                >
                  <td className="px-4 py-3 text-sm font-semibold text-neutral-900 align-top">
                    {k}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700 align-top">
                    {v1}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700 align-top bg-sky-50/40">
                    {v2}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 p-6 rounded-xl bg-sky-50 border border-sky-200">
          <p className="text-sm sm:text-base text-neutral-800 leading-relaxed">
            <strong className="text-[#0088CC]">Чесний висновок:</strong> SaaS-CRM
            виграє, якщо ваші процеси стандартні. Ваші — ні. 3 юрособи,
            Lexware, Ringostat, Telegram, реферальна модель, мульти-міста — це
            конфігурація, де адаптація під SaaS буде стабільно болючою. Власна
            платформа дорожча на старті, дешевша через 18 місяців і повністю
            ваша.
          </p>
        </div>
      </div>
    </section>
  )
}

function Roadmap() {
  const phases = [
    {
      tag: "Фаза 1",
      when: "зараз",
      title: "Календар",
      price: "€2 200–4 200",
      blurb: "Те, що ви читаєте вище.",
      active: true,
    },
    {
      tag: "Фаза 2",
      when: "~2–3 міс. після Фази 1",
      title: "Портал учасників + базові фінанси",
      price: "~€6 000–8 000",
      blurb:
        "Логін у портал, профілі учасників, каталог, інтеграція з Lexware (картка учасника читає Lexware, без автоінвойсів), базова реферальна програма, нагадування про продовження членства.",
    },
    {
      tag: "Фаза 3",
      when: "~5–6 міс. після Фази 1",
      title: "Власна воронка + телефонія",
      price: "~€8 000–12 000",
      blurb:
        "Кастомні лід-форми, воронки за містами, інтеграція Ringostat (дзвінки, історія, записи), аналітика менеджерів, Marketing Hub (кампанії, email).",
    },
  ]
  return (
    <section className="px-6 py-16 sm:py-24 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <Kicker>План на 12 місяців</Kicker>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-12">
          Дорожня карта
        </h2>
        <div className="space-y-4">
          {phases.map((p, i) => (
            <div
              key={i}
              className={`p-6 sm:p-8 rounded-2xl border shadow-sm ${p.active ? "border-[#0088CC] bg-white ring-2 ring-[#0088CC]/15" : "border-neutral-200 bg-white"}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                <div className="sm:w-44 flex-shrink-0">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${p.active ? "bg-[#0088CC] text-white" : "bg-neutral-200 text-neutral-700"}`}
                  >
                    {p.tag}
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">{p.when}</p>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{p.title}</h3>
                  <p className="text-sm font-semibold text-[#0088CC] mt-1">
                    {p.price}
                  </p>
                  <p className="text-sm text-neutral-700 mt-3 leading-relaxed">
                    {p.blurb}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 p-5 rounded-xl bg-sky-50 border border-sky-200">
          <p className="text-sm text-neutral-800 leading-relaxed">
            <strong className="text-[#0088CC]">Бюджет на 12 місяців:</strong>{" "}
            Фаза 1 (Старт) + Фаза 2 + Фаза 3 = €16.2–24.2K сукупно. Це
            вкладається у заявлений ІТ-бюджет (€10–20K) на нижньому діапазоні:
            «Старт» (€2 200) + «базова» Фаза 2 (€6 000) + «мінімальна» Фаза 3
            (€8 000) = €16 200. Або зупиняєтеся раніше — наприклад, після Фази
            1 + Lexware-моста без повної воронки (€10 200).
          </p>
        </div>
        <p className="text-xs text-neutral-500 mt-6 italic leading-relaxed">
          Ціни Фаз 2 і 3 — оціночні. Фіксуються після Фази 1, коли видно реальний
          обсяг даних. Ви можете зупинитися на будь-якій фазі — жодна не
          «ламається» без наступної.
        </p>
      </div>
    </section>
  )
}

function Stages() {
  const steps = [
    {
      n: 1,
      title: "Аналіз і узгодження",
      duration: "1 тиждень",
      desc: "Фінальні вимоги, дизайн Mini App, технічний план, домен, доступ до Telegram-супергрупи.",
    },
    {
      n: 2,
      title: "Розробка",
      duration: "2–4 тижні",
      desc: "Бот, Mini App, інтеграція з календарями, нагадування, аналітика.",
    },
    {
      n: 3,
      title: "Тестування",
      duration: "3–5 днів",
      desc: "Спільне тестування з вашою командою на 2–3 демо-події.",
    },
    {
      n: 4,
      title: "Запуск і навчання",
      duration: "1–2 дні",
      desc: "Розгортання на вашому сервері, навчання адміністраторів.",
    },
  ]
  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="max-w-5xl mx-auto">
        <Kicker>Як ми працюємо</Kicker>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-12">
          Етапи Фази 1
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.n}>
              <div className="size-10 rounded-full bg-[#0088CC] text-white font-bold flex items-center justify-center mb-4">
                {s.n}
              </div>
              <h3 className="font-bold text-base mb-1">{s.title}</h3>
              <p className="text-xs font-semibold text-[#0088CC] uppercase tracking-wider mb-2">
                {s.duration}
              </p>
              <p className="text-sm text-neutral-700 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Support() {
  const tiers = [
    {
      name: "Базовий",
      price: "€40/міс",
      features: [
        "Сервер, домен, SSL, моніторинг 24/7",
        "Виправлення критичних помилок",
        "Щоденні резервні копії",
        "Час відповіді: 72 год",
      ],
      extra: "Додаткові години: €40/год",
    },
    {
      name: "Стандарт",
      price: "€75/міс",
      features: [
        "Усе з «Базового»",
        "До 2 годин дрібних змін на місяць",
        "Виправлення некритичних помилок",
        "Оновлення залежностей і безпекові патчі",
        "Час відповіді: 48 год",
      ],
      featured: true,
      badge: "Рекомендуємо",
      extra: "Години не накопичуються",
    },
    {
      name: "Преміум",
      price: "€120/міс",
      features: [
        "Усе зі «Стандарту»",
        "До 5 годин змін на місяць",
        "Пріоритетна відповідь: 24 год",
        "Щомісячний звіт",
        "Прямий контакт у Telegram",
      ],
      extra: "Включено 1 місяць безкоштовно при тарифі Pro",
    },
  ]
  return (
    <section className="px-6 py-16 sm:py-24 bg-neutral-50">
      <div className="max-w-6xl mx-auto">
        <Kicker>Після запуску</Kicker>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-12">
          Підтримка
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative p-6 sm:p-8 rounded-2xl border shadow-sm bg-white ${t.featured ? "border-[#0088CC] ring-2 ring-[#0088CC]/20" : "border-neutral-200"}`}
            >
              {t.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#FFB800] text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                  {t.badge}
                </span>
              )}
              <h3 className="text-xl font-bold">{t.name}</h3>
              <p className="text-3xl font-extrabold mt-3">{t.price}</p>
              <ul className="mt-6 space-y-2.5">
                {t.features.map((f, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm text-neutral-700 leading-relaxed"
                  >
                    <Check className="size-4 shrink-0 text-[#0088CC] mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-neutral-500 mt-6 italic">{t.extra}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Payment() {
  return (
    <section className="px-6 py-16 sm:py-20">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-[#0088CC] mb-3">
          Умови
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">
          Оплата
        </h2>
        <ul className="space-y-4 text-base text-neutral-700 text-left max-w-xl mx-auto">
          <li className="flex gap-3">
            <span className="text-[#0088CC] font-bold">50%</span>
            <span>авансом після підписання договору.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#0088CC] font-bold">50%</span>
            <span>після здачі та запуску.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-neutral-400 font-bold">·</span>
            <span>Підтримка — щомісяця, з місяця після запуску.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-neutral-400 font-bold">·</span>
            <span>
              Інтеграція з ZOHO / HubSpot / KeyCRM — окремий рахунок, від €700.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-neutral-400 font-bold">·</span>
            <span>Оплата в євро або гривнях за курсом НБУ на день оплати.</span>
          </li>
        </ul>
      </div>
    </section>
  )
}

function OutOfScope() {
  const items = [
    "Портал учасників із логіном (це Фаза 2).",
    "Платіжний процесор (Stripe / SEPA). Платні події у Фазі 1 — підтвердження адміном вручну.",
    "Власна CRM, воронка продажів, лід-форми (це Фаза 3).",
    "Інтеграція з Lexware (це Фаза 2).",
    "WhatsApp-бот — Business API має окрему вартість і затримки сертифікації.",
    "Архів відеозаписів подій.",
    "Реферальна програма — першокласна у Фазі 2.",
    "Опитування.",
    "Нативні мобільні додатки — Mini App покриває iOS і Android.",
  ]
  return (
    <section className="px-6 py-16 sm:py-20 bg-neutral-50">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-3 text-center">
          Прозорість
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-center">
          Що ми не робимо у Фазі 1
        </h2>
        <p className="text-sm text-neutral-600 mb-8 text-center max-w-xl mx-auto leading-relaxed">
          Перелічуємо явно, щоб уникнути розбіжностей в очікуваннях.
        </p>
        <ul className="space-y-2.5">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex gap-3 text-sm text-neutral-700 leading-relaxed"
            >
              <span className="text-neutral-400 flex-shrink-0 mt-1">—</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function MemberTypes() {
  return (
    <section className="px-6 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0">
              <div className="size-12 rounded-xl bg-[#0088CC]/10 flex items-center justify-center">
                <Users className="size-6 text-[#0088CC]" />
              </div>
            </div>
            <div className="flex-1">
              <Kicker>Як працюють учасники</Kicker>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight">
                Типи учасників і доступ до подій
              </h3>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Кожен учасник має тип:{" "}
                <strong className="text-[#0088CC]">Start</strong>,{" "}
                <strong className="text-[#0088CC]">Standard</strong> або{" "}
                <strong className="text-[#0088CC]">Business</strong> — відповідно
                до вашої пакетної моделі. Адмін позначає тип у картці учасника.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                При створенні події адмін обирає, хто може на неї зареєструватися:
                усі / лише Business / Business + Standard / окрема група. Учасник
                нижчого тарифу бачить ексклюзивні події в календарі, але при
                спробі зареєструватися отримує{" "}
                <strong>чесне повідомлення</strong> з причиною і пропозицією
                апгрейду пакета.
              </p>
              <p className="text-sm text-neutral-600 leading-relaxed">
                <strong className="text-neutral-900">Чому це важливо:</strong>{" "}
                ексклюзивність — ваш найсильніший аргумент для апгрейду Start →
                Standard → Business. Календар має це підтримувати з першого
                запуску. (Доступно у тарифах «Розширений» і «Pro».)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Hosting() {
  const items = [
    {
      label: "Хостинг",
      value: "Ваш Hostinger VPS (Coolify)",
      detail:
        "Кладемо на ваш VPS. Якщо у вас його ще немає — Hostinger ~€8–12/міс за просту віртуалку, керована через Coolify (відкритий код).",
    },
    {
      label: "База даних",
      value: "Supabase Cloud",
      detail:
        "Безкоштовний тариф (500MB БД, 1GB сховище) — вистачить на ~80 учасників із роками подій. Якщо доростете до >1000 — €25/міс Pro.",
    },
    {
      label: "Домен",
      value: "≈ €10–15/рік",
      detail:
        "Купується один раз. Приклад: calendar.uawell.com або events.uawell.com.",
    },
    {
      label: "SSL-сертифікат",
      value: "Безкоштовно (Let's Encrypt)",
      detail:
        "Налаштовується автоматично через Coolify. Авто-оновлення.",
    },
    {
      label: "Моніторинг + бекапи",
      value: "Включено в підтримку",
      detail:
        "Sentry для помилок, uptime-monitor 24/7, щоденні бекапи бази, щотижневий повний дамп у ваше сховище.",
    },
  ]
  return (
    <section className="px-6 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto">
        <Kicker>Інфраструктура</Kicker>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          Що з хостингом і скільки він коштує
        </h2>
        <p className="text-neutral-600 mb-10 max-w-3xl leading-relaxed">
          Прозоро: ми не приховуємо ongoing витрати. Хостинг — на вашому
          сервері, дані — у вашій базі (Supabase EU-регіон, GDPR-сумісно).
          Загальна вартість інфраструктури — <strong>€8–25/місяць</strong> у
          поточному масштабі.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it, i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-white border border-neutral-200"
            >
              <div className="flex items-start gap-3 mb-2">
                <Server className="size-5 shrink-0 text-[#0088CC] mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    {it.label}
                  </p>
                  <p className="text-base font-bold text-neutral-900 mt-0.5">
                    {it.value}
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {it.detail}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-xs text-neutral-500 italic leading-relaxed">
          Сумарно: за поточного масштабу UA Well (~80 учасників, ~3 події/міс.)
          інфраструктура коштує <strong>€8–15/місяць</strong>. Усі параметри
          моніторингу й бекапів — включені у вибраний тариф підтримки.
        </p>
      </div>
    </section>
  )
}

function AboutDeveloper() {
  return (
    <section className="px-6 py-16 sm:py-20 bg-neutral-50">
      <div className="max-w-4xl mx-auto">
        <Kicker>Хто за цим стоїть</Kicker>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-8">
          Webspirio — Олександр Чорноус
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4 text-neutral-700 leading-relaxed">
            <p>
              Я розробляю кастомні бізнес-платформи й CRM для невеликих
              продуктових команд і ком'юніті. Працюю з замовниками у Німеччині,
              Україні та Польщі.
            </p>
            <p>
              Цей проєкт — частина ширшої платформи, яку ми будуємо для UA
              Well: окремо вже існує прототип CRM з воронкою продажів, картками
              учасників, фінансовою аналітикою (зараз — на mock-даних). Календар
              у Telegram — найшвидший спосіб довести роботу команди до запуску,
              перш ніж інвестувати у повну CRM.
            </p>
            <p>
              Стек, який я використовую (і яким буде ваша платформа): React +
              TypeScript, Supabase (Postgres з row-level security, EU-регіон),
              Telegram Bot API, shadcn/ui. Усе — open-source або дешеві
              підписки. Ніяких vendor lock-in.
            </p>
            <p className="text-sm text-neutral-600 pt-2 border-t border-neutral-200">
              <strong className="text-neutral-900">Контакти:</strong> Telegram{" "}
              <a
                href={TG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0088CC] hover:underline"
              >
                @swefd
              </a>{" "}
              · Дзвінок 15 хв —{" "}
              <a
                href={CALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0088CC] hover:underline"
              >
                забронювати
              </a>
              .
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-neutral-200 h-fit">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
              Принципи роботи
            </p>
            <ul className="space-y-3 text-sm text-neutral-700">
              <li className="flex gap-2">
                <Check className="size-4 shrink-0 text-[#0088CC] mt-0.5" />
                <span>Ваш код — ваш. Постачаємо репозиторій, не «чорну скриньку».</span>
              </li>
              <li className="flex gap-2">
                <Check className="size-4 shrink-0 text-[#0088CC] mt-0.5" />
                <span>Прямий контакт у Telegram замість тикет-системи.</span>
              </li>
              <li className="flex gap-2">
                <Check className="size-4 shrink-0 text-[#0088CC] mt-0.5" />
                <span>Чесні строки. Якщо щось зайве — кажемо одразу.</span>
              </li>
              <li className="flex gap-2">
                <Check className="size-4 shrink-0 text-[#0088CC] mt-0.5" />
                <span>Open-source стек. Без vendor lock-in.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function FAQ() {
  const items = [
    {
      q: "Чому не Notion + Zapier + Telegram Channels?",
      a: "Можна, але: Notion не вміє в RSVP з лімітами місць, лист очікування, авто-нагадування. Zapier дає прив'язки, але кожен інтеграційний крок — окремий рахунок ($20–100/міс при зростанні) і точка відмови. Календарна синхронізація через Zapier — ненадійна, часто з 30-хв затримками. Власне рішення на Supabase + Telegram-боті надійніше і коштує менше на горизонті 12 міс.",
    },
    {
      q: "Хто володіє кодом і даними?",
      a: "Ви. Код — у вашому Git-репозиторії (передається при здачі). Дані — у вашій базі Supabase (можна забрати в будь-який момент як Postgres-дамп). Ніяких ліцензійних обмежень, ніякого vendor lock-in. Це принципова відмінність від ZOHO/HubSpot.",
    },
    {
      q: "Що буде, якщо ви зникнете або не зможете підтримувати проєкт?",
      a: "Код у вашому Git. Стек — публічний (React, Supabase, Node.js, grammY) — будь-який інший розробник може підхопити. Я передаю документацію архітектури (англомовний tech-spec на ~560 рядків), коментарі в коді, інструкцію розгортання. У підтримці Стандарт+ домовляємося про back-up developer на випадок недоступності.",
    },
    {
      q: "Чому Supabase, а не власна БД?",
      a: "Supabase — це Postgres + Auth + сторадж + Edge Functions, керовані за вас. На вашому масштабі (~80 учасників) безкоштовний тариф покриває все. Якщо доростете — €25/міс Pro. Альтернатива «власна БД на VPS» — це +1 день розробки, +€10/міс на ресурси VPS, і вам же ж її треба бекапити. Не варто. Якщо потім захочете переїхати — Postgres-дамп переноситься куди завгодно.",
    },
    {
      q: "Скільки коштує підтримка хостингу й як це працює?",
      a: "Хостинг сам по собі — €8–15/міс (Hostinger VPS + Supabase free + домен). Тариф підтримки (€40 / €75 / €120) включає моніторинг 24/7, оновлення безпеки, бекапи й (у вищих тарифах) кілька годин на доробки. Деталі — у секції «Підтримка» вище.",
    },
    {
      q: "Можна почати з тарифу Старт, а потім доплатити різницю до Розширеного / Pro?",
      a: "Так. Між тарифами існує апгрейд-шлях: ви платите різницю в ціні + 10% на регресійне тестування (інтеграцію нових модулів з вже працюючим кодом). Наприклад, апгрейд Старт → Розширений: €800 + €80 = €880. Зробити можна в будь-який момент після запуску.",
    },
    {
      q: "Як це інтегрується з вашою майбутньою CRM (Фаза 2-3)?",
      a: "Якщо ви беретe тариф Pro у Фазі 1 — поля для мульти-юрособи, аудит-лог, готовність до email-логіну закладаються одразу. У Фазі 2 (портал учасників + Lexware) ми накладаємо новий шар поверх існуючого, не переписуючи. Якщо беретe Старт або Розширений — у Фазі 2 знадобиться окремий апгрейд архітектури (~€1.5–2K додатково).",
    },
  ]
  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="max-w-3xl mx-auto">
        <Kicker>Питання, які виникають найчастіше</Kicker>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">
          Часті запитання
        </h2>
        <div className="space-y-4">
          {items.map((item, i) => (
            <details
              key={i}
              className="group p-5 sm:p-6 rounded-xl bg-white border border-neutral-200 shadow-sm open:ring-2 open:ring-[#0088CC]/15"
            >
              <summary className="cursor-pointer flex items-start gap-3 list-none">
                <HelpCircle className="size-5 shrink-0 text-[#0088CC] mt-0.5" />
                <span className="flex-1 text-base font-semibold text-neutral-900 leading-snug">
                  {item.q}
                </span>
                <span className="text-2xl text-neutral-400 group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-4 ml-8 text-sm text-neutral-700 leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="px-6 py-20 sm:py-28 bg-gradient-to-b from-white to-sky-50">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          Готові обговорити деталі?
        </h2>
        <p className="mt-6 text-lg text-neutral-600 max-w-xl mx-auto leading-relaxed">
          15 хвилин дзвінка — ми відповідаємо на питання щодо скоупу, термінів
          і вашого конкретного стеку.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <CTA href={CALL_URL}>Забронювати безкоштовну консультацію</CTA>
          <CTA href={TG_URL} variant="secondary">
            <MessageCircle className="size-4 mr-2" /> @swefd
          </CTA>
        </div>
        <p className="mt-16 text-xs text-neutral-400">
          © 2026 · Webspirio · Розробка під ключ
        </p>
      </div>
    </section>
  )
}
