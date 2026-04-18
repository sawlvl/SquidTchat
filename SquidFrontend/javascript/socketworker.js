/*****************************************************
 * PROJECT : SquidTchat
 * AUTHOR  : W.Sanquer
 * DATE    : 2026
 *
 * SHARED WORKER : maintient UNE seule connexion
 * WebSocket vivante entre tous les onglets/pages.
 * La socket ne meurt jamais lors des navigations.
 *****************************************************/

/* ===================================================
    Etat global du worker
   =================================================== */

let socket = null;          // La connexion WebSocket unique
let wsUrl = null;           // URL du serveur
let pseudo = null;          // Pseudo authentifie
let authentifie = false;    // Etat d'authentification

// Liste de tous les ports (pages) connectes au worker
const ports = [];

/* ===================================================
    Connexion d'une nouvelle page au worker
   =================================================== */

onconnect = (e) => {
    const port = e.ports[0];
    ports.push(port);

    // Ecoute les messages de cette page
    port.onmessage = (event) => {
        const msg = event.data;

        // La page envoie sa config au demarrage
        if (msg.type === "init") {
            wsUrl = msg.wsUrl;
            pseudo = msg.pseudo;
            ouvrirSocket();
            return;
        }

        // La page veut envoyer un message au serveur
        if (msg.type === "send") {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(msg.data);
            }
        }

        // La page se deconnecte proprement
        if (msg.type === "disconnect") {
            const index = ports.indexOf(port);
            if (index !== -1) ports.splice(index, 1);
        }
    };

    // Si la socket est deja ouverte et authentifiee, informe la nouvelle page
    if (socket && socket.readyState === WebSocket.OPEN && authentifie) {
        port.postMessage({ type: "already_connected", pseudo: pseudo });
    }

    port.start();
};

/* ===================================================
    Ouverture de la socket WebSocket
   =================================================== */

function ouvrirSocket() {
    // Ne pas rouvrir si deja connecte
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        return;
    }

    socket = new WebSocket(wsUrl);

    // Connexion etablie → s'authentifier
    socket.onopen = () => {
        diffuser({ type: "open" });
        socket.send(JSON.stringify({
            type: "auth/register",
            timestamp: new Date().toISOString(),
            payload: { pseudo: pseudo }
        }));
    };

    // Message recu du serveur → diffuser a toutes les pages
    socket.onmessage = (event) => {
        const reponse = JSON.parse(event.data);

        // Gestion de l'authentification
        if (reponse.type === "auth/ack") {
            if (reponse.payload.status === "ok") {
                authentifie = true;
            } else {
                authentifie = false;
            }
        }

        // Diffuse le message a toutes les pages connectees
        diffuser({ type: "message", data: event.data });
    };

    // Connexion perdue
    socket.onclose = () => {
        authentifie = false;
        diffuser({ type: "close" });
    };

    // Erreur
    socket.onerror = () => {
        diffuser({ type: "error" });
    };
}

/* ===================================================
    Diffusion d'un message a toutes les pages
   =================================================== */

function diffuser(message) {
    ports.forEach(port => {
        try {
            port.postMessage(message);
        } catch (e) {
            // Port mort → le retirer
            const index = ports.indexOf(port);
            if (index !== -1) ports.splice(index, 1);
        }
    });
}
