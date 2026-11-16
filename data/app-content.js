// Uygulama metinleri ve sabit içerikler
export const APP_CONTENT = {
  "appName": "SAHABEYİ TANI",
  "mainSlogan": "Hayatlarını öğren, örnekliklerini keşfet.",
  "subSlogan": "82 kutlu hayat, nice güzel örneklik.",
  "logoUrl": "./assets/images/logo.png",
  "playlistUrl": "https://youtube.com/playlist?list=PL_8CxP8Jmqo08Yg_5HUQqptvbnAi151vM&si=72Wxse9r7mohVSpM",
  "dua": {
    "text": "Dualarınızda anne babamı, eşimi, evlatlarımı ve beni de hatırlarsanız çok sevinirim."
  },
  "contact": {
    "title": "İstek, Öneri ve İletişim",
    "description": "Uygulama hakkındaki görüş, öneri, hata bildirimi ve katkılarınız için iletişim bağlantısı üzerinden doğrudan mesaj gönderebilirsiniz.",
    "buttonLabel": "Telegram ile Mesaj Gönder",
    "telegramUrl": "https://t.me/ByKim1"
  },
  "onboarding": {
    "title": "SAHABEYİ TANI",
    "subtitle": "Hayatlarını öğren, örnekliklerini keşfet.",
    "purposeText": "Sahabeyi Tanı; sahabîlerin (ra) hayatlarını, öne çıkan özelliklerini ve bizlere bıraktıkları örneklikleri daha yakından tanımak için hazırlanmıştır. Biyografileri okuyabilir, kategorileri inceleyebilir, testlerle bilgini ölçebilir ve ipuçlarıyla sahabîleri bulabilirsin.",
    "featuresTitle": "Uygulama İçeriğinde Neler Var?",
    "features": [
      {
        "icon": "book",
        "title": "82 Kapsamlı Sahabî Biyografisi",
        "text": "Her sahabî (ra) için hayat dönemleri, öne çıkan vasıflar, şehir bağlantısı, sesli dinleme ve hayatından alınacak dersler."
      },
      {
        "icon": "compass",
        "title": "14 Fazilet ve Örneklik Kategorisi",
        "text": "Aşere-i Mübeşşere, Muhacirler, Ensar, Öncü Hanımlar, Genç Sahabîler ve İlim Ehli gibi ortak halkalar."
      },
      {
        "icon": "star",
        "title": "1.640 Özgün Soru ve 5 Yıldız Sistemi",
        "text": "Her sahabî için 20 soruluk tam değerlendirme testi, kategori testleri, karışık testler ve yanlışlarım tekrarı."
      },
      {
        "icon": "lamp",
        "title": "Kimim Ben? Bağımsız İpucu Oyunu",
        "text": "Zordan kolaya 5 kademeli ipucuyla gizli sahabîyi bulma oyunu, rozetler ve görsel ders kartı paylaşımı."
      }
    ],
    "sourceCard": "Uygulamadaki içerikler, Muhammed Emin Yıldırım’ın ‘82 İl 82 Sahabî’ video serisindeki anlatımlar esas alınarak düzenlenmiştir.",
    "exploreButton": "Uygulamayı Keşfet",
    "sourceButton": "Kaynağı İncele"
  },
  "home": {
    "title": "SAHABEYİ TANI",
    "prompt": "Bugün kimi tanımak istersin?",
    "cards": [
      {
        "id": "biographies",
        "title": "SAHABÎLERİ TANI",
        "description": "Hayatlarını başlıklar ve kısa maddeler hâlinde oku.",
        "route": "#/biographies",
        "icon": "book"
      },
      {
        "id": "tests",
        "title": "TESTLER",
        "description": "Bir sahabî veya kategori seçerek bilgini ölç.",
        "route": "#/tests",
        "icon": "star"
      },
      {
        "id": "who-am-i",
        "title": "KİMİM BEN?",
        "description": "İpuçlarını açarak gizli sahabîyi bul.",
        "route": "#/who-am-i",
        "icon": "lamp"
      },
      {
        "id": "categories",
        "title": "KATEGORİLER",
        "description": "Sahabîleri ortak özelliklerine göre keşfet.",
        "route": "#/categories",
        "icon": "compass"
      }
    ]
  },
  "biographies": {
    "title": "SAHABÎLERİ TANI",
    "subtitle": "Hayatlarını, özelliklerini ve örnekliklerini keşfet."
  },
  "tests": {
    "title": "TESTLER",
    "subtitle": "Bilgini ölç, öğrendiklerini pekiştir.",
    "mainOptions": [
      {
        "id": "sahabi-tests",
        "title": "SAHABÎ TESTLERİ",
        "description": "Bir sahabî seç ve hayatıyla ilgili 20 soruluk testi çöz.",
        "icon": "book"
      },
      {
        "id": "category-tests",
        "title": "KATEGORİ TESTLERİ",
        "description": "Bir kategorideki farklı sahabîlerden gelen soruları çöz.",
        "icon": "compass"
      },
      {
        "id": "mixed-test",
        "title": "KARIŞIK TEST",
        "description": "Bütün hazır sorular arasından seçilen sorularla bilgini ölç.",
        "icon": "star"
      },
      {
        "id": "favorites-test",
        "title": "FAVORİLERİM",
        "description": "Favori sahabîlerinin testlerine ve favori sorularına hızlıca ulaş.",
        "icon": "heart"
      }
    ]
  },
  "whoAmI": {
    "title": "KİMİM BEN?",
    "description": "İpuçlarını kullanarak gizli sahabîyi bul. Ne kadar az ipucu açarsan o kadar çok puan kazanırsın."
  },
  "about": {
    "whyTitle": "Bu uygulama neden hazırlandı?",
    "whyText": "Sahabeyi Tanı; sahabîlerin (ra) hayatlarını yalnızca isimler ve olaylar üzerinden değil, sadakat, fedakârlık, ilim, cesaret, tebliğ ve güzel ahlak örnekleriyle tanımaya yardımcı olmak için hazırlanmıştır. Biyografiler, testler, kategoriler ve ipuçları sayesinde öğrenilen bilgilerin daha kalıcı hâle gelmesi amaçlanmaktadır.",
    "sourceTitle": "İçerik kaynağı",
    "sourceText": "Uygulamadaki sahabî biyografileri, sorular, ipuçları ve şehir bağlantıları, Muhammed Emin Yıldırım’ın ‘82 İl 82 Sahabî’ video serisindeki anlatımlar esas alınarak düzenlenmiştir.",
    "sourceUrl": "https://youtube.com/playlist?list=PL_8CxP8Jmqo08Yg_5HUQqptvbnAi151vM&si=72Wxse9r7mohVSpM",
    "noteText": "Bazı tarihî konularda farklı rivayetler bulunabilir. İçerikler, ilgili bölümdeki anlatım esas alınarak sadeleştirilmiştir.",
    "openPlaylistButton": "Kaynak Oynatma Listesini Aç",
    "showOnboardingButton": "Açılış Tanıtımını Göster"
  }
};

export default APP_CONTENT;
