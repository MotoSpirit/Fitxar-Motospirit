// Envia cada fitxatge al Google Apps Script (desplegat des de motospirit.upc@gmail.com),
// que és qui realment escriu al full de càlcul. L'app mai té accés directe al full.

import { CONFIG } from "./config.js";

export async function afegeixFitxatge(dades) {
  const resposta = await fetch(CONFIG.appsScript.url, {
    method: "POST",
    // text/plain evita que el navegador faci una petició CORS "preflight" (Apps Script
    // Web Apps no la gestionen bé); el contingut segueix sent JSON vàlid.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(dades),
  });

  const resultat = await resposta.json().catch(() => null);
  if (!resposta.ok || !resultat || resultat.ok !== true) {
    const missatge = (resultat && resultat.error) || `Error del servidor (${resposta.status})`;
    throw new Error(missatge);
  }
}
