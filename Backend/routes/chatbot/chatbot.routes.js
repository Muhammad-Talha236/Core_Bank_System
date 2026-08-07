const express = require('express');
const router = express.Router();
const chatbotController = require('../../controllers/chatbot/chatbot.Controller');
const { verifyToken } = require('../../middleware/auth');

// Allow any authenticated staff member to query the chatbot assistant
router.post('/ask', verifyToken, chatbotController.askChatbot);

module.exports = router;