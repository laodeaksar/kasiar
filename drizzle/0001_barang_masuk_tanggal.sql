ALTER TABLE "barang_masuk" ADD COLUMN "tanggal" date;
--> statement-breakpoint
UPDATE "barang_masuk" SET "tanggal" = ("waktu_dicatat" AT TIME ZONE 'UTC')::date WHERE "tanggal" IS NULL;
--> statement-breakpoint
ALTER TABLE "barang_masuk" ALTER COLUMN "tanggal" SET NOT NULL;
