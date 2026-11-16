// Uygulama puan, yıldız ve sistem ayarları
export const APP_SETTINGS = {
  "storageVersion": "1.3.0",
  "storageKey": "sahabeyi_tani_state_v1",
  "minQuestionsForReadySahabi": 20,
  "quiz": {
    "baseCorrectPoints": 100,
    "streakIncrement": 10,
    "wrongPoints": 0,
    "sahabiModes": [
      {"id": "quick10", "label": "10 Soruluk Hızlı Test", "count": 10, "isOfficial": false},
      {"id": "full20", "label": "20 Soruluk Tam Test", "count": 20, "isOfficial": true},
      {"id": "all", "label": "Tüm Sorular", "count": 20, "isOfficial": false},
      {"id": "mistakes", "label": "Yanlış Yaptıklarım", "count": 0, "isOfficial": false}
    ],
    "categoryModes": [
      {"id": "quick10", "label": "10 Soruluk Hızlı Test", "count": 10, "isOfficial": false},
      {"id": "standard20", "label": "20 Soruluk Standart Test", "count": 20, "isOfficial": true},
      {"id": "long40", "label": "40 Soruluk Uzun Test", "count": 40, "isOfficial": true},
      {"id": "all", "label": "Tüm Sorular", "count": 9999, "isOfficial": false},
      {"id": "mistakes", "label": "Yanlış Yaptıklarım", "count": 0, "isOfficial": false}
    ],
    "mixedCounts": [10, 20, 40]
  },
  "stars": {
    "maxStars": 5,
    "thresholds": [
      {"minPercent": 100, "stars": 5},
      {"minPercent": 80, "stars": 4},
      {"minPercent": 60, "stars": 3},
      {"minPercent": 40, "stars": 2},
      {"minPercent": 0, "stars": 1}
    ]
  },
  "whoAmI": {
    "hintPoints": {
      "1": 100,
      "2": 80,
      "3": 60,
      "4": 40,
      "5": 20
    },
    "wrongGuessPenalty": -10,
    "passPoints": 0,
    "recentHistoryLimit": 5,
    "filters": [
      {"id": "all", "label": "Tüm Sahabîler"},
      {"id": "aserei-mubessere", "label": "Aşere-i Mübeşşere"},
      {"id": "muhacirler", "label": "Muhacirler"},
      {"id": "ensar", "label": "Ensar"},
      {"id": "oncu-hanimlar", "label": "Öncü Hanımlar"},
      {"id": "komutanlar", "label": "Komutanlar"},
      {"id": "ilim-ve-hadis", "label": "İlim ve Hadis"},
      {"id": "favorites", "label": "Favorilerim"},
      {"id": "completed", "label": "Tamamladığım Sahabîler"}
    ]
  },
  "themes": [
    { "id": "light", "name": "Fildişi & Zümrüt", "desc": "Ferah ve dengeli klasik görünüm", "preview": "#0F3D35" },
    { "id": "sepia", "name": "Kitap Kağıdı (Sepya)", "desc": "Göz yormayan sıcak okuma modu", "preview": "#7C4D25" },
    { "id": "slate", "name": "Modern Lacivert", "desc": "Sade ve kurumsal arduvaz tonları", "preview": "#1E3A5F" },
    { "id": "dark", "name": "Gece Modu", "desc": "Düşük ışık için koyu antrasit tema", "preview": "#0D151C" }
  ],
  "defaults": {
    "theme": "sepia",
    "homeView": "grid2x2",
    "categoryView": "card",
    "biographyView": "card",
    "testView": "card",
    "fontScale": 100
  }
};

export default APP_SETTINGS;
