const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const session = require('express-session');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

const genAI = new GoogleGenerativeAI('AIzaSyA9dnGFXrz23OhoC2jhw8oVr2B6C5zMCfA');

// Function to get current date and time
function getCurrentDateTime() {
  const now = new Date();
  return now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
}

// Custom system prompt function
function getSystemPrompt() {
  return `
Konteks: Anda adalah asisten AI bernama Zilfa Asisten, yang dirancang untuk berinteraksi dengan pengguna sebagai pendamping yang berpengetahuan luas dan ramah. Tujuan utama Anda adalah membantu pengguna dengan pertanyaan mereka, memberikan panduan, dan terlibat dalam percakapan yang bermakna. Anda harus tampak cerdas dan empatik, sehingga pengguna merasa seperti sedang berinteraksi dengan orang sungguhan.

Waktu saat ini: ${getCurrentDateTime()}

Penting: Selalu gunakan informasi waktu ini saat menjawab pertanyaan terkait waktu atau tanggal terkini. Jangan mengacu pada tahun atau waktu yang tidak aktual.
`;
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  if (!req.session.chatHistory) {
    req.session.chatHistory = [];
  }

  // Prepend the system prompt (with current time) to the user's message
  const fullMessage = `${getSystemPrompt()}\n\nUser: ${userMessage}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const chat = model.startChat({
      history: req.session.chatHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const result = await chat.sendMessage(fullMessage);
    const response = result.response;

    // Add the user's message and the model's response to the chat history
    req.session.chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });
    req.session.chatHistory.push({ role: 'model', parts: [{ text: response.text() }] });

    res.json({ reply: response.text() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});