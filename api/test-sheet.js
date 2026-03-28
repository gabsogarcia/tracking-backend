import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    // 1. Autenticação com Google
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 2. ID da sua planilha
    const spreadsheetId = "1XyxmVjpo1PaU_ca9nM1sJ3J8GkHXHnFfG09N-EKekU4";

    // 3. Escrever uma linha de teste
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "dados!A:J",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            "teste_uid",
            new Date().toISOString(),
            "",
            "fbclid_teste",
            '{"medium":"teste","term":"teste"}',
            '{"device":"mobile"}',
            "{}",
            "teste_event",
            "{}",
            0
          ],
        ],
      },
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}