const express = require('express');
const app = express();

// Module Express-Session
const session = require('express-session');
// Module mariadb, et configuration connection au serveur
const mariadb = require('mariadb');

const db = mariadb.createPool({
    host: "localhost",
    user: "root",
    password: "toor",
    database: "sio_chat",
    port : 3306
});

// Variable qui va contenir les infos de l'utilisateur (chargé depuis la BDD)
let infosUtilisateur;

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
app.get('/salon', (req, res) => {
    // On vérifie s'il y a bien une connexion
    if(req.session.loggedin){
        // Si oui, on charge la page du salon de discussion
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    }else{
        res.sendFile(path.join(__dirname, '..', '403.html'));
        res.status(403);
    }
});

// Route page de login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

// Route page login.css
app.get('/login.css', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'css/login.css'));
});

// Route page register
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'register.html'));
});

// Route page forgotPasswd
app.get('/forgotPasswd', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'forgotPasswd.html'));
});

// Route vers 403.html
app.get('/403', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '403.html'));
});

//Route vers client
app.get('/client.js', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/js/client.js'));
});

// Route vers le fichier style.css
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/css/style.css'));
});

// Route vers 403.css
app.get('/403.css', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'css/403.css'));
});

// Gestionnaire de connexion au salon
app.post('/login', async(req,res)=>{
    const conn = await db.getConnection();
    const sql = "SELECT * FROM utilisateurs WHERE pseudo = ? AND mdp = ?";
    const rows = await conn.query(sql, [req.body.login, req.body.password]);
    await conn.end();
    if(rows.length > 0) {
        infosUtilisateur = {
            mail: rows[0].mail,
            pseudo: rows[0].pseudo,
        };
        req.session.loggedin = true;
        res.redirect('/salon');
    }else{
        res.send("Erreur, mauvais identifiants !");
    }
});

// Gestionnaire d'incription au salon
app.post('/register', async(req,res)=>{
    // Connexion à la BDD
    const conn = await db.getConnection();
    // Requête SQL
    const register = "INSERT INTO utilisateurs (mail, pseudo, mdp) VALUES (?, ?, ?)";
    const mailRows = await conn.query("SELECT mail FROM utilisateurs WHERE mail = ?", [req.body.email]);
    const pseudoRows = await conn.query("SELECT pseudo FROM utilisateurs WHERE pseudo = ?", [req.body.login]);
    // Si l'email est déja utilisée
    if(mailRows.length > 0 || pseudoRows.length > 0) {
            res.redirect('/register');
    }else{
        // On prépare la requête
        await conn.query(register, [req.body.email, req.body.login, req.body.password]);
        // On ferme la connexion
        await conn.end();

        // On la redirige vers la page de connexion
        res.redirect('/');
    }
});

app.post('/forgotPasswd', async(req, res)=>{
    req.body.password !== req.body.verifPasswd ? res.redirect('/forgotPasswd'): false;
    const conn = await db.getConnection();

    const mailRows = await conn.query("SELECT mail FROM utilisateurs WHERE mail = ?", [req.body.mail]);

    if (mailRows.length < 0 ) {
        res.redirect('/forgotPasswd');
    }

    const forgot_pswd = "UPDATE utilisateurs set mdp = ? WHERE mail = ?";
    await conn.query(forgot_pswd, [req.body.password, req.body.mail]);
    await conn.end();

    res.redirect('/');
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
        io.to('room1').emit('message', message);

        console.log(message);
    });
     
    socket.on('disconnect', ()=>{
        console.log(pseudo + " has disconnected!");
    });
   
});