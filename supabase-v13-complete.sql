-- Paroglu Media / Supabase setup
-- Run once in Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client text,
  tags text,
  year integer default 2026,
  description text,
  cover_url text,
  project_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text,
  url text,
  logo_url text,
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.briefs (
  id uuid primary key default gen_random_uuid(),
  name text,
  company text,
  email text,
  phone text,
  service text,
  project_type text,
  budget text,
  deadline text,
  city text,
  notes text,
  status text not null default 'Yeni',
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists brands_updated_at on public.brands;
create trigger brands_updated_at before update on public.brands
for each row execute function public.set_updated_at();

drop trigger if exists briefs_updated_at on public.briefs;
create trigger briefs_updated_at before update on public.briefs
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.brands enable row level security;
alter table public.briefs enable row level security;

-- Cleanly recreate policies if script is run again.
drop policy if exists "projects_public_read" on public.projects;
drop policy if exists "projects_admin_insert" on public.projects;
drop policy if exists "projects_admin_update" on public.projects;
drop policy if exists "projects_admin_delete" on public.projects;
drop policy if exists "brands_public_read" on public.brands;
drop policy if exists "brands_admin_insert" on public.brands;
drop policy if exists "brands_admin_update" on public.brands;
drop policy if exists "brands_admin_delete" on public.brands;
drop policy if exists "briefs_public_insert" on public.briefs;
drop policy if exists "briefs_admin_read" on public.briefs;
drop policy if exists "briefs_admin_update" on public.briefs;
drop policy if exists "briefs_admin_delete" on public.briefs;

create policy "projects_public_read"
on public.projects for select
to anon, authenticated
using (published = true or (auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "projects_admin_insert"
on public.projects for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "projects_admin_update"
on public.projects for update
to authenticated
using ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com')
with check ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "projects_admin_delete"
on public.projects for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "brands_public_read"
on public.brands for select
to anon, authenticated
using (visible = true or (auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "brands_admin_insert"
on public.brands for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "brands_admin_update"
on public.brands for update
to authenticated
using ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com')
with check ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "brands_admin_delete"
on public.brands for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

-- Website visitors may submit a brief but cannot read existing briefs.
create policy "briefs_public_insert"
on public.briefs for insert
to anon, authenticated
with check (true);

create policy "briefs_admin_read"
on public.briefs for select
to authenticated
using ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "briefs_admin_update"
on public.briefs for update
to authenticated
using ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com')
with check ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "briefs_admin_delete"
on public.briefs for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');


-- PAROGLU MEDIA V3 MIGRATION
-- Supabase > SQL Editor > New query > paste all > Run

create extension if not exists pgcrypto;

-- Existing project table upgrades
alter table if exists public.projects add column if not exists category text;
alter table if exists public.projects add column if not exists content_type text;
alter table if exists public.projects add column if not exists media_url text;
alter table if exists public.projects add column if not exists media_type text;
alter table if exists public.projects add column if not exists ratio text default '16:9';
alter table if exists public.projects add column if not exists filter_tags text;
alter table if exists public.projects add column if not exists sort_order integer default 0;
alter table if exists public.projects add column if not exists featured boolean default false;

-- Brand carousel upgrades
alter table if exists public.brands add column if not exists row_no integer default 1;

-- CMS content table
create table if not exists public.site_content (
  key text primary key,
  value text not null default '',
  section text not null default 'general',
  label text,
  updated_at timestamptz not null default now()
);

-- Media library. Original uploaded file is preserved; ratio is display metadata only.
create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  title text,
  file_url text not null,
  storage_path text not null,
  media_type text not null default 'image',
  ratio text not null default 'original',
  alt_text text,
  file_name text,
  file_size bigint,
  created_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
alter table public.media_library enable row level security;

-- Generic updated_at function (safe if already exists)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists site_content_updated_at on public.site_content;
create trigger site_content_updated_at before update on public.site_content for each row execute function public.set_updated_at();

-- RLS: content public read, only admin write
DROP POLICY IF EXISTS "site_content_public_read" ON public.site_content;
DROP POLICY IF EXISTS "site_content_admin_insert" ON public.site_content;
DROP POLICY IF EXISTS "site_content_admin_update" ON public.site_content;
DROP POLICY IF EXISTS "site_content_admin_delete" ON public.site_content;
create policy "site_content_public_read" on public.site_content for select to anon, authenticated using (true);
create policy "site_content_admin_insert" on public.site_content for insert to authenticated with check ((auth.jwt() ->> 'email')='umutparoglu87@gmail.com');
create policy "site_content_admin_update" on public.site_content for update to authenticated using ((auth.jwt() ->> 'email')='umutparoglu87@gmail.com') with check ((auth.jwt() ->> 'email')='umutparoglu87@gmail.com');
create policy "site_content_admin_delete" on public.site_content for delete to authenticated using ((auth.jwt() ->> 'email')='umutparoglu87@gmail.com');

DROP POLICY IF EXISTS "media_public_read" ON public.media_library;
DROP POLICY IF EXISTS "media_admin_insert" ON public.media_library;
DROP POLICY IF EXISTS "media_admin_update" ON public.media_library;
DROP POLICY IF EXISTS "media_admin_delete" ON public.media_library;
create policy "media_public_read" on public.media_library for select to anon, authenticated using (true);
create policy "media_admin_insert" on public.media_library for insert to authenticated with check ((auth.jwt() ->> 'email')='umutparoglu87@gmail.com');
create policy "media_admin_update" on public.media_library for update to authenticated using ((auth.jwt() ->> 'email')='umutparoglu87@gmail.com') with check ((auth.jwt() ->> 'email')='umutparoglu87@gmail.com');
create policy "media_admin_delete" on public.media_library for delete to authenticated using ((auth.jwt() ->> 'email')='umutparoglu87@gmail.com');

-- Storage bucket for original-quality images/videos/logos
insert into storage.buckets (id,name,public,file_size_limit)
values ('media','media',true,524288000)
on conflict (id) do update set public=true, file_size_limit=524288000;

DROP POLICY IF EXISTS "media_bucket_public_read" ON storage.objects;
DROP POLICY IF EXISTS "media_bucket_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "media_bucket_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "media_bucket_admin_delete" ON storage.objects;
create policy "media_bucket_public_read" on storage.objects for select to public using (bucket_id='media');
create policy "media_bucket_admin_insert" on storage.objects for insert to authenticated with check (bucket_id='media' and (auth.jwt() ->> 'email')='umutparoglu87@gmail.com');
create policy "media_bucket_admin_update" on storage.objects for update to authenticated using (bucket_id='media' and (auth.jwt() ->> 'email')='umutparoglu87@gmail.com') with check (bucket_id='media' and (auth.jwt() ->> 'email')='umutparoglu87@gmail.com');
create policy "media_bucket_admin_delete" on storage.objects for delete to authenticated using (bucket_id='media' and (auth.jwt() ->> 'email')='umutparoglu87@gmail.com');

-- Default editable copy. Existing values are never overwritten.
insert into public.site_content(key,value,section,label) values
('nav.about','Hakkımda','Navigasyon','Hakkımda menüsü'),
('nav.services','Hizmetler','Navigasyon','Hizmetler menüsü'),
('nav.work','İşler','Navigasyon','İşler menüsü'),
('nav.quote','Teklif Al','Navigasyon','Teklif Al butonu'),
('nav.contact','İletişim','Navigasyon','İletişim menüsü'),
('home.hero_kicker','UMUT PAROĞLU · CREATIVE STUDIO','Ana Sayfa','Hero üst yazı'),
('home.hero_line1','Görünen değil,','Ana Sayfa','Hero slogan 1'),
('home.hero_line2','hatırlanan işler.','Ana Sayfa','Hero slogan 2'),
('home.hero_copy','Reels, fotoğraf, grafik tasarım, sosyal medya, drone ve dijital deneyimleri tek bir kreatif dünyada buluşturuyorum.','Ana Sayfa','Hero açıklama'),
('home.hero_cta1','İşleri Keşfet ↗','Ana Sayfa','Hero buton 1'),
('home.hero_cta2','Bir Proje Başlat','Ana Sayfa','Hero buton 2'),
('home.featured_kicker','PORTFOLYO','Ana Sayfa','Seçili işler üst yazı'),
('home.featured_title','Seçili İşler','Ana Sayfa','Seçili işler başlık'),
('home.featured_cta','Tüm İşleri Gör','Ana Sayfa','Seçili işler buton'),
('home.services_kicker','NE ÜRETİYORUM?','Ana Sayfa','Hizmetler üst yazı'),
('home.services_title','Hizmetler','Ana Sayfa','Hizmetler başlık'),
('home.brands_kicker','REFERANSLAR','Ana Sayfa','Markalar üst yazı'),
('home.brands_title','Çalıştığım Markalar','Ana Sayfa','Markalar başlık'),
('brands.carousel_limit','14','Markalar','Dönen maksimum marka sayısı'),
('brands.speed_seconds','34','Markalar','Logo akış süresi (saniye)'),
('works.kicker','PORTFOLYO / 2022—2026','İşler','Üst yazı'),
('works.title','İşler','İşler','Başlık'),
('works.lead','Önce işin türü, sonra proje. Sosyal medya, spor, konser, Reels, fotoğraf, tasarım, drone ve dijital üretimleri aynı şablona sıkıştırmadan sergiliyorum.','İşler','Açıklama'),
('services.kicker','NE ÜRETİYORUM?','Hizmetler','Üst yazı'),
('services.title','Hizmetler','Hizmetler','Başlık'),
('services.lead','Tek bir format satmıyorum. Markanın hedefini, platformu ve kullanım biçimini anlayıp doğru üretim kombinasyonunu kuruyorum.','Hizmetler','Açıklama'),
('service.reels.title','Film / Reels','Hizmetler','Film/Reels başlık'),
('service.reels.summary','Reklam filmi, Reels, etkinlik, konser, kurumsal tanıtım, ürün ve mekân videoları.','Hizmetler','Film/Reels özet'),
('service.reels.process','Brief → fikir → çekim planı → prodüksiyon → kurgu → revizyon → teslim.','Hizmetler','Film/Reels süreç'),
('service.reels.myth','İyi Reels sadece hızlı kurgu değildir. İlk saniye, hikâye ve izleme davranışı birlikte düşünülür.','Hizmetler','Film/Reels not'),
('service.photo.title','Fotoğraf','Hizmetler','Fotoğraf başlık'),
('service.photo.summary','Spor, etkinlik, ürün, portre ve kurumsal fotoğraf çekimleri.','Hizmetler','Fotoğraf özet'),
('service.design.title','Tasarım','Hizmetler','Tasarım başlık'),
('service.design.summary','Kampanya görselleri, sosyal medya, afiş, baskı ve marka iletişimi.','Hizmetler','Tasarım özet'),
('service.social.title','Sosyal Medya','Hizmetler','Sosyal medya başlık'),
('service.social.summary','Sayfa yönetimi, içerik planlaması, Reels, tasarım ve çekim süreçlerinin birlikte yönetimi.','Hizmetler','Sosyal medya özet'),
('service.drone.title','Drone','Hizmetler','Drone başlık'),
('service.drone.summary','Mimari, etkinlik, spor ve reklam projelerinde sinematik hava çekimleri.','Hizmetler','Drone özet'),
('service.digital.title','Digital','Hizmetler','Digital başlık'),
('service.digital.summary','Portfolyo siteleri, landing page’ler ve yaratıcı web deneyimleri.','Hizmetler','Digital özet'),
('about.kicker','UMUT PAROĞLU','Hakkımda','Üst yazı'),
('about.title','Hakkımda','Hakkımda','Başlık'),
('about.headline','Bir işi sadece üretmiyorum; nasıl hatırlanacağını da düşünüyorum.','Hakkımda','Ana cümle'),
('about.p1','24 yaşındayım. Dört yılı aşkın süredir profesyonel olarak reklam ajansı dünyasının içinde video, fotoğraf, grafik tasarım, sosyal medya ve içerik üretimi üzerine çalışıyorum. Bu sürecin öncesinde de amatör olarak görsel üretim yapıyordum.','Hakkımda','Paragraf 1'),
('about.p2','Paroglu Media; Reels kurgusundan çekime, fotoğraftan tasarıma, drone görüntülerinden web deneyimlerine kadar farklı disiplinleri tek bir görsel bakış altında topladığım kişisel kreatif markam.','Hakkımda','Paragraf 2'),
('about.stat1_value','4+','Hakkımda','İstatistik 1 değer'),
('about.stat1_label','Yıl profesyonel deneyim','Hakkımda','İstatistik 1 açıklama'),
('about.stat2_value','1000+','Hakkımda','İstatistik 2 değer'),
('about.stat2_label','Üretilen içerik / kreatif çıktı','Hakkımda','İstatistik 2 açıklama'),
('about.stat3_value','360°','Hakkımda','İstatistik 3 değer'),
('about.stat3_label','Çok disiplinli kreatif üretim','Hakkımda','İstatistik 3 açıklama'),
('about.manifesto_title','Tek bir uzmanlık değil, tek bir bakış açısı.','Hakkımda','Manifesto başlık'),
('about.manifesto_text','Bir projede gerektiğinde kamera arkasında, gerektiğinde kurgu masasında, gerektiğinde tasarım ekranında olabilmek; ortaya çıkan işin parçalarının birbirinden kopmamasını sağlıyor.','Hakkımda','Manifesto metin'),
('contact.kicker','BİR ŞEY ÜRETELİM','İletişim','Üst yazı'),
('contact.title','İletişim','İletişim','Başlık'),
('contact.big','Aklındaki işi<br><span style="color:var(--purple2)">anlat.</span>','İletişim','Büyük cümle'),
('contact.email','umutparoglu87@gmail.com','İletişim','E-posta'),
('contact.email_href','mailto:umutparoglu87@gmail.com','İletişim','E-posta linki'),
('contact.phone','+90 541 662 98 62','İletişim','Telefon'),
('contact.phone_href','tel:+905416629862','İletişim','Telefon linki'),
('contact.instagram','@iamparoglu ↗','İletişim','Instagram'),
('contact.instagram_href','https://instagram.com/iamparoglu','İletişim','Instagram linki'),
('footer.cta_start','Bir sonraki işi','Footer','CTA başlangıç'),
('footer.cta_link','birlikte yapalım.','Footer','CTA link'),
('footer.disciplines','Reels · Fotoğraf · Tasarım · Sosyal Medya · Drone · Digital','Footer','Disiplinler')
on conflict (key) do nothing;


-- PAROGLU MEDIA V4 MIGRATION
-- Run once in Supabase > SQL Editor after V3 migration.
-- Additive only: existing projects, brands, media and briefs are preserved.

create extension if not exists pgcrypto;

create table if not exists public.assistant_knowledge (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'Genel',
  question text not null,
  keywords text not null default '',
  answer text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists assistant_knowledge_question_uq on public.assistant_knowledge (lower(question));

alter table public.assistant_knowledge enable row level security;

drop policy if exists "assistant_public_read" on public.assistant_knowledge;
drop policy if exists "assistant_admin_insert" on public.assistant_knowledge;
drop policy if exists "assistant_admin_update" on public.assistant_knowledge;
drop policy if exists "assistant_admin_delete" on public.assistant_knowledge;

create policy "assistant_public_read"
on public.assistant_knowledge for select
to anon, authenticated
using (active = true or (auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "assistant_admin_insert"
on public.assistant_knowledge for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "assistant_admin_update"
on public.assistant_knowledge for update
to authenticated
using ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com')
with check ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "assistant_admin_delete"
on public.assistant_knowledge for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

-- Reuse V3 updated_at function if present.
drop trigger if exists assistant_knowledge_updated_at on public.assistant_knowledge;
create trigger assistant_knowledge_updated_at
before update on public.assistant_knowledge
for each row execute function public.set_updated_at();

-- Motion / display settings editable from CMS.
insert into public.site_content(key,value,section,label) values
('motion.intro_home_ms','1850','Motion','Ana sayfa açılış animasyonu süresi (ms)'),
('motion.intro_inner_ms','820','Motion','İç sayfa açılış animasyonu süresi (ms)'),
('home.featured_limit','6','Ana Sayfa','Ana sayfada gösterilecek öne çıkan iş sayısı')
on conflict (key) do nothing;



insert into public.site_content(key,value,section,label) values
('service.photo.process','Fotoğrafı yalnızca çekmek değil, nerede kullanılacağını bilerek kadrajlamak önemli. Kampanya, web, sosyal medya ve baskı için teslimler ayrı hazırlanabilir.','Hizmetler','Fotoğraf süreç'),
('service.photo.myth','Yüksek megapiksel tek başına iyi fotoğraf demek değildir; ışık, lens, kompozisyon ve son işlem sonucu belirler.','Hizmetler','Fotoğraf doğru bilinen yanlış'),
('service.design.process','Önce mesaj hiyerarşisi, sonra görsel dil. Tek bir güzel görsel yerine tekrar üretilebilir bir sistem kurmayı hedefliyorum.','Hizmetler','Tasarım süreç'),
('service.design.myth','Tasarım sadece güzel görünmek değildir; bilgiyi doğru sırayla okutmak ve markayı hatırlanır kılmaktır.','Hizmetler','Tasarım doğru bilinen yanlış'),
('service.social.process','İçerikler birbirinden bağımsız değil; profilin genel görünümü, yayın sıklığı, içerik çeşitliliği ve marka tonu birlikte düşünülür.','Hizmetler','Sosyal medya süreç'),
('service.social.myth','Sosyal medya yönetimi yalnızca post paylaşmak değildir. Düzenli içerik sistemi ve marka hafızası oluşturmak asıl iştir.','Hizmetler','Sosyal medya doğru bilinen yanlış'),
('service.drone.process','Drone görüntüsü sırf havadan çekilmiş olmak için kullanılmaz; hareket, ölçek ve sahnenin ritmi için planlanır.','Hizmetler','Drone süreç'),
('service.digital.process','Siteyi yalnızca bilgi veren sayfa olarak değil, markanın işlerini güçlü gösteren dijital deneyim olarak ele alıyorum.','Hizmetler','Digital süreç')
on conflict (key) do nothing;

-- Initial assistant knowledge. Admin panel can edit or delete these later.
insert into public.assistant_knowledge(category,question,keywords,answer,sort_order) values
('Reels / Video','Reels çekimi nasıl ilerliyor?','reels,video,çekim,kurgu,film','Önce hedefi ve yayın platformunu netleştiriyoruz. Ardından fikir, çekim planı, prodüksiyon, kurgu, renk/ses düzenleme ve revizyon geliyor. Teslimler 9:16 başta olmak üzere ihtiyaç varsa 16:9 ve 4:5 formatlarda hazırlanabiliyor.',10),
('Sosyal Medya','Sosyal medya yönetimi yapıyor musunuz?','sosyal medya,yönetim,sayfa,içerik planı,instagram','Evet. İçerik planı, sayfanın görsel dili, Reels ve tasarım üretimi, çekim planlaması ve yayın akışı birlikte kurgulanabiliyor. Amaç yalnızca paylaşım yapmak değil, markanın düzenli ve tanınır bir içerik sistemine sahip olması.',20),
('Fotoğraf','Fotoğraf çekimi yapıyor musunuz?','fotoğraf,ürün,portre,etkinlik,spor fotoğraf','Evet. Ürün, portre, spor, etkinlik ve kurumsal fotoğraf çekimleri yapılabilir. Çekim öncesinde kullanım alanına göre ışık, kadraj ve teslim oranları planlanır.',30),
('Tasarım','Hangi tasarım hizmetlerini veriyorsunuz?','tasarım,afiş,post,story,banner,baskı,kampanya','Sosyal medya post/story, kampanya görselleri, afiş, banner, baskı işleri ve marka iletişimi tasarımları üretiyorum. Tek görselden ziyade mümkün olduğunda tekrar kullanılabilir, tutarlı bir görsel sistem kuruyorum.',40),
('Drone','Drone çekimi yapıyor musunuz?','drone,hava çekimi,mimari,inşaat','Evet. Mimari, inşaat, etkinlik, spor, mekân ve reklam projelerinde sinematik hava çekimleri yapılabilir. Lokasyon ve uçuş koşulları çekim öncesinde değerlendirilir.',50),
('Web / Digital','Web sitesi yapıyor musunuz?','web,site,landing page,digital,portfolyo','Evet. Portfolyo, landing page ve kreatif web deneyimleri hazırlanabilir. Öncelik mobil uyum, hızlı açılış, güçlü portfolyo sunumu ve gerektiğinde yönetilebilir içerik altyapısıdır.',60),
('Spor','Spor kulüpleriyle çalışıyor musunuz?','spor,kulüp,futbol,maç günü,forma','Evet. Spor tarafında Reels, maç günü içerikleri, transfer/forma lansmanları, fotoğraf, grafik tasarım ve sosyal medya yönetimi birlikte üretilebilir.',70),
('Konser','Konser çekimi yapıyor musunuz?','konser,sahne,backstage,sanatçı,sefo','Evet. Sahne, backstage, kalabalık atmosferi ve sanatçı detaylarını kapsayan dikey Reels ve etkinlik videoları üretilebilir.',80),
('Fiyat / Süreç','Fiyatlar nasıl belirleniyor?','fiyat,ücret,bütçe,kaç tl,teklif','Fiyat; çekim süresi, lokasyon, ekip ihtiyacı, teslim adedi, kurgu yoğunluğu ve kullanım kapsamına göre belirlenir. En doğru fiyat için Teklif Al bölümündeki kısa brief yeterli.',90),
('Fiyat / Süreç','Teslim süresi ne kadar?','teslim,süre,kaç gün,ne zaman','Teslim süresi projenin kapsamına göre değişir. Kısa Reels çalışmalarında süreç daha hızlı olabilir; çoklu çekim, kampanya veya kapsamlı kurumsal işlerde takvim brief aşamasında netleştirilir.',100),
('Fiyat / Süreç','Revizyon hakkı var mı?','revizyon,değişiklik,düzeltme','Evet. Revizyon kapsamı iş başlamadan önce netleştirilir. Amaç projeyi sonsuz revizyon döngüsüne sokmadan briefte belirlenen hedefe en doğru şekilde ulaştırmaktır.',110),
('Genel','Hangi şehirlerde çalışıyorsunuz?','şehir,karabük,istanbul,ankara,nerede,lokasyon','Karabük merkezli çalışıyorum; proje kapsamına göre farklı şehirlerde çekim ve prodüksiyon planlanabilir. Şehri yazarsan ulaşım ve çekim planını ona göre değerlendirebiliriz.',120),
('Genel','İletişim bilgileri nedir?','telefon,whatsapp,iletişim,mail,email','Telefon: +90 541 662 98 62. E-posta: umutparoglu87@gmail.com. İstersen önce asistan üzerinden projenin kapsamını netleştirip ardından brief bırakabilirsin.',130)
on conflict do nothing;


-- PAROGLU MEDIA V13.1 BACKEND HARDENING
-- Existing Supabase project upgrade. Safe to run more than once.
-- Run in Supabase > SQL Editor before deploying the V13.1 Edge Functions.

create extension if not exists pgcrypto;


-- ------------------------------------------------------------
-- Explicit Data API grants (future-proof against changing defaults)
-- RLS policies still decide which rows authenticated/anon can use.
-- ------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select on public.projects, public.brands, public.site_content, public.media_library, public.assistant_knowledge to anon, authenticated;
grant insert, update, delete on public.projects, public.brands, public.site_content, public.media_library, public.assistant_knowledge to authenticated;

grant select, update, delete on public.briefs to authenticated;
revoke insert on public.briefs from anon, authenticated;
revoke select, update, delete on public.briefs from anon;

grant all privileges on public.projects, public.brands, public.briefs, public.site_content, public.media_library, public.assistant_knowledge to service_role;

-- ------------------------------------------------------------
-- Performance indexes
-- ------------------------------------------------------------
create index if not exists projects_public_order_idx
  on public.projects (published, featured desc, sort_order asc, created_at desc);
create index if not exists brands_public_order_idx
  on public.brands (visible, row_no asc, sort_order asc, created_at asc);
create index if not exists briefs_created_at_idx
  on public.briefs (created_at desc);
create index if not exists site_content_section_idx
  on public.site_content (section, label);
create index if not exists media_library_created_at_idx
  on public.media_library (created_at desc);
create index if not exists assistant_knowledge_active_idx
  on public.assistant_knowledge (active, sort_order asc, created_at asc);

-- ------------------------------------------------------------
-- Persistent Edge Function rate limits
-- Raw IP addresses are never stored. Functions send only SHA-256 hashes.
-- ------------------------------------------------------------
create table if not exists public.edge_rate_limits (
  scope text not null,
  identity_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (scope, identity_hash, window_start)
);

alter table public.edge_rate_limits enable row level security;

-- No browser/user policies are created for this table.
-- Only the server-side secret/service role should reach it.
revoke all on table public.edge_rate_limits from anon, authenticated;

create or replace function public.consume_edge_rate_limit(
  p_scope text,
  p_identity_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if coalesce(length(trim(p_scope)), 0) = 0
     or coalesce(length(trim(p_identity_hash)), 0) < 16
     or p_limit < 1
     or p_limit > 1000
     or p_window_seconds < 1
     or p_window_seconds > 86400 then
    return false;
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.edge_rate_limits(scope, identity_hash, window_start, request_count, updated_at)
  values (p_scope, p_identity_hash, v_window_start, 1, now())
  on conflict (scope, identity_hash, window_start)
  do update set
    request_count = public.edge_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_count;

  -- Lightweight cleanup so the limiter table cannot grow forever.
  delete from public.edge_rate_limits
  where window_start < now() - interval '2 days';

  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_edge_rate_limit(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_edge_rate_limit(text,text,integer,integer) to service_role;

-- ------------------------------------------------------------
-- Brief security
-- Website visitors no longer insert directly into public.briefs.
-- submit-brief Edge Function validates/rate-limits and inserts server-side.
-- ------------------------------------------------------------
drop policy if exists "briefs_public_insert" on public.briefs;

-- Keep admin-only access policies idempotently aligned.
drop policy if exists "briefs_admin_read" on public.briefs;
drop policy if exists "briefs_admin_update" on public.briefs;
drop policy if exists "briefs_admin_delete" on public.briefs;

create policy "briefs_admin_read"
on public.briefs for select
to authenticated
using ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "briefs_admin_update"
on public.briefs for update
to authenticated
using ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com')
with check ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

create policy "briefs_admin_delete"
on public.briefs for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'umutparoglu87@gmail.com');

-- Ensure status/source defaults remain consistent.
alter table public.briefs alter column status set default 'Yeni';
alter table public.briefs alter column source set default 'website';

-- ------------------------------------------------------------
-- Optional data integrity checks (NOT VALID avoids breaking old rows).
-- New/updated rows must respect these values once constraint is present.
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'briefs_status_allowed') then
    alter table public.briefs add constraint briefs_status_allowed
      check (status in ('Yeni','İletişime Geçildi','Teklif Verildi','Tamamlandı','Arşiv')) not valid;
  end if;
end $$;

-- ------------------------------------------------------------
-- Remove stale limiter records now.
-- ------------------------------------------------------------
delete from public.edge_rate_limits where window_start < now() - interval '2 days';
