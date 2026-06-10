// Türkçe, İngilizce ve Almanca çeviriler
export type Lang = "tr" | "en" | "de";

export const LANGS: Lang[] = ["tr", "en", "de"];

export const translations: Record<Lang, Record<string, string>> = {
  tr: {
    // Header
    "header.title": "StilAI",
    "app.tagline": "Sanal gardırop & stil danışmanı",
    "auth.signIn": "Giriş Yap",

    // Wardrobe Panel
    "wardrobe.title": "Gardırop",
    "wardrobe.subtitle": "Kıyafetlerini yükle, AI etiketlesin.",
    "wardrobe.count": "parça",
    "wardrobe.upload": "Fotoğraf yükle",
    "wardrobe.uploadHint": "Ön / arka — PNG, JPG",
    "wardrobe.addUrl": "🔗 Linkten ekle",
    "wardrobe.urlPrompt": "Mağaza ürün linkini veya görsel linkini yapıştır:",
    "wardrobe.importing": "İçe aktarılıyor…",
    "wardrobe.empty": "Dolap boş",
    "wardrobe.emptyHint": "Başlamak için giysi yükleyin.",
    "wardrobe.analyze": "✨ AI ile etiketle",
    "wardrobe.remove": "Kaldır",
    "wardrobe.laundry": "🧺 Çamaşırları Yıka",
    "wardrobe.dirty": "kirli",
    "wardrobe.shop": "🛒 Benzerini bul",

    // Style Advisor Panel
    "advisor.title": "Stil Danışmanı",
    "advisor.subtitle": "Planını yaz, sana özel kombin önereyim.",
    "advisor.placeholder": "Bugünkü planın nedir?",
    "advisor.send": "Gönder",
    "advisor.tryInCabin": "🪞 Bu Kombini Kabinde Dene",
    "advisor.saveOutfit": "💾 Kombinlere Kaydet",

    // Suggestions
    "suggestion.1": "Akşam yemeğine çıkacağım, şık bir kombin öner",
    "suggestion.2": "Yarın iş görüşmem var, profesyonel görünmek istiyorum",
    "suggestion.3": "Hafta sonu rahat bir gezme kombini",

    // Weather
    "weather.error": "Hava durumu alınamadı",
    "weather.refresh": "Yenile",
    "weather.location": "📍",
    "weather.wind": "💨",

    // Virtual Cabin
    "cabin.title": "Sanal Kabin",
    "cabin.subtitle": "Seçtiğin kombini sanal olarak üzerinde gör.",
    "cabin.uploadPhoto": "Profil fotoğrafını yükle",
    "cabin.photoHint": "Tüm vücudun göründüğü bir fotoğraf en iyi sonucu verir.",
    "cabin.changePhoto": "🔄 Profil fotoğrafını değiştir",
    "cabin.trying": "Giydiriliyor…",
    "cabin.loading": "Sanal kabin hazırlanıyor…",
    "cabin.loadingHint": "VTON modeli görseli üretiyor, bu işlem 30-60 saniye sürebilir.",
    "cabin.error": "😕",
    "cabin.errorRetry": "Tekrar dene",
    "cabin.markWorn": "✓ Bugün Bunu Giyeceğim",
    "cabin.removingBg": "Arka plan kaldırılıyor…",
    "cabin.outfitTitle": "💡 Danışmanın önerdiği kombin",
    "cabin.outfitHint": "Bir parçaya dokunup üzerinde göster.",
    "cabin.letsTry": "✨ Hadi Deneyelim!",
    "cabin.needPhoto": "Önce bir profil fotoğrafı yükle.",
    "cabin.pickTitle": "Kombinini oluştur",
    "cabin.pickHint": "Her kategoriden en fazla bir parça seç. Seçmediğin kategori profil fotoğrafındaki gibi kalır.",
    "cabin.pickEmpty": "Denenebilecek kıyafet yok. Gardıroba kendi fotoğraflarından kıyafet ekle.",
    "cabin.slotTop": "Üst",
    "cabin.slotBottom": "Alt",
    "cabin.slotOuter": "Dış Giyim",
    "cabin.slotDress": "Elbise",
    "cabin.pickNone": "En az bir parça seç",
    "cabin.applyOutfit": "Giydir",
    "cabin.pickKeepHint": "Seçilmeyen alt/üst, fotoğraftaki haliyle kalır.",
    "cabin.pendingOutfit": "Danışmanın önerdiği kombin hazır — fotoğrafını yükle, otomatik giydirelim.",

    // Outfits Panel
    "outfits.title": "Kombinler",
    "outfits.subtitle": "Kombinlerini oluştur, kaydet ve favorile.",
    "outfits.create": "+ Kombin Oluştur",
    "outfits.empty": "Henüz kombin yok",
    "outfits.emptyHint": "Kendin oluştur ya da danışmanın önerilerini kaydet.",
    "outfits.all": "Tümü",
    "outfits.favorites": "⭐ Favoriler",
    "outfits.namePlaceholder": "Kombine bir isim ver",
    "outfits.save": "Kaydet",
    "outfits.cancel": "İptal",
    "outfits.pickItems": "Parçaları seç (en az 1)",
    "outfits.delete": "Sil",
    "outfits.tryCabin": "🪞 Kabinde dene",
    "outfits.aiBadge": "AI önerisi",
    "outfits.pieces": "parça",
    "outfits.saved": "Kombinlere kaydedildi ✓",

    // Welcome Screen
    "welcome.title": "Bugün ne giysem?",
    "welcome.subtitle": "Yapay zeka destekli stil danışmanınla seni bekliyor. Gardıropunu yönet, hava durumuna uygun kombinler keşfet ve sanal giydirme dene.",
    "welcome.btn.wardrobe": "🧥 Gardırop",
    "welcome.btn.advisor": "💬 Stil Danışmanı",
    "welcome.btn.cabin": "🪞 Sanal Kabin",
    "welcome.btn.outfits": "🗂️ Kombinler",

    // Tab Navigation
    "tab.wardrobe": "Gardırop",
    "tab.advisor": "Stil Danışmanı",
    "tab.cabin": "Sanal Kabin",
    "tab.outfits": "Kombinler",
    "tab.close": "Kapat",
  },

  en: {
    "header.title": "StilAI",
    "app.tagline": "Virtual wardrobe & style advisor",
    "auth.signIn": "Sign In",

    "wardrobe.title": "Wardrobe",
    "wardrobe.subtitle": "Upload clothes photos, AI will tag them.",
    "wardrobe.count": "items",
    "wardrobe.upload": "Upload Photo",
    "wardrobe.uploadHint": "Front / Back — PNG, JPG",
    "wardrobe.addUrl": "🔗 Add from link",
    "wardrobe.urlPrompt": "Paste a store product link or image link:",
    "wardrobe.importing": "Importing…",
    "wardrobe.empty": "Your wardrobe is empty",
    "wardrobe.emptyHint": "Upload clothes to get started.",
    "wardrobe.analyze": "✨ Tag with AI",
    "wardrobe.remove": "Remove",
    "wardrobe.laundry": "🧺 Wash Laundry",
    "wardrobe.dirty": "dirty",
    "wardrobe.shop": "🛒 Find similar",

    "advisor.title": "Style Advisor",
    "advisor.subtitle": "Tell me your plan, I'll suggest the perfect outfit.",
    "advisor.placeholder": "What's your plan today?",
    "advisor.send": "Send",
    "advisor.tryInCabin": "🪞 Try This Outfit in Cabin",
    "advisor.saveOutfit": "💾 Save to Outfits",

    "suggestion.1": "Going out for dinner, suggest a chic outfit",
    "suggestion.2": "I have a job interview tomorrow, want to look professional",
    "suggestion.3": "Weekend casual hangout with friends",

    "weather.error": "Weather unavailable",
    "weather.refresh": "Refresh",
    "weather.location": "📍",
    "weather.wind": "💨",

    "cabin.title": "Virtual Cabin",
    "cabin.subtitle": "See your selected outfit virtually on you.",
    "cabin.uploadPhoto": "Upload profile photo",
    "cabin.photoHint": "A photo showing your full body works best.",
    "cabin.changePhoto": "🔄 Change profile photo",
    "cabin.trying": "Processing…",
    "cabin.loading": "Preparing virtual cabin…",
    "cabin.loadingHint": "VTON model is generating the image, this may take 30-60 seconds.",
    "cabin.error": "😕",
    "cabin.errorRetry": "Try again",
    "cabin.markWorn": "✓ Wear This Today",
    "cabin.removingBg": "Removing background…",
    "cabin.outfitTitle": "💡 Advisor's recommended outfit",
    "cabin.outfitHint": "Tap a piece to show it on you.",
    "cabin.letsTry": "✨ Let's Try!",
    "cabin.needPhoto": "Upload a profile photo first.",
    "cabin.pickTitle": "Build your outfit",
    "cabin.pickHint": "Pick up to one item per category. Unselected categories stay as in your photo.",
    "cabin.pickEmpty": "No garments to try. Add clothes from your own photos to the wardrobe.",
    "cabin.slotTop": "Top",
    "cabin.slotBottom": "Bottom",
    "cabin.slotOuter": "Outerwear",
    "cabin.slotDress": "Dress",
    "cabin.pickNone": "Select at least one item",
    "cabin.applyOutfit": "Try On",
    "cabin.pickKeepHint": "Unselected top/bottom stay as in the photo.",
    "cabin.pendingOutfit": "The advisor's outfit is ready — upload your photo and we'll try it on automatically.",

    "outfits.title": "Outfits",
    "outfits.subtitle": "Create, save and favorite your outfits.",
    "outfits.create": "+ Create Outfit",
    "outfits.empty": "No outfits yet",
    "outfits.emptyHint": "Create your own or save the advisor's suggestions.",
    "outfits.all": "All",
    "outfits.favorites": "⭐ Favorites",
    "outfits.namePlaceholder": "Name your outfit",
    "outfits.save": "Save",
    "outfits.cancel": "Cancel",
    "outfits.pickItems": "Pick items (at least 1)",
    "outfits.delete": "Delete",
    "outfits.tryCabin": "🪞 Try in cabin",
    "outfits.aiBadge": "AI pick",
    "outfits.pieces": "items",
    "outfits.saved": "Saved to outfits ✓",

    "welcome.title": "What should I wear today?",
    "welcome.subtitle": "Your AI-powered style advisor awaits. Manage your wardrobe, discover outfits suited to the weather, and try virtual try-on.",
    "welcome.btn.wardrobe": "🧥 Wardrobe",
    "welcome.btn.advisor": "💬 Style Advisor",
    "welcome.btn.cabin": "🪞 Virtual Cabin",
    "welcome.btn.outfits": "🗂️ Outfits",

    "tab.wardrobe": "Wardrobe",
    "tab.advisor": "Style Advisor",
    "tab.cabin": "Virtual Cabin",
    "tab.outfits": "Outfits",
    "tab.close": "Close",
  },

  de: {
    "header.title": "StilAI",
    "app.tagline": "Virtueller Kleiderschrank & Stilberater",
    "auth.signIn": "Anmelden",

    "wardrobe.title": "Kleiderschrank",
    "wardrobe.subtitle": "Lade Kleidung hoch, die KI markiert sie.",
    "wardrobe.count": "Teile",
    "wardrobe.upload": "Foto hochladen",
    "wardrobe.uploadHint": "Vorne / Hinten — PNG, JPG",
    "wardrobe.addUrl": "🔗 Per Link hinzufügen",
    "wardrobe.urlPrompt": "Produkt- oder Bildlink einfügen:",
    "wardrobe.importing": "Wird importiert…",
    "wardrobe.empty": "Schrank ist leer",
    "wardrobe.emptyHint": "Lade Kleidung hoch, um zu starten.",
    "wardrobe.analyze": "✨ Mit KI markieren",
    "wardrobe.remove": "Entfernen",
    "wardrobe.laundry": "🧺 Wäsche waschen",
    "wardrobe.dirty": "schmutzig",
    "wardrobe.shop": "🛒 Ähnliches finden",

    "advisor.title": "Stilberater",
    "advisor.subtitle": "Schreib deinen Plan, ich schlage ein Outfit vor.",
    "advisor.placeholder": "Was hast du heute vor?",
    "advisor.send": "Senden",
    "advisor.tryInCabin": "🪞 Outfit in der Kabine testen",
    "advisor.saveOutfit": "💾 Zu Outfits speichern",

    "suggestion.1": "Ich gehe zum Abendessen, schlag ein schickes Outfit vor",
    "suggestion.2": "Ich habe morgen ein Vorstellungsgespräch und will professionell aussehen",
    "suggestion.3": "Lässiges Wochenend-Outfit für Freunde",

    "weather.error": "Wetter nicht verfügbar",
    "weather.refresh": "Aktualisieren",
    "weather.location": "📍",
    "weather.wind": "💨",

    "cabin.title": "Virtuelle Kabine",
    "cabin.subtitle": "Sieh dein Outfit virtuell an dir.",
    "cabin.uploadPhoto": "Profilfoto hochladen",
    "cabin.photoHint": "Ein Ganzkörperfoto liefert die besten Ergebnisse.",
    "cabin.changePhoto": "🔄 Profilfoto ändern",
    "cabin.trying": "Wird angezogen…",
    "cabin.loading": "Virtuelle Kabine wird vorbereitet…",
    "cabin.loadingHint": "Das VTON-Modell erstellt das Bild, das dauert 30-60 Sekunden.",
    "cabin.error": "😕",
    "cabin.errorRetry": "Erneut versuchen",
    "cabin.markWorn": "✓ Das trage ich heute",
    "cabin.removingBg": "Hintergrund wird entfernt…",
    "cabin.outfitTitle": "💡 Vom Berater empfohlenes Outfit",
    "cabin.outfitHint": "Tippe auf ein Teil, um es anzuprobieren.",
    "cabin.letsTry": "✨ Los, probieren wir!",
    "cabin.needPhoto": "Lade zuerst ein Profilfoto hoch.",
    "cabin.pickTitle": "Stelle dein Outfit zusammen",
    "cabin.pickHint": "Wähle pro Kategorie höchstens ein Teil. Nicht gewählte Kategorien bleiben wie auf dem Foto.",
    "cabin.pickEmpty": "Keine Teile zum Anprobieren. Füge eigene Kleidungsfotos hinzu.",
    "cabin.slotTop": "Oberteil",
    "cabin.slotBottom": "Unterteil",
    "cabin.slotOuter": "Jacke/Mantel",
    "cabin.slotDress": "Kleid",
    "cabin.pickNone": "Wähle mindestens ein Teil",
    "cabin.applyOutfit": "Anprobieren",
    "cabin.pickKeepHint": "Nicht gewählte Teile bleiben wie auf dem Foto.",
    "cabin.pendingOutfit": "Das Outfit des Beraters ist bereit — lade dein Foto hoch, wir ziehen es automatisch an.",

    "outfits.title": "Outfits",
    "outfits.subtitle": "Erstelle, speichere und favorisiere deine Outfits.",
    "outfits.create": "+ Outfit erstellen",
    "outfits.empty": "Noch keine Outfits",
    "outfits.emptyHint": "Erstelle eigene oder speichere die Vorschläge des Beraters.",
    "outfits.all": "Alle",
    "outfits.favorites": "⭐ Favoriten",
    "outfits.namePlaceholder": "Benenne dein Outfit",
    "outfits.save": "Speichern",
    "outfits.cancel": "Abbrechen",
    "outfits.pickItems": "Teile wählen (mind. 1)",
    "outfits.delete": "Löschen",
    "outfits.tryCabin": "🪞 In Kabine testen",
    "outfits.aiBadge": "KI-Vorschlag",
    "outfits.pieces": "Teile",
    "outfits.saved": "Zu Outfits gespeichert ✓",

    "welcome.title": "Was soll ich heute anziehen?",
    "welcome.subtitle": "Dein KI-Stilberater wartet. Verwalte deinen Schrank, entdecke wetterpassende Outfits und teste die virtuelle Anprobe.",
    "welcome.btn.wardrobe": "🧥 Kleiderschrank",
    "welcome.btn.advisor": "💬 Stilberater",
    "welcome.btn.cabin": "🪞 Virtuelle Kabine",
    "welcome.btn.outfits": "🗂️ Outfits",

    "tab.wardrobe": "Schrank",
    "tab.advisor": "Stilberater",
    "tab.cabin": "Kabine",
    "tab.outfits": "Outfits",
    "tab.close": "Schließen",
  },
};

export function t(lang: Lang, key: string): string {
  return translations[lang]?.[key] || translations.en[key] || key;
}

/** Sıradaki dile geç (tr → en → de → tr). */
export function nextLang(lang: Lang): Lang {
  const i = LANGS.indexOf(lang);
  return LANGS[(i + 1) % LANGS.length];
}

/** Dilin bayrağı (toggle butonu için bir sonraki dili gösterir). */
export function langFlag(lang: Lang): string {
  return { tr: "🇹🇷", en: "🇬🇧", de: "🇩🇪" }[lang];
}

/** Tarayıcının sistem dilini algıla; desteklenmiyorsa Türkçe. */
export function detectSystemLang(): Lang {
  if (typeof navigator === "undefined") return "tr";
  const code = navigator.language?.split("-")[0]?.toLowerCase() ?? "tr";
  return (LANGS as string[]).includes(code) ? (code as Lang) : "tr";
}
