import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "@auth/core/adapters";

// ---------------------------------------------------------------------------
// NextAuth required tables
// Column names must match @auth/drizzle-adapter expectations exactly.
// ---------------------------------------------------------------------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ---------------------------------------------------------------------------
// App-specific tables
// ---------------------------------------------------------------------------

export type AccountType = "traditional" | "roth" | "taxable" | "cash";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  traditional: "Traditional 401k/IRA",
  roth: "Roth 401k/IRA",
  taxable: "Taxable Brokerage",
  cash: "Cash / Other",
};

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  returnRate: number;
};

export type IncomeStream = {
  id: string;
  name: string;
  annualAmount: number;
  startAge: number;
  endAge: number | "";
};

export type RetirementInputs = {
  selfAge: number;
  spouseAge: number;
  accounts: Account[];
  annualSpending: number;
  inflationRate: number;
  longevityAge: number;
  ssAgeSelf: number | "";
  ssSelf: number;
  ssAgeSpouse: number | "";
  ssSpouse: number;
  incomeStreams: IncomeStream[];
  filingStatus: "single" | "mfj";
};

// ---------------------------------------------------------------------------
// Urdu Writing Practice tables
// ---------------------------------------------------------------------------

export type UrduLetterComponent = {
  letter_urdu: string;
  letter_roman: string;
  position: "initial" | "medial" | "final" | "standalone";
  form_note: string;
};

export type UrduWordComponents = UrduLetterComponent[];

export const urduWordCache = pgTable("urdu_word_cache", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  roman: text("roman").notNull(),
  urduScript: text("urdu_script").notNull(),
  components: jsonb("components").$type<UrduWordComponents>().notNull(),
  meaning: text("meaning"),
  pronunciationNote: text("pronunciation_note"),
  calligraphyNote: text("calligraphy_note"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const urduQuizHistory = pgTable("urdu_quiz_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  quizType: text("quiz_type").notNull(),
  question: text("question").notNull(),
  userAnswer: text("user_answer").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const retirementScenarios = pgTable("retirement_scenario", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  inputs: jsonb("inputs").$type<RetirementInputs>().notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});
