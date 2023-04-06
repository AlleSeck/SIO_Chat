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

// Route page Ultimate-Sidebar-Menu-BS5.js
app.get('/Ultimate-Sidebar-Menu-BS5.js', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/js/Ultimate-Sidebar-Menu-BS5.js'));
});

// Route page Ultimate-Sidebar-Menu-BS5.css
app.get('/Ultimate-Sidebar-Menu-BS5.css', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/css/Ultimate-Sidebar-Menu-BS5.css'));
});


// Route vers 403.css
app.get('/403.css', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/css/403.css'));
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
        res.send("Erreur, mauvais identifiants ! Ressayez SVP");
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
/**
 * Fonction qui va générer une couleur aléatoire pour chaque utilisateur
 */
function generateColor() {
    return "#" + (Math.floor(Math.random() * 0xFFFFFF)).toString(16);
}

// Port d'écoute
server.listen(PORT, () => {
    console.log('Serveur démarré sur le port :'+PORT);
});

/**
 *  Fonction qui va générer des logs automatiquement
 * @param message
 * @param type
 * @constructor
 */
function Logger(message, type) {
    let date = new Date();
    let heure = date.getHours();
    let minutes = date.getMinutes();
    let secondes = date.getSeconds();

    if (!fs.existsSync(pathLog)) { fs.mkdirSync(pathLog); }

    switch (type) {
        case "connection":
            fs.appendFile (pathLog + "/" + date.getDate () + "-" + (date.getMonth () + 1) + "-" + date.getFullYear () + ".log", "[CONNEXION] " + heure + ":" + minutes + ":" + secondes + " : " + message + " \r \n", function (err) {
                if (err) throw err;
            });
            break;

        case "message":
            fs.appendFile (pathLog + "/" + date.getDate () + "-" + (date.getMonth () + 1) + "-" + date.getFullYear () + ".log", "[MESSAGE] " + heure + ":" + minutes + ":" + secondes + " : " + message + " \r \n", function (err) {
                if (err) throw err;
            });
            break;

        case "disconnection":
            fs.appendFile (pathLog + "/" + date.getDate () + "-" + (date.getMonth () + 1) + "-" + date.getFullYear () + ".log", "[DECONNEXION] " + heure + ":" + minutes + ":" + secondes + " : " + message + " \r \n", function (err) {
                if (err) throw err;
            });
            break;

        case "block":
            fs.appendFile (pathLog + "/" + date.getDate () + "-" + (date.getMonth () + 1) + "-" + date.getFullYear () + ".log", "[BLOQUAGE] " + heure + ":" + minutes + ":" + secondes + " : " + message + " \r \n", function (err) {
                if (err) throw err;
            });
            break;

        case 'error':
            // en rouge
            fs.appendFile (pathLog + "/" + date.getDate () + "-" + (date.getMonth () + 1) + "-" + date.getFullYear () + ".log", "[ERREUR] " + heure + ":" + minutes + ":" + secondes + " : " + message + " \r \n", function (err) {
                if (err) throw err;
            });
            break;
    }
}
/**
 * Lancement du gestionnaire d'événements, qui va gérer notre Socket
 */
io.on('connection', (socket) => {
    if(infosUtilisateur === undefined) {
        new Logger("Un utilisateur non connecté a tenté de se connecter", "error");
        socket.disconnect();
        return;
    }

    socket.pseudo = "<b style=\"color:" + generateColor() + "\">" + infosUtilisateur.pseudo + "</b>";
    const pseudoLog = infosUtilisateur.pseudo;

    // LOG : On envoie un message de bienvenue à l'utilisateur
    new Logger(`${pseudoLog} vient de se connecter à ${new Date()}`, "connection");

    // Récupération de la liste des utilisateurs (Sockets) connectés
    io.fetchSockets().then((room) => {

        // On crée un premier utilisateur nommé salon, retournant l'id salon a chaque fois
        let userConnecter = [{id_users: 'general', pseudo_client: 'Salon'}];

        // On va donc ajouter à chaque connexion les utilisateurs dans le tableau
        room.forEach((item) => {
            userConnecter.push({
                id_users: item.id, pseudo_client: item.pseudo
            });
             console.log(userConnecter) // Affiche la liste des utilisateurs connectés
        });
        io.emit ('get-pseudo', userConnecter);
    });


    /*
     Socket pour l'émission/reception des messages et socket id - SERVER.js
    */

    // On recupere ausssi les images
    socket.on ('emission_message',
        (message, image, id) => {

            // LOG DE MESSAGES
            new Logger (`${pseudoLog} à écrit : ${message},  émetteur : ${socket.id},  destinataire : ${id}`, "message");
            const laDate = new Date ();

            // [OPTIONAL] Pour enregistrer les messages dans le serveur
            if (config["save-images"].value === true && image !== null) {
                const splitted = image.split (';base64,');
                const format = splitted[0].split ('/')[1];
                fs.writeFileSync (config["save-images"].path + laDate.getTime () + '_' + pseudoLog + '.' + format, splitted[1], 'base64');
            }

            // Mis en format JSON
            let unMessage = {
                emet_id: socket.id,
                dest_ID: id,
                pseudo: socket.pseudo,
                msg: message,
                image: image,
                date: laDate.toLocaleDateString () + ' - ' + laDate.toLocaleTimeString (),
                recu: false
            };

            /*
             On envoie le message aux bonnes personnes, dans le salon général tout le monde le reçois,
             mais pour les messages privés seul l'émetteur et le destinataire reçoivent le message.
            */
            if (id === "general") {
                io.emit ('reception_message', unMessage);

            } else {
                io.to (id).to (socket.id).emit ('reception_message', unMessage);
            }

        });

    /*
     Socket pour le bloquage des messages - SERVER.js
    */
    socket.on("bloquer", (id_user, id_bloquer) => {
        new Logger(`${pseudoLog} à bloqué ${id_bloquer}`, "block");

        io.to(id_bloquer).emit("est_bloquer", socket.id);

        io.fetchSockets().then((room) => {
            // On crée un premier utilisateur nommé salon, retournant l'id 'general' a chaque fois
            let userConnecter = [{id_users: 'general', pseudo_client: 'Salon'}];

            // À chaque déconnexion les utilisateurs dans le tableau
            room.forEach((item) => {
                if (socket.id !== item.id || id_user !== item.id || id_bloquer !== item.id || socket.id === id_bloquer) {
                    userConnecter.push ({
                        id_users: item.id, pseudo_client: socket.pseudo
                    });
                }
            });

            io.emit('get-pseudo', userConnecter);
        });
    });

    /*
     Socket pour informer la déconnexion
    */
    socket.on('disconnect', async () => {
        // LOG DE DÉCONNEXION
        let pseudoDisconnected // Variable créée pour éviter erreur de code

        // On récupère le pseudo de l'utilisateur qui se déconnecte
        socket._onclose( pseudoDisconnected = pseudoLog);

        // LOG DE DÉCONNEXION
        new Logger(`${pseudoDisconnected} vient de se déconnecter`, "disconnection");

        // PERMET D'AFFICHER LES PERSONNES CONNECTÉS EN LOG
        //sockets.forEach(element => Logger(element.pseudo, "connection")); *

        // Récupération de la liste des utilisateurs (Sockets) connectés
        io.fetchSockets().then((room) => {
            // On crée un premier utilisateur nommé salon, retournant l'id 'general' a chaque fois
            let userConnecter = [{id_users: 'general', pseudo_client: 'Salon'}];

            // À chaque déconnexion les utilisateurs dans le tableau
            room.forEach((item) => {
                userConnecter.push({
                    id_users: item.id, pseudo_client: socket.pseudo
                });
            });
            io.emit('get-pseudo', userConnecter);
        });

         /*
     Socket pour l'émission/reception des messages et socket id - SERVER.js
    */

    // On recupere ausssi les images
    socket.on ('emission_message',
        (message, image, id) => {

            // LOG DE MESSAGES
            new Logger (`${pseudoLog} à écrit : ${message},  émetteur : ${socket.id},  destinataire : ${id}`, "message");
            const laDate = new Date ();

            // [OPTIONAL] Pour enregistrer les messages dans le serveur
            if (config["save-images"].value === true && image !== null) {
                const splitted = image.split (';base64,');
                const format = splitted[0].split ('/')[1];
                fs.writeFileSync (config["save-images"].path + laDate.getTime () + '_' + pseudoLog + '.' + format, splitted[1], 'base64');
            }

            // Mis en format JSON
            let unMessage = {
                emet_id: socket.id,
                dest_ID: id,
                pseudo: socket.pseudo,
                msg: message,
                image: image,
                date: laDate.toLocaleDateString () + ' - ' + laDate.toLocaleTimeString (),
                recu: false
            };

            /*
             On envoie le message aux bonnes personnes, dans le salon général tout le monde le reçois,
             mais pour les messages privés seul l'émetteur et le destinataire reçoivent le message.
            */
            if (id === "general") {
                io.emit ('reception_message', unMessage);

            } else {
                io.to (id).to (socket.id).emit ('reception_message', unMessage);
            }

        });

    /*
     Socket pour le bloquage des messages - SERVER.js
    */
    socket.on("bloquer", (id_user, id_bloquer) => {
        new Logger(`${pseudoLog} à bloqué ${id_bloquer}`, "block");

        io.to(id_bloquer).emit("est_bloquer", socket.id);

        io.fetchSockets().then((room) => {
            // On crée un premier utilisateur nommé salon, retournant l'id 'general' a chaque fois
            let userConnecter = [{id_users: 'general', pseudo_client: 'Salon'}];

            // À chaque déconnexion les utilisateurs dans le tableau
            room.forEach((item) => {
                if (socket.id !== item.id || id_user !== item.id || id_bloquer !== item.id || socket.id === id_bloquer) {
                    userConnecter.push ({
                        id_users: item.id, pseudo_client: socket.pseudo
                    });
                }
            });

            io.emit('get-pseudo', userConnecter);
        });
    });

    /*
     Socket pour informer la déconnexion
    */
    socket.on('disconnect', async () => {
        // LOG DE DÉCONNEXION
        let pseudoDisconnected // Variable créée pour éviter erreur de code

        // On récupère le pseudo de l'utilisateur qui se déconnecte
        socket._onclose( pseudoDisconnected = pseudoLog);

        // LOG DE DÉCONNEXION
        new Logger(`${pseudoDisconnected} vient de se déconnecter`, "disconnection");

        // PERMET D'AFFICHER LES PERSONNES CONNECTÉS EN LOG
        //sockets.forEach(element => Logger(element.pseudo, "connection")); *

        // Récupération de la liste des utilisateurs (Sockets) connectés
        io.fetchSockets().then((room) => {
            // On crée un premier utilisateur nommé salon, retournant l'id 'general' a chaque fois
            let userConnecter = [{id_users: 'general', pseudo_client: 'Salon'}];

            // À chaque déconnexion les utilisateurs dans le tableau
            room.forEach((item) => {
                userConnecter.push({
                    id_users: item.id, pseudo_client: socket.pseudo
                });
            });
            io.emit('get-pseudo', userConnecter);
        });
    });
    });
});
