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
//lista todas as denuncias
router.get("/", async (req, res) => {
    try {
        const complaintsSnapshot = await firebase_1.default.getDocs(firebase_1.default.collection(firebase_1.db, "complaints"));
        //verifica se a lista esta vazia
        if (complaintsSnapshot.empty) {
            res.status(404).json({
                success: false,
                statuscode: 404,
                message: "Ops... 😿",
            });
        }
        else {
            const listComplaints = complaintsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            res.status(200).json({
                success: true,
                statuscode: 200,
                data: listComplaints,
            });
        }
    }
    catch (error) {
        // Em caso de erro no servidor
        res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Ops...😿",
        });
    }
});
//listar todas as posições das denuncias
router.get("/positions", async (req, res) => {
    try {
        const complaintsPositionsSnapshot = await firebase_1.default.getDocs(firebase_1.default.collection(firebase_1.db, "complaints"));
        //verifica se a lista esta vazia
        if (complaintsPositionsSnapshot.empty) {
            res.status(404).json({
                success: false,
                statuscode: 404,
                message: "Ops... 😿",
            });
        }
        else {
            const listComplaintsPositions = complaintsPositionsSnapshot.docs.map((doc) => ({
                id: doc.id,
                latitude: doc.data().address.latitude,
                longitude: doc.data().address.longitude,
            }));
            res.status(200).json({
                success: true,
                statuscode: 200,
                data: listComplaintsPositions,
            });
        }
    }
    catch (error) {
        // Em caso de erro no servidor
        res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Ops...😿",
        });
    }
});
//buscar denuncia pelo id
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const complaintIdSnapshot = await firebase_1.default.getDocs(firebase_1.default.collection(firebase_1.db, "complaints"));
        if (!complaintIdSnapshot) {
            res.status(400).json({
                success: false,
                statuscode: 400,
                message: "Ops... 😿",
            });
        }
        else {
            let complaint;
            complaintIdSnapshot.docs.map((doc) => doc.id.match(id)
                ? doc.exists
                    ? (complaint = { id: doc.id, ...doc.data() })
                    : null
                : null);
            if (!complaint) {
                res.status(201).json({
                    success: false,
                    statuscode: 400,
                    message: "Ops... ID inválido ou não encontrado 😿",
                });
            }
            else {
                res.status(200).json({
                    success: true,
                    statuscode: 200,
                    data: complaint,
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
//buscar todas as denuncias de um bairro
router.get("/:district", async (req, res) => {
    const { district } = req.params;
    try {
        const chave = district.replace(/\s+/g, "").toLowerCase();
        const complaintsSnapshot = await firebase_1.default.getDocs(firebase_1.default.collection(firebase_1.db, "complaints"));
        const districtComplaints = [];
        complaintsSnapshot.forEach((doc) => {
            const data = doc.data();
            const address = doc.data().address;
            if (address?.district) {
                const docDistrict = address.district.replace(/\s+/g, "").toLowerCase();
                if (docDistrict === chave) {
                    districtComplaints.push({ id: doc.id, ...data });
                }
            }
        });
        if (districtComplaints.length === 0) {
            res.status(404).json({
                success: false,
                statuscode: 404,
                message: "Nenhuma denúncia encontrada para este bairro 😿",
            });
        }
        else {
            res.status(200).json({
                success: true,
                statuscode: 200,
                data: districtComplaints,
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            statuscode: 500,
            message: "Erro interno no servidor 😿 || erro: " + error.message,
        });
    }
});
exports.default = router;
