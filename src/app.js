import express from "express";
import cors from "cors";
import { connectionDB } from "./database/db.js";
import joi from "joi";

const categorySchema = joi.object({
    name: joi.string().trim().required()
});

const server = express();
server.use(cors());
server.use(express.json());

server.get("/categories", async (req, res) => {
    try {
        const categories = await connectionDB.query('SELECT * FROM categories;');
        res.send(categories.rows);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

server.post("/categories", async (req, res) => {
    const categoryName = req.body.name;
    const validation = categorySchema.validate(req.body, {abortEarly: false});

    if(validation.error){
        const errors = validation.error.details.map((detail) => detail.message);
        res.status(400).send(errors);
        return;
    }

    try{
        const categories = await connectionDB.query('SELECT * FROM categories;');

        for(let i = 0; i < categories.rows.length; i++){
            if(categories.rows[i].name === categoryName){
                res.sendStatus(409);
                return;
            }
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
    try {   
        await connectionDB.query(`INSERT INTO categories (name) VALUES ('${categoryName}');`)

        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

server.listen(4000, () => console.log("Server running in port: 4000"));