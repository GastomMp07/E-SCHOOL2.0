// Importations des fonctions Firebase et des instances configurées dans auth.js
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// Importe la fonction d'écoute des changements d'état de connexion et la fonction de déconnexion
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// Importe les fonctions pour référencer un document, le lire et l'écrire dans Firestore
import { auth, db } from "./auth.js";
// Importe les instances déjà initialisées de l'authentification et de la base de données

// Clé utilisée pour stocker le rôle en session afin d'accélérer le chargement (éviter les appels réseau inutiles)
const MENU_ROLE_KEY = "eschool_menu_role";
// Déclare une constante qui servira de clé pour stocker/lire le rôle dans sessionStorage

// --- FONCTIONS DE CACHE ---
function lireRoleEnCache(uid) {
    // Déclare une fonction qui tente de lire le rôle de l'utilisateur depuis le cache de session
    try {
        // Bloc try : tente d'accéder au sessionStorage sans planter l'application
        const raw = sessionStorage.getItem(MENU_ROLE_KEY);
        // Récupère la chaîne JSON stockée dans sessionStorage avec la clé définie
        if (!raw) return null;
        // Si rien n'est stocké, retourne null (pas de cache disponible)
        const o = JSON.parse(raw);
        // Convertit la chaîne JSON en objet JavaScript
        return o && o.uid === uid && o.role ? String(o.role) : null;
        // Retourne le rôle uniquement si le cache appartient bien à cet utilisateur (uid correspond)
    } catch { return null; }
    // En cas d'erreur (sessionStorage indisponible, JSON invalide), retourne null
}

function ecrireRoleEnCache(uid, role) {
    // Déclare une fonction qui sauvegarde le rôle de l'utilisateur dans le cache de session
    try {
        // Bloc try : tente d'écrire dans sessionStorage sans planter l'application
        sessionStorage.setItem(MENU_ROLE_KEY, JSON.stringify({ uid, role }));
        // Sérialise l'objet {uid, role} en JSON et le stocke dans sessionStorage
    } catch { /* ignore */ }
    // En cas d'erreur (ex: navigation privée restrictive), on ignore silencieusement
}

// --- LOGIQUE DE DÉTECTION DES RÔLES ---
// Nettoie les chaînes de caractères (accents, espaces, majuscules) pour des comparaisons fiables
function normaliserRole(roleBrut) {
    // Déclare une fonction qui normalise une chaîne de rôle pour faciliter les comparaisons
    if (!roleBrut) return "";
    // Si la valeur est vide ou nulle, retourne une chaîne vide pour éviter les erreurs
    return String(roleBrut).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Convertit en chaîne, supprime les espaces, met en minuscules, et retire les accents
}

// Fonctions de vérification booléennes pour les rôles
function estRoleEleve(role) {
    // Déclare une fonction qui vérifie si un rôle normalisé correspond à un élève
    return role === "eleve" || role.includes("student");
    // Retourne vrai si le rôle est exactement "eleve" ou contient le mot "student"
}

function estRoleEnseignant(role) {
    // Déclare une fonction qui vérifie si un rôle normalisé correspond à un enseignant
    return role === "enseignant" || role.includes("prof") || role.includes("teacher");
    // Retourne vrai si le rôle est "enseignant", contient "prof" ou "teacher"
}

// AJOUT : Détection du rôle Admin
function estRoleAdmin(role) {
    // Déclare une fonction qui vérifie si un rôle normalisé correspond à un administrateur
    return role === "admin" || role.includes("direction") || role.includes("administrateur");
    // Retourne vrai si le rôle est "admin", contient "direction" ou "administrateur"
}

// Compare les données de deux collections (historique de migration) pour déterminer le rôle final
function deduireRoleDepuisProfils(u, v) {
    // Déclare une fonction qui déduit le rôle final en comparant deux objets de profil utilisateur
    const rU = normaliserRole(u.role);
    // Normalise le rôle issu du premier profil (collection "users")
    const rV = normaliserRole(v.role);
    // Normalise le rôle issu du second profil (collection "utilisateurs")
    
    // Applique une hiérarchie de sécurité
    if (estRoleAdmin(rU) || estRoleAdmin(rV)) return "admin";
    // Si l'un des deux profils est admin, retourne "admin" (priorité maximale)
    if (estRoleEnseignant(rU) || estRoleEnseignant(rV)) return "enseignant";
    // Si l'un des deux profils est enseignant, retourne "enseignant"
    if (estRoleEleve(rU) || estRoleEleve(rV)) return "eleve";
    // Si l'un des deux profils est élève, retourne "eleve"
    
    return (u.classe || v.classe) ? "eleve" : (rU || rV || "eleve");
    // Fallback : si une classe est définie, c'est un élève ; sinon prend le premier rôle trouvé ou "eleve"
}

// --- GESTION DE L'AFFICHAGE DU MENU ---
async function gererAffichageMenu(role, uid) {
    // Déclare une fonction asynchrone qui affiche ou cache les liens du menu selon le rôle
    // Récupération de tous les éléments du menu sidebar par leur ID
    const menuNotesEleve = document.getElementById("menu-eleve-notes");
    // Récupère l'élément HTML du lien "Mes Cotes" réservé aux élèves
    const menucoterEleve = document.getElementById("menu-eleve-coter");
    // Récupère l'élément HTML du lien "Coter les Enseignants" réservé aux élèves
    const menuSaisieNotesProf = document.getElementById("menu-prof-saisie-notes");
    // Récupère l'élément HTML du lien "Saisir les notes" réservé aux enseignants
    const menuAdminSupervision = document.getElementById("menu-Enseignant"); 
    // Récupère l'élément HTML du lien de supervision réservé à la direction/admin
    const menuCommunique = document.getElementById("menu-prof-communiquer");
    // Récupère l'élément HTML du lien "Rédaction du communiqué"
    const menuProfAppel = document.getElementById("menu-prof-appel");
    // Récupère l'élément HTML du lien "Faire l'Appel"
    const menuProfil = document.getElementById("menu-profil");
    // Récupère l'élément HTML du lien "Mon Profil"

    // 1. On cache tout par défaut
    const menus = [menuNotesEleve, menucoterEleve, menuSaisieNotesProf, menuAdminSupervision, menuCommunique, menuProfAppel, menuProfil];
    // Regroupe tous les éléments de menu dans un tableau pour les traiter ensemble
    menus.forEach((el) => { if (el) el.style.display = "none"; });
    // Parcourt chaque élément et le cache (display: none) s'il existe dans le DOM

    // --- GESTION DES CARTES DU FEATURES-GRID ---
    // Récupère chaque carte du features-grid par son identifiant unique
    const cardNotes = document.getElementById("card-notes");
    // Carte "Notes & Résultats" → correspond à l'option "Mes Cotes" du menu élève
    const cardSaisieNotes = document.getElementById("card-saisie-notes");
    // Carte "Saisir les notes" → correspond à l'option de saisie réservée aux enseignants
    const cardPresences = document.getElementById("card-presences");
    // Carte "Présences" → correspond à l'option "Faire l'Appel" du menu enseignant/admin
    const cardProfil = document.getElementById("card-profil");
    // Carte "Mon Profil" → correspond à l'option "Mon Profil" visible pour tous les connectés
    const cardRedacCom = document.getElementById("card-redac-com");
    // Carte "Publier un Communiqué" → correspond à l'option de rédaction du menu enseignant/admin
    const cardAdmin = document.getElementById("card-admin");
    // Carte "Administration" → correspond à l'option de supervision réservée à l'admin

    // Cache toutes les cartes sensibles par défaut avant d'appliquer les droits du rôle
    const cards = [cardNotes, cardSaisieNotes, cardPresences, cardProfil, cardRedacCom, cardAdmin];
    // Regroupe toutes les cartes contrôlées dans un tableau pour un traitement uniforme
    cards.forEach((card) => { if (card) card.style.display = "none"; });
    // Masque chaque carte si elle existe dans le DOM, en attendant la vérification du rôle

    if (!uid) return;
    // Si aucun utilisateur n'est connecté (uid nul), on sort de la fonction sans rien afficher

    // Le profil reste accessible à tous les connectés (menu + carte)
    if (menuProfil) menuProfil.style.display = "block";
    // Rend visible le lien "Mon Profil" pour tout utilisateur authentifié
    if (cardProfil) cardProfil.style.display = "";
    // Rend visible la carte "Mon Profil" pour tout utilisateur authentifié

    const roleNormalise = normaliserRole(role);
    // Normalise le rôle reçu pour éviter les problèmes de casse ou d'accents

    // --- LOGIQUE ADMIN ---
    if (estRoleAdmin(roleNormalise)) {
        // Si l'utilisateur est un administrateur, on affiche les outils d'administration
        // L'Admin a maintenant tous les droits de gestion
        if (menuAdminSupervision) {
            // Vérifie que l'élément existe avant de le modifier
            menuAdminSupervision.style.display = "block";
            // Rend visible le lien d'administration dans le menu
            menuAdminSupervision.innerText = "⚙️ Administration";
            // Change le texte du lien pour l'adapter au rôle admin
            menuAdminSupervision.onclick = () => window.location.href = "Gestion-Ecole.html";
            // Assigne un gestionnaire de clic pour naviguer vers la page de gestion
        }
        if (menuCommunique) {
            // Vérifie que l'élément existe avant de le modifier
            menuCommunique.style.display = "block";
            // Rend visible le lien "Publier Communiqué" pour l'admin
            menuCommunique.innerText = "📢 Publier Communiqué"; // Optionnel : renommer pour l'admin
            // Personnalise le texte du lien pour l'administrateur
        }
        if (menuProfAppel) {
            // Vérifie que l'élément existe avant de le modifier
            menuProfAppel.style.display = "block";
            // Rend visible le lien "Faire l'Appel" pour l'admin
            menuProfAppel.innerText = "📝 Faire l'Appel (Admin)";
            // Personnalise le texte pour indiquer que c'est l'admin qui fait l'appel
        }

        // --- CARTES ADMIN : affiche les cartes qui correspondent aux options du menu admin ---
        if (cardAdmin) cardAdmin.style.display = "";
        // Affiche la carte "Administration" en miroir du lien menuAdminSupervision
        if (cardRedacCom) cardRedacCom.style.display = "";
        // Affiche la carte "Publier un Communiqué" en miroir du lien menuCommunique
        if (cardPresences) cardPresences.style.display = "";
        // Affiche la carte "Présences / Appel" en miroir du lien menuProfAppel
    } 
    
    // --- LOGIQUE ENSEIGNANT ---
    else if (estRoleEnseignant(roleNormalise)) {
        // Si l'utilisateur est un enseignant, on affiche uniquement les outils enseignant
        // L'enseignant ne garde QUE la saisie des notes
        if (menuSaisieNotesProf) menuSaisieNotesProf.style.display = "block";
        // Rend visible le lien "Saisir les notes" pour l'enseignant
        
        // Les lignes suivantes sont commentées ou supprimées pour retirer les droits
        // menuCommunique.style.display = "none";
        // menuProfAppel.style.display = "none";

        // --- CARTES ENSEIGNANT : affiche les cartes qui correspondent aux options du menu enseignant ---
        if (cardSaisieNotes) cardSaisieNotes.style.display = "";
        // Affiche la carte "Saisir les notes" en miroir du lien menuSaisieNotesProf
    } 
    
    // --- LOGIQUE ÉLÈVE ---
    else if (estRoleEleve(roleNormalise)) {
        // Si l'utilisateur est un élève, on vérifie son statut de paiement avant d'afficher les notes
        const snap = await getDoc(doc(db, "users", uid));
        // Récupère le document Firestore de l'élève dans la collection "users"
        if (snap.exists() && snap.data().statutPaiement === true) {
            // Vérifie que le document existe ET que le champ statutPaiement vaut true
            if (menuNotesEleve) menuNotesEleve.style.display = "block";
            // Si l'élève a payé, affiche le lien vers ses notes
            if (menucoterEleve) menucoterEleve.style.display = "block";
            // Si l'élève a payé, affiche le lien pour évaluer les enseignants

            // --- CARTES ÉLÈVE : affiche la carte notes uniquement si l'élève a payé ---
            if (cardNotes) cardNotes.style.display = "";
            // Affiche la carte "Notes & Résultats" en miroir du lien menuNotesEleve (paiement vérifié)
        }
    }
}

// --- AUTHENTIFICATION ---
onAuthStateChanged(auth, async (user) => {
    // Écoute en permanence les changements d'état de connexion (connecté / déconnecté)
    if (user) {
        // Si un utilisateur est connecté, on récupère et applique son rôle
        const cached = lireRoleEnCache(user.uid);
        // Tente de lire le rôle depuis le cache de session pour un affichage immédiat
        if (cached) gererAffichageMenu(cached, user.uid);
        // Si un rôle est en cache, l'applique immédiatement sans attendre Firestore

        try {
            // Bloc try : tente de récupérer les données fraîches depuis Firestore
            const snapUsers = await getDoc(doc(db, "users", user.uid));
            // Lit le document de l'utilisateur dans la collection principale "users"
            const snapUtils = await getDoc(doc(db, "utilisateurs", user.uid));
            // Lit le document de l'utilisateur dans l'ancienne collection "utilisateurs" (migration)
            
            const u = snapUsers.exists() ? snapUsers.data() : {};
            // Si le document "users" existe, récupère ses données ; sinon utilise un objet vide
            const v = snapUtils.exists() ? snapUtils.data() : {};
            // Si le document "utilisateurs" existe, récupère ses données ; sinon utilise un objet vide
            
            const role = deduireRoleDepuisProfils(u, v);
            // Détermine le rôle final en analysant les deux profils récupérés
            ecrireRoleEnCache(user.uid, role);
            // Sauvegarde le rôle frais dans le cache pour les prochains chargements de page
            gererAffichageMenu(role, user.uid);
            // Met à jour l'affichage du menu avec le rôle obtenu depuis Firestore
        } catch (error) {
            // Si une erreur réseau ou Firestore survient, on l'enregistre dans la console
            console.error("Erreur rôle:", error);
            // Affiche l'erreur dans la console du navigateur pour faciliter le débogage
        }
    } else {
        // Si l'utilisateur n'est pas connecté et n'est pas sur une page d'accès, redirection vers login
        if (!window.location.pathname.includes("login.html") && !window.location.pathname.includes("register.html")) {
            // Vérifie que l'utilisateur n'est pas déjà sur la page de connexion ou d'inscription
            window.location.href = "login.html";
            // Redirige vers la page de connexion si l'utilisateur n'est pas authentifié
        }
    }
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
        // Vérifie la combinaison Ctrl+Shift+I (ouvre les DevTools dans Chrome/Firefox)
        (e.ctrlKey && e.shiftKey && e.key === 'J') || 
        // Vérifie la combinaison Ctrl+Shift+J (ouvre la console JavaScript)
        (e.ctrlKey && e.key === 'u') ||
        // Vérifie Ctrl+U (affiche le code source de la page)
        (e.ctrlKey && e.key === 's')
        // Vérifie Ctrl+S (sauvegarde de la page)
    ) {
        e.preventDefault();
        // Annule l'action par défaut du raccourci clavier détecté
        alert("L'inspection du code est désactivée pour des raisons de sécurité.");
        // Affiche un message à l'utilisateur expliquant pourquoi l'action est bloquée
        return false;
        // Retourne false pour s'assurer que l'événement est complètement stoppé
    }
});

// --- EXPORTATIONS ---
// Fonctions utilitaires attachées à l'objet 'window' pour être appelables depuis le HTML (onclick)
export const toggleMenu = () => {
    // Exporte une fonction fléchée qui bascule l'état du menu latéral (ouvert/fermé)
    const sidebar = document.getElementById("sidebar");
    // Récupère l'élément HTML du panneau de navigation latéral
    const overlay = document.getElementById("overlay");
    // Récupère l'élément HTML du fond semi-transparent affiché quand le menu est ouvert
    if (sidebar && overlay) {
        // Vérifie que les deux éléments existent dans le DOM
        sidebar.classList.toggle("active");
        // Ajoute ou supprime la classe CSS "active" qui fait glisser le menu
        overlay.classList.toggle("active");
        // Ajoute ou supprime la classe CSS "active" qui affiche le fond sombre
    }
};

export const logout = () => {
    // Exporte une fonction fléchée qui déconnecte l'utilisateur
    sessionStorage.removeItem(MENU_ROLE_KEY);
    // Efface le rôle mis en cache dans sessionStorage avant de déconnecter
    signOut(auth).then(() => window.location.replace("login.html"));
    // Appelle Firebase pour déconnecter l'utilisateur, puis redirige vers la page de connexion
};

window.logout = logout;
// Expose la fonction logout sur l'objet window pour qu'elle soit appelable depuis les attributs onclick HTML
window.toggleMenu = toggleMenu;
// Expose la fonction toggleMenu sur l'objet window pour qu'elle soit appelable depuis les attributs onclick HTML
window.ouvrirGestionEcole = () => { window.location.href = "Gestion-Ecole.html"; };