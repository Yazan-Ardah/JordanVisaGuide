/**
 * POST /api/generate-document
 * Body: { type, fullName, passportNumber, destination, entryDate, exitDate, jobTitle, purpose, unlockCode }
 *
 * type: 'cover_letter' | 'itinerary' | 'both'
 *
 * Required Vercel env vars:
 *   GEMINI_API_KEY  — from aistudio.google.com (free tier available)
 *   PREMIUM_CODE    — same code used by /api/unlock-premium
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify premium unlock code
  const { type, fullName, passportNumber, destination, entryDate, exitDate, jobTitle, purpose, unlockCode } = req.body || {};

  const secret = process.env.PREMIUM_CODE;
  if (!secret || (unlockCode || '').trim().toUpperCase() !== secret.trim().toUpperCase()) {
    return res.status(403).json({ error: 'Invalid unlock code. Please upgrade to premium.' });
  }

  if (!fullName || !destination || !entryDate || !exitDate || !purpose) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key not configured.' });
  }

  const entry = new Date(entryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const exit  = new Date(exitDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const nights = Math.round((new Date(exitDate) - new Date(entryDate)) / 86400000);

  const systemPrompt = `You are a senior immigration lawyer with 20 years of experience drafting successful Schengen visa applications for Jordanian nationals. You write in formal, professional English. Your documents are always accepted by embassies.`;

  let userPrompt = '';

  if (type === 'cover_letter' || type === 'both') {
    userPrompt += `
Draft a formal Schengen Visa Cover Letter for my client with these details:
- Full Name: ${fullName}
- Passport Number: ${passportNumber || 'Not provided'}
- Destination: ${destination}
- Travel Dates: ${entry} to ${exit} (${nights} nights)
- Job Title: ${jobTitle || 'Not provided'}
- Purpose of Travel: ${purpose}

The letter should:
- Be addressed "To the Visa Section, Embassy of [destination country]"
- Open with a formal salutation
- State the purpose clearly in the first paragraph
- Mention travel dates and duration precisely
- Reference financial self-sufficiency and intent to return to Jordan
- Close with a formal sign-off
- Be 3–4 paragraphs, professional tone throughout
`;
  }

  if (type === 'itinerary' || type === 'both') {
    userPrompt += `
${type === 'both' ? '\n---\n\n' : ''}Create a detailed, realistic day-by-day travel itinerary for the same trip:
- Destination: ${destination}
- Dates: ${entry} to ${exit} (${nights} nights)
- Purpose: ${purpose}

Format each day as:
Day 1 — [Date]: [Activities with specific locations, timing, and realistic details]

Include: arrival logistics on Day 1, a mix of morning/afternoon/evening activities for each day, departure logistics on the last day. Make it convincing for a visa officer — specific museum names, neighborhoods, transport methods. Total days: ${nights + 1}.
`;
  }

  const fullPrompt = `${systemPrompt}\n\n${userPrompt.trim()}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      console.error('[generate-document] Gemini error:', err);
      return res.status(502).json({ error: err.error?.message || 'Gemini request failed.' });
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ text });

  } catch (err) {
    console.error('[generate-document]', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
