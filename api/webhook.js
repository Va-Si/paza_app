export default async function handler(req, res) {
  // Permitem doar cereri POST de la Telegram
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'OK' });
  }

  try {
    const data = req.body;

    // Verificăm dacă utilizatorul a apăsat pe butonul inline
    if (data && data.callback_query) {
      const callbackQuery = data.callback_query;
      const userTelegramId = String(callbackQuery.from.id);
      const callbackData = callbackQuery.data;
      const callbackQueryId = callbackQuery.id;

      const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

      // 1. Răspundem IMEDIAT la Telegram (în sub 0.1 secunde) ca să oprim animația de pe buton
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQueryId })
      });

      // 2. Dacă a apăsat butonul de ture, procesăm cererea
      if (callbackData === 'vezi_turele_mele') {
        await proceseazaTurePentruUtilizator(userTelegramId, TELEGRAM_TOKEN);
      }
    }

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Eroare în webhook:', error);
    return res.status(200).json({ status: 'error', message: error.message });
  }
}

// Funcție care preia dinamic lista de voluntari și ID-urile de Telegram direct din Firestore (setari/congregatii)
async function obtineListaVoluntariDinFirestore() {
  const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/setari/congregatii`;
  
  try {
    const response = await fetch(url);
    const rezultat = await response.json();
    
    let userTelegramIds = {};

    if (rezultat?.fields?.list?.arrayValue?.values) {
      const congregatii = rezultat.fields.list.arrayValue.values;
      congregatii.forEach(cong => {
        const people = cong?.mapValue?.fields?.people?.arrayValue?.values || [];
        people.forEach(p => {
          if (p?.mapValue?.fields) {
            const pf = p.mapValue.fields;
            const name = pf.name?.stringValue;
            const chatId = pf.chatId?.stringValue;
            const lang = pf.lang?.stringValue || 'ro';
            if (name && chatId) {
              userTelegramIds[name] = { chatId, lang };
            }
          }
        });
      });
    }
    return userTelegramIds;
  } catch (err) {
    console.error("Eroare la preluarea userilor din Firestore pe Vercel:", err);
    return {};
  }
}

// Funcție pentru căutarea și trimiterea turelor
async function proceseazaTurePentruUtilizator(userTelegramId, token) {
  // Preluăm dinamic utilizatorii direct din Firestore (fără să mai modifici codul manual pe Vercel)
  const USER_TELEGRAM_IDS = await obtineListaVoluntariDinFirestore();

  // Căutăm limba și numele voluntarului după ID-ul de Telegram
  let voluntariGasiti = [];
  for (let nume in USER_TELEGRAM_IDS) {
    const cfg = USER_TELEGRAM_IDS[nume];
    if (String(cfg.chatId) === String(userTelegramId)) {
      voluntariGasiti.push({ nume: nume, lang: cfg.lang });
    }
  }

  const lang = voluntariGasiti.length > 0 ? voluntariGasiti[0].lang : 'ro';

  if (voluntariGasiti.length === 0) {
    const mesajEroare = `⚠️ Contul tău de Telegram (ID: ${userTelegramId}) nu a fost găsit în lista de voluntari din aplicație.`;
    await trimiteMesaj(userTelegramId, mesajEroare, token);
    return;
  }

  const NumeList = voluntariGasiti.map(v => v.nume.trim().toLowerCase());
  const tureViitoare = await preiaTureDinFirebase();

  // Filtrăm turele pentru acest voluntar
  const tureFiltrate = tureViitoare.filter(tura => {
    if (!tura.dataInceput) return false;
    const dataStart = new Date(tura.dataInceput);
    if (dataStart < new Date()) return false;
    return tura.volunteers && tura.volunteers.some(v => v && NumeList.includes(v.trim().toLowerCase()));
  });

  tureFiltrate.sort((a, b) => new Date(a.dataInceput) - new Date(b.dataInceput));

  let textRapsuns = "";
  if (lang === 'ru') {
    if (tureFiltrate.length === 0) {
      textRapsuns = `📅 *Ваши предстоящие дежурства*\n\nУ вас пока нет запланированных дежурств в будущем.`;
    } else {
      textRapsuns = `📅 *Ваши предстоящие дежурства (${voluntariGasiti.map(v => v.nume).join(', ')}):*\n\n`;
      tureFiltrate.forEach((tura, idx) => {
        const start = new Date(tura.dataInceput);
        const dataFmt = start.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Chisinau' });
        const oraStart = start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Chisinau' });
        const end = new Date(tura.dataSfarsit);
        const oraEnd = end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Chisinau' });
        const colegi = tura.volunteers.filter(p => p && !NumeList.includes(p.trim().toLowerCase())).join(', ');
        
        textRapsuns += `${idx + 1}. 🗓 *${dataFmt}* | ⏰ *${oraStart} - ${oraEnd}*\n   Партнер: *${colegi || 'никто'}*\n\n`;
      });
    }
  } else {
    if (tureFiltrate.length === 0) {
      textRapsuns = `📅 *Turele tale viitoare*\n\nNu ai nicio tură de pază programată în viitor.`;
    } else {
      textRapsuns = `📅 *Turele tale viitoare (${voluntariGasiti.map(v => v.nume).join(', ')}):*\n\n`;
      tureFiltrate.forEach((tura, idx) => {
        const start = new Date(tura.dataInceput);
        const dataFmt = start.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Chisinau' });
        const oraStart = start.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Chisinau' });
        const end = new Date(tura.dataSfarsit);
        const oraEnd = end.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Chisinau' });
        const colegi = tura.volunteers.filter(p => p && !NumeList.includes(p.trim().toLowerCase())).join(', ');
        
        textRapsuns += `${idx + 1}. 🗓 *${dataFmt}* | ⏰ *${oraStart} - ${oraEnd}*\n   Partener: *${colegi || 'nimeni'}*\n\n`;
      });
    }
  }

  await trimiteMesaj(userTelegramId, textRapsuns, token);
}

// Interogare Firestore pentru colecția "ture_paza"
async function preiaTureDinFirebase() {
  const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;
  
  const payload = {
    structuredQuery: {
      from: [{ collectionId: 'ture_paza' }],
      where: {
        fieldFilter: {
          field: { fieldPath: "start" },
          op: "GREATER_THAN_OR_EQUAL",
          value: { stringValue: new Date().toISOString() }
        }
      },
      orderBy: [{ field: { fieldPath: "start" }, direction: "ASCENDING" }],
      limit: 30
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const rezultat = await response.json();

    if (!Array.isArray(rezultat)) return [];

    return rezultat
      .filter(item => item.document && item.document.fields)
      .map(item => {
        const fields = item.document.fields || {};
        let volunteersList = [];
        
        if (fields.extendedProps?.mapValue?.fields?.volunteers?.arrayValue?.values) {
          volunteersList = fields.extendedProps.mapValue.fields.volunteers.arrayValue.values
            .map(v => v.mapValue?.fields?.name?.stringValue || null)
            .filter(name => name !== null && name !== "________");
        }

        return {
          volunteers: volunteersList,
          dataInceput: fields.start?.stringValue || null,
          dataSfarsit: fields.end?.stringValue || null
        };
      });
  } catch (err) {
    console.error("Eroare Firestore:", err);
    return [];
  }
}

async function trimiteMesaj(chatId, text, token) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  });
}
