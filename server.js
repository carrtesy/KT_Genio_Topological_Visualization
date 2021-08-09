// index.js

const http = require("http");
const express = require("express");
const fs = require("fs");
const app = express();
const server = http.createServer(app);
const PORT = 8080;
const path = require("path");
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use('/javascripts',express.static(path.join(__dirname, 'javascripts')));
app.use('/css',express.static(path.join(__dirname, 'css')));
app.use('/data',express.static(path.join(__dirname, 'data')));


app.get("/", (req, res) => {
    fs.readFile(`index.html`, (error, data) => {
        if (error) {
            console.log(error);
            return res.status(500).send("<h1>500 Error</h1>");
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
