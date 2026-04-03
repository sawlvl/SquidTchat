/*****************************************************
 * PROJECT : SquidTchat
 * AUTHOR  : W.Sanquer
 * DATE    : 2026
 *****************************************************/

// Vérifie si un pseudo existe dans le stockage de la session.
const pseudo = sessionStorage.getItem("pseudo");

// Si aucun pseudo enregistrer redirige vers la page de connexion.
if (!pseudo) {
    window.location.href = "../index.html";
}