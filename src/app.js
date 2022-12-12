import express from "express";
import cors from "cors";
import { connectionDB } from "./database/db";

const server = express();
server.use(cors());
server.use(express.json());

const a = 1;

server.listen(4000, () => console.log("Server running in port: 4000"));