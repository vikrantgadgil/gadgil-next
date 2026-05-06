CREATE TABLE "urdu_quiz_history" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"quiz_type" text NOT NULL,
	"question" text NOT NULL,
	"user_answer" text NOT NULL,
	"correct_answer" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "urdu_word_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"roman" text NOT NULL,
	"urdu_script" text NOT NULL,
	"components" jsonb NOT NULL,
	"meaning" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
