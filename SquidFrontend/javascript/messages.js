/*****************************************************
 * PROJECT : SquidTchat
 * AUTHOR  : W.Sanquer
 * DATE    : 2026
 *****************************************************/

/* ===================================================
    Memoire du site (Stockage des messages)
   =================================================== */

// Charge les conversations depuis le sessionStorage au demarrage
const conversations = JSON.parse(sessionStorage.getItem("mp_conversations") || "{}");
let convActive = null;

// Reinitialise la pastille de notif MP (on est sur la page MP)
sessionStorage.removeItem("mp_notif");

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
const convListe = document.querySelector(".conv-liste");
const attente = document.querySelector(".attente");
const zoneMessages = document.querySelector(".messages");

/* ===================================================
    Restauration de la liste des conversations au chargement
   =================================================== */

Object.keys(conversations).forEach(cible => {
    ajouterConvListe(cible);
});

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
    Envoi de la recherche au serveur a chaque caractere tape
   =================================================== */

inputMP.addEventListener("input", () => {
    const recherche = inputMP.value.trim();
    // Cache les resultats si l'input est vide
    if (recherche === "") {
        searchResults.style.display = "none";
        return;
    }
    socket.send(JSON.stringify({
        type: "users/list",
        timestamp: new Date().toISOString(),
        payload: {
            research: recherche
        }
    }));
});

/* ===================================================
    Raccourci clavier
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
    // Cache les resultats si l'input est vide
    if (inputMP.value.trim() === "") {
        searchResults.style.display = "none";
        return;
    }
    // Affiche les resultats sous la barre de recherche
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
    // Cree la conversation si elle n'existe pas encore
    if (!conversations[cible]) {
        conversations[cible] = [];
        sauvegarderConversations();
        ajouterConvListe(cible);
    }
    afficherConversation(cible);
}

/* ===================================================
    Mise a jour de la liste des conversations
   =================================================== */

function ajouterConvListe(cible) {
    const item = document.createElement("div");
    item.classList.add("conv-item");

    const label = document.createElement("span");
    label.classList.add("conv-item-label");
    label.textContent = cible;
    label.addEventListener("click", () => afficherConversation(cible));

    const btnSupp = document.createElement("button");
    btnSupp.classList.add("conv-item-suppr");
    btnSupp.innerHTML = "&times;";
    btnSupp.title = "Supprimer la conversation";
    btnSupp.addEventListener("click", (e) => {
        e.stopPropagation();
        supprimerConversation(cible, item);
    });

    item.appendChild(label);
    item.appendChild(btnSupp);
    convListe.appendChild(item);
}

/* ===================================================
    Suppression d'une conversation
   =================================================== */

function supprimerConversation(cible, item) {
    delete conversations[cible];
    sauvegarderConversations();
    item.remove();
    // Si c'etait la conv active, revenir a l'ecran d'attente
    if (convActive === cible) {
        convActive = null;
        zoneMessages.style.display = "none";
        zoneMessages.innerHTML = "";
        document.querySelector(".chat-input-bar").style.display = "none";
        attente.style.display = "block";
    }
}

/* ===================================================
    Affichage de la zone de conversations
   =================================================== */

function afficherConversation(cible) {
    convActive = cible;

    // Met en evidence l'item actif dans la liste
    document.querySelectorAll(".conv-item").forEach(el => {
        el.classList.toggle("active", el.textContent === cible);
    });

    // Cache le logo et affiche la zone messages
    attente.style.display = "none";
    zoneMessages.style.display = "flex";
    document.querySelector(".chat-input-bar").style.display = "block";
    zoneMessages.innerHTML = "";
    // Affiche tous les messages de la conversation
    conversations[cible].forEach(msg => {
        ajouterBulle(msg.from, msg.content);
    });
    // Scroll vers le bas
    zoneMessages.scrollTop = zoneMessages.scrollHeight;
}

/* ===================================================
    Envoi d'un message prive
   =================================================== */

function envoyerMP() {
    const chatSaisie = document.querySelector(".chat-saisie");
    const texte = chatSaisie.value.trim();
    if (!texte || !convActive) return;

    socket.send(JSON.stringify({
        type: "mp/send",
        timestamp: new Date().toISOString(),
        payload: {
            to: convActive,
            content: texte
        }
    }));

    // Ajoute le message dans la conversation locale et sauvegarde
    conversations[convActive].push({
        from: pseudo,
        content: texte
    });
    sauvegarderConversations();
    ajouterBulle(pseudo, texte);
    chatSaisie.value = "";
}

// Valider avec Entree
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