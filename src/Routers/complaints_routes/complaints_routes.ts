import { Router } from "express";
import searchComplaints from "./search_complaints";


const RouterComplaints = Router();

RouterComplaints.use("/", searchComplaints )

export default RouterComplaints;