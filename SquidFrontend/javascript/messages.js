/*****************************************************
 * PROJECT : SquidTchat
 * AUTHOR  : W.Sanquer
 * DATE    : 2026
 *****************************************************/

const MP_STORAGE_KEY = "mp_conversations";
const GROUP_STORAGE_KEY = "grp_conversations";
const MAX_GROUP_MEMBERS = 12;
const MAX_GROUP_INVITEES = MAX_GROUP_MEMBERS - 1;

const conversations = JSON.parse(sessionStorage.getItem(MP_STORAGE_KEY) || "{}");
const groupes = normaliserGroupes(JSON.parse(sessionStorage.getItem(GROUP_STORAGE_KEY) || "{}"));

let convActive = null;
let convActiveType = null;
let dernierMPSortant = null;
let modeActif = "mp";
let panneauGroupeOuvert = false;
let derniereConvMP = null;
let derniereConvGroupe = null;

const creationGroupe = {
    membres: [],
    resultats: []
};

sessionStorage.removeItem("mp_notif");

const body = document.body;
const btnAdd = document.querySelector(".container-btn-add");
const searchBar = document.querySelector(".search-bar");
const mpSearchSection = document.querySelector(".mp-search-section");
const groupCreateSection = document.querySelector(".group-create-section");
const inputMP = document.querySelector(".input-nouveau-mp");
const searchResults = document.querySelector(".search-results");
const inputGroupName = document.querySelector(".input-group-name");
const inputGroupMember = document.querySelector(".input-group-member");
const groupSearchResults = document.querySelector(".group-search-results");
const selectedMembers = document.querySelector(".group-selected-members");
const createGroupBtn = document.querySelector(".create-group-btn");
const listeMP = document.getElementById("liste-mp");
const listeGroupe = document.getElementById("liste-groupe");
const attente = document.getElementById("attente-mp");
const attenteGroupe = document.getElementById("attente-groupe");
const zoneMessages = document.querySelector(".messages");
const sidebar = document.getElementById("sidebar");
const chatHeader = document.querySelector(".chat-header");
const chatModeLabel = document.querySelector(".chat-mode-label");
const chatTitle = document.querySelector(".chat-title");
const groupInfoToggle = document.getElementById("group-info-toggle");
const groupInfoPanel = document.getElementById("group-info-panel");
const groupInfoClose = document.getElementById("group-info-close");
const groupPanelTitle = document.querySelector(".group-panel-title");
const groupAdminName = document.querySelector(".group-admin-name");
const groupMembersList = document.querySelector(".group-members-list");
const groupWordsList = document.querySelector(".group-words-list");
const groupKickList = document.querySelector(".group-kick-list");
const groupWordInput = document.querySelector(".group-word-input");
const groupWordAddBtn = document.querySelector(".group-word-add-btn");
const groupLeaveBtn = document.getElementById("group-leave-btn");
const groupCloseBtn = document.getElementById("group-close-btn");
const chatInputBar = document.querySelector(".chat-input-bar");
const chatSaisie = document.querySelector(".chat-saisie");

Object.keys(conversations).forEach((cible) => ajouterConvListe(cible, "mp"));
Object.keys(groupes).forEach((nomGroupe) => ajouterConvListe(nomGroupe, "groupe"));

basculerMode("mp");

btnAdd.addEventListener("click", () => {
    const visible = searchBar.style.display === "block";

    if (visible) {
        fermerRecherche();
        return;
    }

    afficherRechercheActive();
});

inputMP.addEventListener("input", () => {
    const recherche = inputMP.value.trim();
    if (recherche === "") {
        searchResults.style.display = "none";
        searchResults.innerHTML = "";
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

inputMP.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        fermerRecherche();
    }
});

searchResults.addEventListener("click", (event) => {
    const item = event.target.closest(".search-result-item");
    if (!item) return;

    const user = item.dataset.user;
    if (!user) return;

    ouvrirConversationMP(user);
    fermerRecherche();
});

inputGroupMember.addEventListener("input", () => {
    const recherche = inputGroupMember.value.trim();
    if (recherche === "") {
        creationGroupe.resultats = [];
        renderGroupSearchResults();
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

inputGroupMember.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        fermerRecherche();
    }
});

groupSearchResults.addEventListener("click", (event) => {
    const button = event.target.closest(".group-result-add");
    if (!button) return;

    const user = button.dataset.user;
    if (!user || creationGroupe.membres.includes(user)) return;

    if (creationGroupe.membres.length >= MAX_GROUP_INVITEES) {
        alert("Erreur : maximum " + MAX_GROUP_MEMBERS + " personnes dans un groupe.");
        return;
    }

    creationGroupe.membres.push(user);
    creationGroupe.resultats = creationGroupe.resultats.filter((nom) => nom !== user);
    inputGroupMember.value = "";
    renderSelectedMembers();
    renderGroupSearchResults();
});

createGroupBtn.addEventListener("click", () => {
    const groupName = inputGroupName.value.trim();

    if (!groupName) {
        alert("Erreur : Le nom du groupe ne peut pas etre vide.");
        return;
    }

    if (creationGroupe.membres.length === 0) {
        alert("Erreur : Selectionnez au moins un membre.");
        return;
    }

    if (creationGroupe.membres.length > MAX_GROUP_INVITEES) {
        alert("Erreur : maximum " + MAX_GROUP_MEMBERS + " personnes dans un groupe.");
        return;
    }

    workerPort.postMessage({
        type: "send",
        data: JSON.stringify({
            type: "grp/create",
            timestamp: new Date().toISOString(),
            payload: {
                group_name: groupName,
                members: creationGroupe.membres
            }
        })
    });
});

chatSaisie.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        envoyerMessageConversation();
    }
});

groupInfoToggle.addEventListener("click", () => {
    if (!convActive || convActiveType !== "groupe") return;

    panneauGroupeOuvert = !panneauGroupeOuvert;
    majAffichagePanneauGroupe();

    if (panneauGroupeOuvert) {
        demanderInfosGroupe(convActive);
    }
});

groupInfoClose.addEventListener("click", () => {
    panneauGroupeOuvert = false;
    majAffichagePanneauGroupe();
});

groupWordAddBtn.addEventListener("click", () => {
    if (!convActive || convActiveType !== "groupe") return;

    const mot = groupWordInput.value.trim();
    if (!mot) return;

    workerPort.postMessage({
        type: "send",
        data: JSON.stringify({
            type: "grp/add_b_word",
            timestamp: new Date().toISOString(),
            payload: {
                word: mot,
                group_name: convActive
            }
        })
    });

    groupWordInput.value = "";
});

groupLeaveBtn.addEventListener("click", () => {
    if (!convActive || convActiveType !== "groupe") return;

    workerPort.postMessage({
        type: "send",
        data: JSON.stringify({
            type: "grp/leave",
            timestamp: new Date().toISOString(),
            payload: { group_name: convActive }
        })
    });
});

groupCloseBtn.addEventListener("click", () => {
    if (!convActive || convActiveType !== "groupe") return;

    workerPort.postMessage({
        type: "send",
        data: JSON.stringify({
            type: "grp/close",
            timestamp: new Date().toISOString(),
            payload: { group_name: convActive }
        })
    });
});

function normaliserGroupes(source) {
    const resultat = {};

    Object.entries(source || {}).forEach(([nom, donnees]) => {
        resultat[nom] = normaliserGroupe(donnees);
    });

    return resultat;
}

function normaliserGroupe(donnees) {
    const groupe = donnees && typeof donnees === "object" ? donnees : {};
    return {
        messages: Array.isArray(groupe.messages) ? groupe.messages : [],
        members: Array.isArray(groupe.members) ? groupe.members : [],
        admin: typeof groupe.admin === "string" ? groupe.admin : "",
        words: Array.isArray(groupe.words) ? groupe.words : [],
        unread: Boolean(groupe.unread)
    };
}

function sauvegarderConversations() {
    sessionStorage.setItem(MP_STORAGE_KEY, JSON.stringify(conversations));
}

function sauvegarderGroupes() {
    sessionStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(groupes));
}

function basculerMode(mode) {
    modeActif = mode;

    const btnGroupe = document.getElementById("toggle-groupe");
    const btnMP = document.getElementById("toggle-mp");

    if (mode === "groupe") {
        btnGroupe.classList.add("active");
        btnMP.classList.remove("active");
        sidebar.classList.add("mode-groupe");
        body.classList.add("mode-groupe-active");
        listeMP.style.display = "none";
        listeGroupe.style.display = "block";
        convActiveType = "groupe";

        if (derniereConvGroupe && groupes[derniereConvGroupe]) {
            afficherConversation(derniereConvGroupe, "groupe");
        } else {
            afficherEtatAttente("groupe");
        }
    } else {
        btnMP.classList.add("active");
        btnGroupe.classList.remove("active");
        sidebar.classList.remove("mode-groupe");
        body.classList.remove("mode-groupe-active");
        listeGroupe.style.display = "none";
        listeMP.style.display = "block";
        fermerPanneauGroupe();
        convActiveType = "mp";

        if (derniereConvMP && conversations[derniereConvMP]) {
            afficherConversation(derniereConvMP, "mp");
        } else {
            afficherEtatAttente("mp");
        }
    }

    fermerRecherche();
}

function afficherRechercheActive() {
    searchBar.style.display = "block";
    const modeGroupe = modeActif === "groupe";

    mpSearchSection.style.display = modeGroupe ? "none" : "block";
    groupCreateSection.style.display = modeGroupe ? "block" : "none";

    if (modeGroupe) {
        inputGroupName.focus();
    } else {
        inputMP.focus();
    }
}

function fermerRecherche() {
    searchBar.style.display = "none";
    searchResults.style.display = "none";
    searchResults.innerHTML = "";
    inputMP.value = "";
    inputGroupMember.value = "";
    creationGroupe.resultats = [];
    renderGroupSearchResults();
}

function resetCreationGroupe() {
    inputGroupName.value = "";
    inputGroupMember.value = "";
    creationGroupe.membres = [];
    creationGroupe.resultats = [];
    renderSelectedMembers();
    renderGroupSearchResults();
}

function afficherEtatAttente(type) {
    convActive = null;
    convActiveType = type;
    body.classList.remove("group-chat-layout");
    zoneMessages.style.display = "none";
    zoneMessages.innerHTML = "";
    chatInputBar.style.display = "none";
    chatHeader.style.display = "none";
    fermerPanneauGroupe();

    if (type === "groupe") {
        attente.style.display = "none";
        attenteGroupe.style.display = "block";
    } else {
        attenteGroupe.style.display = "none";
        attente.style.display = "block";
    }

    document.querySelectorAll(".conv-item").forEach((element) => {
        element.classList.remove("active");
    });
}

function afficherResultatsRecherche(users) {
    if (modeActif === "groupe") {
        creationGroupe.resultats = filtrerUtilisateursGroupe(users || []);
        renderGroupSearchResults();
        return;
    }

    if (inputMP.value.trim() === "") {
        searchResults.style.display = "none";
        return;
    }

    searchResults.style.display = "block";
    searchResults.innerHTML = "";

    filtrerUtilisateursMP(users || []).forEach((user) => {
        const item = document.createElement("button");
        item.type = "button";
        item.classList.add("search-result-item");
        item.dataset.user = user;
        item.textContent = user;
        searchResults.appendChild(item);
    });
}

function filtrerUtilisateursMP(users) {
    return users.filter((user) => user && user !== pseudo);
}

function filtrerUtilisateursGroupe(users) {
    if (creationGroupe.membres.length >= MAX_GROUP_INVITEES) {
        return [];
    }

    return users.filter((user) => {
        return user && user !== pseudo && !creationGroupe.membres.includes(user);
    });
}

function renderGroupSearchResults() {
    groupSearchResults.innerHTML = "";

    if (creationGroupe.resultats.length === 0 || inputGroupMember.value.trim() === "") {
        groupSearchResults.style.display = "none";
        return;
    }

    groupSearchResults.style.display = "flex";

    creationGroupe.resultats.forEach((user) => {
        const ligne = document.createElement("div");
        ligne.classList.add("group-result-item");

        const label = document.createElement("span");
        label.textContent = user;

        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.classList.add("group-result-add");
        bouton.dataset.user = user;
        bouton.textContent = "Ajouter";

        ligne.appendChild(label);
        ligne.appendChild(bouton);
        groupSearchResults.appendChild(ligne);
    });
}

function renderSelectedMembers() {
    selectedMembers.innerHTML = "";

    creationGroupe.membres.forEach((membre) => {
        const badge = document.createElement("button");
        badge.type = "button";
        badge.classList.add("selected-member-chip");
        badge.textContent = membre;
        badge.addEventListener("click", () => {
            creationGroupe.membres = creationGroupe.membres.filter((nom) => nom !== membre);
            renderSelectedMembers();
        });
        selectedMembers.appendChild(badge);
    });
}

function ouvrirConversationMP(cible) {
    if (!conversations[cible]) {
        conversations[cible] = [];
        sauvegarderConversations();
        ajouterConvListe(cible, "mp");
    }

    afficherConversation(cible, "mp");
}

function assurerGroupe(nomGroupe) {
    if (!groupes[nomGroupe]) {
        groupes[nomGroupe] = normaliserGroupe();
    }

    return groupes[nomGroupe];
}

function ouvrirConversationGroupe(nomGroupe) {
    const groupe = assurerGroupe(nomGroupe);
    groupe.unread = false;
    sauvegarderGroupes();
    afficherConversation(nomGroupe, "groupe");
    demanderInfosGroupe(nomGroupe);
}

function ajouterConvListe(cible, type) {
    const liste = type === "groupe" ? listeGroupe : listeMP;
    if (liste.querySelector(`[data-cible="${cible}"]`)) return;

    const item = document.createElement("div");
    item.classList.add("conv-item");
    item.dataset.cible = cible;
    item.dataset.type = type;

    const label = document.createElement("span");
    label.classList.add("conv-item-label");
    label.textContent = cible;
    label.addEventListener("click", () => {
        if (type === "groupe") {
            ouvrirConversationGroupe(cible);
        } else {
            ouvrirConversationMP(cible);
        }
    });

    const btnSupp = document.createElement("button");
    btnSupp.classList.add("conv-item-suppr");
    btnSupp.innerHTML = "&times;";
    btnSupp.title = type === "groupe" ? "Quitter la vue du groupe" : "Supprimer la conversation";
    btnSupp.addEventListener("click", (event) => {
        event.stopPropagation();
        supprimerConversation(cible, item, type);
    });

    item.appendChild(label);
    item.appendChild(btnSupp);
    liste.appendChild(item);
}

function supprimerConversation(cible, item, type) {
    if (type === "mp") {
        delete conversations[cible];
        if (derniereConvMP === cible) derniereConvMP = null;
        sauvegarderConversations();
    } else {
        delete groupes[cible];
        if (derniereConvGroupe === cible) derniereConvGroupe = null;
        sauvegarderGroupes();
    }

    item.remove();

    if (convActive === cible && convActiveType === type) {
        afficherEtatAttente(type);
    }
}

function afficherConversation(cible, type) {
    convActive = cible;
    convActiveType = type;

    if (type === "groupe") {
        derniereConvGroupe = cible;
    } else {
        derniereConvMP = cible;
    }

    document.querySelectorAll(".conv-item").forEach((element) => {
        element.classList.toggle("active", element.dataset.cible === cible && element.dataset.type === type);
    });

    attente.style.display = "none";
    attenteGroupe.style.display = "none";
    zoneMessages.style.display = "flex";
    chatInputBar.style.display = "block";
    zoneMessages.innerHTML = "";

    if (type === "groupe") {
        const groupe = assurerGroupe(cible);
        body.classList.add("group-chat-layout");
        chatHeader.style.display = "none";
        groupInfoToggle.style.display = "inline-flex";
        groupe.messages.forEach((message) => ajouterBulle(message.from, message.content, message.system));
        majPanneauInfos(cible);
    } else {
        body.classList.remove("group-chat-layout");
        chatModeLabel.textContent = "Message prive";
        chatTitle.textContent = cible;
        chatHeader.style.display = "flex";
        groupInfoToggle.style.display = "none";
        conversations[cible].forEach((message) => ajouterBulle(message.from, message.content));
        fermerPanneauGroupe();
    }

    zoneMessages.scrollTop = zoneMessages.scrollHeight;
}

function demanderInfosGroupe(nomGroupe) {
    const groupe = assurerGroupe(nomGroupe);

    workerPort.postMessage({
        type: "send",
        data: JSON.stringify({
            type: "grp/info",
            timestamp: new Date().toISOString(),
            payload: { group_name: nomGroupe }
        })
    });

    if (groupe.admin === pseudo) {
        demanderInfosAdminGroupe(nomGroupe);
    }
}

function demanderInfosAdminGroupe(nomGroupe) {
    workerPort.postMessage({
        type: "send",
        data: JSON.stringify({
            type: "grp/admin_info",
            timestamp: new Date().toISOString(),
            payload: { group_name: nomGroupe }
        })
    });
}

function envoyerMessageConversation() {
    const texte = chatSaisie.value.trim();
    if (!texte || !convActive) return;

    if (convActiveType === "groupe") {
        workerPort.postMessage({
            type: "send",
            data: JSON.stringify({
                type: "grp/send",
                timestamp: new Date().toISOString(),
                payload: {
                    group_name: convActive,
                    content: texte
                }
            })
        });
    } else {
        workerPort.postMessage({
            type: "send",
            data: JSON.stringify({
                type: "mp/send",
                timestamp: new Date().toISOString(),
                payload: {
                    to: convActive,
                    content: texte
                }
            })
        });

        conversations[convActive].push({ from: pseudo, content: texte });
        sauvegarderConversations();
        ajouterBulle(pseudo, texte);
        dernierMPSortant = { to: convActive, content: texte };
    }

    chatSaisie.value = "";
}

function ajouterBulle(from, content, systeme) {
    if (systeme) {
        const notif = document.createElement("p");
        notif.classList.add("notif");
        notif.textContent = content;
        zoneMessages.appendChild(notif);
        zoneMessages.scrollTop = zoneMessages.scrollHeight;
        return;
    }

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

function fermerPanneauGroupe() {
    panneauGroupeOuvert = false;
    majAffichagePanneauGroupe();
}

function majAffichagePanneauGroupe() {
    groupInfoPanel.classList.toggle("open", panneauGroupeOuvert && convActiveType === "groupe");
    body.classList.toggle("group-panel-open", panneauGroupeOuvert && convActiveType === "groupe");
}

function majPanneauInfos(nomGroupe) {
    const groupe = assurerGroupe(nomGroupe);
    const isAdmin = groupe.admin === pseudo;

    groupPanelTitle.textContent = isAdmin
        ? "PANELLE ADMIN DU GROUPE " + nomGroupe
        : "PANELLE D'INFORMATION DU GROUPE " + nomGroupe;
    groupAdminName.textContent = groupe.admin || "-";
    groupLeaveBtn.textContent = "Quitter le groupe";
    groupLeaveBtn.style.display = isAdmin ? "none" : "inline-flex";
    groupCloseBtn.style.display = isAdmin ? "inline-flex" : "none";

    document.querySelectorAll(".admin-only").forEach((element) => {
        element.style.display = isAdmin ? "" : "none";
    });

    renderMembers(groupe, isAdmin);
    renderWords(groupe, isAdmin);
    renderKickActions(groupe, isAdmin);
}

function renderMembers(groupe, isAdmin) {
    groupMembersList.innerHTML = "";

    const membres = groupe.members.length > 0 ? groupe.members : [];
    const slots = Math.max(9, Math.ceil(membres.length / 3) * 3);

    membres.forEach((membre) => {
        const item = document.createElement("div");
        item.classList.add("group-member-item");
        const label = document.createElement("span");
        label.textContent = membre;
        item.appendChild(label);

        if (isAdmin) {
            const badge = document.createElement("button");
            badge.type = "button";
            badge.classList.add("group-kick-remove");
            badge.textContent = membre === groupe.admin ? "*" : "x";
            if (membre !== groupe.admin) {
                badge.addEventListener("click", () => {
                    workerPort.postMessage({
                        type: "send",
                        data: JSON.stringify({
                            type: "grp/kick",
                            timestamp: new Date().toISOString(),
                            payload: {
                                taget_user: membre,
                                group_name: convActive
                            }
                        })
                    });
                });
            } else {
                badge.disabled = true;
            }
            item.appendChild(badge);
        } else if (membre === groupe.admin) {
            const badge = document.createElement("span");
            badge.classList.add("group-admin-badge");
            badge.textContent = "*";
            item.appendChild(badge);
        }

        groupMembersList.appendChild(item);
    });

    for (let index = membres.length; index < slots; index += 1) {
        const empty = document.createElement("div");
        empty.classList.add("group-member-item", "empty-slot");
        empty.textContent = ".";
        groupMembersList.appendChild(empty);
    }
}

function renderWords(groupe, isAdmin) {
    groupWordsList.innerHTML = "";
    if (!isAdmin) return;

    const mots = groupe.words.length > 0 ? groupe.words : [];
    const slots = Math.max(4, Math.ceil(mots.length / 2) * 2);

    mots.forEach((mot) => {
        const item = document.createElement("div");
        item.classList.add("group-word-item");

        const label = document.createElement("span");
        label.textContent = mot;

        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.classList.add("group-word-remove");
        bouton.textContent = "Retirer";
        bouton.addEventListener("click", () => {
            workerPort.postMessage({
                type: "send",
                data: JSON.stringify({
                    type: "grp/dell_b_word",
                    timestamp: new Date().toISOString(),
                    payload: {
                        word: mot,
                        group_name: convActive
                    }
                })
            });
        });

        item.appendChild(label);
        item.appendChild(bouton);
        groupWordsList.appendChild(item);
    });

    for (let index = mots.length; index < slots; index += 1) {
        const empty = document.createElement("div");
        empty.classList.add("group-word-item", "empty-slot");
        empty.textContent = ".";
        groupWordsList.appendChild(empty);
    }
}

function renderKickActions(groupe, isAdmin) {
    groupKickList.innerHTML = "";
    if (!isAdmin) return;

    const membresKickables = groupe.members.filter((membre) => membre && membre !== groupe.admin);
    if (membresKickables.length === 0) return;

    membresKickables.forEach((membre) => {
        const item = document.createElement("div");
        item.classList.add("group-kick-item");

        const label = document.createElement("span");
        label.textContent = membre;

        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.classList.add("group-kick-btn");
        bouton.textContent = "x";
        bouton.addEventListener("click", () => {
            workerPort.postMessage({
                type: "send",
                data: JSON.stringify({
                    type: "grp/kick",
                    timestamp: new Date().toISOString(),
                    payload: {
                        taget_user: membre,
                        group_name: convActive
                    }
                })
            });
        });

        item.appendChild(label);
        item.appendChild(bouton);
        groupKickList.appendChild(item);
    });
}

function majGroupeDepuisInfo(payload, adminOnly) {
    const nomGroupe = payload.group_name;
    const groupe = assurerGroupe(nomGroupe);

    if (Array.isArray(payload.members)) {
        groupe.members = payload.members.filter(Boolean);
        if (!groupe.members.includes(pseudo)) {
            fermerEtSupprimerGroupe(nomGroupe);
            return;
        }
    }

    if (typeof payload.admin === "string") {
        groupe.admin = payload.admin;
    }

    const mots = payload.words || payload.b_words;
    if (adminOnly && Array.isArray(mots)) {
        groupe.words = mots.filter(Boolean);
    }

    sauvegarderGroupes();

    if (!listeGroupe.querySelector(`[data-cible="${nomGroupe}"]`)) {
        ajouterConvListe(nomGroupe, "groupe");
    }

    if (convActive === nomGroupe && convActiveType === "groupe") {
        majPanneauInfos(nomGroupe);
    }

    if (!adminOnly && groupes[nomGroupe].admin === pseudo) {
        demanderInfosAdminGroupe(nomGroupe);
    }
}

function ajouterMessageGroupe(nomGroupe, message) {
    const groupe = assurerGroupe(nomGroupe);
    groupe.messages.push(message);
    sauvegarderGroupes();

    if (!listeGroupe.querySelector(`[data-cible="${nomGroupe}"]`)) {
        ajouterConvListe(nomGroupe, "groupe");
    }
}

function ajouterInfoSystemeGroupe(nomGroupe, texte) {
    ajouterMessageGroupe(nomGroupe, {
        from: "system",
        content: texte,
        system: true
    });

    if (convActive === nomGroupe && convActiveType === "groupe") {
        ajouterBulle("system", texte, true);
    }
}

function fermerEtSupprimerGroupe(nomGroupe, raison) {
    delete groupes[nomGroupe];
    if (derniereConvGroupe === nomGroupe) derniereConvGroupe = null;
    sauvegarderGroupes();

    const item = listeGroupe.querySelector(`[data-cible="${nomGroupe}"]`);
    if (item) item.remove();

    if (convActive === nomGroupe && convActiveType === "groupe") {
        afficherEtatAttente("groupe");
    }

    if (raison) {
        alert(raison);
    }
}

function retirerMembreGroupe(nomGroupe, texte) {
    const groupe = assurerGroupe(nomGroupe);
    const match = texte.match(/utilisateur\s+(.+?)\s+a/i);

    if (match) {
        groupe.members = groupe.members.filter((membre) => membre !== match[1]);
        sauvegarderGroupes();
    }

    if (convActive === nomGroupe && convActiveType === "groupe") {
        majPanneauInfos(nomGroupe);
    }
}

function messageConcernePseudo(texte, userName) {
    return typeof texte === "string" && typeof userName === "string" && texte.toLowerCase().includes(userName.toLowerCase());
}

function handleGroupServerMessage(reponse) {
    const payload = reponse.payload || {};

    if (reponse.type === "grp/create_ack") {
        const nomGroupe = payload.group_name;
        assurerGroupe(nomGroupe);
        ajouterConvListe(nomGroupe, "groupe");
        sauvegarderGroupes();
        resetCreationGroupe();
        fermerRecherche();
        basculerMode("groupe");
        ouvrirConversationGroupe(nomGroupe);
        return true;
    }

    if (reponse.type === "grp/send") {
        const nomGroupe = payload.group_name;
        const message = {
            from: payload.from,
            content: payload.content
        };

        ajouterMessageGroupe(nomGroupe, message);

        if (convActive === nomGroupe && convActiveType === "groupe") {
            ajouterBulle(message.from, message.content);
        }
        return true;
    }

    if (reponse.type === "grp/info_rep") {
        majGroupeDepuisInfo(payload, false);
        return true;
    }

    if (reponse.type === "grp/admin_info_rep") {
        majGroupeDepuisInfo(payload, true);
        return true;
    }

    if (reponse.type === "grp/system_info") {
        const nomGroupe = payload.group_name;
        const raison = payload.raison || "Information groupe";
        ajouterInfoSystemeGroupe(nomGroupe, raison);

        if (payload.status === "user_leave" || payload.status === "user_kicked") {
            retirerMembreGroupe(nomGroupe, raison);

            if (messageConcernePseudo(raison, pseudo)) {
                fermerEtSupprimerGroupe(nomGroupe, raison);
            }
        }

        if (payload.status === "group_closed") {
            fermerEtSupprimerGroupe(nomGroupe, raison);
        }

        if (payload.status === "word_blocked" || payload.status === "word_unblocked" || payload.status === "group_created") {
            demanderInfosGroupe(nomGroupe);
        }

        return true;
    }

    if (reponse.type.startsWith("grp/")) {
        alert(payload.reason || payload.raison || "Erreur groupe inconnue.");
        return true;
    }

    return false;
}

window.basculerMode = basculerMode;
window.afficherResultatsRecherche = afficherResultatsRecherche;
window.ajouterConvListe = ajouterConvListe;
window.ajouterBulle = ajouterBulle;
window.annulerDernierMPEnErreur = annulerDernierMPEnErreur;
window.handleGroupServerMessage = handleGroupServerMessage;
window.envoyerMessageConversation = envoyerMessageConversation;
