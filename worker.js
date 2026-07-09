// ==========================================================================
// CLOUDFLARE WORKER — Gemini-Proxy für den Anime Plot Maker
// ==========================================================================
// EINRICHTUNG:
// 1. Kostenlosen API-Key holen: https://aistudio.google.com/app/apikey
//    (Google-Login reicht, keine Kreditkarte nötig)
// 2. Auf https://dash.cloudflare.com -> Workers & Pages -> "Create Worker"
// 3. Diesen kompletten Code in den Editor einfügen -> "Deploy"
// 4. Im Worker unter "Settings" -> "Variables and Secrets"
//    -> "Add" -> Name: GEMINI_API_KEY, Wert: dein Key -> als "Secret" speichern
// 5. Die Worker-URL (z.B. https://plotmaker-xyz.deinname.workers.dev)
//    trägst du in der App unter "⚙️ Einstellungen" ein.
// ==========================================================================

export default {
  async fetch(request, env) {
    const CORS = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== 'POST') {
      return new Response('Nur POST erlaubt', { status: 405, headers: CORS });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response('Ungültiges JSON', { status: 400, headers: CORS });
    }

    const s = body.selections || {};
    const required = ['name','role','world','archetype','backstory','ability','weapon',
      'finalform','crewmate','pet','mentor','nemesis','flaw','twist'];
    for (const k of required) {
      if (!s[k]) return new Response(`Fehlendes Feld: ${k}`, { status: 400, headers: CORS });
    }

    const prompt = `Du bist ein erfahrener Anime-Autor. Schreibe eine kurze, packende Anime-Kurzgeschichte auf Deutsch (300-450 Wörter, Fließtext ohne Überschriften oder Aufzählungen).

WICHTIGSTE REGEL: Verwende ALLE unten genannten Elemente exakt so, wie sie angegeben sind. Erfinde NIEMALS ein anderes Element derselben Kategorie (z.B. wenn die Fähigkeit "Six Eyes" ist, darf niemals "Sharingan" oder eine andere Fähigkeit auftauchen — nur genau die genannte).

Charakter: ${s.name}
Rolle: ${s.role}
Anime-Welt / Setting: ${s.world}
Archetyp: ${s.archetype}
Vorgeschichte: ${s.name} musste erleben, dass ${s.backstory}
Fähigkeit: ${s.ability}
Waffe: ${s.weapon}
Finale Kampfform: ${s.finalform}
Engster Verbündeter: ${s.crewmate}
Begleiter/Haustier: ${s.pet}
Mentor: ${s.mentor}
Erzfeind: ${s.nemesis}
Fataler Nachteil: ${s.flaw}
Plot Twist: ${s.twist}

Baue eine Geschichte mit klarem Spannungsbogen: Einführung -> Konflikt mit dem Erzfeind, bei dem der fatale Nachteil eine Rolle spielt -> die finale Kampfform kommt zum Einsatz -> der Plot Twist wird enthüllt -> ein klares, in sich stimmiges ENDE.

Entscheide dich für GENAU EIN passendes Ende, das logisch aus Archetyp, fatalem Nachteil und Plot Twist folgt, zum Beispiel: Sieg über den Erzfeind, heldenhafter Tod, Bekehrung zur bösen Seite, Bekehrung des Erzfeindes zum Guten, gegenseitiges Einvernehmen/Waffenstillstand, Selbstopfer zur Rettung anderer, oder ein offener aber eindeutig angedeuteter Ausgang. Formuliere das Ende unmissverständlich, sodass klar wird, was aus ${s.name} und der Situation mit ${s.nemesis} wird.

Nenne ${s.name} mehrfach beim Namen. Schreibe im Stil einer echten Anime-Erzählung: emotional, mit Wendepunkten, nicht wie eine trockene Aufzählung. Antworte NUR mit dem Fließtext der Geschichte, ohne Einleitung, ohne Anführungszeichen, ohne Meta-Kommentar.`;

    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`;
      const geminiBody = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 1.0, maxOutputTokens: 900 }
      });

      let geminiRes;
      let lastErrText = '';
      const maxAttempts = 4;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: geminiBody
        });

        if (geminiRes.ok) break;

        lastErrText = await geminiRes.text();

        // Bei Rate-Limit (429) oder kurzzeitiger Serverüberlastung (503): warten und erneut versuchen.
        if ((geminiRes.status === 429 || geminiRes.status === 503) && attempt < maxAttempts) {
          let waitMs = 2000 * attempt; // 2s, 4s, 6s ...
          const match = lastErrText.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/);
          if (match) waitMs = Math.ceil(parseFloat(match[1]) * 1000) + 500;
          await new Promise(resolve => setTimeout(resolve, waitMs));
          continue;
        }

        return new Response(`Gemini-Fehler (${geminiRes.status}) nach ${attempt} Versuch(en): ${lastErrText}`, { status: 502, headers: CORS });
      }

      if (!geminiRes.ok) {
        return new Response(`Gemini-Fehler (${geminiRes.status}) nach ${maxAttempts} Versuchen: ${lastErrText}`, { status: 502, headers: CORS });
      }

      const data = await geminiRes.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return new Response('Gemini hat keinen Text zurückgegeben.', { status: 502, headers: CORS });
      }

      return new Response(JSON.stringify({ plot: text.trim() }), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(`Worker-Fehler: ${err.message}`, { status: 500, headers: CORS });
    }
  }
};
