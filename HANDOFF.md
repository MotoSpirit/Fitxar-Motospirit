# Handoff — Fitxar Motospirit

Document per a qui reprengui el projecte. Per als passos de configuració des de zero,
mira [`README.md`](README.md); aquí hi ha l'**estat actual**, **qui controla què** i **què
queda pendent**.

Data d'aquest handoff: 10/09/2026.

---

## Estat: funcionant i desplegat

L'app està en producció i el circuit complet (login → geolocalització → escriptura al full
→ resum setmanal) està provat i verificat.

- **App en viu**: https://motospirit.github.io/Fitxar-Motospirit/
- **Codi**: https://github.com/MotoSpirit/Fitxar-Motospirit (públic)
- **Full de dades**: Google Sheet "Fitxatges Motospirit" (propietat de `motospirit.upc@gmail.com`)
  - pestanya `Fitxatges` — registre cru de cada entrada/sortida
  - pestanya `Resum Setmanal` — graella automàtica treballador × setmana amb el compliment
    de la normativa (≥10 h entre setmana + ≥4 h cap de setmana)

---

## Les peces i qui les controla

| Peça | On és | Compte que la controla |
|------|-------|------------------------|
| Codi font | Repo GitHub `MotoSpirit/Fitxar-Motospirit` | Compte GitHub `MotoSpirit` |
| Hosting web | GitHub Pages (branca `main`, arrel) — es redesplega sol a cada push | idem |
| Login dels treballadors | Projecte Google Cloud "Fitxar Motospirit" (client OAuth) | el `client_id` és a `js/config.js`; el projecte es gestiona amb el compte Google que el va crear |
| Escriptura al full | Google Apps Script vinculat al Sheet, desplegat com a "Aplicació web" | `motospirit.upc@gmail.com` (l'script s'executa sempre com aquest compte) |
| URL de l'Apps Script | `js/config.js` → `appsScript.url` | idem |

**Model de seguretat**: cap treballador té accés directe al Sheet. S'identifiquen amb el seu
Google només per saber qui fitxa (el token es revoca immediatament després de llegir el
nom/correu). L'única cosa que escriu al full és l'Apps Script, que corre amb els permisos de
`motospirit.upc@gmail.com`.

---

## Com es fa un canvi

### Canvis a l'app (HTML/CSS/JS)
1. Edita els fitxers (`index.html`, `css/`, `js/`, `manifest.json`, `sw.js`).
2. `git push` a `main`.
3. GitHub Pages es redesplega sol en ~1 minut. No cal fer res més.

### Canvis al backend (`apps-script/Codi.gs`)
Pujar a GitHub **NO** actualitza l'script en viu — els dos només estan connectats perquè
algú copia i enganxa el codi. Per aplicar un canvi:
1. Edita `apps-script/Codi.gs` al repo i fes push (per mantenir-lo com a font de veritat).
2. Obre el Sheet → **Extensions → Apps Script**.
3. Esborra tot el codi de l'editor i enganxa-hi el contingut nou de `apps-script/Codi.gs`.
4. Desa (`Ctrl+S`).
5. **Desplegar → Gestiona les implementacions → ✏️ (llapis) → Versió: "Nova versió" → Desplegar**.
6. La URL `/exec` no canvia; l'app segueix funcionant sense tocar-la.

---

## Accés que necessita la persona nova

- **GitHub**: ser afegida com a col·laboradora del repo `MotoSpirit/Fitxar-Motospirit`
  (Settings → Collaborators), o treballar sobre un fork.
- **Google** (una de les dues opcions):
  - Tenir les credencials de `motospirit.upc@gmail.com`, o
  - Ser afegida com a **Editor** al Google Sheet, com a **editor** al projecte d'Apps Script
    (des de l'editor: Configuració del projecte / Compartir), i al projecte de **Google
    Cloud** "Fitxar Motospirit" (IAM) si ha de gestionar el client OAuth o els usuaris de prova.

---

## Pendent (per fer quan es vulgui)

- [ ] **Afegir la resta de treballadors com a "usuaris de prova"** a Google Cloud:
  console.cloud.google.com → projecte "Fitxar Motospirit" → **Google Auth Platform →
  Público → Usuarios de prueba → Add users** → el Gmail de cada treballador. Sense això no
  poden iniciar sessió. De moment només hi ha `gerardarranz@gmail.com`. Límit: 100.
- [ ] **Esborrar les files de prova** del full `Fitxatges`: `Prova Claude`, `Prova Resum`,
  `Prova Resum 2`. El `Resum Setmanal` es recalcula sol al següent fitxatge real.
- [ ] (Opcional) Prova real des d'un mòbil al taller: login → permís d'ubicació → veure
  "✅ Ets al taller" → fitxar entrada i sortida → comprovar que apareix al full.
- [ ] (Opcional) Publicar/verificar l'app OAuth a Google per treure l'avís "app no
  verificada" i el límit de 100 usuaris. No cal per a un equip petit.

---

## Valors configurables

- `js/config.js`:
  - `taller.lat` / `taller.lon` — coordenades del taller (Camí de les Parellades, 1, Olesa)
  - `taller.radiMetres` — radi per considerar "dins del taller" (actualment 100)
  - `google.clientId` — client OAuth de Google
  - `appsScript.url` — endpoint de l'Apps Script
- `apps-script/Codi.gs`:
  - `HORES_MINIM_ENTRE_SETMANA` (10) i `HORES_MINIM_CAP_SETMANA` (4) — llindars de la normativa
  - `NOM_PESTANYA_FITXATGES` / `NOM_PESTANYA_RESUM` — noms de les pestanyes del full

---

## Coses a saber (gotchas)

- **El full converteix "Data" i "Hora" a tipus data/hora natius.** Quan l'Apps Script
  llegeix aquestes columnes amb `getValues()`, rep objectes `Date`, no text. Si toques codi
  que llegeix cel·les del full, comprova `instanceof Date` abans de tractar un valor com a
  cadena (`Codi.gs` ja ho fa a `obteDataObjecte_` / `obteHoraObjecte_`).
- **Es va provar amb Microsoft 365 / Teams primer i es va descartar**: el compte de
  Microsoft equivalent no tenia un tenant ni subscripció reals, i no es podia registrar
  cap app a Entra ID. Per això tot va a Google.
- **GitHub Pages gratuït exigeix repo públic** — per això el repo és públic. L'únic valor
  semi-sensible que conté és la URL de l'Apps Script (algú que la trobi podria enviar
  fitxatges falsos). Risc baix per a un ús intern, però no la publiquis més enllà del repo.
- **Provar l'Apps Script amb `curl`**: un `POST` respon amb un `302` cap a una URL
  `script.googleusercontent.com/macros/echo?...` que s'ha de tornar a demanar amb `GET`
  (amb `curl -L` es trenca i dona un `411`). Des del navegador (`fetch`) funciona sol.
- L'app està en mode "Proves" a Google: al primer login cada treballador veurà "Google no
  ha verificat aquesta aplicació" → "Configuració avançada" → continuar. És normal.

---

## Arquitectura en 4 línies

PWA estàtica (sense framework, sense build). El treballador inicia sessió amb Google
(Google Identity Services) només per identificar-se. L'app comprova la distància al taller
amb `navigator.geolocation` i la fórmula de Haversine. En fitxar, envia les dades a l'Apps
Script (`fetch` a `appsScript.url`), que afegeix la fila al Sheet i recalcula el resum
setmanal. Cap servidor propi a mantenir.
