//start the socket connection
var socket = io();


//Selection pseudo
socket.emit('set-pseudo',prompt("Pseudo ?"));

//Variables pour recuperer les elements HTML
var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');

//Ecouter et envoi du message du formulaire
form.addEventListener('submit', (e) => {
    e.preventDefault();
 //Emit a message event
    socket.emit('emission_message', input.value);
    input.value= '';
});

//Reception et affichage message
socket.on('reception_message', (contenu) => {
    console.log(contenu);
  var message = document.createElement('li');
  message.innerHTML = contenu;
  messages.appenchild(message);
});