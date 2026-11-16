# SAHABEYİ TANI — Web Uygulaması (v1.1)

**Ana Slogan:** Hayatlarını öğren, örnekliklerini keşfet.  
**İkinci Slogan:** 82 kutlu hayat, nice güzel örneklik.

**Sahabeyi Tanı**; sahabîlerin (ra) hayatlarını kapsamlı biyografiler, 14 fazilet kategorisi, 1.640 özgün çoktan seçmeli soru ve bağımsız "Kimim Ben?" ipucu oyunu aracılığıyla kolay, anlaşılır ve kalıcı biçimde öğretmek üzere tasarlanmış, **mobil öncelikli (mobile-first)** ve **statik** bir web uygulamasıdır (PWA).

---

## Son Güncellemede Değişen / Eklenen Dosyalar Özeti

Mevcut yayındaki sitenizi güncellerken tüm projeyi baştan kurmak istemiyorsanız yalnızca şu güncellenen dosyaları değiştirmeniz yeterlidir:

1. **Logo ve PWA İkonları (`assets/`)**:
   - `assets/images/logo.png` (Yeni uygulama logosu)
   - `assets/icons/icon-192.png` ve `assets/icons/icon-512.png` (Telefona uygulama olarak indirme ikonları)
   - `manifest.webmanifest` ve `service-worker.js`
2. **Stil ve Yazı Tipleri (`index.html` ve `css/`)**:
   - `index.html`: Başlıklar için **Cormorant Garamond**, menü/açıklama/sorular için **Manrope** Google Fonts bağlantısı ve OpenGraph (Telegram/WhatsApp önizleme) etiketleri.
   - `css/variables.css`, `css/main.css`, `css/components.css`, `css/pages.css`, `css/responsive.css`: Yeşil zemin (`.bio-hero-card`) altındaki kategori etiketlerinin parlak krem/altın kontrast düzeltmesi, Ana Sayfa 2x2 kutu görünümü, Dua kartı ve İletişim kartı stilleri.
3. **Veri Dosyaları (`data/`)**:
   - `data/app-content.js` ve `data/app-settings.js`: Açılış ekranı içerik rehberi, `۞ لَا تَنْسَوْنِي مِنْ صَالِحِ دُعَائِكُمْ ۞ — Beni hayır dualarınızda unutmayın` duası, `@ByKim1` (`t.me/ByKim1`) iletişim bilgileri ve `grid2x2` varsayılan görünüm ayarı.
   - `data/sahabis/episode-001.js` ... `episode-082.js`: Tüm 82 sahabî ismine `(ra)` eklendi.
4. **JavaScript Modülleri (`js/`)**:
   - `js/utils.js`, `js/storage.js`, `js/sharing.js`, `js/layout.js`, `js/home.js`, `js/biographies.js`, `js/quiz.js`, `js/profile.js`, `js/app.js`:
     - Ana sayfada varsayılan **2x2 Kutu** ve **Liste** görünüm seçici,
     - **Günün Sahabîsi ve Nebevî Dersi** köşesi,
     - Biyografi detayında **Sesli Dinle (TTS)**, **A- / A+ Punto Ayarı** ve **Ders Kartını İndir (PNG)** özelliği,
     - Test sonuç ekranında **Sonuç Kartını Görsel Olarak İndir (PNG)** özelliği,
     - **Telefona Uygulama Olarak İndir / Kur** rehberi ve tetikleyicisi.

---

## İçerik Kaynağı

Uygulamadaki bütün sahabî biyografileri, kategoriler, sorular, ipuçları ve şehir bağlantıları yalnızca **Muhammed Emin Yıldırım’ın “82 İl 82 Sahabî”** video serisindeki anlatımlar esas alınarak hazırlanmıştır:
- Kaynak Oynatma Listesi: [82 İl 82 Sahabî YouTube Oynatma Listesi](https://youtube.com/playlist?list=PL_8CxP8Jmqo08Yg_5HUQqptvbnAi151vM&si=72Wxse9r7mohVSpM)
- İletişim & Öneri: [Telegram @ByKim1](https://t.me/ByKim1)
