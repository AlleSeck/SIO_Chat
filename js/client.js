//start the socket connection
let socket = io('http://localhost:5555');


//Selection pseudo
socket.emit('set-pseudo',prompt("Pseudo ?"));

//Variables pour recuperer les elements HTML
var messages = document.getElementById('messages');
var form = document.getElementById('form');
const users = document.getElementById('users'); // la liste users connecté
var input = document.getElementById('input');
let id_salon;
/*
 Écouteur et envoi du message du formulaire
*/
form.addEventListener('submit', (e) => {
  // Cette utilisation de preventDefault() sert à éviter de recharger la page a chaque envoie de message
  e.preventDefault ();

  let temp;
  if (input.value !== '' && document.getElementById ('file').files[0] != null) {
      const file = document.getElementById ('file').files[0];
      const reader = new FileReader ();

      temp = input.value;
      reader.onloadend = function () {
          socket.emit('emission_message', temp, reader.result, id_salon);
      }
      reader.readAsDataURL (file);

      // On vide les champs de saisie
      input.value = '';
      document.getElementById ('file').value = '';
  } else if (input.value !== '') {
      socket.emit ('emission_message', input.value, null, id_salon);
      input.value = ''; // Supprimer l'ancienne valeur pour réécrire un message
  } else if (document.getElementById ('file').files[0] != null) {
      const file = document.getElementById ('file').files[0];
      const reader = new FileReader ();
      reader.onloadend = function () {
          socket.emit ('emission_message', '', reader.result, id_salon);
      }
      reader.readAsDataURL (file);

      document.getElementById ('file').value = '';
  }


});

// Variable qui va définir un destinataire, par défaut le salon général
let storageMessages = [];  // Tableau qui va contenir l'ensemble des messages envoyés (semi-persistance)
storageMessages = localStorage.getItem('messages') ? JSON.parse(localStorage.getItem('messages')) : [];
console.log(storageMessages);
storageMessages.forEach(element => {
  let message = document.createElement('li');
  message.innerHTML = element;
  messages.appendChild(message);
});

//Ecouter et envoi du message du formulaire
form.addEventListener('submit', (e) => {
    e.preventDefault();
 //Emit a message event
    socket.emit('emission_message', input.value);
    input.value= '';
});

//Reception et affichage message
socket.on('reception_message', (contenu) => {
  // On crée le tableau qui recense tout les messages
    console.log(contenu);
    storageMessages.push({
      pseudo: contenu.pseudo,
      message: contenu.msg,
      dest_ID: contenu.dest_ID,
      emet_id: contenu.emet_id,
      image: contenu.image,
      recu: contenu.recu
    });
    console.log(contenu.msg);
    localStorage.setItem('messages', JSON.stringify(storageMessages));
    socket.emit('join', 'room1');


  var message = document.createElement('li');
  message.innerHTML = contenu;
  messages.appendChild(message);

  salon(id_salon); // On gère l'affichage pour que les bonnes personnes reçoivent les messages qui leurs sont destinés
  window.scrollTo(0, document.body.scrollHeight); // Permet de scroller automatiquement
});

socket.on('get-pseudo', (userConnecter) => {
  // On met à zéro le tableau des utilisateurs connectés
  users.innerHTML = "";

  // On crée une <li> et un <a>
  const salon_li = document.createElement("li");
  const salon_a = document.createElement("a");
// On met un id à salon ce qui donnera <li id="salon">Salon</li>
    // On crée donc pour chaque pseudo un lien qui va permettre de changer de salon
    salon_li.setAttribute("id", id_salon);

    // <li><a>Exemple de l'appendChild utilisé</a></li>
    users.appendChild(salon_li).appendChild(salon_a);

    // BOUCLE POUR CHAQUE PERMET DE CRÉER LE LI ET D'IMPLÉMENTER AUTOMATIQUEMENT UTILISATEURS CONNECTÉS ET DÉCONNECTÉS
    userConnecter.forEach((element) => {
        console.log(element); // DEBUG : Affiche les données de chaque utilisateur connecté

        // On crée une <li>, un <a> et un <span>
        const li = document.createElement("li");
        const a = document.createElement("a");
        const notif = document.createElement("span");


        //console.log(element); // DEBUG : Affiche l'id de chaque utilisateur connecté
        a.href = "#";

        // Dès qu'on clique sur un utilisateur ou un salon, la sidebar va se replier
        a.setAttribute("onclick", "salon('" + element.id_users + "'); closeSidebar()");
        li.setAttribute("id", element.id_users);

        // Chaque utilisateur a un badge, qui s'affichera quand il n'aura pas lu un message
        notif.setAttribute("id", element.id_users+"_notif");
        notif.setAttribute("class", "badge badge-light")

        // console.log("Salon :", id_salon); // DEBUG MODE

        // Permet d'afficher les utilisateurs connecté et de ne pas s'afficher sois même, j'ai mis a.innerHTML pour que les utilisateurs soient bien clicquable
        a.innerHTML = (socket.id !== element.id_users ? element.pseudo_client : null);

        // Même principe qu'à la ligne 60"
        users.appendChild(li).appendChild(a).appendChild(notif);


        let id_body_user = document.getElementById(element.id_users); // On récupère l'id de l'utilisateur connecté

        // Nom user formalisé
        let pseudo_client_formatted = element.pseudo_client.substring(element.pseudo_client.indexOf(">") + 1, element.pseudo_client.length-4);

        // On met un écouteur sur chaque clique droit sur chaque utilisateur
        id_body_user.addEventListener('contextmenu', e => {
            e.preventDefault();

            // console.log("Clic droit sur " + pseudo_client_formatted); // DEBUG MODE : Affiche le pseudo de l'utilisateur cliqué
            if (confirm("Voulez vous bloquer : " + pseudo_client_formatted + " ?")) {
                alert("Vous avez bloqué " + pseudo_client_formatted);
                userConnecter.pop(element.id_users);
                salon('general')
                socket.emit('bloquer', socket.id ,element.id_users);
            }
        });
    });

});

/*
 Lorsqu'une personne est bloquée - CLIENT.js
*/

socket.on('est_bloquer', (id_users) => {
    //console.log(id_users +" vous à bloqué");
    alert(id_users +" vous à bloqué");
    // Delete bloquer du tableau
    salon('general')
    //userConnecter.pop(id_users);
});

// De base on affiche le salon général
id_salon = 'general';
/**
 * Affichage des messages en fonction du choix de l'utilisateur :
 * @param {string} id - L'id du salon choisis.
 * - Soit les messages du salon général,
 * - Soit les messages d'une conversation privée avec un autre utilisateur
 */
function salon(id) {
    // On affecte l'id du salon choisi à id_salon
    id_salon = id;

    // On vide la liste des messages
    messages.innerHTML = "";

    lesMessages.forEach((contenu) => {
        //console.log("destinataire : " + contenu.dest_ID + ", salon : " + id_salon); // DEBUG MODE
        // Pour chaque message, on vérifie si le message est destiné au salon général ou à un salon privé
        if (contenu.dest_ID === id_salon || contenu.emet_id === id_salon && contenu.dest_ID !== "general") {

            //console.log(contenu); // DEBUG MODE
            const li = document.createElement ("LI");
            li.innerHTML = contenu.pseudo + " : " + contenu.message;
            messages.appendChild (li);
            contenu.recu = true;
            if (contenu.image) {
                const img = document.createElement ("img");
                img.src = contenu.image;
                img.setAttribute("class", "img-fluid");
                img.setAttribute("width", "200");
                // center image img.setAttribute("class", "mx-auto d-block");
                img.setAttribute ("alt", "Responsive image");
                // réduire la taille de l'image
                messages.appendChild (img);
            }
        }
    })

    // On va remettre à zéro les badges de notification
    if (id_salon !== 'general') {
        document.getElementById(id_salon+"_notif").innerHTML="";
    }
}

/**
 * Vérifie les messages non-lus, puis affiche un badge de notification
 * incrémentée à coté de l'utilisateur en question
 */
function check_unread() {
    // Compteurs de messages non-lus
    const compteurs = [];

    // On parcourt le tableau de messages
    for(const contenu of lesMessages) {

        // Si l'utilisateur n'a pas encore reçu le message
        if(contenu.dest_ID !== 'general' && contenu.recu === false) {
            // Si le compteur n'existe pas, on le crée
            if(compteurs[contenu.dest_ID] === undefined) {
                compteurs[contenu.dest_ID] = 0;
            }
            // On incrémente le compteur, puis on affiche le badge avec le nombre de messages non-lus
            compteurs[contenu.dest_ID]++;

            // On affiche le badge dans la sidebar
            document.getElementById(contenu.emet_id+"_notif").innerHTML=compteurs[contenu.dest_ID]
        }
    }
}

/**
 * Déconnecte l'utilisateurs lorsqu'il appuie sur se déconnecter
 * Si il appuie sur ok, son socket sera déconnecté
 */
function disconnect () {
    // On demande confirmation à l'utilisateur
    if (confirm("Vous voulez déconnecter ?")) {
        alert("Vous êtes déconnecté, reconnectez vous en rechargeant la page");

        // On ferme la sidebar
        closeSidebar();

        // Page qui ce crée qui demande a l'utilisateur si il souhaite se reconnecter
        document.write("<h1 style='text-align: center; margin-top: 5em; color:red;'>Vous êtes déconnectés veuillez recharger la page</h1>" +
            "<br><h2 style='text-align: center'>En cliquant <a href='http://127.0.0.1:8080'>ici</a></h2>");

        // On déconnecte le socket
        socket.destroy();
    } else {
        // Si l'utilisateur ne veut pas se déconnecter, on ne fait rien
        alert("Vous êtes toujours connecté");
    }
}

/**
 * Ferme la sidebar dès que la personne a choisis son salon
 * S'il appuie sur le salon alors la sidebar ce ferme
 */
function closeSidebar() {sidebar.setAttribute("class", "sidebar");}



});