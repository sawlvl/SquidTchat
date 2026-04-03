/**
 * @author W.Sanquer
 */

function envoyerMessage() {
    const input = document.querySelector('.saisie');
    const texte = input.value.trim();
    if (!texte) return;

    // Envoie le message au serveur via WebSocket
    socket.send(JSON.stringify({
    type: "forum/send",
    timestamp: new Date().toISOString(),
    payload: {
        pseudo: pseudo,
        content: texte
    }
}));
    input.value = '';
}
document.querySelector('.saisie').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') envoyerMessage();
});