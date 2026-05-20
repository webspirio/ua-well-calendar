import type { CommentRow, EventRow, RsvpRow, UserRow } from "./queries"

// In-memory seed for the demo. Mirrors what supabase/seed.sql used to do.
// All edits during a session mutate these arrays. A page reload resets state.

export const users: UserRow[] = [
  { id: "00000000-0000-0000-0000-000000000001", tg_id: 111,  username: "oleksandr_admin", first_name: "Олександр", is_admin: true,  created_at: "2025-08-12T09:00:00+02:00" },
  { id: "00000000-0000-0000-0000-000000000002", tg_id: 222,  username: "maria_member",    first_name: "Марія",     is_admin: false, created_at: "2025-11-04T18:30:00+02:00" },
  { id: "00000000-0000-0000-0000-000000000003", tg_id: 333,  username: "pavlo_member",    first_name: "Павло",     is_admin: false, created_at: "2026-02-19T12:15:00+02:00" },
  { id: "00000000-0000-0000-0000-000000000010", tg_id: 1010, username: "andriy_k",        first_name: "Андрій",    is_admin: false, created_at: "2025-09-22T10:00:00+02:00" },
  { id: "00000000-0000-0000-0000-000000000011", tg_id: 1011, username: "iryna_p",         first_name: "Ірина",     is_admin: false, created_at: "2025-10-08T14:25:00+02:00" },
  { id: "00000000-0000-0000-0000-000000000012", tg_id: 1012, username: "dmytro_t",        first_name: "Дмитро",    is_admin: false, created_at: "2025-12-01T09:40:00+02:00" },
  { id: "00000000-0000-0000-0000-000000000013", tg_id: 1013, username: "natalia_m",       first_name: "Наталія",   is_admin: false, created_at: "2026-01-14T11:00:00+02:00" },
  { id: "00000000-0000-0000-0000-000000000014", tg_id: 1014, username: "sergiy_b",        first_name: "Сергій",    is_admin: false, created_at: "2025-07-30T16:00:00+02:00" },
  { id: "00000000-0000-0000-0000-000000000015", tg_id: 1015, username: "olena_sh",        first_name: "Олена",     is_admin: false, created_at: "2026-03-02T19:20:00+02:00" },
  { id: "00000000-0000-0000-0000-000000000016", tg_id: 1016, username: "yulia_k",         first_name: "Юлія",      is_admin: false, created_at: "2026-04-11T08:45:00+02:00" },
  { id: "00000000-0000-0000-0000-000000000017", tg_id: 1017, username: "bohdan_l",        first_name: "Богдан",    is_admin: false, created_at: "2025-06-15T12:00:00+02:00" },
  { id: "00000000-0000-0000-0000-000000000018", tg_id: 1018, username: "kateryna_i",      first_name: "Катерина",  is_admin: false, created_at: "2025-10-29T13:10:00+02:00" },
  { id: "00000000-0000-0000-0000-000000000019", tg_id: 1019, username: "vitaliy_h",       first_name: "Віталій",   is_admin: true,  created_at: "2025-05-04T09:30:00+02:00" },
  { id: "00000000-0000-0000-0000-00000000001a", tg_id: 1020, username: "anton_ya",        first_name: "Антон",     is_admin: true,  created_at: "2025-08-22T17:55:00+02:00" },
  { id: "00000000-0000-0000-0000-00000000001b", tg_id: 1021, username: "olena_m",         first_name: "Олена М.",  is_admin: false, created_at: "2025-07-08T15:00:00+02:00" },
  { id: "00000000-0000-0000-0000-00000000001c", tg_id: 1022, username: "taras_h",         first_name: "Тарас",     is_admin: false, created_at: "2026-02-26T10:30:00+02:00" },
  { id: "00000000-0000-0000-0000-00000000001d", tg_id: 1023, username: "anna_z",          first_name: "Анна",      is_admin: false, created_at: "2026-04-30T21:15:00+02:00" },
  { id: "00000000-0000-0000-0000-00000000001e", tg_id: 1024, username: "roman_d",         first_name: "Роман",     is_admin: false, created_at: "2025-12-19T11:45:00+02:00" },
]

const ADMIN = users[0].id

function event(
  id: string,
  title: string,
  description: string,
  location: string,
  starts_at: string,
  ends_at: string,
  type: EventRow["type"],
  capacity: number,
  image_url: string,
  speaker_user_id: string | null = null,
): EventRow {
  return {
    id, title, description, location, starts_at, ends_at, type, capacity,
    image_url, speaker_user_id,
    creator_id: ADMIN, tg_message_id: null, tg_chat_id: null,
  }
}

export const events: EventRow[] = [
  event("11111111-1111-1111-1111-000000000001", "Яхтинг Греція",
    "Тиждень у одному з найкращих регіонів для яхтингу: спокійні води, мальовничі острови, затишні бухти та атмосферні грецькі містечка. 🛥🏝",
    "Саронічна затока, Греція",
    "2026-05-02T12:00:00+02:00", "2026-05-09T18:00:00+02:00",
    "trip", 8, "events/sailing.jpg"),
  event("11111111-1111-1111-1111-000000000002", "Networking та Mastermind — Фрайбург",
    "Networking та Mastermind з потенційними учасниками UA WELL. Прокачай свій бізнес за 4 години разом з 20 власниками бізнесу. Знайомства, що відкривають можливості.",
    "Фрайбург",
    "2026-05-04T17:00:00+02:00", "2026-05-04T21:00:00+02:00",
    "offline", 12, "events/04.05.jpg"),
  event("11111111-1111-1111-1111-000000000003", "Vielleicht Vielleicht: продаємо собі Німеччину",
    "Online групова сесія стратегічного оптимізму.\nМодератор: Олександра Коваленко, психотерапевтка, сертифікований коуч.\n\nЗустріч, після якої ваші \"ні\" ❌ перетворяться на \"може бути\" ✅. Для тих, хто будує життя в Німеччині і хоче знайти в цьому свій сенс. 🔑",
    "Online",
    "2026-05-06T18:00:00+02:00", "2026-05-06T19:30:00+02:00",
    "online", 100, "events/06.05.jpg"),
  event("11111111-1111-1111-1111-000000000004", "Workshop — «Стратегії в бізнесі»",
    "Спікер: Віталій Горбань.\n\nБрейн-штормінг, де кожен буде включений в процес створення бізнес-стратегії для одного з учасників зустрічі.\n\n👋 Приходь, щоб пропрацювати стратегію твого бізнесу або допомогти колегам по Community.",
    "Штутгарт",
    "2026-05-07T17:00:00+02:00", "2026-05-07T20:00:00+02:00",
    "offline", 20, "events/07.05.jpg", "00000000-0000-0000-0000-000000000019"),
  event("11111111-1111-1111-1111-000000000005", "Трансформаційна гра «Успішні рішення»",
    "🎲🧘‍♀️ Трансформаційна гра з Оленою Марчук. Для тих, у кого є ціль, але вона не реалізується.\n\n🔎 Гра допоможе:\n • знайти рівень, де виник блок\n • зрозуміти справжню причину труднощів\n • прийняти цілісне рішення без внутрішнього конфлікту\n • зробити усвідомлений крок, який справді працює.\n\n❗️ Кількість місць обмежена ❗️",
    "м. Ульм",
    "2026-05-09T13:00:00+02:00", "2026-05-09T17:00:00+02:00",
    "offline", 10, "events/09.05.jpg"),
  event("11111111-1111-1111-1111-000000000006", "Аналіз ніші та конкурентів",
    "Як зрозуміти, що реально працює у маркетингу.\nСпікер: Антон Ященко — Online Marketing Manager та YouTube-creator, засновник відеопродакшену.\n\nТи дізнаєшся:\n🔹 як проводити глибокий аналіз ніші та конкурентів і приймати рішення на основі фактів\n🔹 як створити таблицю аналізу для побудови маркетингової стратегії\n🔹 як обрати ефективні платформи та розставити пріоритети в просуванні\n🔹 як аналізувати рекламу, сайти та соцмережі конкурентів\n🔹 як знаходити працюючі формати й точки росту для свого бізнесу.\n\n🎁 Бонус: розіграш розбору ніші одного з учасників з практичними рекомендаціями.",
    "Online",
    "2026-05-11T18:00:00+02:00", "2026-05-11T20:00:00+02:00",
    "online", 100, "events/11.05.jpg", "00000000-0000-0000-0000-00000000001a"),
  event("11111111-1111-1111-1111-000000000007", "Networking та Mastermind — Нюрнберг",
    "Networking та Mastermind з потенційними учасниками UA WELL.",
    "Нюрнберг",
    "2026-05-13T17:00:00+02:00", "2026-05-13T21:00:00+02:00",
    "offline", 12, "events/13.05.jpg"),
  event("11111111-1111-1111-1111-000000000008", "Mastermind — Фрідріхсхафен",
    "Зустріч підприємців в форматі розбору бізнес-кейсів учасників, на котрій ви знайдете відповідь на свій бізнес-запит, нові ідеї та нестандартні рішення.",
    "Фрідріхсхафен",
    "2026-05-15T17:00:00+02:00", "2026-05-15T21:00:00+02:00",
    "offline", 12, "events/15.05.jpg"),
  event("11111111-1111-1111-1111-000000000009", "Велотур Ендерсбах — Шондорф",
    "🚴‍♀️ Є маршрути про кілометри, а є маршрути про внутрішній стан. Цей тур — саме про те, щоб відпустити все зайве.\n\nМи вирушаємо з Ендерсбаха до затишного старовинного Шондорфа, де відчувається спокій і особлива німецька розміреність.\n\n📍 Приблизна дистанція: 40 км туди й назад (плюс-мінус)\n⏱️ Час в дорозі: 1,5–2 години в одну сторону, спокійним темпом\n🌿 Маршрут пройде через зелені дороги, виноградники та поля.",
    "Ендерсбах → Шондорф",
    "2026-05-16T10:00:00+02:00", "2026-05-16T14:00:00+02:00",
    "offline", 15, "events/16.05.jpg"),
  event("11111111-1111-1111-1111-00000000000a", "Networking та Mastermind — Мюнхен",
    "Networking та Mastermind з потенційними учасниками UA WELL.",
    "Мюнхен",
    "2026-05-18T17:00:00+02:00", "2026-05-18T21:00:00+02:00",
    "offline", 12, "events/18.05.jpg"),
  event("11111111-1111-1111-1111-00000000000b", "Розбір бізнес-кейсів: AI та автоматизація",
    "Разом з IT-експертами.\n\nТебе чекає:\n🔹 5 експертів в сфері IT (учасники UA WELL Community)\n🔹 3 бізнес-кейси учасників, які потребують автоматизації або впровадження AI\n🔹 розбір кожного кейсу в форматі: проблема → рішення → результат\n🔹 різні підходи від IT-експертів\n🔹 можливість побачити, як технології можуть оптимізувати процеси та збільшити прибуток.\n\n👉 Це можливість:\n— отримати нові ідеї для свого бізнесу\n— подивитися на AI не як на тренд, а як на інструмент.",
    "Online",
    "2026-05-20T18:00:00+02:00", "2026-05-20T20:00:00+02:00",
    "online", 100, "events/20.05.jpg"),
]

const E1 = "11111111-1111-1111-1111-000000000001"
const E2 = "11111111-1111-1111-1111-000000000002"
const E3 = "11111111-1111-1111-1111-000000000003"
const E4 = "11111111-1111-1111-1111-000000000004"
const E5 = "11111111-1111-1111-1111-000000000005"
const E6 = "11111111-1111-1111-1111-000000000006"
const E7 = "11111111-1111-1111-1111-000000000007"
const E8 = "11111111-1111-1111-1111-000000000008"
const E9 = "11111111-1111-1111-1111-000000000009"
const EA = "11111111-1111-1111-1111-00000000000a"
const EB = "11111111-1111-1111-1111-00000000000b"

function rsvp(event_id: string, user_id: string, status: RsvpRow["status"] = "going"): RsvpRow {
  return { event_id, user_id, status, attended: null }
}

export const rsvps: RsvpRow[] = [
  rsvp(E1, users[0].id), rsvp(E1, users[3].id), rsvp(E1, users[4].id), rsvp(E1, users[7].id),
  rsvp(E1, users[10].id), rsvp(E1, users[15].id), rsvp(E1, users[17].id),

  rsvp(E2, users[0].id), rsvp(E2, users[1].id), rsvp(E2, users[3].id), rsvp(E2, users[5].id),
  rsvp(E2, users[6].id), rsvp(E2, users[8].id), rsvp(E2, users[11].id), rsvp(E2, users[12].id),
  rsvp(E2, users[16].id),

  rsvp(E3, users[1].id), rsvp(E3, users[2].id), rsvp(E3, users[3].id), rsvp(E3, users[4].id),
  rsvp(E3, users[6].id), rsvp(E3, users[7].id), rsvp(E3, users[8].id), rsvp(E3, users[9].id),
  rsvp(E3, users[10].id), rsvp(E3, users[11].id), rsvp(E3, users[13].id), rsvp(E3, users[14].id),
  rsvp(E3, users[15].id), rsvp(E3, users[16].id),

  rsvp(E4, users[0].id), rsvp(E4, users[2].id), rsvp(E4, users[3].id), rsvp(E4, users[5].id),
  rsvp(E4, users[7].id), rsvp(E4, users[9].id), rsvp(E4, users[10].id), rsvp(E4, users[11].id),
  rsvp(E4, users[12].id), rsvp(E4, users[15].id), rsvp(E4, users[16].id), rsvp(E4, users[17].id),

  rsvp(E5, users[1].id), rsvp(E5, users[4].id), rsvp(E5, users[6].id), rsvp(E5, users[8].id),
  rsvp(E5, users[9].id), rsvp(E5, users[11].id), rsvp(E5, users[14].id), rsvp(E5, users[16].id),

  rsvp(E6, users[1].id), rsvp(E6, users[2].id), rsvp(E6, users[3].id), rsvp(E6, users[4].id),
  rsvp(E6, users[5].id), rsvp(E6, users[6].id), rsvp(E6, users[7].id), rsvp(E6, users[8].id),
  rsvp(E6, users[9].id), rsvp(E6, users[10].id), rsvp(E6, users[11].id), rsvp(E6, users[12].id),
  rsvp(E6, users[13].id), rsvp(E6, users[15].id), rsvp(E6, users[16].id), rsvp(E6, users[17].id),

  rsvp(E7, users[3].id), rsvp(E7, users[5].id), rsvp(E7, users[7].id), rsvp(E7, users[9].id),
  rsvp(E7, users[12].id), rsvp(E7, users[16].id),

  rsvp(E8, users[2].id), rsvp(E8, users[4].id), rsvp(E8, users[5].id), rsvp(E8, users[6].id),
  rsvp(E8, users[8].id), rsvp(E8, users[10].id), rsvp(E8, users[12].id), rsvp(E8, users[15].id),

  rsvp(E9, users[1].id), rsvp(E9, users[3].id), rsvp(E9, users[4].id), rsvp(E9, users[6].id),
  rsvp(E9, users[7].id), rsvp(E9, users[8].id), rsvp(E9, users[9].id), rsvp(E9, users[10].id),
  rsvp(E9, users[11].id), rsvp(E9, users[15].id), rsvp(E9, users[17].id), rsvp(E9, users[14].id),

  rsvp(EA, users[5].id), rsvp(EA, users[7].id), rsvp(EA, users[9].id), rsvp(EA, users[12].id),
  rsvp(EA, users[16].id),

  rsvp(EB, users[2].id), rsvp(EB, users[3].id), rsvp(EB, users[5].id), rsvp(EB, users[7].id),
  rsvp(EB, users[8].id), rsvp(EB, users[9].id), rsvp(EB, users[10].id), rsvp(EB, users[11].id),
  rsvp(EB, users[12].id), rsvp(EB, users[13].id), rsvp(EB, users[15].id), rsvp(EB, users[16].id),
  rsvp(EB, users[17].id),

  rsvp(E7, users[1].id, "cancelled"),
  rsvp(E7, users[2].id, "cancelled"),
  rsvp(EA, users[4].id, "cancelled"),
  rsvp(EA, users[17].id, "cancelled"),
  rsvp(E8, users[3].id, "cancelled"),
]

function comment(event_id: string, user_id: string, body: string, created_at: string): CommentRow {
  return { id: crypto.randomUUID(), event_id, user_id, body, created_at }
}

export const comments: CommentRow[] = [
  comment(E1, users[3].id,  "Незабутній досвід! Дякую за організацію 🛥",            "2026-05-09T19:15:00+02:00"),
  comment(E1, users[4].id,  "Ще раз — і скоро! 🌊",                                   "2026-05-09T20:42:00+02:00"),
  comment(E1, users[15].id, "Фото з заходу сонця — найкраще 🌅",                      "2026-05-10T08:30:00+02:00"),

  comment(E2, users[5].id,  "Знайомства закрили 2 партнерства за вечір 🤝",          "2026-05-04T22:30:00+02:00"),
  comment(E2, users[8].id,  "Дякую за теплий вечір, всім успіхів!",                  "2026-05-05T09:11:00+02:00"),

  comment(E3, users[1].id,  "Олександро, дякую! Це було потужно 💛",                  "2026-05-06T19:45:00+02:00"),
  comment(E3, users[6].id,  "Перевернула моє ставлення до \"може бути\"",            "2026-05-06T20:02:00+02:00"),
  comment(E3, users[10].id, "Запис буде доступний?",                                  "2026-05-07T11:20:00+02:00"),

  comment(E4, users[9].id,  "Виталію, дякую! Стратегія для мого бізнесу готова 🎯",   "2026-05-07T20:30:00+02:00"),
  comment(E4, users[11].id, "Найкорисніший воркшоп цього року",                       "2026-05-08T08:00:00+02:00"),
  comment(E4, users[15].id, "Чекаємо наступний 🙌",                                   "2026-05-08T14:05:00+02:00"),

  comment(E5, users[1].id,  "Прийняла важливе рішення завдяки грі. Дякую Олена! 💛",  "2026-05-09T18:00:00+02:00"),
  comment(E5, users[8].id,  "Глибока розмова в кінці варта окремого заходу",          "2026-05-09T22:15:00+02:00"),

  comment(E6, users[3].id,  "Буду! Дуже чекаю на цю лекцію 🔥",                       "2026-05-08T14:00:00+02:00"),
  comment(E6, users[6].id,  "Чи буде запис?",                                          "2026-05-09T09:30:00+02:00"),
  comment(E6, users[10].id, "Антоне, привіт! Готую кілька питань",                    "2026-05-09T16:45:00+02:00"),
  comment(E6, users[13].id, "Запрошуйте друзів — тема актуальна для всіх 👌",         "2026-05-10T08:15:00+02:00"),
  comment(E6, users[9].id,  "Місць ще багато?",                                        "2026-05-10T10:22:00+02:00"),

  comment(E7, users[12].id, "Перший раз буду на цій локації 🎯",                       "2026-05-09T17:00:00+02:00"),
  comment(E7, users[5].id,  "Хто з Праги їде? Шукаю попутника",                        "2026-05-10T09:00:00+02:00"),

  comment(E8, users[8].id,  "Рік як хотів сюди потрапити 🙌",                          "2026-05-08T11:30:00+02:00"),
  comment(E8, users[10].id, "Хто з Цюріха? Можу підвезти",                             "2026-05-09T12:15:00+02:00"),
  comment(E8, users[12].id, "Привезу свіжий бізнес-кейс на розбір",                    "2026-05-10T07:45:00+02:00"),

  comment(E9, users[7].id,  "Беру свого електробайка",                                 "2026-05-08T19:00:00+02:00"),
  comment(E9, users[9].id,  "Чи буде хтось без велосипеда? Можемо орендувати разом",  "2026-05-09T10:30:00+02:00"),
  comment(E9, users[3].id,  "Прогноз погоди обіцяє +18, ідеально 🌞",                  "2026-05-10T08:00:00+02:00"),
  comment(E9, users[11].id, "Я з родиною, можна?",                                      "2026-05-10T11:15:00+02:00"),

  comment(EA, users[9].id,  "Буду вперше, хвилююсь 😊",                                "2026-05-09T21:00:00+02:00"),
  comment(EA, users[12].id, "Беру 2 нових учасників, чекаємо знайомитись",             "2026-05-10T09:45:00+02:00"),

  comment(EB, users[5].id,  "Цікавий формат! Хто буде презентувати свій кейс?",        "2026-05-08T16:20:00+02:00"),
  comment(EB, users[13].id, "Тільки для учасників Community чи відкрита?",              "2026-05-09T14:00:00+02:00"),
  comment(EB, users[10].id, "Запишусь обовʼязково",                                     "2026-05-10T07:30:00+02:00"),
  comment(EB, users[8].id,  "Чекаю на запис, не зможу в живому ефірі 😢",              "2026-05-10T10:15:00+02:00"),
]

export const tables = {
  users,
  events,
  rsvps,
  comments,
} as const

export type TableName = keyof typeof tables
