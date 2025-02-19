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
const router = (0, express_1.Router)();
//lista todos os usuarios
router.get("/", async (req, res) => {
    try {
        const usersSnapshot = await firebase_1.default.getDocs(firebase_1.default.collection(firebase_1.db, "users"));
        if (!usersSnapshot) {
            res
                .status(201)
                .json({ success: false, statuscode: 201, message: "Ops... 😿" });
        }
        else {
            const listUsers = usersSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            res.json({
                success: true,
                statuscode: 200,
                data: listUsers,
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Ops...erro interno no servidor 😿",
        });
    }
});
//busca um usuario pelo id
router.get("/:uid", async (req, res) => {
    const { uid } = req.params;
    try {
        const userSnapshot = await firebase_1.default.getDocs(firebase_1.default.collection(firebase_1.db, "users"));
        if (!userSnapshot) {
            res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Ops... 😿",
            });
        }
        else {
            let usuario;
            userSnapshot.docs.map((doc) => doc.id.match(uid)
                ? doc.exists
                    ? (usuario = { id: doc.id, ...doc.data() })
                    : null
                : null);
            if (!usuario) {
                res.status(400).json({
                    success: false,
                    statuscode: 400,
                    message: "Ops... UID inválido ou não encontrado 😿",
                });
            }
            else {
                res.status(200).json({
                    success: true,
                    statuscode: 200,
                    data: usuario,
                });
            }
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Ops...erro interno no servidor 😿",
        });
    }
});
//buscar todas as denuncias de um usuario pelo o uid
router.get("/:uid/complaints", async (req, res) => {
    const { uid } = req.params;
    try {
        const userComplaintsSnapshot = await firebase_1.default.getDocs(firebase_1.default.collection(firebase_1.db, "complaints"));
        if (!userComplaintsSnapshot) {
            res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Ops... 😿",
            });
        }
        else {
            let userComplaints = [];
            userComplaintsSnapshot.forEach((doc) => {
                doc.data()["userId"].match(uid)
                    ? userComplaints.push({
                        id: doc.id,
                        ...doc.data(),
                    })
                    : null;
            });
            if (!userComplaints) {
                res.status(201).json({
                    success: false,
                    statuscode: 400,
                    message: "Ops... UID inválido ou não encontrado 😿",
                });
            }
            else {
                res.status(200).json({
                    success: true,
                    statuscode: 200,
                    data: userComplaints,
                });
            }
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
exports.default = router;
