/**
 * Jordan Visa Guide — Country Detail Page
 * Lives at: src/pages/CountryDetailPage.jsx
 *
 * Route: /country/:code  (e.g. /country/de for Germany)
 * Design: Deep indigo (#1a1a3e) primary, warm sand (#f5f0e8) surface, coral (#e85d2f) accent.
 */

import { useState, useEffect } from "react";

// ─── Mock data store (replace with API / React Query in prod) ─────────────────
const COUNTRY_DATA = {
  de: {
    code: "DE", name: "Germany", flag: "🇩🇪", region: "Europe",
    capital: "Berlin", currency: "Euro (€)", language: "German", timezone: "CET (UTC+1)",
    visaType: "Schengen Visa (Type C)", badge: "Apply ahead", badgeColor: "amber",
    maxStay: "90 days within any 180-day period",
    fee: "€80 (adults) · €40 (children 6–12)",
    processing: "15–30 business days",
    validity: "Single/double/multiple entry up to 5 years",
    embassyCity: "Amman", embassyPhone: "+962 6 590 0000",
    embassyAddress: "4 Benghazi St, Abdoun, Amman, Jordan",
    embassyHours: "Mon–Fri 09:00–12:00",
    overviewText: "Germany is part of the Schengen Area, which means a single Schengen visa from the German embassy lets you travel freely across 27 European countries — France, Italy, Spain, Netherlands, and more. For Jordanian passport holders, the process is straightforward but requires advance preparation. Apply at the German Embassy in Amman at least 3–4 weeks before your intended travel date.",
    steps: [
      {
        number: "01", title: "Complete the online application",
        body: "Fill out the Schengen visa application form at the official German embassy portal. Print and sign the completed form.",
      },
      {
        number: "02", title: "Gather required documents",
        body: "Compile your full document package (see checklist below). All documents must be originals plus one photocopy.",
      },
      {
        number: "03", title: "Book your embassy appointment",
        body: "Schedule an appointment via the German Embassy Amman appointment system. Peak season slots (June–August) fill up quickly — book 6–8 weeks ahead.",
      },
      {
        number: "04", title: "Attend your appointment",
        body: "Arrive 10 minutes early with all documents. You will submit your application, provide biometrics (fingerprints), and pay the visa fee in cash (JOD equivalent).",
      },
      {
        number: "05", title: "Wait for processing",
        body: "Standard processing is 15 business days. You will receive an SMS or email when your passport is ready for collection.",
      },
      {
        number: "06", title: "Collect your passport",
        body: "Pick up your passport in person, or arrange courier collection if offered. Check visa dates and entry type carefully before leaving the embassy.",
      },
    ],
    documents: [
      { item: "Valid passport", note: "Must be valid for at least 3 months beyond your planned return date" },
      { item: "Completed Schengen application form", note: "Signed and dated" },
      { item: "2 recent passport photos", note: "35×45mm, white background, taken within the last 6 months" },
      { item: "Travel itinerary", note: "Flight bookings (confirmed or provisional) for entire trip" },
      { item: "Hotel reservations", note: "For all nights in the Schengen Area" },
      { item: "Travel insurance", note: "Minimum coverage €30,000, valid for entire Schengen Area" },
      { item: "Bank statements", note: "Last 3 months, showing sufficient funds (min. €50/day recommended)" },
      { item: "Employment proof", note: "Letter from employer, payslips, or trade license if self-employed" },
      { item: "Proof of ties to Jordan", note: "Property ownership, family ties, or other strong reason to return" },
    ],
    faqs: [
      {
        q: "Can I travel to other Schengen countries with a German visa?",
        a: "Yes. A German Schengen visa (Type C) allows you to travel freely across all 27 Schengen member states. However, Germany should be your main or first destination.",
      },
      {
        q: "Do I need to prove I have enough money?",
        a: "Yes. German embassy guidance recommends at least €50 per day of your stay. Bank statements from the last 3 months are the standard proof. A letter from a host can supplement this.",
      },
      {
        q: "Can I extend my Schengen visa from inside Germany?",
        a: "Extensions are only granted in exceptional circumstances (e.g. medical emergency, force majeure). You cannot extend for tourism purposes — apply for a new visa if needed.",
      },
      {
        q: "What happens if my visa is refused?",
        a: "You will receive a written refusal with grounds. You can appeal within one month. Common grounds: insufficient funds, unclear itinerary, or weak ties to Jordan.",
      },
      {
        q: "Is a confirmed flight ticket required?",
        a: "Not necessarily confirmed — many applicants submit provisional ('on-hold') bookings that don't require payment until after visa approval. Check with your airline.",
      },
    ],
    tips: [
      "Apply at the German Embassy even if France or Italy is your main stop — German embassies in Amman are known for faster processing.",
      "Get travel insurance from a provider that issues a certificate immediately (e.g. AXA, Allianz) so you can attach it to your application.",
      "Translate all non-English documents by a certified translator. The embassy does not accept Google Translate printouts.",
      "Keep digital copies of everything in Google Drive or Dropbox before your appointment.",
    ],
    relatedCountries: [
      { code: "fr", name: "France", flag: "🇫🇷", badge: "Apply ahead", badgeColor: "amber" },
      { code: "it", name: "Italy",  flag: "🇮🇹", badge: "Apply ahead", badgeColor: "amber" },
      { code: "es", name: "Spain",  flag: "🇪🇸", badge: "Apply ahead", badgeColor: "amber" },
      { code: "nl", name: "Netherlands", flag: "🇳🇱", badge: "Apply ahead", badgeColor: "amber" },
    ],
  },
  us: {
    code: "US", name: "United States", flag: "🇺🇸", region: "Americas",
    capital: "Washington, D.C.", currency: "US Dollar ($)", language: "English", timezone: "EST–PST (UTC−5 to −8)",
    visaType: "B1/B2 Visitor Visa", badge: "Complex", badgeColor: "red",
    maxStay: "Up to 6 months (as determined by CBP officer)",
    fee: "$185 (non-refundable MRV fee)",
    processing: "2–6 months (varies significantly)",
    validity: "10 years, multiple entry",
    embassyCity: "Amman", embassyPhone: "+962 6 590 6000",
    embassyAddress: "Al-Umawyeen St, Abdoun, Amman, Jordan",
    embassyHours: "Mon–Fri 08:00–10:30 (appointment required)",
    overviewText: "The US B1/B2 visa is one of the most scrutinized visitor visas in the world. For Jordanian passport holders it requires an in-person interview at the US Embassy in Abdoun, Amman. Approval depends heavily on demonstrating strong ties to Jordan and clear intent to return. Processing times can be unpredictable — apply 3–6 months before your trip.",
    steps: [
      { number: "01", title: "Pay the MRV fee", body: "Pay the $185 fee at an approved bank in Jordan (see the embassy website for current partner banks). Keep the receipt." },
      { number: "02", title: "Complete DS-160 form", body: "Fill out the DS-160 online at ceac.state.gov. This is a detailed personal history form — set aside 90–120 minutes. Print the confirmation page." },
      { number: "03", title: "Schedule interview", body: "Book your interview appointment via the US embassy scheduling portal. Current wait times fluctuate — check early as slots book up weeks in advance." },
      { number: "04", title: "Prepare your documents", body: "Assemble all required documents. Organize them in the order listed on the embassy website. Bring originals and photocopies." },
      { number: "05", title: "Attend interview", body: "Arrive 15 minutes early. Security screening takes time. The interview itself is typically 2–5 minutes — be concise and confident." },
      { number: "06", title: "Administrative processing", body: "If your application is placed under 221(g) administrative processing, wait for the embassy to contact you. This can add weeks or months." },
    ],
    documents: [
      { item: "DS-160 confirmation page", note: "Printed, with barcode visible" },
      { item: "MRV fee receipt", note: "From the bank payment" },
      { item: "Interview appointment confirmation", note: "Printed from the scheduling system" },
      { item: "Valid passport", note: "Plus all passports from the last 10 years" },
      { item: "One passport photo", note: "5×5 cm, white background" },
      { item: "Strong ties to Jordan", note: "Property deeds, employment letter, family documents — the most important factor" },
      { item: "Bank statements / financial proof", note: "Last 6 months, showing stable finances" },
      { item: "Invitation letter", note: "If visiting family or attending a conference — include host's US address, status, and contact info" },
      { item: "Travel itinerary", note: "Rough plan of where you'll go and what you'll do in the US" },
    ],
    faqs: [
      {
        q: "What is the most common reason for B1/B2 refusals for Jordanians?",
        a: "Section 214(b) refusals — the officer was not convinced you have strong enough ties to Jordan to ensure you'll return. Counter this with documented property, a stable job, and family commitments.",
      },
      {
        q: "Can I reapply after a refusal?",
        a: "Yes, immediately. But you should reapply with genuinely new or stronger evidence. Reapplying with the same documents rarely changes the outcome.",
      },
      {
        q: "How long does the interview take?",
        a: "The visa interview itself is very short — 2 to 5 minutes. Most of your time will be spent in the security queue and waiting room. Plan for 3–4 hours total.",
      },
      {
        q: "Does the 10-year validity mean I can stay 10 years?",
        a: "No. The visa validity is how long you can use it to enter the US. Each entry, the CBP officer at the border stamps how long you may stay — usually 6 months.",
      },
    ],
    tips: [
      "Dress professionally for the interview. First impressions matter.",
      "When asked about ties to Jordan, be specific: 'I own an apartment in Amman and manage a team of 12 people' is more convincing than 'I have family here'.",
      "Do not book non-refundable flights or hotels until your visa is approved.",
      "If you have a US contact (friend, relative, company), an invitation letter adds credibility — especially with their contact details and status.",
    ],
    relatedCountries: [
      { code: "ca", name: "Canada", flag: "🇨🇦", badge: "Apply ahead", badgeColor: "amber" },
      { code: "au", name: "Australia", flag: "🇦🇺", badge: "Apply ahead", badgeColor: "amber" },
      { code: "gb", name: "UK", flag: "🇬🇧", badge: "Apply ahead", badgeColor: "amber" },
    ],
  },
  ae: {
    code: "AE", name: "UAE", flag: "🇦🇪", region: "Middle East",
    capital: "Abu Dhabi", currency: "UAE Dirham (AED)", language: "Arabic / English", timezone: "GST (UTC+4)",
    visaType: "Visa Free", badge: "Easy", badgeColor: "green",
    maxStay: "30 days per visit (extendable once)",
    fee: "Free",
    processing: "No visa required — stamp on arrival",
    validity: "Multiple entries, 30 days each",
    embassyCity: "N/A — no visa required",
    embassyPhone: "N/A",
    embassyAddress: "N/A",
    embassyHours: "N/A",
    overviewText: "Jordanian passport holders can enter the UAE without a visa and receive a 30-day stay stamp on arrival at any UAE airport or land border. The UAE is one of the easiest destinations for Jordanians — no prior arrangement needed, just a valid passport and onward/return ticket. You can extend your stay by 30 more days at an immigration office inside the UAE.",
    steps: [
      { number: "01", title: "Book your flight", body: "No visa application needed. Book your flights to Dubai (DXB), Abu Dhabi (AUH), or Sharjah (SHJ)." },
      { number: "02", title: "Arrive at UAE port of entry", body: "Present your Jordanian passport at immigration. You'll receive a 30-day entry stamp automatically." },
      { number: "03", title: "Enjoy your stay", body: "You're free to travel across all seven Emirates — Dubai, Abu Dhabi, Sharjah, Ras Al Khaimah, Fujairah, Umm Al Quwain, Ajman." },
      { number: "04", title: "Extend if needed", body: "Visit any UAE immigration office or approved travel agency to apply for a 30-day extension before your stamp expires." },
    ],
    documents: [
      { item: "Valid Jordanian passport", note: "Must be valid for at least 6 months from entry date" },
      { item: "Return or onward ticket", note: "Required to show proof you plan to leave" },
      { item: "Accommodation proof", note: "Hotel booking or host's address (may be asked at immigration)" },
      { item: "Sufficient funds", note: "No fixed amount — officers use discretion. AED 3,000+ is a good baseline." },
    ],
    faqs: [
      { q: "Do I need to arrange a visa before flying?", a: "No. Jordanians receive a visa-free stamp on arrival in the UAE. No pre-arrangement is needed." },
      { q: "Can I work on a visa-free entry?", a: "No. The entry stamp is for tourism and visits only. Working without a proper UAE work visa is illegal." },
      { q: "Can I extend the 30-day stay?", a: "Yes, once, for another 30 days. Apply at an immigration office or approved agency inside the UAE before your stamp expires." },
      { q: "Is there a minimum passport validity requirement?", a: "Yes — your passport must be valid for at least 6 months from your date of entry." },
    ],
    tips: [
      "Download the UAE GDRFA app before you travel — it lets you check your visa status and apply for extensions.",
      "Carry enough cash or a credit card. UAE immigration may ask about funds.",
      "Ramadan does not restrict entry, but be respectful of local customs around eating and drinking in public.",
    ],
    relatedCountries: [
      { code: "qa", name: "Qatar",   flag: "🇶🇦", badge: "Easy", badgeColor: "green" },
      { code: "bh", name: "Bahrain", flag: "🇧🇭", badge: "Easy", badgeColor: "green" },
      { code: "kw", name: "Kuwait",  flag: "🇰🇼", badge: "Easy", badgeColor: "green" },
      { code: "om", name: "Oman",    flag: "🇴🇲", badge: "Easy", badgeColor: "green" },
    ],
  },
};

// Fallback for codes not in the mock store
function getFallback(code) {
  return {
    code: code?.toUpperCase(),
    name: code?.toUpperCase(),
    flag: "🌍",
    region: "Unknown",
    capital: "—", currency: "—", language: "—", timezone: "—",
    visaType: "See embassy",
    badge: "Check embassy", badgeColor: "amber",
    maxStay: "—", fee: "—", processing: "—", validity: "—",
    embassyCity: "Amman", embassyPhone: "—", embassyAddress: "—", embassyHours: "—",
    overviewText: "Visa information for this country is not yet in our database. Please contact the embassy directly for the latest requirements.",
    steps: [], documents: [], faqs: [], tips: [], relatedCountries: [],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ type, children }) {
  const styles = {
    green: { background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" },
    amber: { background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" },
    red:   { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" },
    blue:  { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" },
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "4px 12px", borderRadius: "100px", fontSize: "13px", fontWeight: 600,
      ...(styles[type] || styles.amber),
    }}>{children}</span>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: "40px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a3e", margin: "0 0 20px", letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: "1px solid #f0f0f6",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", background: "none", border: "none", padding: "18px 0",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          gap: "16px", cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a3e" }}>{q}</span>
        <span style={{
          fontSize: "18px", color: "#9ca3af", flexShrink: 0,
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
          display: "block",
        }}>+</span>
      </button>
      {open && (
        <div style={{ fontSize: "14px", color: "#4b5563", lineHeight: 1.7, paddingBottom: "18px" }}>
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Main CountryDetailPage ───────────────────────────────────────────────────
export default function CountryDetailPage() {
  // In prod: const { code } = useParams()
  const code = (typeof window !== "undefined"
    ? window.location.pathname.split("/country/")[1]?.toLowerCase()
    : null) || "de";

  const country = COUNTRY_DATA[code] || getFallback(code);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    document.title = `${country.name} Visa for Jordanians · Jordan Visa Guide`;
  }, [country.name]);

  const badgeColors = {
    green: "#22c55e", amber: "#f59e0b", red: "#ef4444", blue: "#3b82f6",
  };

  const tabs = ["overview", "documents", "faq", "tips"];

  return (
    <div style={{ fontFamily: "'Inter', 'Sora', system-ui, sans-serif", color: "#1a1a3e", background: "#fafafa", minHeight: "100vh" }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #e8e8f0", padding: "0 24px",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", height: "64px", gap: "16px" }}>
          <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px",
              background: "linear-gradient(135deg, #e85d2f, #ff8c5a)",
              borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px",
            }}>🇯🇴</div>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#1a1a3e" }}>
              Jordan <span style={{ color: "#6b7280", fontWeight: 400 }}>Visa Guide</span>
            </span>
          </a>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#9ca3af" }}>
            <span>/</span>
            <a href="/search" style={{ color: "#6b7280", textDecoration: "none" }}>All countries</a>
            <span>/</span>
            <span style={{ color: "#1a1a3e", fontWeight: 500 }}>{country.name}</span>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
            {[{ href: "/search", label: "All countries" }, { href: "/faq", label: "FAQ" }].map((link) => (
              <a key={link.href} href={link.href} style={{
                color: "#374151", textDecoration: "none", fontSize: "14px",
                fontWeight: 500, padding: "8px 12px", borderRadius: "8px",
              }}>{link.label}</a>
            ))}
          </div>
        </div>
      </nav>

      {/* ── HERO STRIP ───────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(150deg, #1a1a3e 0%, #2d2a72 100%)",
        padding: "48px 24px",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "64px", lineHeight: 1 }}>{country.flag}</span>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", fontWeight: 500, marginBottom: "6px" }}>
                {country.region}
              </div>
              <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "#ffffff", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
                {country.name} Visa
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <Badge type={country.badgeColor}>{country.badge}</Badge>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                  {country.visaType} · {country.maxStay}
                </span>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{
              display: "flex", gap: "1px",
              background: "rgba(255,255,255,0.1)", borderRadius: "16px", overflow: "hidden",
              flexShrink: 0,
            }}>
              {[
                { label: "Fee", value: country.fee },
                { label: "Processing", value: country.processing.split(" ")[0] + (country.processing.includes("day") ? " days" : country.processing.split(" ").slice(1).join(" ")) },
                { label: "Max stay", value: country.maxStay.split(" ")[0] + " " + (country.maxStay.split(" ")[1] || "") },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: "16px 20px", background: "rgba(255,255,255,0.06)", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ─────────────────────────────────────────── */}
      <div style={{
        background: "#ffffff", borderBottom: "1px solid #e8e8f0",
        position: "sticky", top: "64px", zIndex: 50, padding: "0 24px",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", gap: "0" }}>
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "16px 20px", background: "none", border: "none",
              borderBottom: `2px solid ${activeTab === tab ? "#e85d2f" : "transparent"}`,
              color: activeTab === tab ? "#e85d2f" : "#6b7280",
              fontWeight: activeTab === tab ? 600 : 500,
              fontSize: "14px", cursor: "pointer", textTransform: "capitalize",
              transition: "all 0.15s ease",
            }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "1fr 320px", gap: "32px", alignItems: "start" }}>

        {/* ── Main content column ────────────────────────────── */}
        <div>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <>
              <Section title="Overview">
                <p style={{ fontSize: "15px", color: "#4b5563", lineHeight: 1.75, margin: 0 }}>
                  {country.overviewText}
                </p>
              </Section>

              {country.steps.length > 0 && (
                <Section title="How to apply — step by step">
                  <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                    {country.steps.map((step, i) => (
                      <div key={step.number} style={{
                        display: "flex", gap: "20px", paddingBottom: "28px",
                        position: "relative",
                      }}>
                        {/* Line */}
                        {i < country.steps.length - 1 && (
                          <div style={{
                            position: "absolute", left: "19px", top: "38px", bottom: 0,
                            width: "2px", background: "#e8e8f0",
                          }} />
                        )}
                        {/* Step number bubble */}
                        <div style={{
                          width: "38px", height: "38px", borderRadius: "50%",
                          background: "#1a1a3e", color: "#ffffff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "12px", fontWeight: 700, flexShrink: 0, zIndex: 1,
                        }}>{step.number}</div>
                        <div style={{ paddingTop: "8px" }}>
                          <div style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a3e", marginBottom: "6px" }}>
                            {step.title}
                          </div>
                          <div style={{ fontSize: "14px", color: "#4b5563", lineHeight: 1.65 }}>
                            {step.body}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === "documents" && (
            <Section title="Required documents">
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {country.documents.map((doc, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: "14px",
                    padding: "16px 18px",
                    background: "#ffffff",
                    border: "1px solid #e8e8f0",
                    borderRadius: "12px",
                  }}>
                    <div style={{
                      width: "24px", height: "24px", borderRadius: "50%",
                      background: "#f0fdf4", border: "1px solid #bbf7d0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", flexShrink: 0, marginTop: "1px",
                    }}>✓</div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a3e", marginBottom: "2px" }}>
                        {doc.item}
                      </div>
                      {doc.note && (
                        <div style={{ fontSize: "13px", color: "#6b7280" }}>{doc.note}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: "24px",
                padding: "16px 20px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "12px",
                fontSize: "13px",
                color: "#92400e",
                lineHeight: 1.6,
              }}>
                <strong>Important:</strong> Document requirements can change. Always verify the current list on the official embassy website before applying.
              </div>
            </Section>
          )}

          {/* FAQ TAB */}
          {activeTab === "faq" && (
            <Section title="Frequently asked questions">
              <div style={{ background: "#ffffff", border: "1px solid #e8e8f0", borderRadius: "16px", padding: "0 24px" }}>
                {country.faqs.map((faq, i) => (
                  <FaqItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </Section>
          )}

          {/* TIPS TAB */}
          {activeTab === "tips" && (
            <Section title={`Insider tips for ${country.name}`}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {country.tips.map((tip, i) => (
                  <div key={i} style={{
                    display: "flex", gap: "14px", alignItems: "flex-start",
                    padding: "18px 20px",
                    background: "#ffffff",
                    border: "1px solid #e8e8f0",
                    borderRadius: "12px",
                  }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "8px",
                      background: "linear-gradient(135deg, #e85d2f, #ff8c5a)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "13px", flexShrink: 0,
                    }}>💡</div>
                    <p style={{ margin: 0, fontSize: "14px", color: "#374151", lineHeight: 1.7 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── Sidebar ────────────────────────────────────────── */}
        <aside>
          {/* Visa snapshot card */}
          <div style={{
            background: "#ffffff", border: "1px solid #e8e8f0", borderRadius: "16px",
            overflow: "hidden", marginBottom: "20px",
          }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f6", background: "#f8f8fc" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Visa snapshot
              </div>
            </div>
            <div style={{ padding: "0" }}>
              {[
                { label: "Visa type",    value: country.visaType },
                { label: "Max stay",     value: country.maxStay },
                { label: "Fee",          value: country.fee },
                { label: "Processing",   value: country.processing },
                { label: "Validity",     value: country.validity },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  gap: "12px", padding: "13px 20px", borderBottom: "1px solid #f7f7fb",
                }}>
                  <span style={{ fontSize: "13px", color: "#9ca3af", flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a3e", textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Country info card */}
          <div style={{
            background: "#ffffff", border: "1px solid #e8e8f0", borderRadius: "16px",
            overflow: "hidden", marginBottom: "20px",
          }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f6", background: "#f8f8fc" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Country info
              </div>
            </div>
            <div>
              {[
                { label: "Capital",   value: country.capital },
                { label: "Currency",  value: country.currency },
                { label: "Language",  value: country.language },
                { label: "Timezone",  value: country.timezone },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  gap: "12px", padding: "13px 20px", borderBottom: "1px solid #f7f7fb",
                }}>
                  <span style={{ fontSize: "13px", color: "#9ca3af" }}>{label}</span>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a3e" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Embassy card */}
          {country.embassyPhone !== "N/A" && (
            <div style={{
              background: "#ffffff", border: "1px solid #e8e8f0", borderRadius: "16px",
              overflow: "hidden", marginBottom: "20px",
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f6", background: "#f8f8fc" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Embassy in {country.embassyCity}
                </div>
              </div>
              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "14px", flexShrink: 0 }}>📍</span>
                  <span style={{ fontSize: "13px", color: "#374151", lineHeight: 1.5 }}>{country.embassyAddress}</span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontSize: "14px" }}>📞</span>
                  <a href={`tel:${country.embassyPhone}`} style={{ fontSize: "13px", color: "#e85d2f", textDecoration: "none", fontWeight: 500 }}>
                    {country.embassyPhone}
                  </a>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontSize: "14px" }}>🕐</span>
                  <span style={{ fontSize: "13px", color: "#374151" }}>{country.embassyHours}</span>
                </div>
              </div>
            </div>
          )}

          {/* Status badge */}
          <div style={{
            padding: "16px 20px",
            background: country.badgeColor === "green" ? "#f0fdf4" : country.badgeColor === "red" ? "#fef2f2" : "#fffbeb",
            border: `1px solid ${country.badgeColor === "green" ? "#bbf7d0" : country.badgeColor === "red" ? "#fecaca" : "#fde68a"}`,
            borderRadius: "12px",
            marginBottom: "20px",
          }}>
            <div style={{
              fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
              color: country.badgeColor === "green" ? "#15803d" : country.badgeColor === "red" ? "#b91c1c" : "#b45309",
              marginBottom: "6px",
            }}>
              {country.badge === "Easy" ? "✅ Easy entry" : country.badge === "Complex" ? "⚠️ Difficult entry" : "📋 Advance planning needed"}
            </div>
            <div style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.55 }}>
              {country.badge === "Easy"
                ? "Jordanians can enter with minimal hassle. No advance visa needed."
                : country.badge === "Complex"
                ? "Significant preparation required. High scrutiny and unpredictable outcomes."
                : "Apply well in advance. Requirements are clear but the process takes time."}
            </div>
          </div>
        </aside>
      </div>

      {/* ── RELATED COUNTRIES ──────────────────────────────── */}
      {country.relatedCountries.length > 0 && (
        <div style={{ background: "#ffffff", borderTop: "1px solid #e8e8f0", padding: "48px 24px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a3e", margin: "0 0 20px" }}>
              Similar destinations
            </h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {country.relatedCountries.map((c) => (
                <a key={c.code} href={`/country/${c.code}`} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "12px 18px", borderRadius: "12px",
                  border: "1px solid #e8e8f0", background: "#ffffff",
                  textDecoration: "none", color: "inherit",
                  transition: "all 0.15s ease",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e8f0"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <span style={{ fontSize: "24px" }}>{c.flag}</span>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a3e" }}>{c.name}</div>
                    <Badge type={c.badgeColor}>{c.badge}</Badge>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: "#111127", padding: "40px 24px 28px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>🇯🇴</span>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#ffffff" }}>Jordan Visa Guide</span>
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
            © 2025 Jordan Visa Guide · Always verify with the official embassy before travelling.
          </div>
        </div>
      </footer>
    </div>
  );
}
