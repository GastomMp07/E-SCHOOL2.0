// Importation des modules Firebase nécessaires depuis le CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// Importe les fonctions d'initialisation de l'app Firebase depuis le CDN officiel de Google
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// Importe le service d'authentification et la fonction de connexion par email/mot de passe
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// Importe le service de base de données Firestore

// Configuration de votre projet Firebase (identifiants uniques)
const firebaseConfig = {
    apiKey: "AIzaSyD-zylLBSzTL0xyUZP75G8QEjblauNw4Nk",
    // Clé API publique qui identifie le projet Firebase côté client
    authDomain: "e-school-8a0c8.firebaseapp.com",
    // Domaine utilisé pour l'authentification Firebase
    projectId: "e-school-8a0c8",
    // Identifiant unique du projet Firebase
    storageBucket: "e-school-8a0c8.firebasestorage.app",
    // Adresse du stockage en ligne (fichiers, images, etc.)
    messagingSenderId: "313905413411",
    // Identifiant de l'expéditeur pour les notifications push (FCM)
    appId: "1:313905413411:web:bec2f4e79394bc5fce6096"
    // Identifiant unique de cette application web dans le projet Firebase
};

// Initialisation de l'application et des services
const app = initializeApp(firebaseConfig);
// Initialise l'application Firebase avec la configuration définie ci-dessus
export const auth = getAuth(app); // Service d'authentification
// Crée et exporte l'instance du service d'authentification Firebase (connexion, inscription, etc.)
export const db = getFirestore(app); // Service de base de données NoSQL
// Crée et exporte l'instance de la base de données Firestore (lecture et écriture de données)

// L'inscription est gérée uniquement dans register.html (évite double soumission avec app.js).

// --- CONNEXION ---
// Récupération de l'élément formulaire par son ID
const loginForm = document.getElementById('login-form');
// Sélectionne l'élément HTML du formulaire de connexion via son identifiant unique
if(loginForm) {
    // Vérifie que l'élément existe dans la page avant d'y attacher un événement
    // Ecoute l'événement de soumission
    loginForm.addEventListener('submit', async (e) => {
        // Ajoute un écouteur sur la soumission du formulaire ; 'async' permet d'utiliser 'await' à l'intérieur
        e.preventDefault(); // Empêche le rechargement de la page
        // Annule le comportement par défaut du formulaire (qui serait de recharger la page)
        
        // Extraction des valeurs saisies par l'utilisateur
        const email = document.getElementById('login-email').value;
        // Récupère la valeur du champ email saisi par l'utilisateur
        const pass = document.getElementById('login-password').value;
        // Récupère la valeur du champ mot de passe saisi par l'utilisateur
        
        try {
            // Bloc try : tente d'exécuter le code suivant et capture les erreurs éventuelles
            // Tentative de connexion via Firebase Auth
            await signInWithEmailAndPassword(auth, email, pass);
            // Appelle Firebase pour connecter l'utilisateur avec son email et mot de passe
            window.location.href = "accueil.html"; // Redirection en cas de succès
            // Si la connexion réussit, redirige l'utilisateur vers la page d'accueil
        } catch (error) {
            // Si Firebase renvoie une erreur (mauvais mot de passe, email inconnu, etc.)
            alert("Erreur de connexion : " + error.message);
            // Affiche un message d'alerte à l'utilisateur avec le détail de l'erreur
        }
    });
}