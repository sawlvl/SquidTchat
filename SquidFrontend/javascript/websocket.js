//Ouvre une connexion directe avec le serveur.
const socket = new WebSocket ("ws://localhost:1234");

//Sauvegarde le pseudo dans le stockage de session.
const pseudo = sessionStorage.getItem("pseudo");

//Attend la connexion et une fois connecte previens dans le terminal JS.
socket.onopen = () => {
    console.log("Connecte au serveur");
};

//Des que le serveur envoie un message il s'affiche dans le terminal JS.
socket.onmessage = (event) => {
    console.log("Reponse du serveur : ", event.data);
};

//Affiche dans le terminal JS quand la connexion avec le serveur est coupee
socket.onclose = () => {
    console.log("Connexion perdu");
};