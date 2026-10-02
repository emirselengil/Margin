CREATE TYPE "public"."book_status" AS ENUM('brought', 'not_brought');--> statement-breakpoint
CREATE TYPE "public"."homework_status" AS ENUM('done', 'missing');--> statement-breakpoint
CREATE TABLE "assistant_head_teachers" (
	"assistant_id" text NOT NULL,
	"head_teacher_id" text NOT NULL,
	CONSTRAINT "assistant_head_teachers_assistant_id_head_teacher_id_pk" PRIMARY KEY("assistant_id","head_teacher_id")
);
--> statement-breakpoint
CREATE TABLE "record_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"record_id" uuid NOT NULL,
	"changed_by" text NOT NULL,
	"before" jsonb NOT NULL,
	"after" jsonb NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_study_days" (
	"student_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	CONSTRAINT "student_study_days_student_id_weekday_pk" PRIMARY KEY("student_id","weekday"),
	CONSTRAINT "student_study_days_weekday_check" CHECK ("student_study_days"."weekday" between 0 and 6)
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"class_name" text NOT NULL,
	"head_teacher_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"date" date NOT NULL,
	"homework" "homework_status",
	"book" "book_status",
	"note" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"edited_by_admin" boolean DEFAULT false NOT NULL,
	CONSTRAINT "study_records_student_date_unique" UNIQUE("student_id","date")
);
--> statement-breakpoint
ALTER TABLE "assistant_head_teachers" ADD CONSTRAINT "assistant_head_teachers_assistant_id_profiles_id_fk" FOREIGN KEY ("assistant_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_head_teachers" ADD CONSTRAINT "assistant_head_teachers_head_teacher_id_profiles_id_fk" FOREIGN KEY ("head_teacher_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_history" ADD CONSTRAINT "record_history_record_id_study_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."study_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_history" ADD CONSTRAINT "record_history_changed_by_profiles_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_study_days" ADD CONSTRAINT "student_study_days_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_head_teacher_id_profiles_id_fk" FOREIGN KEY ("head_teacher_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_records" ADD CONSTRAINT "study_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_records" ADD CONSTRAINT "study_records_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;