const express = require('express');
const app = express();
const port = 3000;

app.get('/api/calibration', (req, res) => {
    res.send(`Calibrated.`);
});

app.put('/api/calibration', (req, res) => {
    res.send(`Calibrated.`);
});

app.get('/api/config', (req, res) => res.send('Hello World!'));

app.put('/api/config', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Listening on port ${port}!`));
