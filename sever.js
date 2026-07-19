// Définit une route GET "/bulletins" sur le serveur Express qui retourne les bulletins de tous les élèves
app.get("/bulletins", async (req, res) => {
    // Déclare un gestionnaire de route HTTP GET asynchrone pour l'URL "/bulletins"
    const students = await Studiant.find();
    // Récupère tous les documents de la collection "Studiant" depuis la base de données MongoDB

    const result = students.map(s => {
        // Transforme chaque élève en un objet de résultat calculé avec notes, moyenne et décision
        let total = 0;
        // Initialise le total des points obtenus à zéro
        let totalMax = 0;
        // Initialise le total des points possibles à zéro

        s.notes.forEach(n => {
            // Parcourt chaque note de l'élève pour cumuler les totaux
            total += n.note;
            // Additionne la note obtenue au total général
            totalMax += n.max;
            // Additionne le maximum possible au total maximum général
        });

        let moyenne = total / s.notes.length;
        // Calcule la moyenne en divisant le total par le nombre de matières notées
        let pourcentage = (total / totalMax) * 100;
        // Calcule le pourcentage de réussite global de l'élève

        let decision = moyenne >= (totalMax / s.notes.length) / 2
            // Compare la moyenne à la moitié de la note maximale moyenne pour décider du résultat
            ? "Reussi"
            // Si la moyenne est suffisante, la décision est "Reussi"
            : "Echoué";
            // Sinon, la décision est "Echoué"

        return {
            // Retourne un objet structuré avec toutes les informations calculées de l'élève
            nom: s.nom,
            // Nom de l'élève tel qu'enregistré dans la base de données
            classe:s.classe,
            // Classe de l'élève
            notes: s.notes,
            // Tableau complet des notes de l'élève (matière, note, max)
            total,
            // Total des points obtenus (raccourci ES6 : équivaut à total: total)
            totalMax,
            // Total des points possibles (raccourci ES6)
            moyenne,
            // Moyenne calculée de l'élève (raccourci ES6)
            pourcentage,
            // Pourcentage de réussite calculé (raccourci ES6)
            decision
            // Décision finale "Reussi" ou "Echoué" (raccourci ES6)
        };
    });

    res.json(result);
    // Envoie la réponse HTTP au client sous forme de JSON avec le tableau de résultats
});
// --- SÉCURITÉ : ANTI-INSPECTION ---
// Bloquer le clic droit
document.addEventListener('contextmenu', (e) => e.preventDefault());
// Empêche l'ouverture du menu contextuel (clic droit) sur toute la page

// Bloquer les raccourcis clavier (F12, Ctrl+U, Ctrl+Shift+I, etc.)
document.addEventListener('keydown', (e) => {
    // Écoute chaque touche pressée sur le clavier pour intercepter les raccourcis de développeur
    if (
        e.key === 'F12' || 
        // Vérifie si la touche F12 (ouvre les DevTools) est pressée
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        // Vérifie la combinaison Ctrl+Shift+I (ouvre les DevTools)
        (e.ctrlKey && e.shiftKey && e.key === 'J') || 
        // Vérifie la combinaison Ctrl+Shift+J (ouvre la console)
        (e.ctrlKey && e.key === 'u') ||
        // Vérifie Ctrl+U (affiche le code source)
        (e.ctrlKey && e.key === 's')
        // Vérifie Ctrl+S (sauvegarde de la page)
    ) {
        e.preventDefault();
        // Annule l'action par défaut du raccourci clavier détecté
        alert("L'inspection du code est désactivée pour des raisons de sécurité.");
        // Affiche un message expliquant pourquoi l'action est bloquée
        return false;
        // Retourne false pour s'assurer que l'événement est complètement stoppé
    }
});
