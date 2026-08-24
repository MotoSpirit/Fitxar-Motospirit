import { CONFIG } from "./config.js";
import { obtePosicioActual, vigilaPosicio, distanciaMetres } from "./geolocation.js";
import { inicialitzaAuth, usuariActual, iniciaSessio, tancaSessio } from "./auth.js";
import { afegeixFitxatge } from "./appsscript.js";

const elEstatText = document.getElementById("estat-text");
const elEstatDistancia = document.getElementById("estat-distancia");
const elZonaLogin = document.getElementById("zona-login");
const elZonaFitxar = document.getElementById("zona-fitxar");
const elUsuari = document.getElementById("usuari");
const elUsuariNom = document.getElementById("usuari-nom");
const elBtnLogin = document.getElementById("btn-login");
const elBtnLogout = document.getElementById("btn-logout");
const elBtnEntrada = document.getElementById("btn-entrada");
const elBtnSortida = document.getElementById("btn-sortida");
const elMissatge = document.getElementById("missatge");

let dinsDelRadi = false;
let posicioActual = null;

function configuracioIncompleta() {
  return (
    CONFIG.google.clientId.startsWith("OMPLE_AQUÍ") ||
    CONFIG.appsScript.url.startsWith("OMPLE_AQUÍ")
  );
}

function actualitzaEstatUbicacio(pos) {
  posicioActual = pos;
  const d = distanciaMetres(
    pos.coords.latitude,
    pos.coords.longitude,
    CONFIG.taller.lat,
    CONFIG.taller.lon
  );
  dinsDelRadi = d <= CONFIG.taller.radiMetres;
  elEstatText.textContent = dinsDelRadi ? "✅ Ets al taller" : "📍 No estàs al taller";
  elEstatDistancia.textContent = `Distància: ${Math.round(d)} m (radi: ${CONFIG.taller.radiMetres} m)`;
  actualitzaBotons();
}

function actualitzaBotons() {
  const usuari = usuariActual();
  const habilitat = dinsDelRadi && !!usuari;
  elBtnEntrada.disabled = !habilitat;
  elBtnSortida.disabled = !habilitat;
}

function iniciaVigilanciaUbicacio() {
  vigilaPosicio(actualitzaEstatUbicacio, (err) => {
    elEstatText.textContent = "⚠️ No s'ha pogut obtenir la ubicació";
    elEstatDistancia.textContent = err.message || "";
  });
}

function actualitzaUiAuth() {
  const usuari = usuariActual();
  if (usuari) {
    elUsuari.classList.remove("oculta");
    elUsuariNom.textContent = usuari.name || usuari.username;
    elZonaLogin.classList.add("oculta");
    elZonaFitxar.classList.remove("oculta");
  } else {
    elUsuari.classList.add("oculta");
    elZonaLogin.classList.remove("oculta");
    elZonaFitxar.classList.add("oculta");
  }
  actualitzaBotons();
}

async function fitxa(tipus) {
  const usuari = usuariActual();
  if (!usuari || !posicioActual) return;

  elBtnEntrada.disabled = true;
  elBtnSortida.disabled = true;
  elMissatge.textContent = "Desant fitxatge…";

  const ara = new Date();
  try {
    await afegeixFitxatge({
      nom: usuari.name || usuari.username,
      email: usuari.username,
      data: ara.toLocaleDateString("ca-ES"),
      hora: ara.toLocaleTimeString("ca-ES"),
      tipus,
      lat: posicioActual.coords.latitude,
      lon: posicioActual.coords.longitude,
      distanciaM: distanciaMetres(
        posicioActual.coords.latitude,
        posicioActual.coords.longitude,
        CONFIG.taller.lat,
        CONFIG.taller.lon
      ),
    });
    elMissatge.textContent = `✅ ${tipus} registrada a les ${ara.toLocaleTimeString("ca-ES")}`;
  } catch (err) {
    console.error(err);
    elMissatge.textContent = `❌ Error en desar el fitxatge: ${err.message}`;
  } finally {
    actualitzaBotons();
  }
}

async function inicia() {
  if (configuracioIncompleta()) {
    elEstatText.textContent = "⚙️ Falta configurar l'app";
    elEstatDistancia.textContent = "Edita js/config.js seguint el README.md";
    elZonaLogin.classList.add("oculta");
    return;
  }

  elBtnLogin.addEventListener("click", async () => {
    elMissatge.textContent = "";
    try {
      await iniciaSessio();
      actualitzaUiAuth();
    } catch (err) {
      console.error(err);
      elMissatge.textContent = `❌ No s'ha pogut iniciar sessió: ${err.message}`;
    }
  });
  elBtnLogout.addEventListener("click", () => {
    tancaSessio();
    elMissatge.textContent = "";
    actualitzaUiAuth();
  });
  elBtnEntrada.addEventListener("click", () => fitxa("Entrada"));
  elBtnSortida.addEventListener("click", () => fitxa("Sortida"));

  try {
    await inicialitzaAuth();
  } catch (err) {
    console.error(err);
  }
  actualitzaUiAuth();

  try {
    const pos = await obtePosicioActual();
    actualitzaEstatUbicacio(pos);
  } catch (err) {
    elEstatText.textContent = "⚠️ Cal permetre l'accés a la ubicació";
    elEstatDistancia.textContent = err.message || "";
  }
  iniciaVigilanciaUbicacio();
}

inicia();
