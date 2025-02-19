"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_complaints_1 = __importDefault(require("./search_complaints"));
const RouterComplaints = (0, express_1.Router)();
RouterComplaints.use("/", search_complaints_1.default);
exports.default = RouterComplaints;
