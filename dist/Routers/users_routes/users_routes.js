"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_users_1 = __importDefault(require("./search_users"));
const RouterUsers = (0, express_1.Router)();
RouterUsers.use("/", search_users_1.default);
exports.default = RouterUsers;
