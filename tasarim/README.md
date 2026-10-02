# Margin tasarımları

Bu klasör Claude Code'un ekranları birebir uygulaması için referanstır. Uygulama kodu değildir; buradaki dosyaları projeye kopyalama, yalnızca görünümü, düzeni ve davranışı örnek al.

## Klasörler

- `kaynak/`: Her ekranın tasarım kaynağı (HTML). Renkler, boşluklar, yazı boyutları ve köşe yuvarlaklıkları için kesin değerler buradadır.
  - Her dosyanın altındaki `<script>` bloğunda bir `T` nesnesi vardır. `light` ve `dark` anahtarları açık ve koyu temanın renkleridir.
  - `{{t.accent}}` gibi ifadeler bu renklere bağlanır.
  - Örnek veriler (öğrenci adları vb.) yalnızca gösterim içindir.
- `gorsel/`: Ekranların açık ve koyu tema görüntüleri (PNG). Genel görünümü anlamak için.

## Ekran → sayfa eşleşmesi

| Dosya | Sayfa | Rol |
|---|---|---|
| 01-giris | `/giris` | herkes |
| 02-kayit | `/kayit` | herkes |
| 03-asistan-etut-listesi | `/etut` | asistan |
| 04-asistan-ogrenci-kayit | `/etut/[ogrenciId]` | asistan |
| 05-asistan-gun-gruplari | `/gruplar` | asistan |
| 06-bas-ogrencilerim | `/ogrencilerim` | baş öğretmen |
| 07-bas-ogrenci-detay | `/ogrencilerim/[ogrenciId]` | baş öğretmen |
| 08-yonetim-ogretmenler | `/yonetim/ogretmenler` | yönetici |
| 09-yonetim-ogrenciler | `/yonetim/ogrenciler` | yönetici |
| 10-yonetim-kayitlar | `/yonetim/kayitlar` | yönetici |

Tasarımla CLAUDE.md çelişirse CLAUDE.md geçerlidir.
