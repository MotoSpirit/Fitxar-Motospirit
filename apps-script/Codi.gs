// Enganxa aquest codi a l'editor d'Apps Script (Extensions > Apps Script) del full de
// càlcul "Fitxatges Motospirit". Veure README.md secció "2. Crear el full de càlcul".
//
// Rep cada fitxatge des de l'app i l'afegeix com a fila nova a la pestanya "Fitxatges".
// S'executa sempre amb els permisos del compte que el desplega (motospirit.upc@gmail.com),
// mai amb els del treballador que fitxa.

const NOM_PESTANYA = "Fitxatges";

function doPost(e) {
  try {
    const dades = JSON.parse(e.postData.contents);
    const full = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOM_PESTANYA);
    if (!full) {
      throw new Error(`No es troba la pestanya "${NOM_PESTANYA}"`);
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
