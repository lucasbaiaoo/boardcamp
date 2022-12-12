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

const customerSchema = joi.object({
    name: joi.string().trim().required(),
    phone: joi.string().regex(/^\d+$/).min(10).max(11).required(),
    cpf: joi.string().regex(/^\d+$/).length(11).required(),
    birthday: joi.date().greater("1-1-1850").required()
})

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
        await connectionDB.query(`INSERT INTO categories (name) VALUES ($1);`, [`${categoryName}`]);
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
            const games = await connectionDB.query(`SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId"= categories.id WHERE games.name LIKE $1;`, ["%"+gameName+"%"]);
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
        await connectionDB.query(`INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);`, [`${gameName}`, `${gameImage}`, gameStockTotal, gameCategoryId, gamePricePerDay]);
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

server.get("/customers", async (req, res) => {
    const customerCPF = req.query.cpf

    if(customerCPF === undefined){
        try {
            const customers = await connectionDB.query('SELECT * FROM customers');
            res.send(customers.rows);
        } catch (error) {
            console.log(error);
            res.sendStatus(500);
        }
    } else {
        try {
            const customers = await connectionDB.query(`SELECT * FROM customers WHERE cpf LIKE $1`, [customerCPF+"%"]);
            res.send(customers.rows);
        } catch (error) {
            console.log(error);
            res.sendStatus(500);
        }
    }
})

server.get("/customers/:id", async (req, res) => {
    const customerId = parseInt(req.params.id); 

    try{
        const customers = await connectionDB.query('SELECT * FROM customers;');
        const customersIds = customers.rows.map(customer => customer.id);
        const customer = await connectionDB.query('SELECT * FROM customers WHERE id= $1;', [customerId]);
        
        if(!customersIds.includes(customerId)){
            res.sendStatus(404);
            return;
        } else {
            res.send(customer.rows);
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

server.post("/customers", async (req, res) => {
    const customerName = req.body.name;
    const customerPhone = req.body.phone;
    const customerCPF = req.body.cpf;
    const customerBirthday = req.body.birthday;

    const validation = customerSchema.validate(req.body, {abortEarly: false});

    if(validation.error){
        const errors = validation.error.details.map((detail) => detail.message);
        res.status(400).send(errors);
        return;
    }

    try{
        const customers = await connectionDB.query('SELECT * FROM customers;');

        for(let i = 0; i < customers.rows.length; i++){
            if(customers.rows[i].cpf === customerCPF){
                res.sendStatus(409);
                return;
            }
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }

    try {
        await connectionDB.query(`INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);`, [`${customerName}`, `${customerPhone}`, customerCPF, customerBirthday])
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }

})

server.put("/customers/:id", async (req, res) => {
    const updatedCustomerName = req.body.name;
    const updatedCustomerPhone = req.body.phone;
    const updatedCustomerCPF = req.body.cpf;
    const updatedCustomerBirthday = req.body.birthday;
    const customerId = req.params.id

    const validation = customerSchema.validate(req.body, {abortEarly: false});

    if(validation.error){
        const errors = validation.error.details.map((detail) => detail.message);
        res.status(400).send(errors);
        return;
    }

    try{
        const customers = await connectionDB.query('SELECT * FROM customers;');
        const customerCPF = await connectionDB.query('SELECT cpf FROM customers WHERE id=$1;', [customerId])

        for(let i = 0; i < customers.rows.length; i++){
            if(customers.rows[i].cpf === customerCPF){
                res.sendStatus(409);
                return;
            }
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
        return;
    }

    try {
        await connectionDB.query(`UPDATE customers SET name=$1, phone=$2, cpf=$3, birthday=$4 WHERE id=$5;`, [`${updatedCustomerName}`, `${updatedCustomerPhone}`, `${updatedCustomerCPF}`, `${updatedCustomerBirthday}`, customerId])
        res.sendStatus(201);
        return
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})
server.listen(4000, () => console.log("Server running in port: 4000"));