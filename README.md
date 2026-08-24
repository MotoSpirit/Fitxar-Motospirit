# Fitxar Motospirit

App web instal·lable (PWA) per fitxar entrada/sortida al taller. Detecta si ets a menys de
100 m del taller (Camí de les Parellades, 1, Olesa de Montserrat) i, si hi ets, permet fitxar.
Cada fitxatge s'escriu com una fila nova a un Google Sheet.

Cada treballador inicia sessió amb el seu propi compte de Google (per saber qui fitxa),
però **només el compte `motospirit.upc@gmail.com` té accés real al full de càlcul**: l'app
no escriu mai directament al Sheet amb el token del treballador, sinó que crida un petit
Google Apps Script desplegat des del compte de Motospirit, que és qui de debò hi escriu.
Així cap treballador necessita (ni té) permís d'edició sobre el full.

Has de completar 3 passos abans que funcioni: **(1) crear les credencials a Google Cloud**,
**(2) crear el full de càlcul i l'Apps Script**, **(3) desplegar el lloc web**. Un cop fet,
edita `js/config.js` amb les dades que obtinguis.

---

## 1. Crear les credencials a Google Cloud

Necessari perquè els treballadors puguin iniciar sessió amb el seu compte de Google (només
per identificar-se — no dona accés a res més). Es fa amb un compte de Google normal (Gmail),
no cal cap subscripció ni cap gestió d'empresa. Fes aquest pas amb el compte que prefereixis
(pot ser el mateix `motospirit.upc@gmail.com` o un altre).

1. Vés a [console.cloud.google.com](https://console.cloud.google.com) i inicia sessió.
2. A dalt, **Crea un projecte nou** → nom `Fitxar Motospirit` → **Crea**.
3. Al menú esquerre: **APIs i serveis → Pantalla de consentiment OAuth** (a la interfície
   nova, "Google Auth Platform"):
   - Tipus d'usuari: **Extern** → **Crear**.
   - Omple nom de l'app (`Fitxar Motospirit`), correu de suport i correu de contacte → **Desa i continua**.
   - A "Àmbits" no cal afegir res manualment → **Desa i continua**.
   - A "Usuaris de prova", afegeix **el correu de Gmail de cada treballador** que fitxarà amb
     l'app (mentre l'app estigui en mode "Proves", només aquests comptes hi podran iniciar
     sessió) → **Desa i continua**.
4. Al menú esquerre: **APIs i serveis → Credencials** → **Crear credencials → ID de client
   d'OAuth**.
   - Tipus d'aplicació: **Aplicació web**.
   - Nom: `Fitxar Motospirit Web`.
   - "Orígens autoritzats de JavaScript": afegeix la URL on penjaràs l'app (pas 3). Si encara
     no la tens, posa temporalment `http://localhost:5500` i actualitza-ho després.
   - **Crear**.
5. Copia el **"ID de client"** que et mostra (acaba en `.apps.googleusercontent.com`).

Guarda aquest ID: el necessitaràs al pas 4.

## 2. Crear el full de càlcul i l'Apps Script

Fes **tot aquest pas amb el compte `motospirit.upc@gmail.com`** — és el que quedarà com
a únic propietari amb accés real al full.

1. Vés a [sheets.google.com](https://sheets.google.com) (amb `motospirit.upc@gmail.com`) i
   crea un full nou anomenat, per exemple, `Fitxatges Motospirit`.
2. Canvia el nom de la primera pestanya (a baix) a `Fitxatges`.
3. A la primera fila escriu aquestes capçaleres, una per columna (A fins H):

   | Nom | Email | Data | Hora | Tipus | Latitud | Longitud | DistanciaMetres |
   |-----|-------|------|------|-------|---------|----------|------------------|

4. Al menú del full: **Extensions → Apps Script**. S'obrirà un editor de codi en una pestanya
   nova.
5. Esborra el contingut per defecte (`function myFunction() {...}`) i enganxa-hi tot el
   contingut de [`apps-script/Codi.gs`](apps-script/Codi.gs) d'aquest projecte.
6. Desa (icona de disquet o `Ctrl+S`). Posa-li un nom com `Fitxatges Backend`.
7. A dalt a la dreta, **Desplegar → Nova implementació**.
   - Clica la rodeta al costat de "Selecciona el tipus" → **Aplicació web**.
   - "Executar com": **Jo** (`motospirit.upc@gmail.com`).
   - "Qui té accés": **Qualsevol usuari**.
   - **Desplegar**.
8. Et demanarà autoritzar l'script perquè pugui escriure al full — accepta amb el mateix
   compte `motospirit.upc@gmail.com` (pot avisar "Google no ha verificat aquesta app": clica
   "Configuració avançada" → "Anar a Fitxatges Backend (no segur)", és el teu propi script).
9. Copia la **URL de l'aplicació web** que et mostra (acaba en `/exec`).

Guarda aquesta URL: la necessitaràs al pas 4. Si mai edites `Codi.gs`, cal tornar a
**Desplegar → Gestiona les implementacions → ✏️ → Nova versió → Desplegar** perquè els canvis
s'apliquin (desar sol no actualitza la versió publicada).

## 3. Desplegar l'app com a lloc web

Cal que l'app estigui servida per HTTPS (obligatori per a la geolocalització i per al login)
amb un domini real. Opció més senzilla i gratuïta: **GitHub Pages**.

1. Crea un repositori nou a GitHub i puja el contingut d'aquesta carpeta.
2. Al repositori: **Settings → Pages → Source: branch `main`, carpeta `/root`** → Guarda.
3. GitHub et donarà una URL tipus `https://elteuusuari.github.io/nom-repo/`.
4. Torna a Google Cloud Console (pas 1, punt 5) i afegeix aquesta URL exacta a
   "Orígens autoritzats de JavaScript".

(Alternatives igual de vàlides: Netlify, Azure Static Web Apps, Vercel — el procés és similar.)

## 4. Configurar l'app

Edita [`js/config.js`](js/config.js) i omple:

- `google.clientId` → l'ID de client del pas 1.5.
- `appsScript.url` → la URL de l'aplicació web del pas 2.9.

Les coordenades del taller i el radi (`taller.lat`, `taller.lon`, `taller.radiMetres`) ja estan
configurades (100 m). Canvia `radiMetres` si el vols més ampli o més estret.

## 5. Instal·lar l'app al mòbil

Un cop desplegada, obre la URL amb el navegador del mòbil:

- **Android (Chrome)**: menú (⋮) → "Afegir a la pantalla d'inici" / "Instal·lar aplicació".
- **iPhone (Safari)**: botó de compartir (□↑) → "Afegeix a la pantalla d'inici".

Cada treballador ha d'iniciar sessió amb el seu propi compte de Google la primera vegada
que obri l'app. Com que l'app està en mode "Proves" a Google (pas 1.3), Google mostrarà un
avís de "l'app no està verificada" — cal clicar "Configuració avançada" → "Anar a Fitxar
Motospirit (no segur)" la primera vegada. És normal i segur mentre només hi accedeixin els
usuaris de prova que heu afegit vosaltres mateixos.

## Com funciona

- L'app mira contínuament la ubicació del mòbil i calcula la distància al taller.
- Els botons "Fitxar Entrada" / "Fitxar Sortida" només s'activen quan estàs a menys del radi
  configurat i has iniciat sessió.
- En fitxar, l'app envia les dades (nom, hora, tipus, ubicació) al Google Apps Script, que
  és qui afegeix la fila nova al full `Fitxatges` — sempre amb els permisos de
  `motospirit.upc@gmail.com`, mai amb els del treballador.
- No hi ha servidor propi a mantenir: el mòbil parla amb Google (login) i amb l'Apps Script
  (per desar el fitxatge), tots dos gratuïts.

## Com afegir o treure treballadors

- **Afegir-ne un**: al projecte de Google Cloud (pas 1.3, secció "Públic" / "Usuarios de
  prueba"), afegeix el seu Gmail. No cal tocar el full ni l'Apps Script.
- **Treure'n un**: elimina el seu Gmail de la mateixa llista.

## Resolució de problemes

- **"Falta configurar l'app"**: encara falten dades a `js/config.js` (pas 4).
- **Error en desar el fitxatge**: obre la URL de `appsScript.url` directament al navegador —
  si dona un error de Google en comptes d'un JSON, torna a comprovar el desplegament (pas
  2.7-2.9). Si vas editar `Codi.gs`, recorda desplegar una "Nova versió" (pas 2, nota final).
- **"Google no ha verificat aquesta aplicació"** (en iniciar sessió al mòbil): normal en
  mode "Proves" — clica "Configuració avançada" i continua. És normal i segur mentre només
  hi accedeixin els usuaris de prova que heu afegit vosaltres mateixos.
- **No demana mai la ubicació / botó sempre desactivat**: assegura't que el lloc s'obre per
  `https://` (no `http://`) i que has acceptat el permís d'ubicació al navegador.
- **Vols canviar el radi**: edita `taller.radiMetres` a `js/config.js` (metres).
