-- ============================================================
-- Jordan Visa Guide — PostgreSQL Database Schema
-- Version: 1.0 · Multi-passport ready from day one
-- ============================================================

-- ── Extensions ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- fuzzy country name search
CREATE EXTENSION IF NOT EXISTS "unaccent";        -- accent-insensitive search

-- ============================================================
-- TABLE: passports
-- Allows the system to scale to every passport in the world.
-- Jordan is passport_id = 'JOR' (ISO 3166-1 alpha-3)
-- ============================================================
CREATE TABLE passports (
  id            VARCHAR(3)   PRIMARY KEY,       -- ISO 3166-1 alpha-3 (e.g. 'JOR', 'USA')
  name          VARCHAR(100) NOT NULL,           -- "Jordanian"
  country_name  VARCHAR(100) NOT NULL,           -- "Jordan"
  flag_emoji    VARCHAR(10),
  is_active     BOOLEAN      DEFAULT TRUE,       -- only JOR active in MVP
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO passports (id, name, country_name, flag_emoji, is_active)
VALUES ('JOR', 'Jordanian', 'Jordan', '🇯🇴', TRUE);

-- ============================================================
-- TABLE: countries
-- Every destination country in the world
-- ============================================================
CREATE TABLE countries (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  iso2            VARCHAR(2)   NOT NULL UNIQUE,  -- 'TR', 'US', 'DE'
  iso3            VARCHAR(3)   NOT NULL UNIQUE,  -- 'TUR', 'USA', 'DEU'
  name            VARCHAR(100) NOT NULL,
  name_ar         VARCHAR(100),                  -- Arabic name (SEO + UX for Arabic users)
  region          VARCHAR(60),                   -- 'Middle East', 'Europe', 'Asia'
  subregion       VARCHAR(80),
  flag_emoji      VARCHAR(10),
  flag_svg_url    TEXT,
  capital         VARCHAR(100),
  currency_code   VARCHAR(3),
  phone_code      VARCHAR(10),
  is_schengen     BOOLEAN      DEFAULT FALSE,
  is_arab_league  BOOLEAN      DEFAULT FALSE,
  latitude        DECIMAL(8,5),
  longitude       DECIMAL(8,5),
  search_vector   TSVECTOR,                     -- full-text search
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- Indices for fast lookups
CREATE INDEX idx_countries_iso2 ON countries(iso2);
CREATE INDEX idx_countries_name ON countries USING gin(name gin_trgm_ops);
CREATE INDEX idx_countries_search ON countries USING gin(search_vector);
CREATE INDEX idx_countries_region ON countries(region);

-- Auto-update search_vector on insert/update
CREATE OR REPLACE FUNCTION countries_update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.name_ar, '') || ' ' ||
    coalesce(NEW.region, '') || ' ' ||
    coalesce(NEW.capital, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER countries_search_vector_update
  BEFORE INSERT OR UPDATE ON countries
  FOR EACH ROW EXECUTE FUNCTION countries_update_search_vector();

-- ============================================================
-- TABLE: visa_requirements
-- Core table — one row per (passport × destination) pair
-- ============================================================
CREATE TABLE visa_requirements (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  passport_id         VARCHAR(3)    NOT NULL REFERENCES passports(id),
  destination_iso2    VARCHAR(2)    NOT NULL REFERENCES countries(iso2),

  -- Visa classification
  visa_type           VARCHAR(50)   NOT NULL,
  -- Values: 'visa_free' | 'visa_on_arrival' | 'evisa' | 'embassy_visa' | 'not_permitted'

  -- Stay allowance
  max_stay_days       INTEGER,                  -- NULL = indefinite or complex
  stay_notes          TEXT,                     -- "30 days, extendable once"

  -- Cost
  fee_usd             DECIMAL(8,2),
  fee_local           DECIMAL(10,2),
  fee_currency        VARCHAR(3),
  fee_notes           TEXT,                     -- "Fee waived for pilgrims"

  -- Processing
  processing_days_min INTEGER,
  processing_days_max INTEGER,
  processing_notes    TEXT,

  -- Application channel
  apply_online_url    TEXT,
  apply_notes         TEXT,

  -- Validity
  validity_days       INTEGER,                  -- from issue date
  validity_notes      TEXT,                     -- "Multiple entry"
  entry_type          VARCHAR(20) DEFAULT 'single', -- 'single' | 'double' | 'multiple'

  -- Documents required (stored as JSONB for flexibility)
  required_docs       JSONB DEFAULT '[]',
  -- Example: [{"name":"Valid passport","details":"6 months validity required"},
  --           {"name":"Passport photos","details":"2 recent colour photos"},
  --           {"name":"Bank statement","details":"Last 3 months"}]

  -- Warnings / special notes
  warnings            JSONB DEFAULT '[]',
  tips                JSONB DEFAULT '[]',

  -- Data quality
  data_source         VARCHAR(100),             -- 'official_embassy' | 'sherpa_api' | 'iata_timatic'
  last_verified_at    TIMESTAMPTZ,
  is_verified         BOOLEAN DEFAULT FALSE,
  confidence_score    SMALLINT CHECK (confidence_score BETWEEN 0 AND 100),

  -- SEO
  slug                VARCHAR(160),             -- 'jordan-to-germany-visa'
  meta_title          VARCHAR(160),
  meta_description    VARCHAR(320),

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_passport_destination UNIQUE (passport_id, destination_iso2)
);

CREATE INDEX idx_visa_req_passport ON visa_requirements(passport_id);
CREATE INDEX idx_visa_req_destination ON visa_requirements(destination_iso2);
CREATE INDEX idx_visa_req_type ON visa_requirements(visa_type);
CREATE INDEX idx_visa_req_verified ON visa_requirements(is_verified, last_verified_at);
CREATE INDEX idx_visa_req_slug ON visa_requirements(slug);

-- ============================================================
-- TABLE: embassies
-- Embassy / consulate info per country for Jordanian passport holders
-- ============================================================
CREATE TABLE embassies (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_iso2    VARCHAR(2)    NOT NULL REFERENCES countries(iso2),
  passport_id     VARCHAR(3)    NOT NULL REFERENCES passports(id),
  type            VARCHAR(30)   DEFAULT 'embassy', -- 'embassy' | 'consulate' | 'honorary'
  name            VARCHAR(200)  NOT NULL,
  address         TEXT,
  city            VARCHAR(100),
  phone           VARCHAR(50),
  email           VARCHAR(200),
  website         TEXT,
  appointment_url TEXT,
  hours           JSONB,                            -- {"Mon-Fri":"09:00-16:00","Sat":"Closed"}
  notes           TEXT,
  latitude        DECIMAL(8,5),
  longitude       DECIMAL(8,5),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_embassies_country ON embassies(country_iso2, passport_id);

-- ============================================================
-- TABLE: visa_requirement_history
-- Audit log of every change — critical for trust signals
-- ============================================================
CREATE TABLE visa_requirement_history (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_id  UUID        NOT NULL REFERENCES visa_requirements(id),
  changed_by      VARCHAR(100),           -- 'system_cron' | 'admin:user@email.com' | 'sherpa_sync'
  change_type     VARCHAR(20),            -- 'created' | 'updated' | 'verified'
  old_values      JSONB,
  new_values      JSONB,
  change_notes    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visa_history_req ON visa_requirement_history(requirement_id);
CREATE INDEX idx_visa_history_date ON visa_requirement_history(created_at DESC);

-- ============================================================
-- TABLE: faqs
-- FAQ page content, also used for structured data (schema.org)
-- ============================================================
CREATE TABLE faqs (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  passport_id   VARCHAR(3)    REFERENCES passports(id),   -- NULL = global
  country_iso2  VARCHAR(2)    REFERENCES countries(iso2), -- NULL = general FAQ
  question      TEXT          NOT NULL,
  answer        TEXT          NOT NULL,
  category      VARCHAR(60),     -- 'schengen' | 'documents' | 'general' | 'europe' | etc.
  display_order INTEGER       DEFAULT 0,
  is_published  BOOLEAN       DEFAULT TRUE,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX idx_faqs_passport ON faqs(passport_id);
CREATE INDEX idx_faqs_country ON faqs(country_iso2);
CREATE INDEX idx_faqs_category ON faqs(category);

-- ============================================================
-- TABLE: blog_posts  (for SEO content strategy)
-- ============================================================
CREATE TABLE blog_posts (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            VARCHAR(200)  NOT NULL UNIQUE,
  title           VARCHAR(200)  NOT NULL,
  excerpt         TEXT,
  body_html       TEXT,
  cover_image_url TEXT,
  author          VARCHAR(100)  DEFAULT 'Jordan Visa Guide',
  passport_id     VARCHAR(3)    REFERENCES passports(id),
  country_iso2    VARCHAR(2)    REFERENCES countries(iso2),
  tags            TEXT[]        DEFAULT '{}',
  meta_title      VARCHAR(160),
  meta_description VARCHAR(320),
  is_published    BOOLEAN       DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_blog_published ON blog_posts(is_published, published_at DESC);

-- ============================================================
-- TABLE: search_analytics (privacy-safe, no PII)
-- ============================================================
CREATE TABLE search_analytics (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  query           VARCHAR(200),
  destination_iso2 VARCHAR(2),
  passport_id     VARCHAR(3)    DEFAULT 'JOR',
  result_count    INTEGER,
  clicked_iso2    VARCHAR(2),
  session_id      VARCHAR(64),  -- anonymised session hash
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX idx_analytics_query ON search_analytics(query);
CREATE INDEX idx_analytics_destination ON search_analytics(destination_iso2);
CREATE INDEX idx_analytics_date ON search_analytics(created_at DESC);

-- ============================================================
-- FUNCTION: auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['passports','countries','visa_requirements','embassies','faqs','blog_posts']
  LOOP
    EXECUTE format('
      CREATE TRIGGER set_updated_at_%I
        BEFORE UPDATE ON %I
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    ', t, t);
  END LOOP;
END;
$$;

-- ============================================================
-- SEED: Popular Jordanian passport destinations (sample)
-- ============================================================
INSERT INTO countries (iso2, iso3, name, name_ar, region, flag_emoji, is_arab_league, is_schengen) VALUES
  ('TR','TUR','Turkey','تركيا','Middle East','🇹🇷',FALSE,FALSE),
  ('AE','ARE','United Arab Emirates','الإمارات','Middle East','🇦🇪',TRUE,FALSE),
  ('EG','EGY','Egypt','مصر','Africa','🇪🇬',TRUE,FALSE),
  ('DE','DEU','Germany','ألمانيا','Europe','🇩🇪',FALSE,TRUE),
  ('GB','GBR','United Kingdom','المملكة المتحدة','Europe','🇬🇧',FALSE,FALSE),
  ('US','USA','United States','الولايات المتحدة','Americas','🇺🇸',FALSE,FALSE),
  ('JP','JPN','Japan','اليابان','Asia','🇯🇵',FALSE,FALSE),
  ('TH','THA','Thailand','تايلاند','Asia','🇹🇭',FALSE,FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABLE: consultation_leads
-- Stores every form submission from the visa guide pages.
-- No foreign keys on purpose — country names are free-text from
-- the dropdown so they survive schema changes.
-- ============================================================
CREATE TABLE consultation_leads (
  id                   UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact details
  full_name            VARCHAR(200) NOT NULL,
  country_code         VARCHAR(10)  NOT NULL DEFAULT '+962',  -- e.g. '+962'
  phone_number         VARCHAR(30)  NOT NULL,

  -- Lead intent
  destination_country  VARCHAR(100) NOT NULL,   -- free-text from dropdown
  page_country         VARCHAR(100),            -- the ?country= param on the page
  notes                TEXT,                    -- optional free-text

  -- Attribution / deduplication
  source_url           TEXT,                    -- Referer header
  ip_hash              VARCHAR(64),             -- base64(ip) for dedup, never raw IP

  -- Pipeline management
  status               VARCHAR(30)  NOT NULL DEFAULT 'new',
  -- 'new' | 'contacted' | 'qualified' | 'converted' | 'closed'
  assigned_to          VARCHAR(100),            -- agency partner email
  notes_internal       TEXT,                    -- CRM notes, not shown to user

  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Trigger: keep updated_at fresh
CREATE TRIGGER set_updated_at_consultation_leads
  BEFORE UPDATE ON consultation_leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indices for the most common admin queries
CREATE INDEX idx_leads_status      ON consultation_leads(status, created_at DESC);
CREATE INDEX idx_leads_destination ON consultation_leads(destination_country);
CREATE INDEX idx_leads_created     ON consultation_leads(created_at DESC);
CREATE INDEX idx_leads_phone       ON consultation_leads(phone_number);

-- ============================================================
-- VIEW: leads_dashboard  (quick CRM overview)
-- ============================================================
CREATE OR REPLACE VIEW leads_dashboard AS
SELECT
  id,
  full_name,
  country_code || phone_number AS full_phone,
  destination_country,
  page_country,
  notes,
  status,
  assigned_to,
  created_at
FROM consultation_leads
ORDER BY created_at DESC;

-- ============================================================
-- VIEW: visa_summary  (fast read for API layer)
-- ============================================================
CREATE OR REPLACE VIEW visa_summary AS
SELECT
  vr.id,
  vr.passport_id,
  c.iso2,
  c.iso3,
  c.name AS country_name,
  c.name_ar AS country_name_ar,
  c.flag_emoji,
  c.region,
  c.is_schengen,
  c.is_arab_league,
  vr.visa_type,
  vr.max_stay_days,
  vr.stay_notes,
  vr.fee_usd,
  vr.fee_notes,
  vr.processing_days_min,
  vr.processing_days_max,
  vr.entry_type,
  vr.apply_online_url,
  vr.required_docs,
  vr.warnings,
  vr.tips,
  vr.is_verified,
  vr.last_verified_at,
  vr.confidence_score,
  vr.slug,
  vr.updated_at
FROM visa_requirements vr
JOIN countries c ON c.iso2 = vr.destination_iso2;

-- ============================================================
-- VIEW: popular_destinations  (homepage widget)
-- ============================================================
CREATE OR REPLACE VIEW popular_destinations AS
SELECT
  vs.*,
  COALESCE(sa.search_count, 0) AS search_count
FROM visa_summary vs
LEFT JOIN (
  SELECT destination_iso2, COUNT(*) AS search_count
  FROM search_analytics
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY destination_iso2
) sa ON sa.destination_iso2 = vs.iso2
WHERE vs.passport_id = 'JOR'
ORDER BY search_count DESC, vs.country_name ASC;
