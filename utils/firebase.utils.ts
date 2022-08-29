import * as firebase from 'firebase';

export class FirebaseAuthProvider {
    private readonly _firebase: firebase.default.app.App;

    constructor() {
        // Your web app's Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyAi11wbmiMXxNj45ZUFBDIO7W1f0Z96rq4",
            authDomain: "auranetworkcontractdeployer.firebaseapp.com",
            projectId: "auranetworkcontractdeployer",
            storageBucket: "auranetworkcontractdeployer.appspot.com",
            messagingSenderId: "749686417683",
            appId: "1:749686417683:web:5a0cecb0055c0cda6952e6"
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