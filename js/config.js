// Configuració de l'app Fitxar Motospirit
// Omple els valors marcats amb "OMPLE_AQUÍ" seguint les instruccions de README.md

export const CONFIG = {
  // Ubicació del taller i radi (en metres) considerat "dins del taller"
  taller: {
    nom: "Motospirit - Camí de les Parellades, 1, Olesa de Montserrat",
    lat: 41.53815954650923,
    lon: 1.8943329238568338,
    radiMetres: 100,
  },

  // Credencials de Google Cloud per identificar qui inicia sessió (Sign in with Google)
  // Veure README.md secció "1. Crear les credencials a Google Cloud"
  google: {
    clientId: "1064825324042-ldcn43von796g2ks0lmgo0fi4ll3in1h.apps.googleusercontent.com",
  },

  // URL del Google Apps Script (desplegat des de motospirit.upc@gmail.com) que escriu
  // els fitxatges al full de càlcul. Veure README.md secció "2. Crear el full de càlcul"
  appsScript: {
    url: "https://script.google.com/macros/s/AKfycbxsbYy8_LKP7hoX_jF4e4VsGkFWhNBJOS9J6tR1HMglpU07KtacRA9gLY3cSCGRcF636Q/exec",
  },
};
