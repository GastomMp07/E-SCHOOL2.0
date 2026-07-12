// Importation des modules Firebase nécessaires depuis le CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuration de votre projet Firebase (identifiants uniques)
const firebaseConfig = {
    apiKey: "AIzaSyD-zylLBSzTL0xyUZP75G8QEjblauNw4Nk",
    authDomain: "e-school-8a0c8.firebaseapp.com",
    projectId: "e-school-8a0c8",
    storageBucket: "e-school-8a0c8.firebasestorage.app",
    messagingSenderId: "313905413411",
    appId: "1:313905413411:web:bec2f4e79394bc5fce6096"
};

// Initialisation de l'application et des services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Service d'authentification
export const db = getFirestore(app); // Service de base de données NoSQL

// L'inscription est gérée uniquement dans register.html (évite double soumission avec app.js).

// --- CONNEXION ---
// Récupération de l'élément formulaire par son ID
const loginForm = document.getElementById('login-form');
if(loginForm) {
    // Ecoute l'événement de soumission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page
        
        // Extraction des valeurs saisies par l'utilisateur
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        
        try {
            // Tentative de connexion via Firebase Auth
            await signInWithEmailAndPassword(auth, email, pass);
            window.location.href = "accueil.html"; // Redirection en cas de succès
        } catch (error) {
            alert("Erreur de connexion : " + error.message);
        }
    });
}