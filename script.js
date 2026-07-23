// Script utilitaire des bulletins

async function loadBulletins() {
    // Déclare une fonction asynchrone pour charger et afficher les bulletins
    const res = await fetch ("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    // Effectue une requête HTTP fetch pour récupérer un fichier (ici l'URL de Firestore, ce qui renvoie du code JS)
    const data = await res.json();
    // Tente de convertir la réponse HTTP récupérée en objet JSON (attention: cette URL renvoie du JS, ce qui provoquera une erreur au parsing JSON)

    let container = document.getElementById("bulletins");
    // Récupère l'élément HTML ayant pour identifiant "bulletins" servant de conteneur d'affichage
    container.innerHTML = "",
    // Vide le contenu du conteneur avant d'effectuer le nouveau rendu

    data.forEach(s => {
        // Parcourt chaque bulletin d'élève présent dans le tableau récupéré
        let rows = "";
        // Initialise une chaîne de caractères vide pour contenir les lignes de notes du tableau

        s.notes.forEach(n => {
            // Parcourt chaque note individuelle du bulletin de l'élève
            rows +=
            // Concatène la ligne HTML de note au tableau cumulé de notes
            
            `<tr>
                 <td>${n.cours}</td>
                  <td>${n.notes}/${n.max}</td>
            </tr>`
            // Modèle de ligne de tableau HTML contenant le nom du cours et les points obtenus sur le max
            ;
        });

        container.innerHTML +=
        // Ajoute la structure de carte HTML du bulletin de l'élève dans le conteneur principal
            `<div class="bulletins">
                <h2>E-SCHOOL</h2>
                <p><strong>Nom:</strong> ${s.nom}</p>
                <p><strong>Classe:</strong> ${s.classe}</p>

                <table>
                   <tr>
                       <th>Cours</th>
                       <th>Notes</th>
                   </tr>
                   ${rows}
                </table>

                <p>Total : ${s.total} / ${s.totalMax}</p>
                <p>Moyenne : ${s.moyenne.toFixed(2)}</p>
                <p>Pourcentage : ${s.pourcentage.toFixed(2)}</p>
                <p>Décision : ${s.decision}</p>
            </div>`
            // Template HTML complet de la carte bulletin contenant nom, classe, tableau de notes, moyennes et décision
            ;
        });
    }
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
