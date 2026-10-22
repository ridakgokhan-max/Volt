# Bir Dakikada Bilim — Kalite Sistemi (ekip onayı)

Kadir'in kuralı: **her aşama ayrı bir ekip tarafından puanlanır, 8'in altı yayına giremez.**
Her ekip, videoyu yapan ajandan ayrı, önceki konuşmayı görmeyen bağımsız bir ajandır ve
acımasız, kıdemli bir tasarımcı/editör gibi davranır. Puan 1–10, eşik **8**. 8 altında kalan aşama
somut düzeltme listesiyle geri döner; en fazla **3 tur**. 3 turda geçemezse Kadir'e sorulur.

## Aşamalar ve ekipler

| # | Ekip | Neye bakar |
|---|------|-----------|
| 0 | **Hikaye editörü** | Merak eğrisi (soru → bekleme → cevap), cevabın sona saklanması, izleyicinin kendini bulması, sahnelerin bir yolculuk gibi akması, gereksiz bilgi/jargon |
| 1 | **Kanca** | İlk kare + ilk cümle + kapak aynı soruyu soruyor mu; 1 saniyede anlaşılıyor mu; kaydırmayı durdurur mu |
| 2 | **Ses kurgusu** | Kekeleme, yarım kelime, baştan okuma, uzun sessizlik kalmış mı; nefes/ritim; müzik seviyesi ve efektlerin yeri |
| 3 | **Motion / animasyon** | Ekranda hareket hiç durmuyor mu (ölü an yok); kamera yolculuğu hissi; easing ve overshoot kalitesi; sözle senkron; geçişlerin akıcılığı; ikincil (idle) hareketler |
| 4 | **Grafik / kompozisyon** | Görsel hiyerarşi, boş alan dengesi, renk uyumu, çizim tutarlılığı, altyazı alanının korunması, üst üste binme |
| 5 | **Tipografi** | Okunabilirlik, satır kırılması, kesik yazı, vurgu, ekranda kalma süresi |
| 6 | **Render / teknik** | Çözünürlük, kare atlaması, ses-görüntü senkronu, süre, ses yüksekliği |
| 7 | **Paket** | Kapak (başlık okunur mu, görsel başlığı ezmiyor mu), açıklama (kanca ilk satırda, doğruluk, yorum sorusu) |

## Otomatik ölçümler (ekiplere kanıt olarak verilir)

- **Hareket ölçümü:** ardışık kareler arası ortalama piksel farkı, 0,5 sn pencerelerle. 1 sn'den uzun
  "ölü" (eşiğin altında) pencere varsa Motion ekibi en fazla 6 verebilir.
- **İlk kare:** 0. karede kanca yazısı okunuyor mu.
- **Altyazı alanı:** y≈1250–1350 bandında sahne öğesi olmamalı.
- **Süre:** bilgi bitince en fazla 1 sn.
- **Ses:** kelime içi uzun sessizlik (>0,6 sn) = muhtemel kekeleme, Ses ekibine işaretlenir.

## Puan kartı biçimi (her ekip JSON döner)

```json
{"ekip": "Motion", "puan": 7, "gerekce": "…", "duzeltmeler": ["12–14 sn arası ekran donuk: …", "…"]}
```

Son teslimde Kadir'e tüm ekiplerin son puanları tablo olarak gönderilir.
