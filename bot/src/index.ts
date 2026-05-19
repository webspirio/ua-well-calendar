import { Bot } from "grammy"

// Skeleton — not wired up for the demo.
// Phase 1 turns this into the announcement worker that posts events
// into the community's forum topics via webhook (grammY + Hono).
const bot = new Bot(process.env.BOT_TOKEN ?? "dummy")
bot.command("start", (ctx) =>
  ctx.reply("Calendar bot. Open the Mini App from the menu."),
)
console.log("Bot skeleton — not started in demo mode.")
