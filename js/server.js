const express = require('express');
const app = express();

// Module Express-Session
const session = require('express-session');

// Configuration du serveur
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
var path = require("path");
let PORT = 5555;

// Propriétés session Express + prise en charge données réseau
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(express.json()); // Prise en charge du format JSON

app.use(express.urlencoded({extended:true})); // Prise en charge des formulaires

/*
 les routes pour le serveur
*/

// Route page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});
//Route vers cilient
app.get('/js/client.js', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/js/client.js'));
});
// Route vers le fichier style.css
app.get('/css/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/css/style.css'));
});

// Port d'écoute
server.listen(PORT, () => {
    console.log('Serveur démarré sur le port :'+PORT);
});

io.on('connection',(socket)=>{
    //Saisie du pseudo de l'utilisateur
    socket.on('set-pseudo',(pseudo)=>{
        console.log(pseudo + " Vient de se connecter à "+new Date());
        socket.nickname = pseudo;
});
    socket.on('emission_message',(message)=>{
        socket.emit('reception_message', socket.nickname + ' : ' + message);
        console.log(message);
    });
     
    socket.on('disconnect', ()=>{
        console.log("A client has disconnected!");
    });
   
});