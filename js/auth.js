// Identificació amb Google (Google Identity Services) - fa servir la llibreria global
// `google` carregada per <script> a index.html. Només s'usa per saber QUI fitxa (nom i
// correu); l'escriptura al full la fa el Google Apps Script amb el seu propi compte
// (veure js/appsscript.js), no calen permisos de Sheets aquí.

import { CONFIG } from "./config.js";

const SCOPES = "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";

const CLAU_SESSIO = "fitxar-motospirit-sessio";

let clientToken = null;
let usuari = carregaSessio();

function carregaSessio() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAU_SESSIO) || "null");
  } catch {
    return null;
  }
}

function desaSessio() {
  if (usuari) sessionStorage.setItem(CLAU_SESSIO, JSON.stringify(usuari));
  else sessionStorage.removeItem(CLAU_SESSIO);
}

function getClientToken() {
  if (!clientToken) {
    clientToken = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.google.clientId,
      scope: SCOPES,
      callback: () => {}, // se sobreescriu a cada crida (veure iniciaSessio)
    });
  }
  return clientToken;
}

export async function inicialitzaAuth() {
  // res a fer: la sessió ja s'ha carregat de sessionStorage al importar el mòdul
}

export function usuariActual() {
  return usuari ? { name: usuari.name, username: usuari.email } : null;
}

export function iniciaSessio() {
  return new Promise((resolve, reject) => {
    const client = getClientToken();
    client.callback = async (resposta) => {
      if (resposta.error) {
        reject(new Error(resposta.error));
        return;
      }
      try {
        const perfil = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${resposta.access_token}` },
        }).then((r) => r.json());

        usuari = { name: perfil.name, email: perfil.email };
        desaSessio();
        google.accounts.oauth2.revoke(resposta.access_token, () => {});
        resolve(usuariActual());
      } catch (err) {
        reject(err);
      }
    };
    client.requestAccessToken({ prompt: "consent" });
  });
}

export function tancaSessio() {
  usuari = null;
  desaSessio();
}
