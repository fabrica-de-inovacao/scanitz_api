import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { setupSwagger } from "./documentation/swagger";
import RouterUsers from "./Routers/users_routes/users_routes";
import RouterComplaints from "./Routers/complaints_routes/complaints_routes";

const app = express();
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
  })
);

app.get("/", (req, res) => {
  return res.json(
    "🔴 ScanITZ API (DEV) - Version 1.0.0 | Acesse /api-docs para consultar a documentação do serviço"
  );
});

setupSwagger(app);

app.use("/users", RouterUsers);
app.use("/complaints", RouterComplaints);

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(`🔥 Serviço execultando em:  http://localhost:${PORT}`)
);
