import { divide } from "firebase/firestore/pipelines";

async function loadBulletins() {
    const res = await fetch ("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const data = await res.json();

    let container = document.getElementById("bulletins");
    container.innerHTML = "",

    data.forEach(s => {
        let rows = "";

        s.notes.forEach(n => {
            rows +=
            
            <tr>
                 <td>$(n.cours)</td>
                  <td>$(n.notes)/$(n.max)</td>
            </tr>
            ;
        });

        container.innerHTML +=
            <div class="bulletins">
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
            </div>
            ;
        });
    }
// --- SÉCURITÉ : ANTI-INSPECTION ---
// Bloquer le clic droit
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Bloquer les raccourcis clavier (F12, Ctrl+U, Ctrl+Shift+I, etc.)
document.addEventListener('keydown', (e) => {
    if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        (e.ctrlKey && e.shiftKey && e.key === 'J') || 
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's')
    ) {
        e.preventDefault();
        alert("L'inspection du code est désactivée pour des raisons de sécurité.");
        return false;
    }
});
