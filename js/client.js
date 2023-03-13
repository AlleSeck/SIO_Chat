//start the socket connection
let socket = io();


//Selection pseudo
socket.emit('set-pseudo',prompt("Pseudo ?"));

//Variables pour recuperer les elements HTML
var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');
let storageMessages = []; 
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
    console.log(contenu);
    storageMessages.push(contenu);
    localStorage.setItem('messages', JSON.stringify(storageMessages));

  var message = document.createElement('li');
  message.innerHTML = contenu;
  messages.appendChild(message);
});
