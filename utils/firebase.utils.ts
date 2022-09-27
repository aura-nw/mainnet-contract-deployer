import { Config } from '../common';
import * as firebase from 'firebase';

export class FirebaseAuthProvider {
    private readonly _firebase: firebase.default.app.App;

    constructor() {
        // Your web app's Firebase configuration
        const firebaseConfig = {
            apiKey: Config.FIREBASE_API_KEY,
            authDomain: Config.FIREBASE_AUTH_DOMAIN,
            projectId: Config.FIREBASE_PROJECT_ID,
            storageBucket: Config.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID,
            appId: Config.FIREBASE_APP_ID,
        };

        if (!firebase.default.apps.length) {
            this._firebase = firebase.default.initializeApp(firebaseConfig, 'Firebase');
        } else {
            this._firebase = firebase.default.app('Firebase');
        }
    }

    async signin(email: string, password: string) {
        await this._firebase.auth().signInWithEmailAndPassword(email, password);
        let user = await this._firebase.auth().currentUser;
        let token = await user!.getIdToken();
        let resultJwt = {
            jwt: token,
        };
        return resultJwt;
    }

}