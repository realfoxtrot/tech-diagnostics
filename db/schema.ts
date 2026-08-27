import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ─── Дерево диагностики ────────────────────────────────────────────
// Вопросы: одно дерево, у каждого вопроса опции-ответы (options).
// Опция ведёт либо на другой вопрос (nextQuestionId), либо на решение/рекомендацию (resolutionId).

export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),            // текст вопроса
  category: text("category"),              // напр. "power", "display", "boot", "performance", "network"
  isFirst: integer("is_first").default(0), // стартовый вопрос (1 = да)
  order: integer("order").default(0),      // порядок в категории/дереве
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const questionOptions = sqliteTable("question_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  label: text("label").notNull(),          // текст ответа/опции
  nextQuestionId: integer("next_question_id").references(() => questions.id), // куда ведёт
  resolutionId: integer("resolution_id").references(() => resolutions.id),    // если ответ = финал
  order: integer("order").default(0),
});

// ─── Решения / рекомендации (траблшутинг) ──────────────────────────
export const resolutions = sqliteTable("resolutions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),          // короткое название проблемы/решения
  description: text("description").notNull(), // рекомендация для пользователя
  steps: text("steps", { mode: "json" }),  // пошаговая инструкция (массив строк)
  needsFollowUp: integer("needs_follow_up").default(0), // 1 = после рекомендации спросить "помогло?"
  nextResolutionId: integer("next_resolution_id"), // если "не помогло" → следующая рекомендация (цепочка; валидация в приложении)
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// ─── Сервисные центры ──────────────────────────────────────────────
export const serviceCenters = sqliteTable("service_centers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  lat: text("lat"),                        // широта (для карты)
  lng: text("lng"),                        // долгота
  isActive: integer("is_active").default(1),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Сессии диагностики / обращения ────────────────────────────────
export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketNumber: text("ticket_number").notNull().unique(), // номер обращения (человекочитаемый)
  // История диалога: массив {questionId, question, answer, optionLabel, timestamp}
  transcript: text("transcript", { mode: "json" }).notNull(),
  // Итоговый диагноз: {category, problemTitle, resolutionId, resolutionTitle, outcome}
  diagnosis: text("diagnosis", { mode: "json" }),
  outcome: text("outcome").default("pending"), // pending | resolved_self | referral
  serviceCenterId: integer("service_center_id").references(() => serviceCenters.id),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});
