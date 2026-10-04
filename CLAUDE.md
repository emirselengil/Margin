# Margin

Uygulamanın adı **Margin** (logo ve sayfa başlıklarında bu ad kullanılır). Bir okulun etüt takibi için web uygulaması. Asistan öğretmenler her etütte öğrenci için kayıt girer (ödev, kitap, not), baş öğretmenler kendi öğrencilerinin kayıtlarını yalnızca görüntüler, yönetici her şeyi yönetir. İlk aşama web; ileride mobil uygulama gelecek, bu yüzden iş mantığı arayüzden ayrı tutulmalı.

Arayüz dili Türkçe. Kod (değişken, fonksiyon, tablo adları) İngilizce olabilir; kullanıcıya görünen her metin Türkçe olmalı.

## Teknoloji

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- Veritabanı: Neon (sunucusuz PostgreSQL)
- ORM: Drizzle ORM + `@neondatabase/serverless` sürücüsü, migration'lar `drizzle-kit` ile
- Giriş: Neon Auth (`@neondatabase/auth`), yalnızca e-posta + şifre
- Yayın: Vercel
- Test: Vitest (yetki kuralları için birim testleri)

### Neon Auth kurulumu

Kurulumdan önce güncel belgeyi kontrol et: https://neon.com/docs/auth/quick-start/nextjs

- `lib/auth/server.ts` → `createNeonAuth()` ile sunucu tarafı auth nesnesi (`getSession()`, `handler()`, `middleware()`)
- `lib/auth/client.ts` → `createAuthClient()` ile tarayıcı tarafı
- `app/api/auth/[...path]/route.ts` → `auth.handler()`
- `middleware.ts` (Next.js 16+ ise `proxy.ts`) → `auth.middleware({ loginUrl: '/giris' })` ile korumalı sayfalar
- Kayıt: `signUp.email({ name, email, password })`

Neon Auth kullanıcıları kendi tablolarında tutar. Uygulamaya ait bilgiler (rol, aktiflik vb.) bizim `profiles` tablomuzda, Neon Auth kullanıcı kimliğine bağlı olarak tutulur. İlk girişte profil yoksa `pending` rolüyle oluşturulur.

### Ortam değişkenleri (`.env.local`, asla commit edilmez)

```
DATABASE_URL=            # Neon bağlantı adresi
NEON_AUTH_BASE_URL=      # Neon Console'daki Auth URL
NEON_AUTH_COOKIE_SECRET= # en az 32 karakter: openssl rand -base64 32
```

`.env.example` dosyasında yalnızca anahtar adları bulunur.

## Roller

| Rol | Kod | Ne yapabilir |
|---|---|---|
| Yönetici | `admin` | Her şeyi görür ve değiştirir: kullanıcı onayı, roller, asistan–baş öğretmen bağları, öğrenciler, etüt günleri, tüm kayıtlar |
| Baş öğretmen | `head_teacher` | Yalnızca kendisine atanmış öğrencileri ve onların kayıtlarını **görüntüler**. Hiçbir şeyi değiştiremez |
| Asistan öğretmen | `assistant` | Bağlı olduğu baş öğretmenlerin öğrencilerini görür; bu öğrencilere kayıt ekler/düzenler; bu öğrencilerin etüt günlerini düzenler |
| Onay bekliyor | `pending` | Kayıt olmuş ama yönetici onaylamamış. Hiçbir veriye erişemez, yalnızca "Hesabınız onay bekliyor" ekranını görür |

- Kayıt ekranında rol seçilmez. Kayıt olan herkes `pending` olur; rolü yönetici atar.
- `is_active = false` olan kullanıcı giriş yapsa bile hiçbir veriye erişemez.
- Bir asistan birden fazla baş öğretmene bağlı olabilir.
- Öğrencinin asistanı ayrıca tutulmaz: öğrencinin baş öğretmenine bağlı asistanlardan türetilir.

## Yetki kuralları (en önemli bölüm)

Neon'da satır düzeyinde güvenlik kullanmıyoruz; yetki **sunucu tarafında, tek bir yerde** uygulanır.

- Tarayıcı veritabanına asla doğrudan erişmez. Tüm okuma/yazma işlemleri Server Action veya Route Handler içinde yapılır.
- Tüm yetki kontrolleri `lib/permissions.ts` dosyasındadır. Her sunucu işlemi önce oturumu alır, sonra bu dosyadaki fonksiyonla kontrol eder. Sayfa veya bileşen içinde ayrı yetki mantığı yazma.
- Örnek fonksiyonlar:
  - `requireRole(user, ...roles)`
  - `canViewStudent(user, studentId)`
  - `canWriteRecord(user, studentId)`: yalnızca `admin` ve öğrenciye bağlı `assistant`
  - `canEditStudentDays(user, studentId)`: `admin` ve bağlı `assistant`
  - `visibleStudentIds(user)`: listelerde filtre olarak kullanılır
- Listeler her zaman `visibleStudentIds` ile filtrelenir; arayüzde gizlemek yetmez.
- Yetkisiz istek → 403 ve Türkçe hata mesajı.
- Her kural için Vitest testi yazılır. Örnekler:
  - Baş öğretmen kayıt eklemeye çalışınca reddedilir.
  - Asistan bağlı olmadığı baş öğretmenin öğrencisini göremez.
  - `pending` kullanıcı hiçbir öğrenciyi göremez.

## Veri modeli (Drizzle, `db/schema.ts`)

```
profiles
  id               uuid pk           -- Neon Auth kullanıcı kimliği
  first_name       text
  last_name        text
  email            text unique
  role             enum('admin','head_teacher','assistant','pending') default 'pending'
  is_active        boolean default true
  created_at       timestamptz

assistant_head_teachers                 -- asistan ↔ baş öğretmen bağı (çoka çok)
  assistant_id     uuid fk → profiles
  head_teacher_id  uuid fk → profiles
  pk(assistant_id, head_teacher_id)

students
  id               uuid pk
  full_name        text
  class_name       text              -- örn. '8-A'
  head_teacher_id  uuid fk → profiles
  is_active        boolean default true
  created_at       timestamptz

student_study_days                      -- öğrenci hangi gün etüde geliyor
  student_id       uuid fk → students
  weekday          smallint          -- 0 = Pazartesi … 6 = Pazar
  pk(student_id, weekday)

study_records                           -- her etüt için bir kayıt
  id               uuid pk
  student_id       uuid fk → students
  date             date
  homework         enum('done','missing')
  book             enum('brought','not_brought')
  note             text null
  created_by       uuid fk → profiles
  created_at       timestamptz
  updated_at       timestamptz
  edited_by_admin  boolean default false
  unique(student_id, date)          -- bir öğrenciye günde bir kayıt

record_history                          -- yönetici düzeltmelerinin geçmişi
  id               uuid pk
  record_id        uuid fk → study_records
  changed_by       uuid fk → profiles
  before           jsonb
  after            jsonb
  changed_at       timestamptz
```

Yönetici bir kaydı değiştirdiğinde `edited_by_admin = true` olur ve `record_history` tablosuna eski/yeni hali yazılır.

## Ekranlar

Tasarımlar `tasarim/` klasöründe (açık ve koyu tema). Ekranları bu görsellere olabildiğince sadık yap.

**Genel**
- `/giris`: e-posta, şifre, "Beni hatırla", "Şifremi unuttum", "Kayıt ol" bağlantısı. "Veli" ve "Öğrenci" sekmeleri pasif ("yakında")
- `/kayit`: ad, soyad, e-posta, şifre (güç göstergesi), şifre tekrar, KVKK onay kutusu
- `/onay-bekliyor`: `pending` kullanıcıların gördüğü ekran

**Asistan öğretmen**
- `/etut`: Etüt listesi
  - hafta şeridi (gün seçimi, günlük öğrenci sayısı)
  - özet kutuları: kayıt girildi x/y, gelecek öğrenci, ödev eksik, kitap getirmedi
  - öğrenci tablosu: ödev ve kitap doğrudan tablodan tek tıkla girilir, anında kaydedilir
- `/etut/[ogrenciId]`: Öğrenci detayı ve kayıt formu
  - solda günün öğrenci listesi
  - sağda büyük seçim kartları, hazır not kısayolları ve geçmiş zaman çizelgesi
- `/gruplar`: Gün grupları
  - öğrenci × gün tablosu
  - günlük yoğunluk grafiği
  - kaydedilmemiş değişiklik uyarısı

**Baş öğretmen** (salt görüntüleme, hiçbir düzenleme kontrolü görünmez)
- `/ogrencilerim`: özet kutuları, hafta şeridi, bugünün durumu, son 4 etüt göstergesi
- `/ogrencilerim/[ogrenciId]`: özet, son 4 etüt şeritleri, kayıt zaman çizelgesi ("Giren: …")

**Yönetici**
- `/yonetim/ogretmenler`
  - onay bekleyenler: rol seçip onayla/reddet
  - öğretmen tablosu
  - sağ panel: rol, bağlı baş öğretmenler, hesap aktif anahtarı, şifre sıfırlama, silme
- `/yonetim/ogrenciler`
  - tablo, baş öğretmene göre filtre
  - sağ panelde düzenleme: ad, sınıf, baş öğretmen, etüt günleri
  - öğrenci ekleme ve silme
- `/yonetim/kayitlar`
  - tüm kayıtlar; tarih, baş öğretmen ve "yalnızca eksikler" filtreleri
  - satır içi düzeltme ve silme, "düzenlendi" etiketi

Girişten sonra yönlendirme rol'e göre yapılır:
- `admin` → `/yonetim/ogretmenler`
- `head_teacher` → `/ogrencilerim`
- `assistant` → `/etut`
- `pending` → `/onay-bekliyor`

## Tasarım kuralları

- Yazı tipleri: **Geist** (arayüz) ve **Geist Mono** (tarih, sayı, sınıf kodu). `next/font` ile yükle.
- Açık ve koyu tema; kullanıcı sağ üstteki ay/güneş düğmesiyle değiştirir, tercih saklanır. Varsayılan sistem tercihidir. Tailwind `dark:` sınıfları ve CSS değişkenleri kullan.
- Renk değişkenleri:

| Değişken | Açık | Koyu |
|---|---|---|
| bg | #F4F4F1 | #0B0B0E |
| surface | #FFFFFF | #141418 |
| surface-2 | #FAFAF8 | #18181D |
| sunken | #F1F1ED | #0F0F12 |
| line | #E4E3DE | #26262D |
| line-2 | #D3D1CA | #38383F |
| ink | #17171A | #EDEDF1 |
| ink-2 | #45454D | #BDBDC6 |
| muted | #6B6B73 | #8E8E99 |
| accent | #4F46E5 | #5B53EE |
| accent-soft | #ECEBFC | #22214A |
| accent-text | #3730C4 | #B3AEFF |
| warn | #C2410C | #F97316 |
| warn-soft | #FDF0E7 | #2A160C |
| warn-text | #A83A0B | #FDBA74 |

- Olumlu durum (Yapıldı, Getirdi) → accent tonları; eksik durum (Eksik, Getirmedi) → warn tonları. Renk tek başına anlam taşımaz; metin ve ✓ / – işaretleri de kullanılır.
- Baş öğretmen renkleri: avatar ve küçük kare işaretlerde her baş öğretmene ayırt edici bir renk.
- Düzen: solda menü, sağda yuvarlatılmış (16px) ve hafif gölgeli içerik paneli. Telefon genişliğinde menü üste geçer, tablolar yatay kayar.
- Erişilebilirlik: gerçek `<button>`, `<a>`, `<label>` kullan; ikon düğmelerine `aria-label`; tıklanabilir alanlar en az 36–44px; metin kontrastı en az 4.5:1.
- Emoji kullanma; ikonlar için `lucide-react`.

## Çalışma şekli

- Her adımı küçük tut, bitince nasıl test edeceğimi anlat ve çalışan hali commit et.
- Önerilen sıra:
  1. Kurulum + Neon Auth + giriş/kayıt + rol yönlendirmesi
  2. Drizzle şeması, migration, örnek veri (seed)
  3. `lib/permissions.ts` + testleri
  4. Asistan ekranları
  5. Baş öğretmen ekranları
  6. Yönetici paneli
  7. Tema, son dokunuşlar, Vercel'e yayın
- Veritabanı şemasını değiştirirken her zaman migration üret (`drizzle-kit generate`), elle SQL çalıştırma.
- Gizli bilgileri (bağlantı adresi, anahtarlar) koda veya commit'e yazma.
- Emin olmadığın bir iş kuralında tahmin yürütme, bana sor.

## Mobil uygulama (`mobile/`)

Expo (React Native) ile Android uygulaması; web ile aynı sunucuyu ve aynı yetki kurallarını kullanır, ayrı bir veritabanı/iş mantığı yoktur.

- Sunucu tarafı: `app/api/mobile/**` ince Route Handler'lardır; yetkiler yine `lib/permissions.ts` ve mevcut sunucu eylemlerinde uygulanır. Kimlik, `Authorization: Bearer <oturum belirteci>` ile gelir (`lib/auth/mobile.ts`, `lib/profile.ts`); web çerezle çalışmaya devam eder.
- Mobil kodu `mobile/src` altında (Expo Router). Tasarım jetonları `mobile/src/theme.ts` ve tarih kuralları `mobile/src/lib/date.ts` içinde web'dekinin kopyasıdır; web'de renk/tarih kuralı değişirse buraya da yansıt.
- Sunucu adresi `mobile/.env.local` içinde `EXPO_PUBLIC_API_URL` (örnek: `mobile/.env.example`).
- Şu an kapsam: asistan ve baş öğretmen rolleri + profil. Yönetici paneli yalnızca web'de.
- Windows'ta kullanıcı adında boşluk varsa yerel Android derlemesi NDK kısa-yol (8.3) yüzünden bağlama hatası verir; SDK'ya boşluksuz bir junction (`C:sdk`) ile derleyin ve `ANDROID_HOME`/`sdk.dir` olarak onu verin.

## Komutlar

```
npm run dev              # geliştirme sunucusu (Neon "dev" dalına bağlı)
npm run build            # üretim derlemesi
npm run test             # Vitest
npm run db:generate      # drizzle-kit generate
npm run db:migrate       # migration'ı GELİŞTİRME (dev dalı) veritabanına uygular
npm run db:migrate:prod  # migration'ı CANLI veritabanına uygular (bilerek, deploy öncesi)
npm run db:seed          # örnek veri (yalnızca dev; canlıda reddedilir)
```

### Geliştirme ve canlı ayrımı

- `.env.local` CANLI veritabanı ve Auth adreslerini tutar (Vercel ile aynı). `.env.development.local` Neon'daki `dev` dalını gösterir; `npm run dev` ve `db:*` komutları ve tek seferlik betikler (`db/load-env.ts`) varsayılan olarak bunu kullanır. Dosya yoksa canlıya düşmek yerine durur.
- Canlıya yalnızca `npm run db:migrate:prod` bağlanır (şema değişikliğinde: önce `db:migrate` ile dev'de dene, kodu push et, sonra canlıya `db:migrate:prod`).
- Her iki dosya da git'e girmez. Test için geçici hesap/veri gerekirse dev dalında oluştur.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
