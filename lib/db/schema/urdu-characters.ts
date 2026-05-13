import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";

export type UrduCharacterForms = {
  isolated: string;
  initial: string;
  medial: string;
  final: string;
};

export type UrduCharacterExample = {
  word: string;
  transliteration: string;
  meaning: string;
};

export type UrduCharacterExamples = {
  isolated: UrduCharacterExample;
  initial: UrduCharacterExample;
  medial: UrduCharacterExample;
  final: UrduCharacterExample;
};

export const urduCharacters = pgTable("urdu_characters", {
  id: integer("id").primaryKey(),
  character: text("character").notNull(),
  name: text("name").notNull(),
  forms: jsonb("forms").$type<UrduCharacterForms>().notNull(),
  examples: jsonb("examples").$type<UrduCharacterExamples>().notNull(),
});

export type UrduCharacter = typeof urduCharacters.$inferSelect;
export type NewUrduCharacter = typeof urduCharacters.$inferInsert;
