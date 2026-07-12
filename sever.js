app.get("/bulletins", async (req, res) => {
    const students = await Studiant.find();

    const result = students.map(s => {
        let total = 0;
        let totalMax = 0;

        s.notes.forEach(n => {
            total += n.note;
            totalMax += n.max;
        });

        let moyenne = total / s.notes.length;
        let pourcentage = (total / totalMax) * 100;

        let decision = moyenne >= (totalMax / s.notes.length) / 2
            ? "Reussi"
            : "Echoué";

        return {
            nom: s.nom,
            classe:s.classe,
            notes: s.notes,
            total,
            totalMax,
            moyenne,
            pourcentage,
            decision
        };
    });

    res.json(result);
});
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
