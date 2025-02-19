import { Router } from "express";
import searchUsers from "./search_users";


const RouterUsers = Router();

RouterUsers.use("/", searchUsers )

export default RouterUsers;