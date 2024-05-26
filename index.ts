import express from "express";
import ejs from "ejs";
import { Car } from "./interfaces/cars"

import * as database from "./database";

const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');

const dotenv = require('dotenv');
dotenv.config();
console.log("[server] Successfully parsed ENV values");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("port", 3002);
app.use(express.json());
app.use(cookieParser());

function makeCookie(length: number): string {
    let result = "";
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&@-$^§è!çà)(";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

app.get("/", async (req, res) => {

    const cookie = req.cookies.sessionCookie;

    const session = await database.validateCookie(cookie);

    if (!session) {
        return res.redirect("/login");
    }


    let filteredVehicles = await database.fetchVehicles();

    if (req.query["q"] !== undefined) {
        const queryString = req.query["q"].toString().toLowerCase();

        filteredVehicles = filteredVehicles.filter(vehicle => vehicle.name.toLowerCase().includes(queryString));
    }

    if (req.query["s"] !== undefined) {
        const sortParam = req.query["s"].toString().toLowerCase();
        switch (sortParam) {
            case 'nameasc':
                filteredVehicles.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'namedesc':
                filteredVehicles.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'classasc':
                filteredVehicles.sort((a, b) => a.class.localeCompare(b.class));
                break;
            case 'classdesc':
                filteredVehicles.sort((a, b) => b.class.localeCompare(a.class));
                break;
            case 'playstyleasc':
                filteredVehicles.sort((a, b) => a.playstyle[0].localeCompare(b.playstyle[0]));
                break;
            case 'playstyledesc':
                filteredVehicles.sort((a, b) => b.playstyle[0].localeCompare(a.playstyle[0]));
                break;
            case 'playstylesasc':
                filteredVehicles.sort((a, b) => a.playstyle[1].localeCompare(b.playstyle[1]));
                break;
            case 'playstylesdesc':
                filteredVehicles.sort((a, b) => b.playstyle[1].localeCompare(a.playstyle[1]));
                break;
        }
    }

    res.render("index.ejs", { vehicles: filteredVehicles });
});

app.get("/car/:name", async (req, res) => {

    const cookie = req.cookies.sessionCookie;

    const session = await database.validateCookie(cookie);

    if (!session) {
        return res.redirect("/login");
    }

    let name: string = req.params.name;
    let vehicles = await database.fetchVehicles();

    let nameCar: string = "";
    let type: string = "";
    let image: string = "";
    let carClass: string = "";
    let rarity: string = "";
    let playstyle1: string = "";
    let playstyle2: string = "";

    for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];
        let vehicleName: string = vehicle.name;

        if (vehicleName === name) {
            nameCar = vehicle.name;
            type = vehicle.type;
            image = vehicle.image;
            carClass = vehicle.class;
            playstyle1 = vehicle.playstyle[0];
            playstyle2 = vehicle.playstyle[1];
            break;
        }
    }

    const isAdmin = await database.isUserAdmin(req.cookies.sessionCookie);

    res.render("car.ejs", { nameCar: nameCar, type: type, image: image, carClass: carClass, rarity: rarity, playstyle1: playstyle1, playstyle2: playstyle2, isAdmin: isAdmin });
});

app.post("/api/change", async (req, res) => {
    console.log(req.body);
    const { name, newName, newType, newClass, newImage } = req.body;
    await database.changeVehicleName(name, newName);
    await database.changeVehicleType(name, newType);
    await database.changeVehicleClass(name, newClass);
    await database.changeVehicleImage(name, newImage);
    console.log("[server] Name changed successfully");
});

type ClassName = string;

app.get("/classes", async (req, res) => {

    const cookie = req.cookies.sessionCookie;

    const session = await database.validateCookie(cookie);

    if (!session) {
        return res.redirect("/login");
    }

    let uniqueClasses: ClassName[] = [];

    let filteredVehicles = await database.fetchVehicles();

    filteredVehicles.forEach(vehicle => {

        const className = vehicle.class.charAt(0).toUpperCase() + vehicle.class.slice(1);

        if (!uniqueClasses.includes(className)) {

            uniqueClasses.push(className);
        }
    });

    uniqueClasses = uniqueClasses.sort();

    res.render("classes.ejs", { classes: uniqueClasses });
});

app.get("/class/:name", async (req, res) => {

    const cookie = req.cookies.sessionCookie;

    const session = await database.validateCookie(cookie);

    if (!session) {
        return res.redirect("/login");
    }

    let name: string = req.params.name.toLowerCase();

    let filteredVehicles = await database.fetchVehicles();
    let showVehciles: Car[] = [];

    filteredVehicles.forEach(vehicle => {
        if (vehicle.class.toLowerCase() == name) {

            showVehciles.push(vehicle);
        }
    });

    showVehciles = showVehciles.sort();

    res.render("class.ejs", { classe: name, vehicles: showVehciles });
});

app.get("/playstyles", async (req, res) => {

    const cookie = req.cookies.sessionCookie;

    const session = database.validateCookie(cookie);

    if (!session) {
        return res.redirect("/login");
    }

    let uniquePlaystyles: ClassName[] = [];
    let filteredVehicles = await database.fetchVehicles();

    filteredVehicles.forEach(vehicle => {

        const playStyle1Name = vehicle.playstyle[0].charAt(0).toUpperCase() + vehicle.playstyle[0].slice(1);
        const playStyle2Name = vehicle.playstyle[1].charAt(0).toUpperCase() + vehicle.playstyle[1].slice(1);

        if (!uniquePlaystyles.includes(playStyle1Name)) {

            uniquePlaystyles.push(playStyle1Name);
        }

        if (!uniquePlaystyles.includes(playStyle2Name)) {

            uniquePlaystyles.push(playStyle2Name);
        }
    });

    uniquePlaystyles = uniquePlaystyles.sort();

    res.render("playstyles.ejs", { playstyles: uniquePlaystyles });
});

app.get("/playstyle/:name", async (req, res) => {

    const cookie = req.cookies.sessionCookie;

    const session = await database.validateCookie(cookie);

    if (!session) {
        return res.redirect("/login");
    }

    let name: string = req.params.name.toLowerCase();

    let filteredVehicles = await database.fetchVehicles();
    let showVehciles: Car[] = [];

    filteredVehicles.forEach(vehicle => {
        if (vehicle.playstyle[0].toLowerCase() == name || vehicle.playstyle[1].toLowerCase() == name) {
            showVehciles.push(vehicle);
        }
    });

    showVehciles = showVehciles.sort();

    res.render("playstyle.ejs", { playstyle: name, vehicles: showVehciles });
});

app.get("/login", async (req, res) => {
    const cookie = req.cookies.sessionCookie;

    const session = await database.validateCookie(cookie);

    if (session) {
        return res.redirect("/");
    }

    res.render("login.ejs");
})

app.post("/api/login", async (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    console.log(password);

    const account = await database.getAccountInfo(username);

    if (account) {
        if (bcrypt.compareSync(password, account.password)) {

            const sessionCookie = makeCookie(100);
            await database.setupSession(username, sessionCookie);

            res.cookie("sessionCookie", sessionCookie, {
                httpOnly: true,
                maxAge: 1000 * 60 * 1440,
                secure: false, // Transmit the cookie only over HTTPS
                // sameSite: "Strict",
            });

            res.status(200).json({ message: "Login success" });
        } else {
            res.status(401).json({ message: "Incorrect wachtwoord" });
        }
    }
});

app.get('/register', async (req, res) => {
    const cookie = req.cookies.sessionCookie;

    const session = await database.validateCookie(cookie);

    if (session) {
        return res.redirect("/");
    }

    res.render('register.ejs');
});

app.post("/api/register", async (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    const account = await database.isUsernameTaken(username);
    console.log(account);

    if (account) {
        return res.status(409).json({ message: "Gebruikersnaam is al in gebruik." });
    } else {
        await database.setupAccount(username, password, "user");
        return res.status(200).json({ message: "Succes" });
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('sessionCookie');
    res.redirect('/login');
});


app.listen(app.get("port"), async () => {
    database.setupDatabase();

    console.log("[server] http://localhost:" + app.get("port"));
});