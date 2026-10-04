CREATE TABLE "institution_branches" (
	"institution_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	CONSTRAINT "institution_branches_institution_id_branch_id_pk" PRIMARY KEY("institution_id","branch_id")
);
--> statement-breakpoint
ALTER TABLE "institution_branches" ADD CONSTRAINT "institution_branches_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_branches" ADD CONSTRAINT "institution_branches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;