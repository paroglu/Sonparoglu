PAROGLU MEDIA V13.1 — BACKEND FINAL

Bu sürüm V13 ön yüzünü korur, backend tarafını yayın için sertleştirir.

Yapılanlar:
- Eski paroglu-ai Edge Function klasörü kaldırıldı; tek AI endpoint smooth-worker.
- supabase/config.toml artık smooth-worker ve submit-brief için doğru slug'ları kullanıyor.
- AI rate limit bellekten çıkarılıp PostgreSQL tabanlı kalıcı rate-limit'e taşındı.
- IP adresi ham olarak saklanmıyor; Edge Function yalnızca SHA-256 kimlik hash'i gönderiyor.
- AI çağrılarına timeout, payload limiti, CORS/origin kontrolü ve güvenli hata çıktısı eklendi.
- OpenAI hata loglarında API anahtarı veya hata mesajı yazdırılmıyor.
- OPENAI_MODEL ayarlanabilir; varsayılan gpt-6-luna, model bulunamazsa gpt-5.6-luna fallback.
- AI artık projects, brands, site_content ve assistant_knowledge verilerini kullanıyor.
- Brief gönderimi artık tarayıcıdan public.briefs tablosuna direkt INSERT yapmıyor.
- Yeni submit-brief Edge Function formu doğrular, rate-limit uygular ve server-side secret key ile kaydeder.
- briefs_public_insert RLS politikası kaldırılıyor.
- Supabase Data API tablo grant'leri açık ve least-privilege olacak şekilde sabitleniyor.
- Sık kullanılan sorgular için indeksler eklendi.
- data-store.js istek timeout'u ve anonim client kimliği eklendi.
- Tüm sayfalarda data-store cache sürümü v13.1'e yükseltildi.
- Fresh install için supabase/supabase-v13-complete.sql eklendi.
- Mevcut proje için supabase/supabase-v13-backend-hardening.sql eklendi.

GİZLİ ANAHTAR YOKTUR:
- OPENAI_API_KEY paket içinde bulunmaz.
- Supabase secret/service-role key paket içinde bulunmaz.
- Browser tarafında yalnızca publishable key vardır; bu normaldir ve RLS ile korunur.

CANLIYA ALMA SIRASI:
1) Supabase SQL Editor'da supabase/supabase-v13-backend-hardening.sql çalıştır.
2) Edge Function smooth-worker kodunu supabase/functions/smooth-worker/index.ts ile güncelle ve Deploy et.
3) Yeni Edge Function submit-brief oluştur; supabase/functions/submit-brief/index.ts kodunu Deploy et.
4) Her iki function için Verify JWT = OFF.
5) OPENAI_API_KEY secret'ı mevcut olmalı. OPENAI_MODEL opsiyoneldir.
6) GitHub Pages'e bu V13.1 site dosyalarını yükle.
7) AI ve brief testlerini yap.

NOT:
Supabase hosted Edge Functions SUPABASE_URL, SUPABASE_PUBLISHABLE_KEYS ve SUPABASE_SECRET_KEYS ortam değişkenlerini otomatik sağlar. Kod legacy anon/service_role değişkenleri için de fallback içerir.
