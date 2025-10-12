const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
const PORT = 3001;
const SESSIONS_DIR = path.join(__dirname, 'sessions');

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR);
}

app.use(express.json());
app.use(express.static(SESSIONS_DIR));

// 1. Nowa sesja
app.post('/api/session', (req, res) => {
  const sessionId = uuidv4();
  const sessionPath = path.join(SESSIONS_DIR, sessionId);
  fs.mkdirSync(sessionPath);
  res.json({ sessionId });
});

// 2. Przesyłanie zdjęcia
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const sessionId = req.body.sessionId;
    const sessionPath = path.join(SESSIONS_DIR, sessionId);
    cb(null, sessionPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('photo'), (req, res) => {
  res.json({ success: true });
});

// 3. Lista zdjęć
app.get('/api/photos/:sessionId', (req, res) => {
  const sessionPath = path.join(SESSIONS_DIR, req.params.sessionId);
  if (!fs.existsSync(sessionPath)) return res.json([]);
  const files = fs.readdirSync(sessionPath);
  res.json(files);
});

// 4. Pobierz zdjęcie
app.get('/api/photo/:sessionId/:filename', (req, res) => {
  const filePath = path.join(SESSIONS_DIR, req.params.sessionId, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).end();
  res.sendFile(filePath);
});

// 5. Usuń zdjęcie
app.delete('/api/photo/:sessionId/:filename', (req, res) => {
  const filePath = path.join(SESSIONS_DIR, req.params.sessionId, req.params.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ success: true });
});

// 6. Zakończ sesję
app.delete('/api/session/:sessionId', (req, res) => {
  const sessionPath = path.join(SESSIONS_DIR, req.params.sessionId);
  if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true });
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Foto-kiosk backend działa na http://localhost:${PORT}`);
});
