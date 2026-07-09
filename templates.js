// ==========================================================================
// PLOT-TEXTBAUSTEIN-ENGINE
// Erzeugt aus den gewählten Kategorien einen Plot, der sich durch tiefe
// Verschachtelung von Zufalls-Formulierungen jedes Mal neu anfühlt —
// auch wenn zwei Durchläufe dieselben Kategorie-Werte teilen.
// ==========================================================================

function r(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Schneidet eine Erklärung in Klammern ab: "Feigling (rennt weg)" -> "Feigling"
function shortName(entry) {
  if (!entry) return entry;
  const i = entry.indexOf(" (");
  return i === -1 ? entry : entry.substring(0, i);
}
// Liefert nur die Erklärung in Klammern, falls vorhanden, sonst "".
function explanation(entry) {
  if (!entry) return "";
  const m = entry.match(/\(([^)]+)\)/);
  return m ? m[1] : "";
}

const HOOKS = [
  s => `Es gibt Geschichten, die man sich in der Welt von ${s.world} nur flüsternd erzählt. Das hier ist eine davon.`,
  s => `Niemand in ${s.world} hätte gedacht, dass ausgerechnet ${s.name} diese Geschichte schreiben würde.`,
  s => `${s.world} hat viele Legenden hervorgebracht — doch keine beginnt so unscheinbar wie die von ${s.name}.`,
  s => `Manche Namen hallen jahrelang durch ${s.world} nach. ${s.name} ist einer davon.`,
  s => `Es heißt, jede Welt bekommt genau den Helden, den sie am wenigsten erwartet. ${s.world} bekam ${s.name}.`,
  s => `Die Chroniken von ${s.world} beginnen dieses Kapitel mit einem einzigen Namen: ${s.name}.`,
  s => `Was als gewöhnlicher Tag in ${s.world} begann, wurde zur Geschichte von ${s.name}.`,
  s => `In ${s.world} misst man Stärke nicht an Titeln — sondern an Geschichten wie der von ${s.name}.`
];

const OPENERS = [
  s => `${s.name} ist ${r(["heute","in dieser Geschichte","von Anfang an"])} ${s.role}, ${r(["auch wenn niemand das anfangs ahnt","auch wenn das anfangs kaum jemandem auffällt","auch wenn das lange verborgen bleibt"])}. Alles beginnt damit, dass ${s.backstory}.`,
  s => `Bevor ${s.name} zur Legende wurde, war da nur ${r(["ein Kind mit einer Wunde","eine Person mit einer Narbe","ein Mensch mit einer offenen Rechnung"])}, die niemand heilen konnte: ${s.backstory}.`,
  s => `Als ${s.role} trägt ${s.name} eine Last, die die meisten in ${s.world} nicht einmal erahnen — denn ${s.backstory}.`,
  s => `${s.name}s Geschichte beginnt nicht mit einem Sieg, sondern mit einem Verlust: ${s.backstory}.`,
  s => `Man kennt ${s.name} in ${s.world} als ${s.role} — ${r(["doch die wahre Geschichte beginnt früher","doch das erzählt nicht die halbe Wahrheit","was aber nur die Hälfte der Geschichte ist"])}: ${s.backstory}.`,
  s => `${r(["Jede große Geschichte hat einen Bruch, an dem alles beginnt","Jede Reise beginnt an einem Punkt ohne Rückkehr","Jede Legende beginnt mit einem einzigen Moment"])} — bei ${s.name} war es der Tag, an dem ${s.backstory}.`,
  s => `In den Augen der anderen ist ${s.name} nur ${s.role}. ${r(["Kaum jemand weiß","Fast niemand ahnt","Nur wenige wissen"])}, dass ${s.backstory}.`,
  s => `${s.world} hat ${s.name} nicht ausgesucht — ${s.name} hat sich ${s.world} aufgezwungen, nachdem ${s.backstory}.`,
  s => `Als ${s.role} beginnt ${s.name}s Weg an einem denkbar dunklen Punkt: ${s.backstory}.`,
  s => `${r(["Man muss weit zurückgehen, um zu verstehen","Um ${s.name} zu verstehen, muss man zurückgehen","Alles ergibt erst Sinn, wenn man weiß"])}, warum ${s.name} heute ${s.role} in ${s.world} ist: ${s.backstory}.`,
  s => `${s.name} redet nicht gern darüber, aber jeder, der lange genug bleibt, erfährt es irgendwann: ${s.backstory}.`,
  s => `Die Rolle als ${s.role} war ${s.name} nie vorbestimmt. Sie wurde erzwungen, an dem Tag, als ${s.backstory}.`
];

const POWER_INTROS = [
  s => `${s.name} gilt als ${shortName(s.archetype)} — ${explanation(s.archetype) || "und das prägt jede Entscheidung im Kampf"}. Im Zentrum dieser Kraft steht ${s.ability}${explanation(s.ability) ? `, also ${explanation(s.ability)}` : ""}.`,
  s => `Wer ${s.name} kämpfen sieht, erkennt sofort den ${shortName(s.archetype)}-Typ: ${explanation(s.archetype) || "unverkennbar in jeder Bewegung"}. Verstärkt wird das durch ${s.ability}.`,
  s => `${s.ability} ist nicht einfach eine Fähigkeit — sie ist ${s.name}s ${r(["Fluch und Segen zugleich","größtes Geheimnis","wertvollstes Gut"])}. Kombiniert mit der Art des ${shortName(s.archetype)} (${explanation(s.archetype) || "kompromisslos im entscheidenden Moment"}), wird daraus etwas Gefährliches.`,
  s => `In der Hand von ${s.name} verwandelt sich ${s.weapon} in mehr als nur ein Werkzeug. Zusammen mit ${s.ability} entsteht ein Kampfstil, den ${r(["kaum jemand kommen sieht","niemand vorhersagen kann","selbst erfahrene Kämpfer unterschätzen"])}.`,
  s => `${shortName(s.archetype)} zu sein bedeutet für ${s.name}: ${explanation(s.archetype) || "niemals halbe Sachen zu machen"}. Genau diese Haltung macht ${s.ability} erst wirklich gefährlich.`,
  s => `${s.name} führt ${s.weapon}, als wäre es ein Teil des eigenen Körpers. Erst im Zusammenspiel mit ${s.ability} zeigt sich, wie weit diese Kombination wirklich reicht.`,
  s => `Andere trainieren jahrelang für die Hälfte dessen, was ${s.name} durch ${s.ability} beherrscht. Doch als ${shortName(s.archetype)} (${explanation(s.archetype) || "kompromisslos bis zum Ende"}) reicht das ${s.name} nie aus.`,
  s => `Die Kombination aus ${s.weapon} und ${s.ability} macht ${s.name} zu einer Gefahr, die ${r(["man in ${s.world} nicht unterschätzen sollte","selbst die Ältesten in ${s.world} respektieren","in ${s.world} nur wenige Male vorkommt"])}.`.replace(/\$\{s\.world\}/g, s.world),
  s => `${s.name} verkörpert den ${shortName(s.archetype)} bis ins Letzte: ${explanation(s.archetype) || "keine halben Sachen, niemals"}. ${s.ability} ist dabei weniger eine Waffe als eine Verlängerung dieser Haltung.`,
  s => `Wer glaubt, ${s.weapon} allein mache ${s.name} gefährlich, irrt. Erst in Kombination mit ${s.ability} zeigt sich das volle Ausmaß.`,
  s => `${explanation(s.ability) ? `${s.ability}, also ${explanation(s.ability)}, ` : `${s.ability} `}macht ${s.name} zu einer Ausnahmeerscheinung — verstärkt durch die kompromisslose Art des ${shortName(s.archetype)}.`,
  s => `${s.name} hat gelernt, ${s.weapon} und ${s.ability} so zu verbinden, dass Gegner selten eine zweite Chance bekommen.`
];

const BOND_TEMPLATES = [
  s => `An ${s.name}s Seite kämpft ${s.crewmate} — ${r(["ein Bündnis, das niemand kommen sah","eine Verbindung, die sich über die Zeit gefestigt hat","eine Partnerschaft, auf die sich ${s.name} blind verlässt"]).replace(/\$\{s\.name\}/g, s.name)}. Gelehrt wurde ${s.name} einst von ${s.mentor}, und treuer Begleiter durch alle Gefahren ist ${s.pet}.`,
  s => `Ohne ${s.crewmate} wäre ${s.name} vermutlich längst gescheitert. Was ${s.name} heute kann, verdankt sich vor allem ${s.mentor} — und wenn es einsam wird, ist da immer noch ${s.pet}.`,
  s => `${s.mentor} sah in ${s.name} etwas, das sonst niemand erkannte, und bildete ${s.name} entsprechend aus. Heute steht mit ${s.crewmate} ein gleichwertiger Partner an der Seite, während ${s.pet} für die seltenen ruhigen Momente sorgt.`,
  s => `${s.crewmate} und ${s.name} haben gemeinsam mehr überstanden, als beide zugeben würden. Den Grundstein dafür legte ${s.mentor} — und ${s.pet} war von Anfang an dabei.`,
  s => `Man kennt ${s.name} selten allein: Da ist ${s.crewmate} als engster Verbündeter, ${s.mentor} als prägende Lehrperson und ${s.pet}, das ${s.name} nie ganz aus den Augen lässt.`,
  s => `${s.name} verdankt ${s.mentor} nicht nur die eigene Stärke, sondern auch die Lektion, wann man Vertrauen schenken darf — etwa ${s.crewmate}, mit dem ${s.name} inzwischen unzertrennlich ist. Und ${s.pet}? Das war ohnehin nie zur Debatte.`,
  s => `${s.pet} begleitet ${s.name} seit ${r(["den frühesten Tagen","einer Begegnung, die niemand für möglich hielt","einem Zufall, der sich als Schicksal entpuppte"])}. Gemeinsam mit ${s.crewmate} und unter dem wachsamen Blick von ${s.mentor} formt sich daraus eine Truppe, auf die Verlass ist.`,
  s => `${s.mentor} pflegte zu sagen, wahre Stärke zeige sich erst im Vertrauen zu anderen. ${s.name} hat das verstanden — mit ${s.crewmate} an der Seite und ${s.pet} im Rücken.`
];

const CONFLICT_TEMPLATES = [
  s => `Doch jede Geschichte braucht einen Gegenspieler, und ${s.name}s Gegenspieler heißt ${s.nemesis}. Erschwerend kommt hinzu: ${s.name} ${s.flaw}.`,
  s => `${s.nemesis} ist nicht irgendein Gegner — ${s.nemesis} ist genau die Art von Feind, die ${s.name}s größte Schwäche gnadenlos ausnutzt: ${s.name} ${s.flaw}.`,
  s => `Was ${s.name} von ${s.nemesis} unterscheidet, ist hauchdünn. Und genau das macht es gefährlich, denn ${s.name} ${s.flaw}.`,
  s => `Seit dem ersten Aufeinandertreffen mit ${s.nemesis} weiß ${s.name}, dass dieser Kampf anders ist. Das liegt auch daran, dass ${s.name} ${s.flaw} — ein Makel, den ${s.nemesis} sofort durchschaut.`,
  s => `${s.nemesis} lauert nicht im Verborgenen, sondern fordert ${s.name} offen heraus. Das Problem: ${s.name} ${s.flaw}, und genau darauf hat ${s.nemesis} nur gewartet.`,
  s => `Man könnte sagen, ${s.nemesis} ist ${s.name}s dunkler Spiegel. Während ${s.nemesis} keine Schwächen zeigt, gilt für ${s.name}: ${s.flaw}.`,
  s => `Jeder Sieg gegen ${s.nemesis} hat seinen Preis, denn ${s.name} ${s.flaw} — eine Schwäche, die in diesem Kampf zum entscheidenden Faktor wird.`,
  s => `${s.nemesis} braucht keine Armee, um ${s.name} in Bedrängnis zu bringen. Es reicht, dass ${s.name} ${s.flaw}.`
];

const CLIMAX_TEMPLATES = [
  s => `Als alles verloren scheint, geschieht das Unerwartete: ${s.name} entfesselt ${s.finalform}. ${r(["Selbst ${s.nemesis} zögert für einen Moment.","Selbst ${s.mentor} hätte das nicht für möglich gehalten.","Der Boden von ${s.world} scheint für einen Augenblick zu erzittern."]).replace(/\$\{s\.nemesis\}/g, s.nemesis).replace(/\$\{s\.mentor\}/g, s.mentor).replace(/\$\{s\.world\}/g, s.world)}`,
  s => `Im entscheidenden Moment bricht ${s.name}s wahre Kraft durch: ${s.finalform}. Was folgt, wird man in ${s.world} noch lange erzählen.`,
  s => `${s.nemesis} unterschätzt einen letzten Faktor: dass ${s.name} noch eine Karte im Ärmel hat — ${s.finalform}.`,
  s => `Getrieben von allem, was bisher geschehen ist, lässt ${s.name} die letzte Barriere fallen. Was zum Vorschein kommt, ist ${s.finalform}.`,
  s => `${s.crewmate} kann es kaum glauben, als ${s.name} vor aller Augen ${s.finalform} entfesselt — genau im Moment, in dem es am meisten zählt.`,
  s => `Für einen einzigen Herzschlag steht die Zeit in ${s.world} still, als ${s.name} in ${s.finalform} übergeht.`,
  s => `${s.name} zahlt einen hohen Preis dafür, doch es gibt keinen anderen Weg mehr: ${s.finalform} ist die letzte Antwort auf ${s.nemesis}.`,
  s => `Was ${s.mentor} einst nur andeutete, wird jetzt Wirklichkeit — ${s.name} erreicht ${s.finalform}.`
];

const TWIST_TEMPLATES = [
  s => `Doch genau in diesem Triumph liegt die eigentliche Wendung: ${s.twist}. Für ${s.name} ändert sich damit alles, was bis hierhin wahr schien.`,
  s => `Was niemand ahnte: ${s.twist}. ${s.name} muss in diesem Moment jede bisherige Gewissheit neu bewerten.`,
  s => `Und dann, wenn der Sieg schon greifbar scheint, die Enthüllung: ${s.twist}. Für ${s.name} ist nichts mehr, wie es war.`,
  s => `Die wahre Geschichte zeigt sich erst jetzt: ${s.twist}. ${s.name} steht plötzlich vor einer ganz anderen Wahrheit.`,
  s => `${s.name} ahnt es erst zu spät: ${s.twist}. Von nun an zählt jede Entscheidung doppelt.`,
  s => `Kein Sieg ohne Preis — und der Preis heißt hier: ${s.twist}. ${s.name} wird das nicht kalt lassen.`,
  s => `In ${s.world} wird man sich noch lange an diesen Moment erinnern, denn genau jetzt offenbart sich: ${s.twist}.`,
  s => `${s.name} hat gewonnen — und doch beginnt hier eine neue Geschichte, denn: ${s.twist}.`
];

const CLOSERS = [
  s => `Ob ${s.name} als ${s.role} in ${s.world} daran zerbricht oder daran wächst, entscheidet sich erst im nächsten Kapitel.`,
  s => `${s.name}s Geschichte in ${s.world} ist damit noch lange nicht zu Ende erzählt.`,
  s => `Eines steht fest: ${s.world} wird ${s.name} nach diesem Tag mit anderen Augen sehen.`,
  s => `Und so beginnt für ${s.name} ein ganz neues Kapitel — eines, das ${s.world} nicht vorhergesehen hat.`,
  s => `Was auch immer als Nächstes kommt — ${s.name} wird ihm als jemand anderes begegnen als zuvor.`,
  s => `${s.crewmate} weiß: Das war erst der Anfang von etwas Größerem.`,
  s => `In ${s.world} beginnt man bereits, sich Geschichten über diesen Tag zu erzählen — und über ${s.name}.`,
  s => `${s.name} atmet durch. Der nächste Kampf, das ist klar, wartet nicht lange.`
];

function generatePlot(sel) {
  const parts = [
    r(HOOKS)(sel),
    r(OPENERS)(sel),
    r(POWER_INTROS)(sel),
    r(BOND_TEMPLATES)(sel),
    r(CONFLICT_TEMPLATES)(sel),
    r(CLIMAX_TEMPLATES)(sel),
    r(TWIST_TEMPLATES)(sel),
    r(CLOSERS)(sel)
  ];
  return parts.join(" ");
}
