import { Router } from "express";
import authFunctions from "./auth_functions";


const RouterAuth = Router();

RouterAuth.use("/", authFunctions )

export default RouterAuth;