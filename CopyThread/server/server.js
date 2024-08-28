// server.js (Node.js + Express 예시)
const express = require('express');
const app = express();
const port = 3000;

let comments = [];

app.use(express.json());

app.get('/comments', (req, res) => {
    res.json(comments);
});

app.post('/comments', (req, res) => {
    const comment = req.body.comment;
    comments.push(comment);
    res.status(201).send('Comment added');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
