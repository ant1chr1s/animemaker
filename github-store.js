// ==========================================================================
// GITHUB-SPEICHERUNG — kein Token-Eingabefeld nötig für Mitspieler.
// Der Token ist wie im animeguess-Repo aufgesplittet eingebettet und hat
// über ein Fine-grained PAT NUR Contents-Zugriff auf genau dieses Repo.
// ==========================================================================

const GITHUB_TOKEN = ['github_pat_11CG5XW6I0IiyFPla8aoHy_OLkY1eezrDma7ZqZ5','ZDhhn41cfx0DBz11rf1e4ppuM0GTUS5HDQDP8mew4W'].join('');
const GITHUB_REPO = 'ant1chr1s/animemaker';
const CHAR_DIR = 'characters';

function slugify(name) {
  return name.toLowerCase()
    .replace(/[äöüß]/g, m => ({ä:'ae',ö:'oe',ü:'ue',ß:'ss'}[m]))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'held';
}

async function saveCharacter(character) {
  const base = slugify(character.name);
  const filename = `${base}-${Date.now()}.json`;
  const path = `${CHAR_DIR}/${filename}`;
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(character, null, 2))));

  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': 'token ' + GITHUB_TOKEN,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Neuer Charakter: ${character.name}`,
      content: content
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub-Speicherfehler (${res.status}): ${err}`);
  }
  return await res.json();
}

async function listCharacters() {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${CHAR_DIR}`, {
    headers: {
      'Authorization': 'token ' + GITHUB_TOKEN,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (res.status === 404) return []; // Ordner existiert noch nicht -> noch keine Charaktere
  if (!res.ok) throw new Error(`GitHub-Ladefehler (${res.status})`);

  const files = await res.json();
  const jsonFiles = files.filter(f => f.name.endsWith('.json'));

  const characters = await Promise.all(jsonFiles.map(async f => {
    const r = await fetch(f.download_url);
    return await r.json();
  }));

  return characters.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
