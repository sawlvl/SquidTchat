/*****************************************************
 * PROJECT : SquidTchat
 * AUTHOR  : W.Sanquer
 * DATE    : 2026
 *****************************************************/

// Ouvre une connexion directe avec le serveur.
const socket = new WebSocket("ws://10.16.26.1:1234");

// Attend la connexion et envoie le pseudo au serveur pour s'authentifier.
socket.onopen = () => {
    console.log("Connecte au serveur");
    socket.send(JSON.stringify({
        type: "auth/register",
        timestamp: new Date().toISOString(),
        payload: {
            pseudo: pseudo
        }
    }));
};

// Des que le serveur envoie un message il l'affiche dans la zone des messages.
socket.onmessage = (event) => {
    const reponse = JSON.parse(event.data);

    // Message du forum
    if (reponse.type === "forum/send") {
        const bubble = document.createElement("div");
        const pseudoLabel = document.createElement("div");
        const contenu = document.createElement("div");

        // Affiche le pseudo en haut de la bulle
        pseudoLabel.classList.add("pseudo-label");
        pseudoLabel.textContent = reponse.payload.from;

        // Affiche le contenu du message
        contenu.classList.add("contenu");
        contenu.textContent = reponse.payload.content;
        bubble.appendChild(pseudoLabel);
        bubble.appendChild(contenu);

        // Si le message vient de moi → droite, sinon → gauche
        if (reponse.payload.from === pseudo) {
            bubble.classList.add("moi");
        } else {
            bubble.classList.add("autre");
        }
        document.querySelector(".messages").appendChild(bubble);
    }

    // Confirmation d'authentification
    if (reponse.type === "auth/ack") {
        if (reponse.payload.status === "error") {
            
            // Pseudo refusé → supprime la session et redirige vers index
            sessionStorage.removeItem("pseudo");
            window.location.href = "../index.html";
        } else {
            console.log("Authentifie :", reponse.payload.pseudo);
        }
    }
};

// Affiche dans le terminal JS quand la connexion avec le serveur est coupee
socket.onclose = () => {
    console.log("Connexion perdu");
};