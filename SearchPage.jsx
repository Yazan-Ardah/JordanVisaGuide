/**
 * Jordan Visa Guide — Search Page
 * Lives at: src/pages/SearchPage.jsx
 *
 * Design mirrors HomePage: Deep indigo (#1a1a3e) primary, warm sand (#f5f0e8) surface,
 * coral (#e85d2f) accent. Inter/Sora typography.
 */

import { useState, useEffect, useRef, useMemo } from "react";

// ─── Full country dataset (replace with API call in prod) ─────────────────────
const ALL_COUNTRIES = [
  { code: "TR", name: "Turkey",       flag: "🇹🇷", region: "Middle East",   visaType: "Visa on Arrival", duration: "30 days",     badge: "Easy",         badgeColor: "green", fee: "Free",  time: "On arrival" },
  { code: "AE", name: "UAE",          flag: "🇦🇪", region: "Middle East",   visaType: "Visa Free",       duration: "30 days",     badge: "Easy",         badgeColor: "green", fee: "Free",  time: "No wait" },
  { code: "EG", name: "Egypt",        flag: "🇪🇬", region: "Africa",        visaType: "Visa on Arrival", duration: "30 days",     badge: "Easy",         badgeColor: "green", fee: "$25",   time: "On arrival" },
  { code: "MA", name: "Morocco",      flag: "🇲🇦", region: "Africa",        visaType: "Visa Free",       duration: "90 days",     badge: "Easy",         badgeColor: "green", fee: "Free",  time: "No wait" },
  { code: "TN", name: "Tunisia",      flag: "🇹🇳", region: "Africa",        visaType: "Visa Free",       duration: "30 days",     badge: "Easy",         badgeColor: "green", fee: "Free",  time: "No wait" },
  { code: "LB", name: "Lebanon",      flag: "🇱🇧", region: "Middle East",   visaType: "Visa Free",       duration: "1 month",     badge: "Easy",         badgeColor: "green", fee: "Free",  time: "No wait" },
  { code: "KW", name: "Kuwait",       flag: "🇰🇼", region: "Middle East",   visaType: "Visa Free",       duration: "1 month",     badge: "Easy",         badgeColor: "green", fee: "Free",  time: "No wait" },
  { code: "BH", name: "Bahrain",      flag: "🇧🇭", region: "Middle East",   visaType: "Visa on Arrival", duration: "14 days",     badge: "Easy",         badgeColor: "green", fee: "Free",  time: "On arrival" },
  { code: "QA", name: "Qatar",        flag: "🇶🇦", region: "Middle East",   visaType: "Visa Free",       duration: "30 days",     badge: "Easy",         badgeColor: "green", fee: "Free",  time: "No wait" },
  { code: "OM", name: "Oman",         flag: "🇴🇲", region: "Middle East",   visaType: "Visa on Arrival", duration: "14 days",     badge: "Easy",         badgeColor: "green", fee: "Free",  time: "On arrival" },
  { code: "MV", name: "Maldives",     flag: "🇲🇻", region: "Asia",          visaType: "Visa on Arrival", duration: "30 days",     badge: "Easy",         badgeColor: "green", fee: "Free",  time: "On arrival" },
  { code: "ID", name: "Indonesia",    flag: "🇮🇩", region: "Asia",          visaType: "Visa on Arrival", duration: "30 days",     badge: "Easy",         badgeColor: "green", fee: "$35",   time: "On arrival" },
  { code: "MY", name: "Malaysia",     flag: "🇲🇾", region: "Asia",          visaType: "Visa Free",       duration: "30 days",     badge: "Easy",         badgeColor: "green", fee: "Free",  time: "No wait" },
  { code: "KE", name: "Kenya",        flag: "🇰🇪", region: "Africa",        visaType: "eVisa",           duration: "90 days",     badge: "eVisa",        badgeColor: "blue",  fee: "$51",   time: "3–5 days" },
  { code: "TZ", name: "Tanzania",     flag: "🇹🇿", region: "Africa",        visaType: "eVisa",           duration: "90 days",     badge: "eVisa",        badgeColor: "blue",  fee: "$50",   time: "3–5 days" },
  { code: "ET", name: "Ethiopia",     flag: "🇪🇹", region: "Africa",        visaType: "eVisa",           duration: "30 days",     badge: "eVisa",        badgeColor: "blue",  fee: "$52",   time: "3 days" },
  { code: "IN", name: "India",        flag: "🇮🇳", region: "Asia",          visaType: "eVisa",           duration: "60 days",     badge: "eVisa",        badgeColor: "blue",  fee: "$25",   time: "3–5 days" },
  { code: "LK", name: "Sri Lanka",    flag: "🇱🇰", region: "Asia",          visaType: "eVisa",           duration: "30 days",     badge: "eVisa",        badgeColor: "blue",  fee: "$20",   time: "1–2 days" },
  { code: "TR", name: "Turkey",       flag: "🇹🇷", region: "Europe",        visaType: "eVisa",           duration: "90 days",     badge: "eVisa",        badgeColor: "blue",  fee: "$50",   time: "Instant" },
  { code: "DE", name: "Germany",      flag: "🇩🇪", region: "Europe",        visaType: "Schengen Visa",   duration: "90 days",     badge: "Apply ahead",  badgeColor: "amber", fee: "€80",   time: "15–30 days" },
  { code: "FR", name: "France",       flag: "🇫🇷", region: "Europe",        visaType: "Schengen Visa",   duration: "90 days",     badge: "Apply ahead",  badgeColor: "amber", fee: "€80",   time: "15–30 days" },
  { code: "IT", name: "Italy",        flag: "🇮🇹", region: "Europe",        visaType: "Schengen Visa",   duration: "90 days",     badge: "Apply ahead",  badgeColor: "amber", fee: "€80",   time: "15–30 days" },
  { code: "ES", name: "Spain",        flag: "🇪🇸", region: "Europe",        visaType: "Schengen Visa",   duration: "90 days",     badge: "Apply ahead",  badgeColor: "amber", fee: "€80",   time: "15–30 days" },
  { code: "NL", name: "Netherlands",  flag: "🇳🇱", region: "Europe",        visaType: "Schengen Visa",   duration: "90 days",     badge: "Apply ahead",  badgeColor: "amber", fee: "€80",   time: "15–30 days" },
  { code: "SE", name: "Sweden",       flag: "🇸🇪", region: "Europe",        visaType: "Schengen Visa",   duration: "90 days",     badge: "Apply ahead",  badgeColor: "amber", fee: "€80",   time: "15–30 days" },
  { code: "CH", name: "Switzerland",  flag: "🇨🇭", region: "Europe",        visaType: "Schengen Visa",   duration: "90 days",     badge: "Apply ahead",  badgeColor: "amber", fee: "CHF 80","time": "15–30 days" },
  { code: "GB", name: "UK",           flag: "🇬🇧", region: "Europe",        visaType: "Standard Visitor",duration: "6 months",    badge: "Apply ahead",  badgeColor: "amber", fee: "£115",  time: "3 weeks" },
  { code: "CA", name: "Canada",       flag: "🇨🇦", region: "Americas",      visaType: "Visitor Visa",    duration: "6 months",    badge: "Apply ahead",  badgeColor: "amber", fee: "CAD $100","time":"4–8 weeks"},
  { code: "AU", name: "Australia",    flag: "🇦🇺", region: "Oceania",       visaType: "Visitor Visa",    duration: "3 months",    badge: "Apply ahead",  badgeColor: "amber", fee: "AUD $145","time":"4–6 weeks"},
  { code: "JP", name: "Japan",        flag: "🇯🇵", region: "Asia",          visaType: "Tourist Visa",    duration: "90 days",     badge: "Apply ahead",  badgeColor: "amber", fee: "¥3,000","time":"5–7 days" },
  { code: "KR", name: "South Korea",  flag: "🇰🇷", region: "Asia",          visaType: "Tourist Visa",    duration: "90 days",     badge: "Apply ahead",  badgeColor: "amber", fee: "$45",   time: "5–7 days" },
  { code: "CN", name: "China",        flag: "🇨🇳", region: "Asia",          visaType: "Tourist Visa",    duration: "30 days",     badge: "Complex",      badgeColor: "red",   fee: "~$140", time: "4–7 days" },
  { code: "US", name: "USA",          flag: "🇺🇸", region: "Americas",      visaType: "B1/B2 Visa",      duration: "Up to 6 months",badge:"Complex",      badgeColor: "red",   fee: "$185",  time: "2–6 months" },
  { code: "RU", name: "Russia",       flag: "🇷🇺", region: "Europe",        visaType: "Tourist Visa",    duration: "30 days",     badge: "Complex",      badgeColor: "red",   fee: "€35",   time: "3–20 days" },
  { code: "BR", name: "Brazil",       flag: "🇧🇷", region: "Americas",      visaType: "Tourist Visa",    duration: "90 days",     badge: "Complex",      badgeColor: "red",   fee: "$80",   time: "10–15 days" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", region: "Africa",        visaType: "Tourist Visa",    duration: "30 days",     badge: "Apply ahead",  badgeColor: "amber", fee: "ZAR 425","time":"5–10 days"},
  { code: "MX", name: "Mexico",       flag: "🇲🇽", region: "Americas",      visaType: "Tourist Visa",    duration: "180 days",    badge: "Apply ahead",  badgeColor: "amber", fee: "$36",   time: "3–5 days" },
  { code: "AR", name: "Argentina",    flag: "🇦🇷", region: "Americas",      visaType: "Tourist Visa",    duration: "90 days",     badge: "Apply ahead",  badgeColor: "amber", fee: "$50",   time: "5–10 days" },
  { code: "TH", name: "Thailand",     flag: "🇹🇭", region: "Asia",          visaType: "Visa on Arrival", duration: "15 days",     badge: "Easy",         badgeColor: "green", fee: "THB 2000","time":"On arrival"},
  { code: "SG", name: "Singapore",    flag: "🇸🇬", region: "Asia",          visaType: "Visa Required",   duration: "30 days",     badge: "Apply ahead",  badgeColor: "amber", fee: "SGD $30","time":"3–5 days"},
];

const REGIONS = ["All regions", "Middle East", "Europe", "Asia", "Africa", "Americas", "Oceania"];
const VISA_TYPES = ["All types", "Visa Free", "Visa on Arrival", "eVisa", "Apply ahead", "Complex"];

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ type, children }) {
  const styles = {
    green: "bg-green-50 text-green-700 border border-green-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    red:   "bg-red-50 text-red-700 border border-red-200",
    blue:  "bg-blue-50 text-blue-700 border border-blue-200",
  };
  const inlineStyles = {
    green: { background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" },
    amber: { background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" },
    red:   { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" },
    blue:  { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" },
  };
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 8px",
      borderRadius: "100px",
      fontSize: "11px",
      fontWeight: 600,
      whiteSpace: "nowrap",
      ...(inlineStyles[type] || inlineStyles.green),
    }}>
      {children}
    </span>
  );
}

// ─── Country Row (list view) ──────────────────────────────────────────────────
function CountryRow({ country }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={`/country/${country.code.toLowerCase()}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1.2fr 0.8fr 0.8fr 1fr auto",
        alignItems: "center",
        gap: "16px",
        padding: "16px 20px",
        textDecoration: "none",
        color: "inherit",
        borderBottom: "1px solid #f0f0f6",
        background: hovered ? "#fafafa" : "#ffffff",
        transition: "background 0.15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "28px", lineHeight: 1, flexShrink: 0 }}>{country.flag}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: "15px", color: "#1a1a3e" }}>{country.name}</div>
          <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "1px" }}>{country.region}</div>
        </div>
      </div>
      <div style={{ fontSize: "13px", color: "#374151" }}>{country.visaType}</div>
      <div style={{ fontSize: "13px", color: "#374151" }}>{country.duration}</div>
      <div style={{ fontSize: "13px", color: "#374151" }}>{country.fee}</div>
      <div style={{ fontSize: "13px", color: "#374151" }}>{country.time}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Badge type={country.badgeColor}>{country.badge}</Badge>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </a>
  );
}

// ─── Country Card (grid view) ─────────────────────────────────────────────────
function CountryCard({ country }) {
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
        boxShadow: hovered ? "0 12px 32px rgba(26,26,62,0.10)" : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
        <span style={{ fontSize: "36px", lineHeight: 1 }}>{country.flag}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "15px", color: "#1a1a3e" }}>{country.name}</div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{country.visaType}</div>
        </div>
        <Badge type={country.badgeColor}>{country.badge}</Badge>
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px",
        padding: "12px", background: "#f8f8fc", borderRadius: "10px",
      }}>
        {[["Stay", country.duration], ["Fee", country.fee], ["Processing", country.time]].map(([label, val]) => (
          <div key={label}>
            <div style={{ fontSize: "10px", color: "#9ca3af", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "#1a1a3e" }}>{val}</div>
          </div>
        ))}
      </div>
    </a>
  );
}

// ─── Main SearchPage component ────────────────────────────────────────────────
export default function SearchPage() {
  const [query, setQuery]         = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("q") || "";
    }
    return "";
  });
  const [region, setRegion]       = useState("All regions");
  const [visaFilter, setVisaFilter] = useState("All types");
  const [viewMode, setViewMode]   = useState("list"); // "list" | "grid"
  const [scrolled, setScrolled]   = useState(false);
  const [inputVal, setInputVal]   = useState(query);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const filtered = useMemo(() => {
    return ALL_COUNTRIES.filter((c) => {
      const matchQuery = !query || c.name.toLowerCase().includes(query.toLowerCase());
      const matchRegion = region === "All regions" || c.region === region;
      const matchVisa = visaFilter === "All types"
        || c.visaType.toLowerCase().includes(visaFilter.toLowerCase())
        || c.badge.toLowerCase().includes(visaFilter.toLowerCase());
      return matchQuery && matchRegion && matchVisa;
    });
  }, [query, region, visaFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(inputVal.trim());
  };

  return (
    <div style={{ fontFamily: "'Inter', 'Sora', system-ui, sans-serif", color: "#1a1a3e", minHeight: "100vh", background: "#fafafa" }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.95)" : "#ffffff",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid #e8e8f0",
        transition: "all 0.2s ease",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", height: "64px", gap: "24px" }}>
          <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <div style={{
              width: "34px", height: "34px",
              background: "linear-gradient(135deg, #e85d2f, #ff8c5a)",
              borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px",
            }}>🇯🇴</div>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#1a1a3e" }}>Jordan <span style={{ color: "#6b7280", fontWeight: 400 }}>Visa Guide</span></span>
          </a>

          {/* Inline search bar */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: "480px" }}>
            <div style={{
              display: "flex", alignItems: "center",
              background: "#f3f4f6", borderRadius: "10px",
              padding: "8px 14px", gap: "8px",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Search any country…"
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "14px", color: "#1a1a3e" }}
              />
              {inputVal && (
                <button type="button" onClick={() => { setInputVal(""); setQuery(""); inputRef.current?.focus(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, lineHeight: 1 }}>
                  ✕
                </button>
              )}
            </div>
          </form>

          <div style={{ display: "flex", gap: "4px", marginLeft: "auto" }}>
            {[{ href: "/search", label: "All countries" }, { href: "/faq", label: "FAQ" }, { href: "/about", label: "About" }].map((link) => (
              <a key={link.href} href={link.href} style={{
                color: link.href === "/search" ? "#e85d2f" : "#374151",
                textDecoration: "none", fontSize: "14px", fontWeight: link.href === "/search" ? 600 : 500,
                padding: "8px 12px", borderRadius: "8px",
              }}>{link.label}</a>
            ))}
          </div>
        </div>
      </nav>

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(150deg, #1a1a3e 0%, #2d2a72 100%)", padding: "48px 24px 56px", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#ffffff", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
          All 193 countries
        </h1>
        <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
          Search, filter, and find the visa requirements for any destination.
        </p>
      </div>

      {/* ── FILTERS BAR ─────────────────────────────────────── */}
      <div style={{
        background: "#ffffff",
        borderBottom: "1px solid #e8e8f0",
        padding: "0 24px",
        position: "sticky",
        top: "64px",
        zIndex: 50,
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", flexWrap: "wrap" }}>
          {/* Region pills */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {REGIONS.map((r) => (
              <button key={r} onClick={() => setRegion(r)} style={{
                padding: "6px 14px", borderRadius: "100px", fontSize: "13px", fontWeight: 500,
                border: "1px solid",
                borderColor: region === r ? "#1a1a3e" : "#e5e7eb",
                background: region === r ? "#1a1a3e" : "#ffffff",
                color: region === r ? "#ffffff" : "#6b7280",
                cursor: "pointer", transition: "all 0.15s ease", whiteSpace: "nowrap",
              }}>{r}</button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: "1px", height: "24px", background: "#e5e7eb", flexShrink: 0 }} />

          {/* Visa type select */}
          <select
            value={visaFilter}
            onChange={(e) => setVisaFilter(e.target.value)}
            style={{
              padding: "6px 32px 6px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
              border: "1px solid #e5e7eb", background: "#ffffff", color: "#374151",
              cursor: "pointer", appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
            }}
          >
            {VISA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Result count */}
          <div style={{ marginLeft: "auto", fontSize: "13px", color: "#6b7280", flexShrink: 0 }}>
            <strong style={{ color: "#1a1a3e" }}>{filtered.length}</strong> countries
          </div>

          {/* View toggle */}
          <div style={{ display: "flex", gap: "2px", background: "#f3f4f6", borderRadius: "8px", padding: "2px" }}>
            {[
              { mode: "list", icon: "☰" },
              { mode: "grid", icon: "⊞" },
            ].map(({ mode, icon }) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: "6px 10px", borderRadius: "6px", fontSize: "14px", border: "none",
                background: viewMode === mode ? "#ffffff" : "transparent",
                boxShadow: viewMode === mode ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer", transition: "all 0.15s ease", color: viewMode === mode ? "#1a1a3e" : "#9ca3af",
              }}>{icon}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── RESULTS ─────────────────────────────────────────── */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a3e", margin: "0 0 8px" }}>No results found</h3>
            <p style={{ color: "#6b7280", margin: "0 0 20px" }}>
              Try a different search term or reset your filters.
            </p>
            <button onClick={() => { setQuery(""); setInputVal(""); setRegion("All regions"); setVisaFilter("All types"); }}
              style={{
                background: "#e85d2f", color: "#ffffff", border: "none", borderRadius: "10px",
                padding: "10px 22px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
              }}>
              Reset filters
            </button>
          </div>
        ) : viewMode === "list" ? (
          <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e8e8f0", overflow: "hidden" }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.2fr 0.8fr 0.8fr 1fr auto",
              gap: "16px",
              padding: "12px 20px",
              borderBottom: "1px solid #f0f0f6",
              background: "#f8f8fc",
            }}>
              {["Country", "Visa type", "Max stay", "Fee", "Processing", "Status"].map((h) => (
                <div key={h} style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
              ))}
            </div>
            {filtered.map((c) => <CountryRow key={c.code + c.name} country={c} />)}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {filtered.map((c) => <CountryCard key={c.code + c.name} country={c} />)}
          </div>
        )}
      </div>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: "#111127", padding: "40px 24px 28px", marginTop: "60px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>🇯🇴</span>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#ffffff" }}>Jordan Visa Guide</span>
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
            © 2025 Jordan Visa Guide · Data updated daily from official embassy sources.
          </div>
        </div>
      </footer>
    </div>
  );
}
