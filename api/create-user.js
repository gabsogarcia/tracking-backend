import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const spreadsheetId = "1XyxmVjpo1PaU_ca9nM1sJ3J8GkHXHnFfG09N-EKekU4";

const body = req.body || {};

const { uid, utms, browser } = body;

if (!uid) {
  return res.status(400).json({ error: "uid obrigatório" });
}

const response = await sheets.spreadsheets.values.get({
  spreadsheetId,
  range: "dados!A:A",
});

const rows = response.data.values || [];

const rowIndex = rows.findIndex(row => row[0] === uid);

if (rowIndex === -1) {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "dados!A:J",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        uid,
        new Date().toISOString(),
        new Date().toISOString(),
        "",
        JSON.stringify(utms),
        JSON.stringify(browser),
        "{}",
        "",
        "{}",
        0
      ]],
    },
  });
} else {
  const realRow = rowIndex + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `dados!C${realRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[new Date().toISOString()]],
    },
  });
}

return res.status(200).json({
  ok: true,
  action: rowIndex === -1 ? "created" : "updated"
});

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}