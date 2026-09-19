import admin from "firebase-admin";

/*
    The service account key is read from an env var instead of a committed JSON
    file, so nothing secret ever lands in the repo. Two formats are accepted:
      - FIREBASE_SERVICE_ACCOUNT        raw JSON
      - FIREBASE_SERVICE_ACCOUNT_BASE64 the same JSON, base64 encoded (easier to
                                        paste into a hosting dashboard)
*/
const readServiceAccount = () => {
    const { FIREBASE_SERVICE_ACCOUNT, FIREBASE_SERVICE_ACCOUNT_BASE64 } = process.env;

    const raw = FIREBASE_SERVICE_ACCOUNT_BASE64
        ? Buffer.from(FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
        : FIREBASE_SERVICE_ACCOUNT;

    if (!raw) {
        return null;
    }

    const parsed = JSON.parse(raw);

    // Dashboards often escape the newlines inside the private key.
    if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }

    return parsed;
};

let googleAuthEnabled = false;

export const initFirebase = () => {
    try {
        const serviceAccount = readServiceAccount();

        if (!serviceAccount) {
            console.warn("⚠️  Firebase service account not set — Google sign-in is disabled");
            return;
        }

        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        googleAuthEnabled = true;

        console.log("✅ Firebase admin initialised");
    } catch (err) {
        console.warn("⚠️  Firebase admin failed to initialise — Google sign-in is disabled:", err.message);
    }
};

export const isGoogleAuthEnabled = () => googleAuthEnabled;
