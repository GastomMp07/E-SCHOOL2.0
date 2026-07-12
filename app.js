// Importations des fonctions Firebase et des instances configurées dans auth.js
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from "./auth.js";

// Clé utilisée pour stocker le rôle en session afin d'accélérer le chargement (éviter les appels réseau inutiles)
const MENU_ROLE_KEY = "eschool_menu_role";

// --- FONCTIONS DE CACHE ---
function lireRoleEnCache(uid) {
    try {
        const raw = sessionStorage.getItem(MENU_ROLE_KEY);
        if (!raw) return null;
        const o = JSON.parse(raw);
        return o && o.uid === uid && o.role ? String(o.role) : null;
    } catch { return null; }
}

function ecrireRoleEnCache(uid, role) {
    try {
        sessionStorage.setItem(MENU_ROLE_KEY, JSON.stringify({ uid, role }));
    } catch { /* ignore */ }
}

// --- LOGIQUE DE DÉTECTION DES RÔLES ---
// Nettoie les chaînes de caractères (accents, espaces, majuscules) pour des comparaisons fiables
function normaliserRole(roleBrut) {
    if (!roleBrut) return "";
    return String(roleBrut).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Fonctions de vérification booléennes pour les rôles
function estRoleEleve(role) {
    return role === "eleve" || role.includes("student");
}

function estRoleEnseignant(role) {
    return role === "enseignant" || role.includes("prof") || role.includes("teacher");
}

// AJOUT : Détection du rôle Admin
function estRoleAdmin(role) {
    return role === "admin" || role.includes("direction") || role.includes("administrateur");
}

// Compare les données de deux collections (historique de migration) pour déterminer le rôle final
function deduireRoleDepuisProfils(u, v) {
    const rU = normaliserRole(u.role);
    const rV = normaliserRole(v.role);
    
    // Applique une hiérarchie de sécurité
    if (estRoleAdmin(rU) || estRoleAdmin(rV)) return "admin";
    if (estRoleEnseignant(rU) || estRoleEnseignant(rV)) return "enseignant";
    if (estRoleEleve(rU) || estRoleEleve(rV)) return "eleve";
    
    return (u.classe || v.classe) ? "eleve" : (rU || rV || "eleve");
}

// --- GESTION DE L'AFFICHAGE DU MENU ---
async function gererAffichageMenu(role, uid) {
    // Récupération de tous les éléments du menu sidebar par leur ID
    const menuNotesEleve = document.getElementById("menu-eleve-notes");
    const menucoterEleve = document.getElementById("menu-eleve-coter");
    const menuSaisieNotesProf = document.getElementById("menu-prof-saisie-notes");
    const menuAdminSupervision = document.getElementById("menu-Enseignant"); 
    const menuCommunique = document.getElementById("menu-prof-communiquer");
    const menuProfAppel = document.getElementById("menu-prof-appel");
    const menuProfil = document.getElementById("menu-profil");

    // 1. On cache tout par défaut
    const menus = [menuNotesEleve, menucoterEleve, menuSaisieNotesProf, menuAdminSupervision, menuCommunique, menuProfAppel, menuProfil];
    menus.forEach((el) => { if (el) el.style.display = "none"; });

    if (!uid) return;

    // Le profil reste accessible à tous les connectés
    if (menuProfil) menuProfil.style.display = "block";

    const roleNormalise = normaliserRole(role);

    // --- LOGIQUE ADMIN ---
    if (estRoleAdmin(roleNormalise)) {
        // L'Admin a maintenant tous les droits de gestion
        if (menuAdminSupervision) {
            menuAdminSupervision.style.display = "block";
            menuAdminSupervision.innerText = "⚙️ Administration";
            menuAdminSupervision.onclick = () => window.location.href = "Gestion-Ecole.html";
        }
        if (menuCommunique) {
            menuCommunique.style.display = "block";
            menuCommunique.innerText = "📢 Publier Communiqué"; // Optionnel : renommer pour l'admin
        }
        if (menuProfAppel) {
            menuProfAppel.style.display = "block";
            menuProfAppel.innerText = "📝 Faire l'Appel (Admin)";
        }
    } 
    
    // --- LOGIQUE ENSEIGNANT ---
    else if (estRoleEnseignant(roleNormalise)) {
        // L'enseignant ne garde QUE la saisie des notes
        if (menuSaisieNotesProf) menuSaisieNotesProf.style.display = "block";
        
        // Les lignes suivantes sont commentées ou supprimées pour retirer les droits
        // menuCommunique.style.display = "none";
        // menuProfAppel.style.display = "none";
    } 
    
    // --- LOGIQUE ÉLÈVE ---
    else if (estRoleEleve(roleNormalise)) {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists() && snap.data().statutPaiement === true) {
            if (menuNotesEleve) menuNotesEleve.style.display = "block";
            if (menucoterEleve) menucoterEleve.style.display = "block";
        }
    }
}

// --- AUTHENTIFICATION ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const cached = lireRoleEnCache(user.uid);
        if (cached) gererAffichageMenu(cached, user.uid);

        try {
            const snapUsers = await getDoc(doc(db, "users", user.uid));
            const snapUtils = await getDoc(doc(db, "utilisateurs", user.uid));
            
            const u = snapUsers.exists() ? snapUsers.data() : {};
            const v = snapUtils.exists() ? snapUtils.data() : {};
            
            const role = deduireRoleDepuisProfils(u, v);
            ecrireRoleEnCache(user.uid, role);
            gererAffichageMenu(role, user.uid);
        } catch (error) {
            console.error("Erreur rôle:", error);
        }
    } else {
        // Si l'utilisateur n'est pas connecté et n'est pas sur une page d'accès, redirection vers login
        if (!window.location.pathname.includes("login.html") && !window.location.pathname.includes("register.html")) {
            window.location.href = "login.html";
        }
    }
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

// --- EXPORTATIONS ---
// Fonctions utilitaires attachées à l'objet 'window' pour être appelables depuis le HTML (onclick)
export const toggleMenu = () => {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    if (sidebar && overlay) {
        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");
    }
};

export const logout = () => {
    sessionStorage.removeItem(MENU_ROLE_KEY);
    signOut(auth).then(() => window.location.replace("login.html"));
};

window.logout = logout;
window.toggleMenu = toggleMenu;