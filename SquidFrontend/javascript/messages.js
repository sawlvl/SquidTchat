/*****************************************************
 * PROJECT : SquidTchat
 * AUTHOR  : W.Sanquer
 * DATE    : 2026
 *****************************************************/

/* ===================================================
    Memoire du site (Stockage des messages)
   =================================================== */

const conversations = JSON.parse(sessionStorage.getItem("mp_conversations") || "{}");
let convActive = null;
let convActiveType = null; // "mp" ou "groupe"
let dernierMPSortant = null;

// Reinitialise la pastille de notif MP
sessionStorage.removeItem("mp_notif");

/* ===================================================
    Mode actif : mp ou groupe
   =================================================== */

let modeActif = "mp";

/* ===================================================
    Sauvegarde des conversations dans le sessionStorage
   =================================================== */

function sauvegarderConversations() {
    sessionStorage.setItem("mp_conversations", JSON.stringify(conversations));
}

/* ===================================================
    Recuperation des elements de la page
   =================================================== */

const btnAdd = document.querySelector(".container-btn-add");
const searchBar = document.querySelector(".search-bar");
const inputMP = document.querySelector(".input-nouveau-mp");
const searchResults = document.querySelector(".search-results");
const listeMP = document.getElementById("liste-mp");
const listeGroupe = document.getElementById("liste-groupe");
const attente = document.getElementById("attente-mp");
const attenteGroupe = document.getElementById("attente-groupe");
const zoneMessages = document.querySelector(".messages");
const sidebar = document.getElementById("sidebar");

/* ===================================================
    Restauration de la liste des conversations au chargement
   =================================================== */

Object.keys(conversations).forEach(cible => {
    ajouterConvListe(cible, "mp");
});

/* ===================================================
    Gestion du toggle GROUPE / MP
   =================================================== */

function basculerMode(mode) {
    modeActif = mode;

    const btnGroupe = document.getElementById("toggle-groupe");
    const btnMP = document.getElementById("toggle-mp");

    if (mode === "groupe") {
        btnGroupe.classList.add("active");
        btnMP.classList.remove("active");
        sidebar.classList.add("mode-groupe");
        listeMP.style.display = "none";
        listeGroupe.style.display = "block";
        inputMP.placeholder = "Entrer un nom de groupe...";

        if (!convActive || convActiveType !== "groupe") {
            zoneMessages.style.display = "none";
            document.querySelector(".chat-input-bar").style.display = "none";
            attente.style.display = "none";
            attenteGroupe.style.display = "block";
        }
    } else {
        btnMP.classList.add("active");
        btnGroupe.classList.remove("active");
        sidebar.classList.remove("mode-groupe");
        listeGroupe.style.display = "none";
        listeMP.style.display = "block";
        inputMP.placeholder = "Entrer un pseudo...";

        if (!convActive || convActiveType !== "mp") {
            zoneMessages.style.display = "none";
            document.querySelector(".chat-input-bar").style.display = "none";
            attenteGroupe.style.display = "none";
            attente.style.display = "block";
        }
    }

    searchBar.style.display = "none";
    searchResults.style.display = "none";
    inputMP.value = "";
}

/* ===================================================
    Gestion de la barre de recherche
   =================================================== */

btnAdd.addEventListener("click", () => {
    if (searchBar.style.display === "none") {
        searchBar.style.display = "block";
        inputMP.focus();
    } else {
        searchBar.style.display = "none";
        searchResults.style.display = "none";
        inputMP.value = "";
    }
});

/* ===================================================
    Envoi de la recherche au serveur via le worker
   =================================================== */

inputMP.addEventListener("input", () => {
    const recherche = inputMP.value.trim();
    if (recherche === "") {
        searchResults.style.display = "none";
        return;
    }
    workerPort.postMessage({
        type: "send",
        data: JSON.stringify({
            type: "users/list",
            timestamp: new Date().toISOString(),
            payload: { research: recherche }
        })
    });
});

/* ===================================================
    Raccourci clavier pour la touche echap
   =================================================== */

inputMP.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        searchBar.style.display = "none";
        searchResults.style.display = "none";
        inputMP.value = "";
    }
});

/* ===================================================
    Affichage des resultats de recherche
   =================================================== */

function afficherResultatsRecherche(users) {
    if (inputMP.value.trim() === "") {
        searchResults.style.display = "none";
        return;
    }
    searchResults.style.display = "block";
    searchResults.innerHTML = "";
    users.forEach(user => {
        const item = document.createElement("div");
        item.classList.add("search-result-item");
        item.textContent = user;
        item.addEventListener("click", () => {
            ouvrirConversation(user);
            searchBar.style.display = "none";
            searchResults.style.display = "none";
            inputMP.value = "";
        });
        searchResults.appendChild(item);
    });
}

/* ===================================================
    Logique pour creer ou rejoindre une discussion
   =================================================== */

function ouvrirConversation(cible) {
    if (!conversations[cible]) {
        conversations[cible] = [];
        sauvegarderConversations();
        ajouterConvListe(cible, "mp");
    }
    afficherConversation(cible, "mp");
}

/* ===================================================
    Mise a jour de la liste des conversations
   =================================================== */

function ajouterConvListe(cible, type) {
    const liste = type === "groupe" ? listeGroupe : listeMP;

    // Evite les doublons
    if (liste.querySelector(`[data-cible="${cible}"]`)) return;

    const item = document.createElement("div");
    item.classList.add("conv-item");
    item.dataset.cible = cible;
    item.dataset.type = type;

    const label = document.createElement("span");
    label.classList.add("conv-item-label");
    label.textContent = cible;
    label.addEventListener("click", () => afficherConversation(cible, type));

    const btnSupp = document.createElement("button");
    btnSupp.classList.add("conv-item-suppr");
    btnSupp.innerHTML = "&times;";
    btnSupp.title = "Supprimer la conversation";
    btnSupp.addEventListener("click", (e) => {
        e.stopPropagation();
        supprimerConversation(cible, item, type);
    });

    item.appendChild(label);
    item.appendChild(btnSupp);
    liste.appendChild(item);
}

/* ===================================================
    Suppression d'une conversation
   =================================================== */

function supprimerConversation(cible, item, type) {
    if (type === "mp") {
        delete conversations[cible];
        sauvegarderConversations();
    }
    item.remove();

    if (convActive === cible) {
        convActive = null;
        convActiveType = null;
        zoneMessages.style.display = "none";
        zoneMessages.innerHTML = "";
        document.querySelector(".chat-input-bar").style.display = "none";
        if (type === "groupe") {
            attenteGroupe.style.display = "block";
            attente.style.display = "none";
        } else {
            attente.style.display = "block";
            attenteGroupe.style.display = "none";
        }
    }
}

/* ===================================================
    Affichage de la zone de conversations
   =================================================== */

function afficherConversation(cible, type) {
    convActive = cible;
    convActiveType = type;

    document.querySelectorAll(".conv-item").forEach(el => {
        el.classList.toggle("active", el.dataset.cible === cible);
    });

    attente.style.display = "none";
    attenteGroupe.style.display = "none";
    zoneMessages.style.display = "flex";
    document.querySelector(".chat-input-bar").style.display = "block";
    zoneMessages.innerHTML = "";

    if (type === "mp" && conversations[cible]) {
        conversations[cible].forEach(msg => ajouterBulle(msg.from, msg.content));
    }

    zoneMessages.scrollTop = zoneMessages.scrollHeight;
}

/* ===================================================
    Envoi d'un message prive via le worker
   =================================================== */

function envoyerMP() {
    const chatSaisie = document.querySelector(".chat-saisie");
    const texte = chatSaisie.value.trim();
    if (!texte || !convActive) return;

    if (convActiveType === "mp") {
        workerPort.postMessage({
            type: "send",
            data: JSON.stringify({
                type: "mp/send",
                timestamp: new Date().toISOString(),
                payload: { to: convActive, content: texte }
            })
        });
        conversations[convActive].push({ from: pseudo, content: texte });
        sauvegarderConversations();
        ajouterBulle(pseudo, texte);
        dernierMPSortant = { to: convActive, content: texte };
    }

    chatSaisie.value = "";
}

document.querySelector(".chat-saisie").addEventListener("keydown", (e) => {
    if (e.key === "Enter") envoyerMP();
});

/* ===================================================
    Creation des bulles de messages
   =================================================== */

function ajouterBulle(from, content) {
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

    zoneMessages.appendChild(bubble);
    zoneMessages.scrollTop = zoneMessages.scrollHeight;
}

function annulerDernierMPEnErreur(reason) {
    if (!dernierMPSortant) {
        alert(reason);
        return;
    }

    const conversation = conversations[dernierMPSortant.to];
    const dernierMessage = conversation && conversation[conversation.length - 1];

    if (
        dernierMessage &&
        dernierMessage.from === pseudo &&
        dernierMessage.content === dernierMPSortant.content
    ) {
        conversation.pop();
        sauvegarderConversations();
    }

    if (convActive === dernierMPSortant.to && convActiveType === "mp") {
        afficherConversation(convActive, convActiveType);
    }

    dernierMPSortant = null;
    alert(reason);
}
