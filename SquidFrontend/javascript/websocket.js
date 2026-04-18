/*****************************************************
 * PROJECT : SquidTchat
 * AUTHOR  : W.Sanquer
 * DATE    : 2026
 *
 * Ce fichier est le pont entre la page et le
 * Shared Worker. Il ne cree plus de WebSocket
 * directement — tout passe par socket.worker.js.
 *****************************************************/

/* ===================================================
    Connexion au Shared Worker
   =================================================== */

const worker = new SharedWorker("../javascript/socketworker.js");
const workerPort = worker.port;
workerPort.start();

/* ===================================================
    Initialisation : envoi de la config au worker
   =================================================== */

const wsUrl = window.SQUIDTCHAT_WS_URL || "ws://127.0.0.1:1234";

workerPort.postMessage({
    type: "init",
    wsUrl: wsUrl,
    pseudo: pseudo
});

/* ===================================================
    Memoire des timers de presence (plus necessaire
    car la socket reste vivante entre les pages)
   =================================================== */

/* ===================================================
    Reception des messages du worker
   =================================================== */

workerPort.onmessage = (event) => {
    const msg = event.data;

    // Connexion ouverte
    if (msg.type === "open") {
        console.log("Connecte au serveur");
    }

    // Connexion perdue
    if (msg.type === "close") {
        console.log("Connexion perdue");
    }

    // Deja connecte (navigation entre pages)
    if (msg.type === "already_connected") {
        console.log("Reconnexion transparente :", msg.pseudo);
        rechargerHistorique();
        return;
    }

    // Message recu du serveur
    if (msg.type === "message") {
        traiterMessage(msg.data);
    }
};

/* ===================================================
    Traitement des messages du serveur
   =================================================== */

function traiterMessage(data) {
    const reponse = JSON.parse(data);

    // Indique si on est sur la page forum
    const surPageForum = typeof afficherBulle === "function" && !document.querySelector(".conversations");

    // Message du forum
    if (reponse.type === "forum/send") {
        enregistrerEvenementForum({
            type: "forum/send",
            from: reponse.payload.from,
            content: reponse.payload.content
        });
        if (surPageForum) afficherBulle(reponse.payload.from, reponse.payload.content);
    }

    // Notification de connexion d'un utilisateur
    if (reponse.type === "presence/come") {
        if (!reponse.payload.pseudo) return;
        enregistrerEvenementForum({
            type: "presence/come",
            pseudo: reponse.payload.pseudo
        });
        if (surPageForum) afficherNotif(reponse.payload.pseudo + " a rejoint les joueurs");
    }

    // Notification de deconnexion d'un utilisateur
    if (reponse.type === "presence/left") {
        if (!reponse.payload.pseudo) return;
        enregistrerEvenementForum({
            type: "presence/left",
            pseudo: reponse.payload.pseudo
        });
        if (surPageForum) afficherNotif(reponse.payload.pseudo + " a été éliminé");
    }

    // Resultats de recherche d'utilisateurs
    if (reponse.type === "users/list") {
        if (typeof afficherResultatsRecherche === "function") {
            afficherResultatsRecherche(reponse.payload.users);
        }
    }

    // Reception d'un message prive
    if (reponse.type === "mp/message") {
        const from = reponse.payload.from;
        const content = reponse.payload.content;

        // Sauvegarde dans sessionStorage
        const mpData = JSON.parse(sessionStorage.getItem("mp_conversations") || "{}");
        if (!mpData[from]) mpData[from] = [];
        mpData[from].push({ from: from, content: content });
        sessionStorage.setItem("mp_conversations", JSON.stringify(mpData));

        // Pastille rouge sur le bouton MP si on est sur le forum
        if (surPageForum) {
            sessionStorage.setItem("mp_notif", "1");
            const btnMP = document.querySelector("a.btn-mp[href*='messages']");
            if (btnMP) btnMP.classList.add("notif-mp");
        }

        // Affiche le message si on est sur la page MP
        if (typeof ajouterBulle === "function") {
            if (!conversations[from]) {
                conversations[from] = [];
                ajouterConvListe(from, "mp");
            }
            conversations[from].push({ from: from, content: content });
            if (convActive === from) ajouterBulle(from, content);
        }
    }

    if (reponse.type === "mp/error") {
        if (typeof annulerDernierMPEnErreur === "function") {
            annulerDernierMPEnErreur(reponse.payload.reason);
        } else {
            alert(reponse.payload.reason);
        }
    }

    // Confirmation d'authentification
    if (reponse.type === "auth/ack") {
        if (reponse.payload.status === "error") {
            sessionStorage.setItem("erreur", reponse.payload.reason);
            sessionStorage.removeItem("pseudo");
            window.location.href = "/index.html";
        } else {
            console.log("Authentifie :", reponse.payload.pseudo);
        }
    }
}

/* ===================================================
    Fonctions d'affichage
   =================================================== */

// Affiche une bulle de message
function afficherBulle(from, content) {
    const bubble = document.createElement("div");
    const pseudoLabel = document.createElement("div");
    const contenu = document.createElement("div");

    pseudoLabel.classList.add("pseudo-label");
    pseudoLabel.textContent = from;

    contenu.classList.add("contenu");
    contenu.textContent = content;

    bubble.appendChild(pseudoLabel);
    bubble.appendChild(contenu);

    if (from === pseudo) {
        bubble.classList.add("moi");
    } else {
        bubble.classList.add("autre");
    }

    const zone = document.querySelector(".messages");
    zone.appendChild(bubble);
    zone.scrollTop = zone.scrollHeight;
}

// Affiche une notification
function afficherNotif(texte) {
    const notif = document.createElement("p");
    notif.classList.add("notif");
    notif.textContent = texte;
    const zone = document.querySelector(".messages");
    zone.appendChild(notif);
    zone.scrollTop = zone.scrollHeight;
}

function enregistrerEvenementForum(evenement) {
    const historique = JSON.parse(sessionStorage.getItem("forum") || "[]");
    const dernierEvenement = historique[historique.length - 1];

    const doublonPresence =
        dernierEvenement &&
        dernierEvenement.type === evenement.type &&
        dernierEvenement.pseudo === evenement.pseudo;

    if (!doublonPresence) {
        historique.push(evenement);
        sessionStorage.setItem("forum", JSON.stringify(historique));
    }
}

/* ===================================================
    Recuperation de l'historique au chargement
   =================================================== */

function rechargerHistorique() {
    const surPageForum = typeof afficherBulle === "function" && !document.querySelector(".conversations");
    if (!surPageForum) return;
    const zone = document.querySelector(".messages");
    zone.innerHTML = "";
    const historique = JSON.parse(sessionStorage.getItem("forum") || "[]");
    historique.forEach(msg => {
        if (msg.type === "forum/send") afficherBulle(msg.from, msg.content);
        if (msg.type === "presence/come") afficherNotif(msg.pseudo + " a rejoint les joueurs");
        if (msg.type === "presence/left") afficherNotif(msg.pseudo + " a été éliminé");
    });
}

// Recharge l'historique au chargement de la page
rechargerHistorique();

// Restaure la pastille rouge si MP non lu
if (sessionStorage.getItem("mp_notif") === "1") {
    const btnMP = document.querySelector("a.btn-mp[href*='messages']");
    if (btnMP) btnMP.classList.add("notif-mp");
}
