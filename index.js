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

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
  });
  
  app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    
    if (!req.session.chatHistory) {
      req.session.chatHistory = [];
    }
    
    req.session.chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const chat = model.startChat({
        history: req.session.chatHistory
      });
      
      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      
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