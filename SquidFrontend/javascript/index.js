/**
 * @author W.Sanquer
 */

// On récupère le texte où l'utilisateur tape son pseudo.
const input = document.querySelector(".pseudo");

// On récupère le bouton pour passer a la page forum.
const lien = document.querySelector(".btn");

// Le navigateur surveille le moment où l'utilisateur clique sur le lien pour empecher de changer de page.
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