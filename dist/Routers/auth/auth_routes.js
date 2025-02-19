"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_functions_1 = __importDefault(require("./auth_functions"));
const RouterAuth = (0, express_1.Router)();
RouterAuth.use("/", auth_functions_1.default);
exports.default = RouterAuth;
