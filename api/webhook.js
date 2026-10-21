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

// Funcție pentru căutarea și trimiterea turelor
async function proceseazaTurePentruUtilizator(userTelegramId, token) {
  // Maparea utilizatorilor (poți muta asta și în variabile de mediu sau lăsa aici)
  const USER_TELEGRAM_IDS = {
    // Pune aici utilizatorii tăi exact cum îi aveai în Google Apps Script, de ex:
    // "Nume Prenume": { chatId: "632767613", lang: "ro" }
    // Sau poți folosi direct ID-ul tău pentru test:
   "Siminițchi Valeriu": { chatId: "-1004441991904", lang: "ro" },
  "Siminițchi Nicoleta": { chatId: "-1004441991904", lang: "ro" },
  "Ghileţchi Dana": { chatId: "-1004441991904", lang: "ro" },
  "Ghileţchi Oleg": { chatId: "-1004441991904", lang: "ro" },
  "Vlasiuc Constantin": { chatId: "-1004441991904", lang: "ro" },
  "Pustii Natalia": { chatId: "-1004441991904", lang: "ro" },
  "Pustii Ruslan": { chatId: "-1004441991904", lang: "ro" },
  "Mărgineanu Valentin": { chatId: "-1004441991904", lang: "ro" },
  "Mărgineanu Dorin": { chatId: "-1004441991904", lang: "ro" },
  "Ciuș Ludmila": { chatId: "-1004441991904", lang: "ro" },
  "Vîhodeț Natalia": { chatId: "-1004441991904", lang: "ro" },
  "Carp Felicia": { chatId: "-1004441991904", lang: "ro" },
  "Puls Marina": { chatId: "-1004441991904", lang: "ro" },
  "Apostol Mariana": { chatId: "-1004441991904", lang: "ro" },
  "Pleșca Erica": { chatId: "-1004441991904", lang: "ro" },
  "Gorbuleac Veaceslav": { chatId: "-1004441991904", lang: "ro" },
  "Chirtoacă Nelea": { chatId: "-1004441991904", lang: "ro" },
  "Petic Svetlana": { chatId: "-1004441991904", lang: "ro" },
  "Tertea Grigore": { chatId: "-1004441991904", lang: "ro" },
  "Focșa Simion": { chatId: "-1004441991904", lang: "ro" },
  "Rudenco Sergiu": { chatId: "-1004441991904", lang: "ro" },
  "Rudenco Tatiana": { chatId: "-1004441991904", lang: "ro" },
  "Mereuță Rodica": { chatId: "-1004441991904", lang: "ro" },
  "Mereuță Sergiu": { chatId: "8001826259", lang: "ro" },
  "Ciuș Valeriu": { chatId: "-1004441991904", lang: "ro" },
  "Banaru Constantin": { chatId: "-1004441991904", lang: "ro" },
  "Banaru Natalia": { chatId: "-1004441991904", lang: "ro" },
  "Codreanu Elena": { chatId: "-1004441991904", lang: "ro" },
  "Artin Lilia": { chatId: "-1004441991904", lang: "ro" },
  "Solomon Natalia": { chatId: "-1004441991904", lang: "ro" },
  "Iacuboi Vasilii": { chatId: "-1004441991904", lang: "ro" },
  "Tuvicenco Olesea": { chatId: "-1004441991904", lang: "ro" },
  "Tuvicenco Sergiu": { chatId: "-1004441991904", lang: "ro" },
  "Croitoru Irina": { chatId: "-1004441991904", lang: "ro" },
  "Ceban Adriana": { chatId: "-1004441991904", lang: "ro" },
  "Rotaru Maria": { chatId: "-1004441991904", lang: "ro" },
  "Rotaru Ana": { chatId: "-1004441991904", lang: "ro" },
  "Rotaru Sergiu": { chatId: "-1004441991904", lang: "ro" },
  "Codreanu Milena": { chatId: "-1004441991904", lang: "ro" },
  "Becciu Claudia": { chatId: "-1004441991904", lang: "ro" },
  "Arnaut Cristina": { chatId: "-1004441991904", lang: "ro" },
  "Istratii Vitalie": { chatId: "-1004441991904", lang: "ro" },
  "Istratii Victoria": { chatId: "-1004441991904", lang: "ro" },
  "Croitoru Victor": { chatId: "-1004441991904", lang: "ro" },
  "Molic Alexandra": { chatId: "-1004441991904", lang: "ro" },
  "Bandalac Valeria": { chatId: "-1004441991904", lang: "ro" },
  "Pascari Rodica": { chatId: "-1004441991904", lang: "ro" },
  "Diacon Daniel": { chatId: "-1004441991904", lang: "ro" },
  "Golovko Nikita": { chatId: "-1004441991904", lang: "ro" },
  "Pricop Nicoleta": { chatId: "-1004441991904", lang: "ro" },
  "Mura Sergiu": { chatId: "-1004441991904", lang: "ru" },
  "Josanu Olga": { chatId: "-1004441991904", lang: "ro" },
  "Marga Valeria": { chatId: "-1004441991904", lang: "ro" },
  "Popa Cristi": { chatId: "-1004441991904", lang: "ro" },
  "Mămăligă Maria": { chatId: "-1004441991904", lang: "ro" },
  "Pricop Victoria": { chatId: "-1004441991904", lang: "ro" },
  "Gușan Valeriu": { chatId: "-1004441991904", lang: "ro" },
  "Josanu Sultana": { chatId: "-1004441991904", lang: "ro" },
  "Josanu Maxim": { chatId: "-1004441991904", lang: "ro" },
  "Codreanu Vitalie": { chatId: "-1004441991904", lang: "ro" },
  "Badan Victor": { chatId: "-1004441991904", lang: "ro" },
  "Șchepu Daniel": { chatId: "-1004441991904", lang: "ro" },

  // --- LIMBA RUSĂ (ru) ---
  "Виеру Валерий": { chatId: "-1004441991904", lang: "ru" },
  "Голубкова Светлана": { chatId: "-1004441991904", lang: "ru" },
  "Дикусар Арианна": { chatId: "-1004441991904", lang: "ru" },
  "Жаворонков Роман": { chatId: "-1004441991904", lang: "ru" },
  "Жаворонкова Снежанна": { chatId: "-1004441991904", lang: "ru" },
  "Иванова Нина": { chatId: "-1004441991904", lang: "ru" },
  "Ионица Анастасия": { chatId: "-1004441991904", lang: "ru" },
  "Киперь Инна": { chatId: "-1004441991904", lang: "ru" },
  "Киркиш Марчел": { chatId: "-1004441991904", lang: "ru" },
  "Клименко Людмила": { chatId: "-1004441991904", lang: "ru" },
  "Маммедов Мухаммед": { chatId: "-1004441991904", lang: "ru" },
  "Маммедова Ширин": { chatId: "-1004441991904", lang: "ru" },
  "Марчук Артем": { chatId: "-1004441991904", lang: "ru" },
  "Переверзева Светлана": { chatId: "-1004441991904", lang: "ru" },
  "Рядинская Татьяна": { chatId: "-1004441991904", lang: "ru" },
  "Флянку Виталий": { chatId: "-1004441991904", lang: "ru" },
  "Флянку Марина": { chatId: "-1004441991904", lang: "ru" },
  "Фудзинский Леонид": { chatId: "-1004441991904", lang: "ru" },
  "Чебанова Карнелия": { chatId: "-1004441991904", lang: "ru" },
  "Шаповалова Татьяна": { chatId: "632767613", lang: "ru" },
  "Бурлачук Светлана": { chatId: "-1004441991904", lang: "ru" },
  "Шулер Мария": { chatId: "-1004441991904", lang: "ru" }
  };

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
    const mesajEroare = `⚠️ Contul tău de Telegram (ID: ${userTelegramId}) nu a fost găsit în lista de voluntari.`;
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

// Interogare Firestore (folosind datele tale existente)
async function preiaTureDinFirebase() {
  const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
  const FIRESTORE_COLLECTION = process.env.FIRESTORE_COLLECTION || 'shifts';
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;
  
  const payload = {
    structuredQuery: {
      from: [{ collectionId: FIRESTORE_COLLECTION }],
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
