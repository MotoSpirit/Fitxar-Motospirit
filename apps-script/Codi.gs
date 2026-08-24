// Enganxa aquest codi a l'editor d'Apps Script (Extensions > Apps Script) del full de
// càlcul "Fitxatges Motospirit". Veure README.md secció "2. Crear el full de càlcul".
//
// Rep cada fitxatge des de l'app i l'afegeix com a fila nova a la pestanya "Fitxatges".
// Després recalcula automàticament la pestanya "Resum Setmanal" (es crea sola si no
// existeix): una graella amb un treballador per fila i una setmana per columna, indicant
// si aquella setmana s'ha complert la normativa d'hores.
// S'executa sempre amb els permisos del compte que el desplega (motospirit.upc@gmail.com),
// mai amb els del treballador que fitxa.

const NOM_PESTANYA_FITXATGES = "Fitxatges";
const NOM_PESTANYA_RESUM = "Resum Setmanal";

// Normativa Motospirit: mínim d'hores setmanals
const HORES_MINIM_ENTRE_SETMANA = 10;
const HORES_MINIM_CAP_SETMANA = 4;

function doPost(e) {
  try {
    const dades = JSON.parse(e.postData.contents);
    const full = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOM_PESTANYA_FITXATGES);
    if (!full) {
      throw new Error(`No es troba la pestanya "${NOM_PESTANYA_FITXATGES}"`);
    }
    full.appendRow([
      dades.nom,
      dades.email,
      dades.data,
      dades.hora,
      dades.tipus,
      dades.lat,
      dades.lon,
      dades.distanciaM,
    ]);

    try {
      actualitzaResumSetmanal_();
    } catch (errResum) {
      // Un error calculant el resum no ha de fer fallar el fitxatge en si.
      console.error("Error actualitzant el resum setmanal: " + errResum);
    }

    return respon({ ok: true });
  } catch (err) {
    return respon({ ok: false, error: String(err) });
  }
}

function respon(objecte) {
  return ContentService.createTextOutput(JSON.stringify(objecte)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// --- Resum setmanal ---------------------------------------------------------

function actualitzaResumSetmanal_() {
  const llibre = SpreadsheetApp.getActiveSpreadsheet();
  const fullFitxatges = llibre.getSheetByName(NOM_PESTANYA_FITXATGES);
  if (!fullFitxatges) return;

  const files = fullFitxatges.getDataRange().getValues();
  const capçaleres = files.shift(); // treu la fila de capçaleres
  if (!files.length) return;

  // Agrupa els fitxatges per treballador (per email, mostrant el darrer nom vist)
  const esdevenimentsPerTreballador = {}; // email -> [{data: Date, tipus}]
  const nomPerEmail = {};

  files.forEach((fila) => {
    const [nom, email, dataText, horaText, tipus] = fila;
    if (!email || !dataText || !horaText || !tipus) return;
    const data = combinaDataIHora_(dataText, horaText);
    if (!data) return;

    const clau = String(email).trim().toLowerCase();
    nomPerEmail[clau] = nom || clau;
    if (!esdevenimentsPerTreballador[clau]) esdevenimentsPerTreballador[clau] = [];
    esdevenimentsPerTreballador[clau].push({ data, tipus: String(tipus).trim() });
  });

  // Per cada treballador, aparella Entrada -> Sortida en ordre cronològic i acumula
  // hores per setmana, separant entre-setmana i cap de setmana.
  // hores[email][clauSetmana] = { entreSetmana, capSetmana, etiquetaSetmana, iniciSetmana }
  const hores = {};
  const setmanesVistes = {}; // clauSetmana -> { etiqueta, inici }

  Object.keys(esdevenimentsPerTreballador).forEach((email) => {
    const events = esdevenimentsPerTreballador[email].sort((a, b) => a.data - b.data);
    let entradaPendent = null;

    events.forEach((ev) => {
      if (ev.tipus === "Entrada") {
        entradaPendent = ev.data;
      } else if (ev.tipus === "Sortida" && entradaPendent) {
        acumulaSessio_(hores, setmanesVistes, email, entradaPendent, ev.data);
        entradaPendent = null;
      }
    });
  });

  const treballadors = Object.keys(nomPerEmail).sort((a, b) =>
    nomPerEmail[a].localeCompare(nomPerEmail[b], "ca")
  );
  const claussSetmana = Object.keys(setmanesVistes).sort();

  const clauSetmanaActual = clauSetmanaDe_(new Date());

  const capçalera = ["Treballador"].concat(
    claussSetmana.map((c) => setmanesVistes[c].etiqueta)
  );
  const graella = [capçalera];

  treballadors.forEach((email) => {
    const fila = [nomPerEmail[email]];
    claussSetmana.forEach((clauSetmana) => {
      const h = hores[email] && hores[email][clauSetmana];
      if (!h) {
        fila.push("");
        return;
      }
      const compleix = h.entreSetmana >= HORES_MINIM_ENTRE_SETMANA && h.capSetmana >= HORES_MINIM_CAP_SETMANA;
      const esSetmanaActual = clauSetmana === clauSetmanaActual;
      const marca = compleix ? "✅" : esSetmanaActual ? "⏳" : "❌";
      fila.push(`${marca} ${h.entreSetmana.toFixed(1)}h+${h.capSetmana.toFixed(1)}h`);
    });
    graella.push(fila);
  });

  escriuResum_(llibre, graella);
}

function acumulaSessio_(hores, setmanesVistes, email, inici, fi) {
  const horesSessio = (fi - inici) / (1000 * 60 * 60);
  if (horesSessio <= 0) return;

  const clauSetmana = clauSetmanaDe_(inici);
  if (!setmanesVistes[clauSetmana]) {
    setmanesVistes[clauSetmana] = {
      etiqueta: etiquetaSetmana_(inici),
      inici: dilluns_(inici),
    };
  }

  if (!hores[email]) hores[email] = {};
  if (!hores[email][clauSetmana]) {
    hores[email][clauSetmana] = { entreSetmana: 0, capSetmana: 0 };
  }

  const diaSetmana = inici.getDay(); // 0=diumenge ... 6=dissabte
  const esCapDeSetmana = diaSetmana === 0 || diaSetmana === 6;
  if (esCapDeSetmana) {
    hores[email][clauSetmana].capSetmana += horesSessio;
  } else {
    hores[email][clauSetmana].entreSetmana += horesSessio;
  }
}

function dilluns_(data) {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const diaSetmana = d.getDay(); // 0=diumenge
  const desplaçament = diaSetmana === 0 ? -6 : 1 - diaSetmana;
  d.setDate(d.getDate() + desplaçament);
  return d;
}

function clauSetmanaDe_(data) {
  const d = dilluns_(data);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function etiquetaSetmana_(data) {
  const inici = dilluns_(data);
  const fi = new Date(inici);
  fi.setDate(fi.getDate() + 6);
  const tz = Session.getScriptTimeZone();
  return `${Utilities.formatDate(inici, tz, "dd/MM")} - ${Utilities.formatDate(fi, tz, "dd/MM/yyyy")}`;
}

// Combina les columnes "Data" i "Hora" en un objecte Date real. El full de càlcul sol
// convertir automàticament aquestes columnes a tipus data/hora natius (per això surten
// alineades a la dreta), en aquest cas getValues() ja retorna objectes Date; però també
// acceptem que arribin com a text (p.ex. si algú les ha escrit a mà), per si de cas.
function combinaDataIHora_(dataVal, horaVal) {
  const data = obteDataObjecte_(dataVal);
  const hora = obteHoraObjecte_(horaVal);
  if (!data || !hora) return null;
  return new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate(),
    hora.getHours(),
    hora.getMinutes(),
    hora.getSeconds()
  );
}

function obteDataObjecte_(valor) {
  if (valor instanceof Date) return valor;
  const parts = String(valor).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!parts) return null;
  const [, dia, mes, any] = parts.map(Number);
  return new Date(any, mes - 1, dia);
}

function obteHoraObjecte_(valor) {
  if (valor instanceof Date) return valor;
  const parts = String(valor).trim().match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!parts) return null;
  const [, h, m, s] = parts.map(Number);
  return new Date(1899, 11, 30, h, m, s);
}

function escriuResum_(llibre, graella) {
  let full = llibre.getSheetByName(NOM_PESTANYA_RESUM);
  if (!full) {
    full = llibre.insertSheet(NOM_PESTANYA_RESUM);
  }
  full.clearContents();
  if (graella.length && graella[0].length) {
    full.getRange(1, 1, graella.length, graella[0].length).setValues(graella);
    full.setFrozenRows(1);
    full.setFrozenColumns(1);
  }
}
