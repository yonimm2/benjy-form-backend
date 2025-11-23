import express from "express";
import cors from "cors";
import { google } from "googleapis";

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// GOOGLE SHEETS CONFIG
// ===============================

// 1. Your Google Sheet ID
const SPREADSHEET_ID = "1D4AcBb0k-VjDACPDZac1gSWlvE6AEo9R0OmnqCkhM7o";

// 2. Your Google Service Account Credentials (from Render ENV)
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Google Sheets Client
async function getSheets() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

// ===============================
// POST /submit (your webhook endpoint)
// ===============================

app.post("/submit", async (req, res) => {
  try {
    const { name, phone, projectType } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const sheets = await getSheets();

    // Append to Sheet1
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:C",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[new Date().toISOString(), name, phone, projectType || ""]],
      },
    });

    res.json({ success: true, message: "Saved" });
  } catch (error) {
    console.error("Error saving:", error);
    res.status(500).json({ error: "Failed to save" });
  }
});

// ===============================
// ROOT CHECK
// ===============================

app.get("/", (req, res) => {
  res.send("Benjy Form Backend is running.");
});

// ===============================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
