"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUserRole = exports.createUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
function normalizeRole(value) {
    const raw = String(value ?? '');
    if (raw === 'CEO' || raw === 'CTO' || raw === 'CMO')
        return raw;
    throw new https_1.HttpsError('invalid-argument', 'Role tidak valid');
}
async function assertCallerIsCEO(callerUid) {
    const db = (0, firestore_1.getFirestore)();
    const snap = await db.collection('users').doc(callerUid).get();
    const role = String(snap.data()?.role ?? '');
    if (role !== 'CEO') {
        throw new https_1.HttpsError('permission-denied', 'Hanya CEO yang boleh melakukan aksi ini');
    }
}
exports.createUser = (0, https_1.onCall)(async (req) => {
    const callerUid = req.auth?.uid;
    if (!callerUid)
        throw new https_1.HttpsError('unauthenticated', 'Harus login');
    // Prioritaskan custom claim jika sudah ada, fallback ke users/{uid}.role
    const claimRole = req.auth?.token?.role;
    if (claimRole === 'CEO') {
        // ok
    }
    else {
        await assertCallerIsCEO(callerUid);
    }
    const email = String(req.data?.email ?? '').trim().toLowerCase();
    const password = String(req.data?.password ?? '');
    const name = String(req.data?.name ?? '').trim();
    const position = String(req.data?.position ?? '').trim();
    const role = normalizeRole(req.data?.role);
    if (!email || !email.includes('@'))
        throw new https_1.HttpsError('invalid-argument', 'Email tidak valid');
    if (!password || password.length < 6)
        throw new https_1.HttpsError('invalid-argument', 'Password minimal 6 karakter');
    if (!name)
        throw new https_1.HttpsError('invalid-argument', 'Nama wajib diisi');
    const adminAuth = (0, auth_1.getAuth)();
    const db = (0, firestore_1.getFirestore)();
    try {
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
        });
        await adminAuth.setCustomUserClaims(userRecord.uid, { role });
        await db
            .collection('users')
            .doc(userRecord.uid)
            .set({
            email,
            name,
            role,
            position,
            avatarDataUrl: '',
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { uid: userRecord.uid };
    }
    catch (err) {
        const code = String(err?.code ?? '');
        if (code === 'auth/email-already-exists') {
            throw new https_1.HttpsError('already-exists', 'Email sudah terdaftar');
        }
        throw new https_1.HttpsError('internal', 'Gagal membuat user');
    }
});
exports.setUserRole = (0, https_1.onCall)(async (req) => {
    const callerUid = req.auth?.uid;
    if (!callerUid)
        throw new https_1.HttpsError('unauthenticated', 'Harus login');
    // Prioritaskan custom claim jika sudah ada, fallback ke users/{uid}.role
    const claimRole = req.auth?.token?.role;
    if (claimRole === 'CEO') {
        // ok
    }
    else {
        await assertCallerIsCEO(callerUid);
    }
    const targetUid = String(req.data?.uid ?? '').trim();
    const nextRole = normalizeRole(req.data?.role);
    if (!targetUid)
        throw new https_1.HttpsError('invalid-argument', 'uid wajib diisi');
    const adminAuth = (0, auth_1.getAuth)();
    const db = (0, firestore_1.getFirestore)();
    // Merge existing custom claims
    const userRecord = await adminAuth.getUser(targetUid);
    const existing = (userRecord.customClaims ?? {});
    await adminAuth.setCustomUserClaims(targetUid, { ...existing, role: nextRole });
    await db
        .collection('users')
        .doc(targetUid)
        .set({
        role: nextRole,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { uid: targetUid, role: nextRole };
});
