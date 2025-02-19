"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = __importStar(require("../../database/firebase"));
const auth_1 = require("firebase/auth");
const router = (0, express_1.Router)();
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCredential = await (0, auth_1.signInWithEmailAndPassword)(firebase_1.auth, email, password);
        if (!userCredential) {
            res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Ops... credenciais inválidas ou não encontradas 😿",
            });
        }
        else {
            const docRef = await firebase_1.default.collection(firebase_1.db, "users");
            const userCollectionSnapshot = await firebase_1.default.getDocs(docRef);
            let userCollectionData = [];
            userCollectionSnapshot.docs.map((doc) => {
                doc.id === userCredential.user.uid
                    ? userCollectionData.push(doc.data())
                    : null;
            });
            const userData = {
                uid: userCredential.user.uid,
                displayName: userCredential.user.displayName,
                fullName: userCollectionData[0].fullName,
                email: userCredential.user.email,
                phoneNumber: userCredential.user.phoneNumber,
                documentNumber: userCollectionData[0].documentNumber
                    .replaceAll(".", "")
                    .replaceAll("-", ""),
                photoURL: userCredential.user.photoURL,
                token: userCredential.user["stsTokenManager"]["accessToken"],
            };
            res.status(200).json({ success: true, statuscode: 200, data: userData });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Ops...erro interno no servidor 😿 || erro: " + error,
        });
    }
});
router.post("/register", async (req, res) => {
    const { email, password, fullName, documentNumber, phoneNumber } = req.body;
    try {
        const userCredential = await (0, auth_1.createUserWithEmailAndPassword)(firebase_1.auth, email, password);
        const userData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            fullName: fullName,
            phoneNumber: phoneNumber,
            documentNumber: documentNumber,
        };
        await firebase_1.default.setDoc(firebase_1.default.doc(firebase_1.db, "users", userCredential.user.uid), userData);
        res.status(201).json({
            success: true,
            statuscode: 201,
            data: userCredential,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Ops...erro interno no servidor 😿 || erro: " + error,
        });
    }
});
exports.default = router;
