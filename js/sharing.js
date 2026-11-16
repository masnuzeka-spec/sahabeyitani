// Sonuç, içerik, görsel PNG ders/sonuç kartı (duasız) ve İsimli Başarı Belgesi (PNG) paylaşım modülü
import APP_CONTENT from "../data/app-content.js";
import { showToast } from "./utils.js";

export async function shareTextContent({ title, text }) {
  const fullText = `${title}\n\n${text}`;
  try {
    if (navigator.share) {
      await navigator.share({ title, text: fullText });
      return true;
    }
  } catch (err) {
    if (err && err.name === "AbortError") return false;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(fullText);
      showToast("Paylaşım metni panoya kopyalandı.");
      return true;
    }
  } catch (err) {
    // Fallback textarea
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = fullText;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast("Paylaşım metni panoya kopyalandı.");
    return true;
  } catch (err) {
    showToast("Paylaşım yapılamadı.");
    return false;
  }
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let current = "";
  for (const w of words) {
    const testLine = current ? `${current} ${w}` : w;
    if (ctx.measureText(testLine).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = testLine;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function downloadVisualCardPng({
  badgeText = "SAHABEYİ TANI",
  title = "",
  subtitle = "",
  sectionHeading = "Hayatından Alınacak Dersler",
  lines = [],
  filename = "sahabeyi-tani-kart.png"
}) {
  try {
    const canvas = document.createElement("canvas");
    const width = 1080;
    const height = 1280;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // 1. Zümrüt yeşili arka plan
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#0F3D35");
    grad.addColorStop(0.55, "#165247");
    grad.addColorStop(1, "#092621");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. İnce altın çerçeve
    ctx.strokeStyle = "rgba(217, 164, 65, 0.45)";
    ctx.lineWidth = 3;
    ctx.strokeRect(44, 44, width - 88, height - 88);

    let y = 110;

    // 3. Uygulama logosu
    const logoUrl = APP_CONTENT.logoUrl;
    if (logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = logoUrl;
        });
        if (img.complete && img.naturalWidth > 0) {
          const logoSize = 124;
          ctx.save();
          ctx.beginPath();
          ctx.arc(width / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, width / 2 - logoSize / 2, y, logoSize, logoSize);
          ctx.restore();

          ctx.strokeStyle = "#D9A441";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(width / 2, y + logoSize / 2, logoSize / 2 + 2, 0, Math.PI * 2);
          ctx.stroke();
          y += logoSize + 38;
        }
      } catch (e) {
        // ignore
      }
    }

    // 4. Üst rozet
    ctx.textAlign = "center";
    ctx.fillStyle = "#F5D07E";
    ctx.font = "700 24px Manrope, sans-serif";
    ctx.fillText(badgeText.toLocaleUpperCase("tr-TR"), width / 2, y);
    y += 56;

    // 5. Ana Başlık (Sahabî Adı)
    ctx.fillStyle = "#FBF7F0";
    ctx.font = "700 60px 'Cormorant Garamond', Georgia, serif";
    const titleLines = wrapCanvasText(ctx, title, width - 180);
    for (const tl of titleLines) {
      ctx.fillText(tl, width / 2, y);
      y += 66;
    }

    // 6. Alt Başlık
    if (subtitle) {
      ctx.fillStyle = "#D9A441";
      ctx.font = "700 32px 'Cormorant Garamond', Georgia, serif";
      const subLines = wrapCanvasText(ctx, subtitle, width - 180);
      for (const sl of subLines) {
        ctx.fillText(sl, width / 2, y);
        y += 42;
      }
    }

    y += 18;
    ctx.strokeStyle = "rgba(217, 164, 65, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(160, y);
    ctx.lineTo(width - 160, y);
    ctx.stroke();
    y += 48;

    // 7. Bölüm Başlığı
    ctx.fillStyle = "#F5D07E";
    ctx.font = "800 28px Manrope, sans-serif";
    ctx.fillText(sectionHeading, width / 2, y);
    y += 46;

    // 8. Maddeler kutusu
    ctx.textAlign = "left";
    ctx.font = "600 27px Manrope, sans-serif";
    const maxItems = lines.slice(0, 5);
    for (const item of maxItems) {
      const wrapped = wrapCanvasText(ctx, item, width - 220);
      if (y + wrapped.length * 38 > height - 130) break;
      ctx.fillStyle = "#D9A441";
      ctx.fillText("•", 108, y);
      ctx.fillStyle = "#F7F1E5";
      for (const wl of wrapped) {
        ctx.fillText(wl, 144, y);
        y += 38;
      }
      y += 16;
    }

    // 9. Alt İmza Bandı (Dua yazıları kaldırıldı, yalnızca uygulama adı ve sloganı yer alır)
    const footerY = height - 76;
    ctx.strokeStyle = "rgba(217, 164, 65, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(160, footerY - 30);
    ctx.lineTo(width - 160, footerY - 30);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(247, 241, 229, 0.85)";
    ctx.font = "700 22px Manrope, sans-serif";
    ctx.fillText("SAHABEYİ TANI • 82 Kutlu Hayat, Nice Güzel Örneklik", width / 2, footerY);

    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Görsel kart PNG olarak indirildi.");
    return true;
  } catch (err) {
    showToast("Görsel kart oluşturulurken bir hata oluştu.");
    return false;
  }
}

export async function downloadCertificatePng({
  recipientName = "İsimsiz Katılımcı",
  achievementTitle = "Sahabeyi Tanı Başarı ve Tamamlama Belgesi",
  statsLine = "",
  filename = "sahabeyi-tani-basari-belgesi.png"
}) {
  return downloadVisualCardPng({
    badgeText: "BAŞARI VE TAMAMLAMA BELGESİ",
    title: recipientName.trim() || "Değerli Katılımcı",
    subtitle: achievementTitle,
    sectionHeading: "Kazanım ve İlerleme Özeti",
    lines: [
      statsLine || "82 kutlu sahabînin (ra) hayatlarını ve örnek ahlaklarını öğrenme yolculuğunda üstün gayret göstermiştir.",
      "Hayatlarını öğren, örnekliklerini keşfet.",
      `Tarih: ${new Date().toLocaleDateString("tr-TR")}`
    ],
    filename
  });
}
