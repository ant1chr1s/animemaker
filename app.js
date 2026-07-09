// ==========================================================================
// APP-LOGIK — Anime Plot Maker
// ==========================================================================

const app = document.getElementById('app');

const state = {
  screen: 'home',      // home | category | summary | plot | gallery | settings
  name: '',
  catIndex: 0,
  selections: {},       // key -> gewählter Eintrag (voller String)
  slotValues: {A:null, B:null},
  spinning: false,
  plot: '',
  generating: false,
  saving: false,
  gallery: null,
  galleryError: null
};

function getWorkerUrl(){ return localStorage.getItem('plotWorkerUrl') || ''; }
function setWorkerUrl(url){ localStorage.setItem('plotWorkerUrl', url); }

async function requestAIPlot(sel){
  const url = getWorkerUrl();
  if (!url) {
    const err = new Error('Keine Worker-URL eingestellt. Bitte zuerst unter ⚙️ Einstellungen eintragen.');
    err.needsSetup = true;
    throw err;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selections: sel })
  });
  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    throw new Error(`KI-Anfrage fehlgeschlagen (${res.status}): ${text || res.statusText}`);
  }
  const data = await res.json();
  if (!data.plot) throw new Error('Antwort enthielt keinen Plot-Text.');
  return data.plot;
}

function toast(msg, ms=3200){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>{ t.style.display='none'; }, ms);
}

function render(){
  if (state.screen === 'home') return renderHome();
  if (state.screen === 'category') return renderCategoryScreen();
  if (state.screen === 'summary') return renderSummary();
  if (state.screen === 'plot') return renderPlotScreen();
  if (state.screen === 'gallery') return renderGallery();
  if (state.screen === 'settings') return renderSettings();
}

function headerHTML(rightLabel){
  return `
    <header>
      <div class="logo">
        <div class="mark">⛩️</div>
        <h1 class="display">Anime Plot Maker</h1>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="navbtn" id="navBtn">${rightLabel}</button>
        <button class="navbtn" id="settingsBtn" title="Einstellungen">⚙️</button>
      </div>
    </header>`;
}

function mountHeaderNav(action){
  const btn = document.getElementById('navBtn');
  if (btn) btn.onclick = action;
  const sBtn = document.getElementById('settingsBtn');
  if (sBtn) sBtn.onclick = () => { state.screen = 'settings'; render(); };
}

// ------------------------------------------------------------ SETTINGS ----
function renderSettings(){
  const current = getWorkerUrl();
  app.innerHTML = `
    ${headerHTML('← Zurück')}
    <h2 class="display" style="font-size:22px;">Einstellungen</h2>
    <div class="panel">
      <label for="workerInput">Cloudflare-Worker-URL (Gemini-Proxy)</label>
      <input type="text" id="workerInput" placeholder="https://dein-worker.deinname.workers.dev" value="${escapeHtml(current)}">
      <p class="muted" style="font-size:13px;margin-top:10px;">
        Der Plot wird ausschließlich von der KI generiert. Ohne gültige Worker-URL
        kann kein Plot erzeugt werden. Einrichtung siehe worker.js im Repo.
      </p>
      <div class="spacer"></div>
      <button class="btn block" id="saveSettingsBtn">Speichern</button>
    </div>
  `;
  mountHeaderNav(()=>{ state.screen='home'; render(); });
  document.getElementById('saveSettingsBtn').onclick = () => {
    const val = document.getElementById('workerInput').value.trim();
    setWorkerUrl(val);
    toast(val ? '✅ Worker-URL gespeichert.' : 'Worker-URL entfernt.');
  };
}

// ---------------------------------------------------------------- HOME ----
function renderHome(){
  app.innerHTML = `
    ${headerHTML('📚 Galerie', null)}
    <div class="speedlines">
      <p class="hero-title display">Erschaffe deinen<br>eigenen Anime-Charakter</p>
      <p class="hero-sub">Name eingeben, durch 13 Kategorien würfeln, am Ende entsteht dein ganz eigener Plot.</p>
    </div>
    <div class="panel">
      <label for="nameInput">Wie heißt dein Charakter?</label>
      <input type="text" id="nameInput" placeholder="z. B. Kenji, Aria, Draven..." maxlength="30" value="${escapeHtml(state.name)}">
      <div class="spacer"></div>
      <button class="btn block" id="startBtn">Los geht's 🎲</button>
    </div>
    <p class="muted center" style="font-size:13px;">${CATEGORIES.length} Kategorien · Roulette-Auswahl · Plot live von der KI geschrieben</p>
  `;
  mountHeaderNav(()=>{ state.screen='gallery'; state.gallery=null; render(); });
  const input = document.getElementById('nameInput');
  const startBtn = document.getElementById('startBtn');
  input.addEventListener('input', e => state.name = e.target.value);
  input.addEventListener('keydown', e => { if(e.key==='Enter') startBtn.click(); });
  startBtn.onclick = () => {
    const name = state.name.trim();
    if (!name){ toast('Bitte gib zuerst einen Namen ein.'); input.focus(); return; }
    state.name = name;
    state.catIndex = 0;
    state.selections = {};
    state.plot = '';
    state.screen = 'category';
    render();
  };
}

// ------------------------------------------------------------ CATEGORY ----
function renderCategoryScreen(){
  const cat = CATEGORIES[state.catIndex];
  const pool = cat.entries;
  const [a, b] = pickTwoDistinct(pool);
  state.slotValues = {A:a, B:b};
  state.spinning = true;

  app.innerHTML = `
    ${headerHTML('Abbrechen', null)}
    <div class="progress-wrap">
      <div class="progress-label">
        <span>Kategorie ${state.catIndex+1} / ${CATEGORIES.length}</span>
        <span>${cat.label}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${(state.catIndex)/CATEGORIES.length*100}%"></div></div>
    </div>
    <div class="cat-icon">${cat.icon}</div>
    <h2 class="cat-title display">${cat.label}</h2>
    <p class="cat-hint">Wähle eine der beiden Optionen — oder würfle einzeln neu.</p>

    <div class="vs-wrap">
      <div class="vs-badge">VS</div>
      <div class="slot spinning" id="slotA"><div class="slot-value">–</div></div>
      <div class="slot spinning" id="slotB"><div class="slot-value">–</div></div>
    </div>

    <div class="cat-footer">
      <button class="btn secondary" id="backBtn" ${state.catIndex===0 ? 'disabled' : ''}>← Zurück</button>
      <span class="muted" id="statusLabel" style="align-self:center;font-size:13px;">Würfelt...</span>
    </div>
  `;
  mountHeaderNav(()=>{ if(confirm('Charakter-Erstellung abbrechen?')){ state.screen='home'; render(); } });

  document.getElementById('backBtn').onclick = () => {
    if (state.catIndex === 0) return;
    state.catIndex -= 1;
    render();
  };

  spinBothSlots(cat, a, b, () => {
    state.spinning = false;
    document.getElementById('statusLabel').textContent = 'Wähle eine Option';
    attachSlotHandlers(cat);
  });
}

function slotInnerHTML(entry){
  const val = shortName(entry);
  const expl = explanation(entry);
  return `<div class="slot-value">${escapeHtml(val)}</div>${expl ? `<div class="slot-expl">${escapeHtml(expl)}</div>` : ''}`;
}

function spinBothSlots(cat, finalA, finalB, onBothDone){
  let doneCount = 0;
  const check = () => { doneCount++; if (doneCount===2) onBothDone(); };
  spinSlot(v => { document.getElementById('slotA').innerHTML = slotInnerHTML(v); }, cat.entries, finalA, 1000, check);
  spinSlot(v => { document.getElementById('slotB').innerHTML = slotInnerHTML(v); }, cat.entries, finalB, 1200, check);
}

function spinSlot(renderFn, pool, finalValue, duration, cb){
  let delay = 45;
  let elapsed = 0;
  function tick(){
    renderFn(r(pool));
    elapsed += delay;
    delay = Math.min(delay*1.24, 250);
    if (elapsed < duration){
      setTimeout(tick, delay);
    } else {
      renderFn(finalValue);
      cb && cb();
    }
  }
  tick();
}

function attachSlotHandlers(cat){
  const slotA = document.getElementById('slotA');
  const slotB = document.getElementById('slotB');

  function addRerollBtn(slotEl, letter){
    const btn = document.createElement('button');
    btn.className = 'slot-reroll';
    btn.textContent = '🎲 Neu würfeln';
    btn.onclick = (e) => {
      e.stopPropagation();
      if (state.spinning) return;
      state.spinning = true;
      document.getElementById('statusLabel').textContent = 'Würfelt...';
      [slotA, slotB].forEach(s => s.classList.add('spinning'));
      const otherVal = letter === 'A' ? state.slotValues.B : state.slotValues.A;
      const newVal = rerollValue(cat.entries, otherVal);
      state.slotValues[letter] = newVal;
      spinSlot(v => { slotEl.innerHTML = slotInnerHTML(v); }, cat.entries, newVal, 900, () => {
        state.spinning = false;
        document.getElementById('statusLabel').textContent = 'Wähle eine Option';
        [slotA, slotB].forEach(s => s.classList.remove('spinning'));
      });
    };
    slotEl.appendChild(btn);
  }

  addRerollBtn(slotA, 'A');
  addRerollBtn(slotB, 'B');

  function choose(letter){
    if (state.spinning) return;
    const val = state.slotValues[letter];
    state.selections[cat.key] = val;
    (letter==='A' ? slotA : slotB).classList.add('chosen');
    slotA.style.pointerEvents = 'none';
    slotB.style.pointerEvents = 'none';
    document.getElementById('statusLabel').innerHTML = '<span class="loader"></span>';
    setTimeout(() => {
      if (state.catIndex < CATEGORIES.length - 1){
        state.catIndex += 1;
        render();
      } else {
        state.screen = 'summary';
        render();
      }
    }, 550);
  }

  slotA.onclick = () => choose('A');
  slotB.onclick = () => choose('B');
}

// ------------------------------------------------------------- SUMMARY ----
function renderSummary(){
  const rows = CATEGORIES.map(cat => {
    const val = shortName(state.selections[cat.key] || '');
    return `<div class="summary-item">
      <div class="summary-icon">${cat.icon}</div>
      <div class="summary-label">${cat.label}</div>
      <div class="summary-val">${escapeHtml(val)}</div>
    </div>`;
  }).join('');

  app.innerHTML = `
    ${headerHTML('📚 Galerie', null)}
    <h2 class="display" style="font-size:22px;">${escapeHtml(state.name)}s Profil</h2>
    <div class="panel">${rows}</div>
    <button class="btn block" id="genBtn">📜 Plot generieren</button>
    <div class="spacer"></div>
    <button class="btn secondary block" id="restartBtn">Von vorne anfangen</button>
  `;
  mountHeaderNav(()=>{ state.screen='gallery'; state.gallery=null; render(); });
  document.getElementById('genBtn').onclick = async () => {
    const btn = document.getElementById('genBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> KI schreibt deine Geschichte...';
    try {
      const sel = buildSelectionObject();
      state.plot = await requestAIPlot(sel);
      state.screen = 'plot';
      render();
    } catch (err) {
      console.error(err);
      toast('❌ ' + err.message, 6000);
      btn.disabled = false;
      btn.textContent = '📜 Plot generieren';
      if (err.needsSetup) { state.screen = 'settings'; render(); }
    }
  };
  document.getElementById('restartBtn').onclick = () => {
    if (confirm('Wirklich von vorne beginnen? Alle Auswahlen gehen verloren.')){
      state.screen = 'home'; render();
    }
  };
}

function buildSelectionObject(){
  const sel = { name: state.name };
  CATEGORIES.forEach(cat => { sel[cat.key] = shortName(state.selections[cat.key]); });
  return sel;
}

// ---------------------------------------------------------------- PLOT ----
function renderPlotScreen(){
  app.innerHTML = `
    ${headerHTML('📚 Galerie', null)}
    <h2 class="display" style="font-size:22px;">${escapeHtml(state.name)}s Geschichte</h2>
    <div class="plot-box"><p>${escapeHtml(state.plot)}</p></div>
    <div class="spacer"></div>
    <button class="btn block" id="saveBtn">💾 Charakter speichern &amp; mit Freunden teilen</button>
    <div class="spacer"></div>
    <button class="btn secondary block" id="rerollPlotBtn">🔄 Andere KI-Version mit gleicher Auswahl</button>
    <div class="spacer"></div>
    <button class="btn secondary block" id="newBtn">Neuen Charakter erstellen</button>
  `;
  mountHeaderNav(()=>{ state.screen='gallery'; state.gallery=null; render(); });

  document.getElementById('rerollPlotBtn').onclick = async () => {
    const btn = document.getElementById('rerollPlotBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> KI schreibt neu...';
    try {
      const sel = buildSelectionObject();
      state.plot = await requestAIPlot(sel);
      render();
    } catch (err) {
      console.error(err);
      toast('❌ ' + err.message, 6000);
      btn.disabled = false;
      btn.textContent = '🔄 Andere KI-Version mit gleicher Auswahl';
    }
  };

  document.getElementById('newBtn').onclick = () => {
    state.screen = 'home'; state.name=''; render();
  };

  document.getElementById('saveBtn').onclick = async () => {
    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> Speichert...';
    try {
      const character = {
        name: state.name,
        selections: buildSelectionObject(),
        plot: state.plot,
        createdAt: Date.now()
      };
      await saveCharacter(character);
      toast('✅ Charakter gespeichert! Deine Freunde sehen ihn in der Galerie.');
      btn.textContent = '✅ Gespeichert';
    } catch (err) {
      console.error(err);
      toast('❌ Fehler beim Speichern: ' + err.message, 5000);
      btn.disabled = false;
      btn.textContent = '💾 Charakter speichern & mit Freunden teilen';
    }
  };
}

// ------------------------------------------------------------- GALLERY ----
async function renderGallery(){
  app.innerHTML = `
    ${headerHTML('🏠 Zurück', null)}
    <h2 class="display" style="font-size:22px;">Charakter-Galerie</h2>
    <div id="galleryContent" class="center muted"><span class="loader"></span> Lade Charaktere...</div>
  `;
  mountHeaderNav(()=>{ state.screen='home'; render(); });

  try {
    const chars = await listCharacters();
    state.gallery = chars;
    const content = document.getElementById('galleryContent');
    if (!chars.length){
      content.innerHTML = `<p class="muted center">Noch keine Charaktere gespeichert. Sei der oder die Erste!</p>`;
      return;
    }
    content.innerHTML = chars.map(c => {
      const s = c.selections || {};
      return `<div class="char-card">
        <h3>${escapeHtml(c.name)}</h3>
        <div class="meta">${escapeHtml(s.world||'')} · ${escapeHtml(s.role||'')} · ${c.createdAt ? new Date(c.createdAt).toLocaleDateString('de-DE') : ''}</div>
        <div class="plot-preview">${escapeHtml(c.plot||'')}</div>
        <div class="tags">
          ${['archetype','ability','weapon','finalform','nemesis'].map(k => s[k] ? `<span class="tag">${escapeHtml(s[k])}</span>` : '').join('')}
        </div>
      </div>`;
    }).join('');
  } catch (err) {
    console.error(err);
    document.getElementById('galleryContent').innerHTML =
      `<p class="muted center">❌ Galerie konnte nicht geladen werden: ${escapeHtml(err.message)}</p>`;
  }
}

// --------------------------------------------------------------- UTILS ----
function pickTwoDistinct(pool){
  const a = r(pool);
  let b = r(pool.filter(x => x !== a));
  if (b === undefined) b = a; // Sicherheitsnetz falls Pool nur 1 Eintrag hat
  return [a, b];
}
function rerollValue(pool, exclude){
  const filtered = pool.filter(x => x !== exclude);
  return r(filtered.length ? filtered : pool);
}
function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

render();
