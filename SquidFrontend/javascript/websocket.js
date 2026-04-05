/*****************************************************
 * PROJECT : SquidTchat
 * AUTHOR  : W.Sanquer
 * DATE    : 2026
 *****************************************************/

/* ===================================================
    Ouverture de la connexion avec le serveurs
   =================================================== */

const wsUrl = window.SQUIDTCHAT_WS_URL || "ws://127.0.0.1:1234";
const socket = new WebSocket(wsUrl);

/* ===================================================
    Presentation aupres du serveur
   =================================================== */
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

/* ===================================================
    Reception et affichage des messages
   =================================================== */

// Des que le serveur envoie un message il l'affiche dans la zone des messages.
socket.onmessage = (event) => {
    const reponse = JSON.parse(event.data);

    // Indique si on est actuellement sur la page forum
    const surPageForum = typeof afficherBulle === "function" && !document.querySelector(".conversations");

    // Message du forum
    if (reponse.type === "forum/send") {
        const historique = JSON.parse(sessionStorage.getItem("forum") || "[]");
        historique.push({
            type: "forum/send",
            from: reponse.payload.from,
            content: reponse.payload.content
        });
        sessionStorage.setItem("forum", JSON.stringify(historique));
        if (surPageForum) afficherBulle(reponse.payload.from, reponse.payload.content);
    }

    // Notification de connexion d'un utilisateur
    if (reponse.type === "presence/come") {
        if (reponse.payload.pseudo === "") return;
        const historique = JSON.parse(sessionStorage.getItem("forum") || "[]");
        historique.push({
            type: "presence/come",
            pseudo: reponse.payload.pseudo
        });
        sessionStorage.setItem("forum", JSON.stringify(historique));
        if (surPageForum) afficherNotif(reponse.payload.pseudo + " a rejoint les joueurs");
    }

    // Notification de déconnexion d'un utilisateur
    if (reponse.type === "presence/left") {
        if (reponse.payload.pseudo === "") return;
        if (reponse.payload.pseudo === pseudo) return;
        const historique = JSON.parse(sessionStorage.getItem("forum") || "[]");
        historique.push({
            type: "presence/left",
            pseudo: reponse.payload.pseudo
        });
        sessionStorage.setItem("forum", JSON.stringify(historique));
        if (surPageForum) afficherNotif(reponse.payload.pseudo + " a été éliminé");
    }

    // Resultats de recherche d'utilisateurs
    if (reponse.type === "users/list") {
        console.log("users/list reçu :", reponse.payload.users);
        if (typeof afficherResultatsRecherche === "function") {
            afficherResultatsRecherche(reponse.payload.users);
        }
    }

    // Reception d'un message prive
    if (reponse.type === "mp/message") {
        const from = reponse.payload.from;
        const content = reponse.payload.content;

        // Sauvegarde dans le sessionStorage (toujours, meme si on est sur le forum)
        const mpData = JSON.parse(sessionStorage.getItem("mp_conversations") || "{}");
        if (!mpData[from]) {
            mpData[from] = [];
        }
        mpData[from].push({ from: from, content: content });
        sessionStorage.setItem("mp_conversations", JSON.stringify(mpData));

        // Si on est sur le forum, allume la pastille rouge sur le bouton MP
        if (surPageForum) {
            sessionStorage.setItem("mp_notif", "1");
            const btnMP = document.querySelector("a.btn-mp[href*='messages']");
            if (btnMP) btnMP.classList.add("notif-mp");
        }

        // Affiche le message si on est sur la page MP et que la conversation est active
        if (typeof ajouterBulle === "function") {
            if (!conversations[from]) {
                conversations[from] = [];
                ajouterConvListe(from);
            }
            conversations[from].push({ from: from, content: content });
            if (convActive === from) {
                ajouterBulle(from, content);
            }
        }
    }

    /* ===================================================
        Verification de la reponse du serveur
       =================================================== */

    // Confirmation d'authentification
    if (reponse.type === "auth/ack") {
        if (reponse.payload.status === "error") {
            // Pseudo refusé → sauvegarde l'erreur et redirige vers index
            sessionStorage.setItem("erreur", reponse.payload.reason);
            sessionStorage.removeItem("pseudo");
            window.location.href = "/index.html";
        } else {
            console.log("Authentifie :", reponse.payload.pseudo);
        }
    }
};

/* ===================================================
    Gestion des coupures de courant (Deconnexion)
   =================================================== */

// Affiche dans le terminal JS quand la connexion avec le serveur est coupee
socket.onclose = () => {
    console.log("Connexion perdu");
};

/* ===================================================
    Fonctions d'affichage
   =================================================== */

// Affiche une bulle de message dans la zone des messages
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

// Affiche une notification dans la zone des messages
function afficherNotif(texte) {
    const notif = document.createElement("p");
    notif.classList.add("notif");
    notif.textContent = texte;
    const zone = document.querySelector(".messages");
    zone.appendChild(notif);
    zone.scrollTop = zone.scrollHeight;
}

/* ===================================================
    Recuperation des anciens messages
   =================================================== */

// Recharge l'historique des messages au chargement de la page
const historique = JSON.parse(sessionStorage.getItem("forum") || "[]");
historique.forEach(msg => {
    if (msg.type === "forum/send") {
        afficherBulle(msg.from, msg.content);
    } else if (msg.type === "presence/come") {
        afficherNotif(msg.pseudo + " a rejoint les joueurs");
    } else if (msg.type === "presence/left") {
        afficherNotif(msg.pseudo + " a été éliminé");
    }
});

// Restaure la pastille rouge si un MP non lu est en attente
if (sessionStorage.getItem("mp_notif") === "1") {
    const btnMP = document.querySelector("a.btn-mp[href*='messages']");
    if (btnMP) btnMP.classList.add("notif-mp");
}