CREATE TYPE "public"."branch_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "branch_access_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assistant_id" text NOT NULL,
	"institution_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"status" "branch_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" text,
	CONSTRAINT "branch_access_requests_unique" UNIQUE("assistant_id","institution_id","branch_id")
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"level" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branches_name_level_unique" UNIQUE("name","level"),
	CONSTRAINT "branches_level_check" CHECK ("branches"."level" in ('ilkokul', 'ortaokul', 'lise'))
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_institutions" (
	"teacher_id" text NOT NULL,
	"institution_id" uuid NOT NULL,
	CONSTRAINT "teacher_institutions_teacher_id_institution_id_pk" PRIMARY KEY("teacher_id","institution_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "branch_access_requests" ADD CONSTRAINT "branch_access_requests_assistant_id_profiles_id_fk" FOREIGN KEY ("assistant_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_access_requests" ADD CONSTRAINT "branch_access_requests_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_access_requests" ADD CONSTRAINT "branch_access_requests_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_access_requests" ADD CONSTRAINT "branch_access_requests_decided_by_profiles_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_institutions" ADD CONSTRAINT "teacher_institutions_teacher_id_profiles_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_institutions" ADD CONSTRAINT "teacher_institutions_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;