import { google } from "googleapis";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const body = req.body || {};
    const { uid, utms, browser } = body;

    if (!uid) {
      return res.status(400).json({ error: "uid obrigatório" });
    }

    const now = new Date().toISOString();

    // =========================
    // IP + GEO
    // =========================
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";

    let geo = {};

    try {
      const geoRes = await fetch(`https://ipinfo.io/${ip}/json`);
      geo = await geoRes.json();
    } catch (e) {
      console.log("erro ao pegar geo", e);
    }

    const loc = JSON.stringify({
      ip,
      city: geo.city || "",
      region: geo.region || "",
      country: geo.country || "",
    });

    // =========================
    // GOOGLE AUTH
    // =========================
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = "1XyxmVjpo1PaU_ca9nM1sJ3J8GkHXHnFfG09N-EKekU4";

    // =========================
    // BUSCAR UID NA COLUNA A
    // =========================
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "dados!A:A",
    });

    const rows = response.data.values || [];

    // linha 1 = header
    // dados começam na linha 2
    const rowIndex = rows.findIndex((row) => row[0] === uid);

    if (rowIndex === -1) {
      // próxima linha livre
      const nextRow = rows.length + 1;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `dados!A${nextRow}:K${nextRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[
            uid,                     // A uid
            now,                     // B first
            now,                     // C update
            "",                      // D fbclid
            JSON.stringify(utms || {}), // E utms
            loc,                     // F loc
            JSON.stringify(browser || {}), // G browser
            "{}",                    // H behavior
            "{}",                    // I events
            "",                      // J payment
            0,                       // K score
          ]],
        },
      });

      return res.status(200).json({
        ok: true,
        action: "created",
        row: nextRow,
      });
    } else {
      const realRow = rowIndex + 1;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `dados!C${realRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[now]],
        },
      });

      return res.status(200).json({
        ok: true,
        action: "updated",
        row: realRow,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}