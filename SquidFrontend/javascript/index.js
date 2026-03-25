// On récupère le texte où l'utilisateur tape son pseudo.
const input = document.querySelector(".pseudo");

// On récupère le bouton pour passer a la page forum.
const lien = document.querySelector(".btn");

// Le navigateur surveille le moment où l'utilisateur clique sur le lien pour empecher de changer de page.
lien.addEventListener("click", (e) => {
    if (input.value.trim().length === 0) {
        e.preventDefault();
    } else {
        e.preventDefault(); // bloque la redirection automatique

        sessionStorage.setItem("pseudo", input.value.trim());

        // Connexion WebSocket et envoi du pseudo au serveur
        const socket = new WebSocket("ws://localhost:1234");
        socket.onopen = () => {
            console.log("Connecte au serveur");
            const message = JSON.stringify({
                type: "auth/register",
                timestamp: new Date().toISOString(),
                payload: {
                    pseudo: input.value.trim()
                }
            });
            console.log("Message envoyé : ", message);
            socket.send(message);
        };

        // Le serveur répond avec le résultat.
        socket.onmessage = (event) => {
            try {
                const reponse = JSON.parse(event.data);
                if (reponse.type === "auth/ack" && reponse.payload.status === "error") {
                    // Pseudo refusé → affiche la raison
                    document.querySelector(".erreur").textContent = reponse.payload.reason;
                    return;
                }
            } catch (e) {
                // La réponse n'est pas du JSON on ignore.
            }
            // Tout autre réponse que erreur on redirige.
            window.location.href = "pages/forum.html";
        };
    }
});