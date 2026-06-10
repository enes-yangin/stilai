"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WardrobePanel from "@/components/WardrobePanel";
import StyleAdvisorPanel from "@/components/StyleAdvisorPanel";
import VirtualCabinPanel from "@/components/VirtualCabinPanel";
import OutfitsPanel from "@/components/OutfitsPanel";
import WelcomeScreen from "@/components/WelcomeScreen";
import TabNavigation from "@/components/TabNavigation";
import AuthModal from "@/components/AuthModal";
import { detectSystemLang, nextLang, langFlag, t, type Lang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { flattenToWhite, downscaleImage } from "@/lib/imageClient";
import { categorize, categoryToClothType, type ClothType } from "@/lib/category";
import type {
  ChatMessage,
  GarmentTags,
  Outfit,
  TryOnState,
  WardrobeItem,
  Weather,
} from "@/lib/types";

type Tab = "wardrobe" | "advisor" | "cabin" | "outfits";

const DEFAULT_COORDS = { lat: 37.76, lon: 30.55 };
const uid = () => Math.random().toString(36).slice(2, 10);

function makeWelcomeMsg(lang: Lang): ChatMessage {
  return {
    id: "seed-welcome-msg",
    role: "assistant",
    content:
      lang === "en"
        ? "Hello! I'm your style advisor. Tell me your plans, and I'll suggest the perfect outfit based on your wardrobe and weather. ✨"
        : "Merhaba! Ben senin stil danışmanınım. Bugünkü planını yaz, gardırobuna ve hava durumuna göre sana özel bir kombin önereyim. ✨",
  };
}

export default function Home() {
  const { user, loading: authLoading, signOut, updateProfilePhoto } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  // --- Tab Navigation ---
  const [activeTab, setActiveTab] = useState<Tab | null>(null);

  // --- Dil ---
  const [lang, setLang] = useState<Lang>("tr");
  useEffect(() => {
    const detected = detectSystemLang();
    setLang(detected);
    setMessages([makeWelcomeMsg(detected)]);
  }, []);

  // --- Gardırop ---
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wardrobeLoaded, setWardrobeLoaded] = useState(false);
  const [importing, setImporting] = useState(false);

  // --- Kombinler ---
  const [outfits, setOutfits] = useState<Outfit[]>([]);

  // Ref: DB'ye yazılmış item ID'leri
  const dbItemIds = useRef<Set<string>>(new Set());

  // --- Stil danışmanı (chat) ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    makeWelcomeMsg("tr"),
  ]);
  const [sending, setSending] = useState(false);

  // --- Hava durumu ---
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | undefined>();

  // --- Sanal kabin ---
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [tryOn, setTryOn] = useState<TryOnState>({ loading: false });
  // Danışmanın önerdiği ve kabinde gösterilen kombin (parça ID'leri)
  const [outfitIds, setOutfitIds] = useState<string[]>([]);
  // Fotoğraf yokken seçilen kombin — fotoğraf yüklenince otomatik giydirilir
  const [pendingOutfit, setPendingOutfit] = useState<{
    top?: string; bottom?: string; outer?: string; dress?: string;
  } | null>(null);

  const selectedGarment = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );
  const outfit = useMemo(
    () =>
      outfitIds
        .map((id) => items.find((i) => i.id === id))
        .filter(Boolean) as WardrobeItem[],
    [items, outfitIds],
  );

  // ====================================================================
  //  AUTH — kullanıcı girişi/çıkışı
  // ====================================================================

  // Kullanıcı giriş yaptığında DB'den gardırobu yükle
  useEffect(() => {
    if (!user) {
      // Çıkış yapıldı — boş dolaba dön
      setItems([]);
      setSelectedId(null);
      setUserPhoto(null);
      setOutfits([]);
      setPendingOutfit(null);
      dbItemIds.current = new Set();
      setWardrobeLoaded(false);
      return;
    }

    // Zaten yüklendiyse tekrar yükleme
    if (wardrobeLoaded) return;

    // Kayıtlı profil fotoğrafını yükle
    if (user.profilePhoto) setUserPhoto(user.profilePhoto);

    (async () => {
      try {
        const res = await fetch(`/api/wardrobe?userId=${user.id}`);
        if (res.ok) {
          const dbItems: WardrobeItem[] = await res.json();
          if (dbItems.length > 0) {
            setItems(dbItems);
            setSelectedId(dbItems[0].id);
            dbItems.forEach((i) => dbItemIds.current.add(i.id));
          }
        }
        // Kombinleri de yükle
        const oRes = await fetch(`/api/outfits?userId=${user.id}`);
        if (oRes.ok) setOutfits(await oRes.json());
        setWardrobeLoaded(true);
      } catch {
        setWardrobeLoaded(true);
      }
    })();
  }, [user, wardrobeLoaded]);

  // ====================================================================
  //  HAVA DURUMU
  // ====================================================================
  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setWeatherLoading(true);
    setWeatherError(undefined);
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error("Hava durumu servisi yanıt vermedi");
      const data: Weather = await res.json();
      setWeather(data);
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon),
        { timeout: 8000 },
      );
    } else {
      fetchWeather(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon);
    }
  }, [fetchWeather]);

  // ====================================================================
  //  GARDIROP — yükleme, silme, arka plan kaldırma
  // ====================================================================
  // Bir dataURL'i gardıroba ekler: arka plan kaldır + (giriş yapıldıysa) DB'ye kaydet.
  const addImage = async (originalImage: string, name: string) => {
    const id = uid();
    const newItem: WardrobeItem = {
      id,
      name,
      frontImage: originalImage,
      originalImage,
      isDirty: false,
      wearCount: 0,
      removingBg: true,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedId((cur) => cur ?? id);

    // Arka planı kaldır
    let finalImage = originalImage;
    try {
      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: originalImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Arka plan kaldırılamadı");
      finalImage = data.resultUrl;
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, frontImage: finalImage, removingBg: false } : i,
        ),
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                removingBg: false,
                bgError:
                  err instanceof Error ? err.message : "Arka plan kaldırılamadı",
              }
            : i,
        ),
      );
    }

    // Giriş yaptıysa DB'ye kaydet
    if (user) {
      try {
        const res = await fetch("/api/wardrobe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            name,
            frontImage: finalImage,
            originalImage,
          }),
        });
        const data = await res.json();
        if (res.ok && data.id) {
          dbItemIds.current.add(data.id);
          setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, id: data.id } : i)),
          );
          setSelectedId((cur) => (cur === id ? data.id : cur));
        }
      } catch {
        /* DB hatası: yerel state'de devam et */
      }
    }
  };

  const handleAddFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        addImage(reader.result as string, file.name.replace(/\.[^.]+$/, ""));
      reader.readAsDataURL(file);
    });
  };

  // Mağaza entegrasyonu: ürün/görsel linkinden gardıroba ekle.
  // Başarılıysa null, hata varsa hata metni döndürür (inline gösterim için).
  const handleAddUrl = async (url: string): Promise<string | null> => {
    setImporting(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || !data.image) {
        return data.error || "İçe aktarma başarısız";
      }
      // Link'in domain'inden kaba bir isim üret
      let name = "Ürün";
      try {
        name = new URL(url).hostname.replace(/^www\./, "").split(".")[0];
        name = name.charAt(0).toUpperCase() + name.slice(1) + " ürünü";
      } catch {
        /* yoksa varsayılan */
      }
      await addImage(data.image, name);
      return null;
    } catch {
      return "İçe aktarma başarısız";
    } finally {
      setImporting(false);
    }
  };

  const handleRemove = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));

    if (user && dbItemIds.current.has(id)) {
      try {
        await fetch(`/api/wardrobe?id=${id}&userId=${user.id}`, {
          method: "DELETE",
        });
        dbItemIds.current.delete(id);
      } catch {
        // Sessizce devam et
      }
    }
  };

  // ====================================================================
  //  KIYAFEt ANALİZİ — LLaVA
  // ====================================================================
  const handleAnalyze = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, analyzing: true, error: undefined } : i,
      ),
    );

    try {
      // Görseli küçült — büyük/yüksek çözünürlüklü fotolarda 413 (too large) hatasını önler
      const smallImage = await downscaleImage(item.frontImage, 1024, 0.85);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: smallImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analiz başarısız");

      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, analyzing: false, tags: data.tags } : i,
        ),
      );

      // Etiketleri DB'ye sync et
      if (user && dbItemIds.current.has(id)) {
        fetch("/api/wardrobe", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, userId: user.id, tags: data.tags }),
        }).catch(() => {});
      }
    } catch (err) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                analyzing: false,
                error: err instanceof Error ? err.message : "Analiz başarısız",
              }
            : i,
        ),
      );
    }
  };

  // ====================================================================
  //  STİL ÖNERİSİ — Groq
  // ====================================================================
  const handleSend = async (text: string) => {
    if (sending) return;
    const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
    const pendingId = uid();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: pendingId, role: "assistant", content: "", pending: true },
    ]);
    setSending(true);

    try {
      const available = items.filter((i) => i.tags && !i.isDirty);
      const wardrobe = available.map((i) => ({ name: i.name, ...i.tags }));

      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: text, weather, wardrobe }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Öneri alınamadı");

      // Önerilen isimleri dolap parça ID'lerine eşle
      const recommendedIds: string[] = (data.recommended ?? [])
        .map((name: string) => available.find((i) => i.name === name)?.id)
        .filter(Boolean);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { ...m, content: data.advice, pending: false, recommendedIds }
            : m,
        ),
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                ...m,
                pending: false,
                content:
                  "⚠️ " +
                  (err instanceof Error ? err.message : "Bir hata oluştu") +
                  "\n\n(.env.local içinde GROQ_API_KEY tanımlı mı?)",
              }
            : m,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  // ====================================================================
  //  SANAL GİYDİRME — IDM-VTON
  // ====================================================================
  // Profil fotoğrafını ayarla; giriş yapılmışsa DB'ye kaydet.
  // Beklemede bir kombin varsa (danışmandan), fotoğraf yüklenince otomatik giydir.
  const handleSetUserPhoto = (dataUrl: string) => {
    setUserPhoto(dataUrl);
    if (user) updateProfilePhoto(dataUrl);
    if (pendingOutfit) {
      const sel = pendingOutfit;
      setPendingOutfit(null);
      handleTryOnLayered(sel, dataUrl); // taze fotoğrafla hemen giydir
    }
  };

  // Tek bir parçayı belirli bir profil görselinin üzerine giydirir (zincirleme için).
  const tryOnGarment = async (
    personImg: string,
    garment: WardrobeItem,
    clothType: ClothType,
  ): Promise<string> => {
    const garmentImg = await flattenToWhite(garment.frontImage);
    // Dinamik, doğal açıklama — örn: "Mavi renkli, Casual tarz denim ceket"
    const desc = garment.tags
      ? [
          garment.tags.color && `${garment.tags.color} renkli`,
          garment.tags.style && `${garment.tags.style} tarz`,
          garment.tags.type,
        ]
          .filter(Boolean)
          .join(", ")
      : garment.name;

    const res = await fetch("/api/tryon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        person_img: personImg,
        garment_img: garmentImg,
        garment_desc: desc,
        cloth_type: clothType,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Giydirme başarısız");
    return data.resultUrl as string;
  };

  // Tek parça (eski "tekrar dene" butonu) — parçanın kendi kategorisine göre.
  const handleTryOn = async (garmentOverride?: WardrobeItem) => {
    const garment = garmentOverride ?? selectedGarment;
    if (!userPhoto || !garment) return;
    setTryOn({ loading: true });
    try {
      const clothType = categoryToClothType(categorize(garment.tags?.type));
      const resultUrl = await tryOnGarment(userPhoto, garment, clothType);
      setTryOn({ loading: false, resultUrl });
    } catch (err) {
      setTryOn({
        loading: false,
        error: err instanceof Error ? err.message : "Giydirme başarısız",
      });
    }
  };

  /**
   * Katmanlı giydirme: seçilen alt/üst/dış giyim parçalarını SIRAYLA modele
   * giydirir. Her geçişin sonucu bir sonrakine girdi olur.
   * Seçilmeyen kategori → profil fotoğrafındaki haliyle kalır.
   * Elbise seçilirse tek başına (overall) uygulanır.
   */
  const handleTryOnLayered = async (
    selection: {
      top?: string;
      bottom?: string;
      outer?: string;
      dress?: string;
    },
    personOverride?: string,
  ) => {
    const person = personOverride ?? userPhoto;
    if (!person) return;

    // Uygulama sırası: önce alt, sonra üst, en son dış giyim (üste gelir).
    const steps: { item: WardrobeItem; clothType: ClothType }[] = [];
    const pick = (id?: string) =>
      id ? items.find((i) => i.id === id) : undefined;

    const dress = pick(selection.dress);
    if (dress) {
      steps.push({ item: dress, clothType: "dress" });
    } else {
      const bottom = pick(selection.bottom);
      const top = pick(selection.top);
      const outer = pick(selection.outer);
      if (bottom) steps.push({ item: bottom, clothType: "lower_body" });
      if (top) steps.push({ item: top, clothType: "upper_body" });
      if (outer) steps.push({ item: outer, clothType: "upper_body" });
    }

    if (steps.length === 0) return;

    // Kombin şeridini güncelle
    setOutfitIds(steps.map((s) => s.item.id));
    setActiveTab("cabin");
    setTryOn({ loading: true });

    try {
      let currentPerson = person;
      for (const step of steps) {
        currentPerson = await tryOnGarment(
          currentPerson,
          step.item,
          step.clothType,
        );
      }
      setTryOn({ loading: false, resultUrl: currentPerson });
    } catch (err) {
      setTryOn({
        loading: false,
        error: err instanceof Error ? err.message : "Giydirme başarısız",
      });
    }
  };

  // Önerilen kombini kategori-seçimine çevirir.
  const idsToSelection = (ids: string[]) => {
    const selection: { top?: string; bottom?: string; outer?: string; dress?: string } = {};
    for (const id of ids) {
      const it = items.find((i) => i.id === id);
      if (!it) continue;
      const cat = categorize(it.tags?.type);
      if (cat === "alt" && !selection.bottom) selection.bottom = id;
      else if (cat === "üst" && !selection.top) selection.top = id;
      else if (cat === "dış giyim" && !selection.outer) selection.outer = id;
      else if (cat === "elbise" && !selection.dress) selection.dress = id;
    }
    return selection;
  };

  // Danışmanın önerdiği kombini DOĞRUDAN sanal kabinde dene.
  // Fotoğraf varsa hemen giydirir; yoksa beklemeye alır ve fotoğraf
  // yüklenince otomatik giydirir.
  const handleTryOutfit = (ids: string[]) => {
    if (ids.length === 0) return;
    setActiveTab("cabin");
    setOutfitIds(ids);

    const selection = idsToSelection(ids);
    if (userPhoto) {
      handleTryOnLayered(selection);
    } else {
      setPendingOutfit(selection); // fotoğraf yüklenince otomatik çalışacak
    }
  };

  // ====================================================================
  //  ARKA PLAN YENİDEN KALDIR
  // ====================================================================
  const handleRetryBg = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item?.originalImage) return;

    // Hata durumunu sıfırla, işlem başladı olarak işaretle
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, removingBg: true, bgError: undefined } : i,
      ),
    );

    try {
      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: item.originalImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Arka plan kaldırılamadı");

      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, frontImage: data.resultUrl, removingBg: false } : i,
        ),
      );

      // DB'ye sync et
      if (user && dbItemIds.current.has(id)) {
        fetch("/api/wardrobe", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, userId: user.id, frontImage: data.resultUrl }),
        }).catch(() => {});
      }
    } catch (err) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                removingBg: false,
                bgError: err instanceof Error ? err.message : "Arka plan kaldırılamadı",
              }
            : i,
        ),
      );
    }
  };

  // ====================================================================
  //  RENAME & EDIT TAGS
  // ====================================================================
  const handleRename = (id: string, name: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name } : i)));
    if (user && dbItemIds.current.has(id)) {
      fetch("/api/wardrobe", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: user.id, name }),
      }).catch(() => {});
    }
  };

  const handleEditTags = (id: string, tags: GarmentTags) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, tags } : i)));
    if (user && dbItemIds.current.has(id)) {
      fetch("/api/wardrobe", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: user.id, tags }),
      }).catch(() => {});
    }
  };

  // ====================================================================
  //  LAUNDRY & WEAR TRACKING
  // ====================================================================
  const handleMarkWorn = (id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, isDirty: true, wearCount: i.wearCount + 1 }
          : i,
      ),
    );

    const item = items.find((i) => i.id === id);
    if (user && item && dbItemIds.current.has(id)) {
      fetch("/api/wardrobe", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          userId: user.id,
          isDirty: true,
          wearCount: (item.wearCount ?? 0) + 1,
        }),
      }).catch(() => {});
    }
  };

  const handleWashLaundry = () => {
    setItems((prev) => prev.map((i) => ({ ...i, isDirty: false })));

    if (user) {
      items
        .filter((i) => i.isDirty && dbItemIds.current.has(i.id))
        .forEach((i) => {
          fetch("/api/wardrobe", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: i.id, userId: user.id, isDirty: false }),
          }).catch(() => {});
        });
    }
  };

  // ====================================================================
  //  KOMBİNLER (Outfits)
  // ====================================================================
  const createOutfit = async (
    name: string,
    itemIds: string[],
    source: "manual" | "ai" = "manual",
  ) => {
    if (itemIds.length === 0) return;
    const tempId = uid();
    const optimistic: Outfit = { id: tempId, name, itemIds, isFavorite: false, source };
    setOutfits((prev) => [optimistic, ...prev]);

    if (user) {
      try {
        const res = await fetch("/api/outfits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, name, itemIds, source }),
        });
        const data = await res.json();
        if (res.ok && data.id) {
          setOutfits((prev) =>
            prev.map((o) => (o.id === tempId ? (data as Outfit) : o)),
          );
        }
      } catch {
        /* yerel state'de kalır */
      }
    }
  };

  const handleToggleFavorite = (id: string) => {
    let next = false;
    setOutfits((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        next = !o.isFavorite;
        return { ...o, isFavorite: next };
      }),
    );
    if (user) {
      fetch("/api/outfits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: user.id, isFavorite: next }),
      }).catch(() => {});
    }
  };

  const handleDeleteOutfit = (id: string) => {
    setOutfits((prev) => prev.filter((o) => o.id !== id));
    if (user) {
      fetch(`/api/outfits?id=${id}&userId=${user.id}`, {
        method: "DELETE",
      }).catch(() => {});
    }
  };

  // Danışmanın önerdiği kombini kaydet (AI kaynaklı)
  const handleSaveAiOutfit = (itemIds: string[]) => {
    const names = itemIds
      .map((id) => items.find((i) => i.id === id)?.tags?.type)
      .filter(Boolean);
    const name = names.length ? names.join(" + ") : t(lang, "outfits.aiBadge");
    createOutfit(name, itemIds, "ai");
  };

  // ====================================================================
  //  RENDER
  // ====================================================================

  // Auth yüklenirken bekle
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  // Auth modal — giriş yapmamış kullanıcı "Giriş Yap" butonuna bastı
  if (showAuth) {
    return (
      <AuthModal
        lang={lang}
        onSuccess={() => setShowAuth(false)}
        onGuest={() => setShowAuth(false)}
      />
    );
  }

  // Welcome screen
  if (!activeTab) {
    return (
      <WelcomeScreen
        lang={lang}
        user={user}
        onSelectTab={setActiveTab}
        onShowAuth={() => setShowAuth(true)}
        onSignOut={signOut}
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen flex-col lg:h-screen max-w-[1500px]">
      <header className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="font-serif text-xl font-medium tracking-tight text-paper-ink sm:text-2xl">
            StilAi
          </h1>
          <span className="hidden label-caps text-paper-faint sm:inline">
            — {t(lang, "app.tagline")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="shrink-0 rounded-xl bg-accent-deep px-3 py-1.5 text-xs font-semibold text-white shadow-glow transition hover:bg-accent"
            >
              {t(lang, "auth.signIn")}
            </button>
          )}

          <button
            onClick={() => setLang(nextLang(lang))}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-black/10 text-sm transition hover:border-black/20 hover:bg-black/[0.05]"
            title="TR / EN / DE"
          >
            {langFlag(lang)}
          </button>
        </div>
      </header>

      <TabNavigation
        lang={lang}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onClose={() => setActiveTab(null)}
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:min-h-0">
        {activeTab === "wardrobe" && (
          <div className="lg:h-full">
            <WardrobePanel
              lang={lang}
              items={items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAddFiles={handleAddFiles}
              onAddUrl={handleAddUrl}
              importing={importing}
              onRemove={handleRemove}
              onAnalyze={handleAnalyze}
              onMarkWorn={handleMarkWorn}
              onWashLaundry={handleWashLaundry}
              onRename={handleRename}
              onEditTags={handleEditTags}
              onRetryBg={handleRetryBg}
            />
          </div>
        )}

        {activeTab === "advisor" && (
          <div className="lg:h-full">
            <StyleAdvisorPanel
              lang={lang}
              messages={messages}
              items={items}
              weather={weather}
              weatherLoading={weatherLoading}
              weatherError={weatherError}
              onRefreshWeather={() =>
                fetchWeather(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon)
              }
              onSend={handleSend}
              sending={sending}
              onTryOutfit={handleTryOutfit}
              onSaveOutfit={handleSaveAiOutfit}
            />
          </div>
        )}

        {activeTab === "cabin" && (
          <div className="lg:h-full">
            <VirtualCabinPanel
              lang={lang}
              userPhoto={userPhoto}
              onSetUserPhoto={handleSetUserPhoto}
              selectedGarment={selectedGarment}
              outfit={outfit}
              onSelectGarment={setSelectedId}
              items={items.filter((i) => !i.isDirty)}
              pendingOutfit={!!pendingOutfit}
              onTryOnLayered={handleTryOnLayered}
              tryOn={tryOn}
              onTryOn={() => handleTryOn()}
              onMarkWorn={handleMarkWorn}
            />
          </div>
        )}

        {activeTab === "outfits" && (
          <div className="lg:h-full">
            <OutfitsPanel
              lang={lang}
              outfits={outfits}
              items={items}
              onCreate={(name, ids) => createOutfit(name, ids, "manual")}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteOutfit}
              onTryOutfit={handleTryOutfit}
            />
          </div>
        )}
      </div>
    </main>
  );
}

// ── Kullanıcı menüsü (header'daki küçük dropdown) ──────────────────────────
function UserMenu({ user }: { user: { name?: string; email: string } }) {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const initial = (user.name ?? user.email).charAt(0).toLocaleUpperCase("tr");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex shrink-0 items-center gap-2 rounded-xl border border-black/10 py-1 pl-1 pr-2 text-xs font-medium text-paper-body transition hover:border-black/20 hover:bg-black/[0.05]"
      >
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-accent-deep text-[11px] font-semibold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[8rem] truncate sm:inline">
          {user.name ?? user.email.split("@")[0]}
        </span>
        <span className="text-paper-muted">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] animate-scale-in rounded-xl border border-black/10 bg-ink-800/95 p-1.5 shadow-soft backdrop-blur-xl">
            <div className="mb-1 border-b border-black/5 px-2.5 py-2">
              <p className="truncate text-sm font-medium text-paper-ink">
                {user.name ?? user.email.split("@")[0]}
              </p>
              <p className="truncate text-[11px] text-paper-muted">{user.email}</p>
            </div>
            <button
              onClick={() => {
                signOut();
                setOpen(false);
              }}
              className="w-full rounded-lg px-2.5 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-500/10"
            >
              ↪ Çıkış Yap
            </button>
          </div>
        </>
      )}
    </div>
  );
}
