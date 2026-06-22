/**
 * Jordan Visa Guide — Homepage
 * Tech: React 18, Tailwind CSS, Framer Motion (via CDN shim below)
 *
 * This file is a self-contained React component. In the real project it lives at:
 *   src/pages/HomePage.jsx
 *
 * Design language: Stripe-clean layout meets Airbnb warmth and Linear precision.
 * Palette: Deep indigo (#1a1a3e) primary, warm sand (#f5f0e8) surface, coral (#e85d2f) accent.
 * Typography: Inter for body, Sora (display) for headlines.
 */

import { useState, useEffect, useRef } from "react";

// ─── Fake data (replace with API calls via React Query in prod) ───────────────
const POPULAR_COUNTRIES = [
  {
    code: "TR",
    name: "Turkey",
    flag: "🇹🇷",
    visaType: "Visa on Arrival",
    duration: "30 days",
    badge: "Easy",
    badgeColor: "green",
    fee: "Free",
    time: "On arrival",
  },
  {
    code: "AE",
    name: "UAE",
    flag: "🇦🇪",
    visaType: "Visa Free",
    duration: "30 days",
    badge: "Easy",
    badgeColor: "green",
    fee: "Free",
    time: "No wait",
  },
  {
    code: "EG",
    name: "Egypt",
    flag: "🇪🇬",
    visaType: "Visa on Arrival",
    duration: "30 days",
    badge: "Easy",
    badgeColor: "green",
    fee: "$25",
    time: "On arrival",
  },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    visaType: "Schengen Visa",
    duration: "90 days",
    badge: "Apply ahead",
    badgeColor: "amber",
    fee: "€80",
    time: "15–30 days",
  },
  {
    code: "GB",
    name: "UK",
    flag: "🇬🇧",
    visaType: "Standard Visitor",
    duration: "6 months",
    badge: "Apply ahead",
    badgeColor: "amber",
    fee: "£115",
    time: "3 weeks",
  },
  {
    code: "US",
    name: "USA",
    flag: "🇺🇸",
    visaType: "B1/B2 Visa",
    duration: "Up to 6 months",
    badge: "Complex",
    badgeColor: "red",
    fee: "$185",
    time: "2–6 months",
  },
];

const STATS = [
  { value: "193", label: "Countries covered" },
  { value: "42", label: "Visa-free destinations" },
  { value: "98", label: "Visa on arrival" },
  { value: "Daily", label: "Data updates" },
];

const FEATURES = [
  {
    icon: "⚡",
    title: "Real-time accuracy",
    desc: "Visa data verified against official embassy portals and updated daily. Never rely on outdated information again.",
  },
  {
    icon: "🗺",
    title: "Full country coverage",
    desc: "Every country on earth, with detailed requirements including fees, processing times, documents needed, and embassy contacts.",
  },
  {
    icon: "📋",
    title: "Step-by-step guides",
    desc: "Not just requirements — we walk you through the exact application process for every major visa type.",
  },
  {
    icon: "🔔",
    title: "Requirement alerts",
    desc: "Get notified when visa rules change for countries on your travel wishlist. Never get caught off-guard.",
  },
];

const VISA_CATEGORIES = [
  { label: "Visa Free", count: 42, color: "#22c55e", bg: "#f0fdf4" },
  { label: "Visa on Arrival", count: 56, color: "#f59e0b", bg: "#fffbeb" },
  { label: "eVisa", count: 38, color: "#3b82f6", bg: "#eff6ff" },
  { label: "Embassy Visa", count: 57, color: "#e85d2f", bg: "#fff7ed" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ type, children }) {
  const styles = {
    green: "bg-green-50 text-green-700 border border-green-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    red: "bg-red-50 text-red-700 border border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[type] || styles.green}`}
    >
      {children}
    </span>
  );
}

function CountryCard({ country, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={`/country/${country.code.toLowerCase()}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        background: "#ffffff",
        borderRadius: "16px",
        border: `1px solid ${hovered ? "#c7d2fe" : "#e8e8f0"}`,
        padding: "20px",
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 12px 32px rgba(26,26,62,0.10)"
          : "0 1px 3px rgba(0,0,0,0.04)",
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
        <span style={{ fontSize: "36px", lineHeight: 1 }}>{country.flag}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: "16px", color: "#1a1a3e" }}>
            {country.name}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
            {country.visaType}
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Badge type={country.badgeColor}>{country.badge}</Badge>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
          padding: "12px",
          background: "#f8f8fc",
          borderRadius: "10px",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "2px" }}>Stay</div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a3e" }}>
            {country.duration}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "2px" }}>Fee</div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a3e" }}>{country.fee}</div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "2px" }}>Processing</div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a3e" }}>{country.time}</div>
        </div>
      </div>

      <div
        style={{
          marginTop: "12px",
          fontSize: "13px",
          color: "#e85d2f",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        View full requirements
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </a>
  );
}

function SearchBar() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <form onSubmit={handleSearch} style={{ width: "100%", maxWidth: "620px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#ffffff",
          borderRadius: "16px",
          border: `2px solid ${focused ? "#e85d2f" : "transparent"}`,
          boxShadow: focused
            ? "0 0 0 4px rgba(232,93,47,0.12), 0 8px 32px rgba(0,0,0,0.12)"
            : "0 4px 24px rgba(0,0,0,0.16)",
          transition: "all 0.2s ease",
          overflow: "hidden",
          padding: "6px 6px 6px 20px",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="2"
          style={{ flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search any country — Turkey, Germany, USA…"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: "16px",
            color: "#1a1a3e",
            background: "transparent",
            padding: "10px 12px",
          }}
        />
        <button
          type="submit"
          style={{
            background: "#e85d2f",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => (e.target.style.background = "#cf4a1e")}
          onMouseLeave={(e) => (e.target.style.background = "#e85d2f")}
        >
          Check visa
        </button>
      </div>
    </form>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', 'Sora', system-ui, sans-serif", color: "#1a1a3e" }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
          transition: "all 0.3s ease",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            height: "68px",
            gap: "40px",
          }}
        >
          {/* Logo */}
          <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "linear-gradient(135deg, #e85d2f, #ff8c5a)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              🇯🇴
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: "16px", color: "#1a1a3e" }}>Jordan</span>
              <span style={{ fontWeight: 400, fontSize: "16px", color: "#6b7280" }}> Visa Guide</span>
            </div>
          </a>

          {/* Nav links */}
          <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
            {[
              { href: "/search", label: "All countries" },
              { href: "/faq", label: "FAQ" },
              { href: "/about", label: "About" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  color: scrolled ? "#374151" : "#ffffff",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  padding: "8px 14px",
                  borderRadius: "8px",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,0.15)")}
                onMouseLeave={(e) => (e.target.style.background = "transparent")}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(150deg, #1a1a3e 0%, #2d2a72 50%, #1a1a3e 100%)",
          padding: "140px 24px 100px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative orbs */}
        <div style={{
          position: "absolute", top: "-60px", right: "-60px",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(232,93,47,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-40px", left: "-40px",
          width: "300px", height: "300px",
          background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Eyebrow */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: "100px",
            padding: "6px 16px",
            marginBottom: "28px",
            fontSize: "13px",
            color: "rgba(255,255,255,0.8)",
            fontWeight: 500,
          }}
        >
          <span style={{ color: "#fbbf24" }}>🇯🇴</span>
          The definitive visa resource for Jordanian passport holders
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.08,
            margin: "0 auto 20px",
            maxWidth: "820px",
            letterSpacing: "-0.03em",
          }}
        >
          Where can your
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #ff8c5a, #e85d2f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Jordanian passport
          </span>{" "}
          take you?
        </h1>

        <p
          style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "rgba(255,255,255,0.65)",
            maxWidth: "540px",
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}
        >
          Instant, accurate visa requirements for 193 countries. No guesswork.
          No outdated data. Updated daily from official sources.
        </p>

        <SearchBar />

        {/* Quick filters */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "20px" }}>
          {["🟢 Visa-free countries", "⚡ Visa on arrival", "📱 eVisa available", "🌍 Arab world"].map((tag) => (
            <a
              key={tag}
              href={`/search?filter=${tag.split(" ")[1]?.toLowerCase()}`}
              style={{
                background: "rgba(255,255,255,0.09)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "100px",
                padding: "7px 16px",
                fontSize: "13px",
                color: "rgba(255,255,255,0.75)",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255,255,255,0.16)";
                e.target.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255,255,255,0.09)";
                e.target.style.color = "rgba(255,255,255,0.75)";
              }}
            >
              {tag}
            </a>
          ))}
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      <section
        style={{
          background: "#f5f0e8",
          padding: "36px 24px",
          borderBottom: "1px solid #ece6da",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "0",
            textAlign: "center",
          }}
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: "16px",
                borderRight: i < STATS.length - 1 ? "1px solid #ddd5c8" : "none",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "#1a1a3e",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: "13px", color: "#8a7f72", marginTop: "4px", fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── VISA CATEGORY OVERVIEW ───────────────────────────── */}
      <section style={{ padding: "80px 24px 60px", background: "#ffffff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#e85d2f", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
              At a glance
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#1a1a3e", margin: 0, letterSpacing: "-0.02em" }}>
              193 countries, four paths
            </h2>
            <p style={{ color: "#6b7280", marginTop: "12px", fontSize: "16px" }}>
              Every country sorted by how easy it is to enter with a Jordanian passport.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {VISA_CATEGORIES.map((cat) => (
              <a
                key={cat.label}
                href={`/search?type=${cat.label.toLowerCase().replace(/ /g, "-")}`}
                style={{
                  display: "block",
                  background: cat.bg,
                  border: `1px solid ${cat.color}22`,
                  borderRadius: "16px",
                  padding: "28px 24px",
                  textDecoration: "none",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = `0 12px 32px ${cat.color}22`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    fontSize: "40px",
                    fontWeight: 900,
                    color: cat.color,
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                    marginBottom: "8px",
                  }}
                >
                  {cat.count}
                </div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a3e", marginBottom: "4px" }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                  destinations →
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR DESTINATIONS ─────────────────────────────── */}
      <section style={{ padding: "60px 24px 80px", background: "#fafafa" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: "36px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#e85d2f", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                Most searched
              </div>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "#1a1a3e", margin: 0, letterSpacing: "-0.02em" }}>
                Popular destinations
              </h2>
            </div>
            <a
              href="/search"
              style={{
                color: "#e85d2f",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              View all 193 countries
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {POPULAR_COUNTRIES.map((country, i) => (
              <CountryCard key={country.code} country={country} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "#1a1a3e" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#ffffff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              Built for Jordanian travellers
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "16px", maxWidth: "480px", margin: "0 auto" }}>
              Every feature designed around the reality of travelling on a Jordanian passport.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "16px",
                  padding: "28px",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>{f.icon}</div>
                <div style={{ fontSize: "17px", fontWeight: 700, color: "#ffffff", marginBottom: "10px" }}>
                  {f.title}
                </div>
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg, #e85d2f, #ff7043)",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: "#ffffff", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
          Start planning your trip today
        </h2>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "18px", margin: "0 0 36px" }}>
          Search any country and get visa requirements in seconds.
        </p>
        <a
          href="/search"
          style={{
            display: "inline-block",
            background: "#ffffff",
            color: "#e85d2f",
            borderRadius: "14px",
            padding: "16px 36px",
            fontWeight: 700,
            fontSize: "16px",
            textDecoration: "none",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            boxShadow: "0 4px 16px rgba(0,0,0,0.16)",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 8px 24px rgba(0,0,0,0.24)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 16px rgba(0,0,0,0.16)";
          }}
        >
          Explore all countries →
        </a>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: "#111127", padding: "60px 24px 36px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: "40px",
              marginBottom: "48px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{ fontSize: "24px" }}>🇯🇴</div>
                <span style={{ fontWeight: 700, fontSize: "15px", color: "#ffffff" }}>Jordan Visa Guide</span>
              </div>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: "260px" }}>
                The most accurate and up-to-date visa resource for Jordanian passport holders. Data sourced from official embassy portals and verified daily.
              </p>
            </div>

            {[
              {
                heading: "Explore",
                links: ["All countries", "Visa-free list", "Schengen guide", "Arab world"],
              },
              {
                heading: "Resources",
                links: ["FAQ", "Blog", "Visa tips", "Embassy finder"],
              },
              {
                heading: "Company",
                links: ["About", "Contact", "Privacy policy", "Terms of use"],
              },
            ].map((col) => (
              <div key={col.heading}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
                  {col.heading}
                </div>
                {col.links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    style={{
                      display: "block",
                      fontSize: "14px",
                      color: "rgba(255,255,255,0.6)",
                      textDecoration: "none",
                      marginBottom: "10px",
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#ffffff")}
                    onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.6)")}
                  >
                    {link}
                  </a>
                ))}
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              paddingTop: "28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
              © 2025 Jordan Visa Guide. Visa information is provided for reference only — always verify with the official embassy.
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
              Data updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
