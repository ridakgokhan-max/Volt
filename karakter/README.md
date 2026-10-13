# Kanal maskotu: Meraklı Gözlüklü

Bir Dakikada Bilim videolarının karakteri (onaylandı, 13 Ekim 2026).

- Yuvarlak gözlük, soru işareti şeklinde perçem, sarı atkı
- Eklemli iskelet: dirsek, diz, gövde eğimi; perçem, atkı ve gözlük gecikmeli hareket eder
- 12 duygu: mutlu, kahkaha, şaşkın, meraklı, üzgün, kızgın, korkmuş, heyecanlı, utangaç, uykulu, aha, göz kırpan
- Hareketler: yürüme, el sallama, zıplama (çömelme/ezilme), düşünme, aha, anlatma, şaşırma, koşma

Dosyalar:
- `merakli.py` — karakterin çizimi (SVG üretir): `figure(poz)` ve `head(duygu, ...)`
- `ifadeler_ciz.py` — 12 duygu tablosunu çizer
- `hareket_testi.py` — 12 sn sesli hareket testi videosu
- `merakli_ifadeler.png`, `merakli_hareket.mp4` — onaylanan örnekler

Sonraki adım: aynı tasarımı `src/bilim/kit.tsx` içine Remotion bileşeni olarak taşımak (eski çöp adamın yerine).
