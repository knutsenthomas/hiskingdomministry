// ===================================
// Firebase Service Wrapper
// ===================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

class FirebaseService {
    constructor() {
        this.app = null;
        this.db = null;
        this.auth = null;
        this.isInitialized = false;

        // Try load from localStorage first
        const savedConfig = localStorage.getItem('hkm_firebase_config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                this.init(config);
                return;
            } catch (e) {
                console.error("Local config error:", e);
            }
        }

        // Only initialize if static config is provided
        if (firebaseConfig && firebaseConfig.apiKey !== "YOUR_API_KEY") {
            this.init(firebaseConfig);
        }
    }

    init(config) {
        try {
            this.app = initializeApp(config);
            this.db = getFirestore(this.app);
            this.auth = getAuth(this.app);
            this.storage = getStorage(this.app);
            this.isInitialized = true;
            console.log("🔥 Firebase initialized successfully.");
        } catch (error) {
            console.error("❌ Firebase initialization failed:", error);
        }
    }

    /**
     * Get content for a specific page section
     * @param {string} pageId - e.g., 'index'
     */
    async getPageContent(pageId) {
        if (!this.isInitialized) {
            console.warn(`⚠️ Firebase not initialized. getPageContent('${pageId}') returns null.`);
            return null;
        }

        try {
            const docRef = doc(this.db, "content", pageId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                console.warn(`⚠️ No content found for page: ${pageId}`);
                return null;
            }
        } catch (error) {
            console.error(`❌ Failed to load content for page '${pageId}':`, error);
            return null;
        }
    }

    /**
     * Save/Update page content
     * @param {string} pageId 
     * @param {object} data 
     */
    async updatePageContent(pageId, data) {
        if (!this.isInitialized) throw new Error("Firebase not initialized");
        const docRef = doc(this.db, "content", pageId);
        await setDoc(docRef, data, { merge: true });
    }

    /**
     * Backwards-compatible alias for saving page content.
     * Some callers use `savePageContent` — keep that working.
     */
    async savePageContent(pageId, data) {
        return this.updatePageContent(pageId, data);
    }

    /**
     * Subscribe to real-time content updates
     * @param {string} pageId 
     * @param {function} callback 
     */
    subscribeToPage(pageId, callback) {
        if (!this.isInitialized) {
            console.warn(`⚠️ Firebase not initialized. subscribeToPage('${pageId}') is a no-op.`);
            return null;
        }

        try {
            const docRef = doc(this.db, "content", pageId);
            return onSnapshot(docRef, (doc) => {
                if (doc.exists()) {
                    callback(doc.data());
                }
            });
        } catch (error) {
            console.error(`❌ Failed to subscribe to page '${pageId}':`, error);
            return null;
        }
    }

    /**
     * Auth Methods
     */
    async login(email, password) {
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    async loginWithGoogle() {
        if (!this.isInitialized) throw new Error("Firebase not initialized");
        const provider = new GoogleAuthProvider();
        return signInWithPopup(this.auth, provider);
    }

    async logout() {
        return signOut(this.auth);
    }

    /**
     * Storage Methods
     */
    async uploadImage(file, path) {
        if (!this.isInitialized) throw new Error("Firebase not initialized");
        const storageRef = ref(this.storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        return getDownloadURL(snapshot.ref);
    }

    onAuthChange(callback) {
        if (!this.isInitialized) return;
        onAuthStateChanged(this.auth, callback);
    }
}

export const firebaseService = new FirebaseService();
