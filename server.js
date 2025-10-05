const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let messages = [];
let messageId = 0;

app.post('/alerts/send_message', (req, res) => {
    const { message, username } = req.body;
    messageId++;
    const newMessage = {
        id: messageId,
        username: username || 'Anonymous',
        message,
        timestamp: new Date().toLocaleTimeString()
    };
    messages.push(newMessage);
    res.json({ success: true });
});

app.get('/alerts/get_messages', (req, res) => {
    const lastId = parseInt(req.query.last_message_id) || 0;
    const newMessages = messages.filter(m => m.id > lastId);
    res.json({ messages: newMessages });
});

app.listen(5000, () => console.log('Server running on port 5000'));