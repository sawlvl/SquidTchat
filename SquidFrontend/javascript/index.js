/*****************************************************
 * PROJECT : SquidTchat
 * AUTHOR  : W.Sanquer
 * DATE    : 2026
 *****************************************************/

/* ===================================================
    Recuperation des elements de la page
   =================================================== */
// Je recupère le texte où l'utilisateur tape son pseudo.
const input = document.querySelector(".pseudo");
// Je recupère le bouton pour passer a la page forum.
const lien = document.querySelector(".btn");

/* ===================================================
    Affichage de l'erreur si le pseudo a ete refuse
   =================================================== */
const erreur = sessionStorage.getItem("erreur");
if (erreur) {
    document.querySelector(".erreur").textContent = erreur;
    sessionStorage.removeItem("erreur");
}

/* ===================================================
    Blocage du bouton en l'absence du pseudo
    Le WebSocket est initialise par le Shared Worker
    des l'arrivee sur forum.html — plus besoin de
    se connecter ici.
   =================================================== */
lien.addEventListener("click", (e) => {
    if (input.value.trim().length === 0) {
        e.preventDefault();
    } else {
        e.preventDefault();
        // Sauvegarde le pseudo et redirige vers le forum
        sessionStorage.setItem("pseudo", input.value.trim());
        window.location.href = "pages/forum.html";
    }
});

/* ===================================================
    Raccourci clavier pour la touche entrer
   =================================================== */
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        lien.click();
    }
});

/* ===================================================
    Gestion des CGU
   =================================================== */
function acceptCGU() {
    const banner = document.getElementById('cgu-banner');
    banner.style.display = 'none';
    sessionStorage.setItem('squidtchat_cgu', 'accepted');
}

window.addEventListener('load', () => {
    if (sessionStorage.getItem('squidtchat_cgu') === 'accepted') {
        document.getElementById('cgu-banner').style.display = 'none';
    }
});