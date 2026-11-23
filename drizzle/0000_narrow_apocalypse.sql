CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "barang" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "barang_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nama" varchar(160) NOT NULL,
	"satuan" varchar(16) NOT NULL,
	"harga_jual" integer NOT NULL,
	"stok" integer DEFAULT 0 NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "barang_harga_nonnegatif" CHECK ("barang"."harga_jual" >= 0),
	CONSTRAINT "barang_stok_nonnegatif" CHECK ("barang"."stok" >= 0)
);
--> statement-breakpoint
CREATE TABLE "barang_masuk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"waktu_dicatat" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"barang_id" integer NOT NULL,
	"jumlah_persepuluh" integer NOT NULL,
	"harga_beli" integer NOT NULL,
	"pemasok" varchar(200),
	"pengguna_id" text NOT NULL,
	CONSTRAINT "barang_masuk_jumlah_positif" CHECK ("barang_masuk"."jumlah_persepuluh" > 0),
	CONSTRAINT "barang_masuk_harga_nonnegatif" CHECK ("barang_masuk"."harga_beli" >= 0)
);
--> statement-breakpoint
CREATE TABLE "item_transaksi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaksi_id" uuid NOT NULL,
	"barang_id" integer NOT NULL,
	"jumlah_persepuluh" integer NOT NULL,
	"harga_satuan" integer NOT NULL,
	"subtotal" integer NOT NULL,
	CONSTRAINT "item_jumlah_positif" CHECK ("item_transaksi"."jumlah_persepuluh" > 0),
	CONSTRAINT "item_harga_nonnegatif" CHECK ("item_transaksi"."harga_satuan" >= 0),
	CONSTRAINT "item_subtotal_nonnegatif" CHECK ("item_transaksi"."subtotal" >= 0)
);
--> statement-breakpoint
CREATE TABLE "pembayaran_utang" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pembayaran_utang_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"pembeli_id" integer NOT NULL,
	"tanggal" timestamp with time zone DEFAULT now() NOT NULL,
	"nominal" integer NOT NULL,
	"pengguna_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pembayaran_nominal_positif" CHECK ("pembayaran_utang"."nominal" > 0)
);
--> statement-breakpoint
CREATE TABLE "pembeli" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pembeli_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nama" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "riwayat_harga_jual" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "riwayat_harga_jual_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"barang_id" integer NOT NULL,
	"harga_jual" integer NOT NULL,
	"berlaku_sejak" timestamp with time zone DEFAULT now() NOT NULL,
	"admin_id" text NOT NULL,
	CONSTRAINT "riwayat_harga_nonnegatif" CHECK ("riwayat_harga_jual"."harga_jual" >= 0)
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "transaksi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"waktu_dicatat" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"total" integer NOT NULL,
	"jumlah_dibayar" integer NOT NULL,
	"status" varchar(12) NOT NULL,
	"pembeli_id" integer,
	"kasir_id" text NOT NULL,
	CONSTRAINT "transaksi_total_nonnegatif" CHECK ("transaksi"."total" >= 0),
	CONSTRAINT "transaksi_dibayar_valid" CHECK ("transaksi"."jumlah_dibayar" >= 0 and "transaksi"."jumlah_dibayar" <= "transaksi"."total"),
	CONSTRAINT "transaksi_status_valid" CHECK ("transaksi"."status" in ('lunas', 'utang')),
	CONSTRAINT "transaksi_pembeli_jika_utang" CHECK ("transaksi"."jumlah_dibayar" = "transaksi"."total" or "transaksi"."pembeli_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"username" text NOT NULL,
	"display_username" text,
	"role" varchar(16) DEFAULT 'kasir' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_role_check" CHECK ("user"."role" in ('admin', 'kasir'))
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang_masuk" ADD CONSTRAINT "barang_masuk_barang_id_barang_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barang"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang_masuk" ADD CONSTRAINT "barang_masuk_pengguna_id_user_id_fk" FOREIGN KEY ("pengguna_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_transaksi" ADD CONSTRAINT "item_transaksi_transaksi_id_transaksi_id_fk" FOREIGN KEY ("transaksi_id") REFERENCES "public"."transaksi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_transaksi" ADD CONSTRAINT "item_transaksi_barang_id_barang_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barang"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembayaran_utang" ADD CONSTRAINT "pembayaran_utang_pembeli_id_pembeli_id_fk" FOREIGN KEY ("pembeli_id") REFERENCES "public"."pembeli"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembayaran_utang" ADD CONSTRAINT "pembayaran_utang_pengguna_id_user_id_fk" FOREIGN KEY ("pengguna_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riwayat_harga_jual" ADD CONSTRAINT "riwayat_harga_jual_barang_id_barang_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barang"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riwayat_harga_jual" ADD CONSTRAINT "riwayat_harga_jual_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_pembeli_id_pembeli_id_fk" FOREIGN KEY ("pembeli_id") REFERENCES "public"."pembeli"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_kasir_id_user_id_fk" FOREIGN KEY ("kasir_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;