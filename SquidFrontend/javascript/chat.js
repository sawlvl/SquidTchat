function envoyerMessage() {
            const input = document.querySelector('.saisie');
            const texte = input.value.trim();
            if (!texte) return;
            input.value = '';
        }
        document.querySelector('.saisie').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') envoyerMessage();
        });