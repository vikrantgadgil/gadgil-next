CREATE TABLE "urdu_user_words" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"roman" text NOT NULL,
	"urdu_script" text NOT NULL,
	"meaning" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "urdu_user_words_user_id_roman_unique" UNIQUE("user_id","roman")
);
