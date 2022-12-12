import express from "express";
import cors from "cors";
import { connectionDB } from "./database/db.js";
import joi from "joi";

const categorySchema = joi.object({
    name: joi.string().trim().required()
});

const gameSchema = joi.object({
    name: joi.string().trim().required(),
    image: joi.required(),
    stockTotal: joi.number().greater(0).required(),
    categoryId: joi.required(),
    pricePerDay: joi.number().greater(0).required()
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

server.get("/games", async (req, res) => {
    const gameName = req.query.name;

    if(gameName === undefined){
        try{
            const games = await connectionDB.query(`SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id;`);
            res.send(games.rows);
        } catch (error) {
            console.log(error);
            res.sendStatus(500);
        }
    } else {
        try{
            const games = await connectionDB.query(`SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId"= categories.id WHERE games.name LIKE '%${gameName}%';`);
            res.send(games.rows);
        } catch (error) {
            console.log(error);
            res.sendStatus(500);
        }
    }
})

server.post("/games", async (req, res) => {
    const gameName = req.body.name;
    const gameImage = req.body.image;
    const gameStockTotal = req.body.stockTotal;
    const gameCategoryId = parseInt(req.body.categoryId);
    const gamePricePerDay = req.body.pricePerDay;

    const validation = gameSchema.validate(req.body, {abortEarly: false});

    if(validation.error){
        const errors = validation.error.details.map((detail) => detail.message);
        res.status(400).send(errors);
        return;
    }


    try{
        const categories = await connectionDB.query('SELECT * FROM categories;');
        const categoriesIds = categories.rows.map(category => category.id);

        for(let i = 0; i < categoriesIds.length; i++){
            if(!categoriesIds.includes(gameCategoryId)){
                res.sendStatus(400);
                return;
            }
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }

    try{
        const games = await connectionDB.query('SELECT * FROM games;');

        for(let i = 0; i < games.rows.length; i++){
            if(games.rows[i].name === gameName){
                res.sendStatus(409);
                return;
            }
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }

    try {
        await connectionDB.query(`INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ('${gameName}', '${gameImage}', ${gameStockTotal}, ${gameCategoryId}, ${gamePricePerDay});`)
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

server.listen(4000, () => console.log("Server running in port: 4000"));