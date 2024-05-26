import express from "express";
import ejs from "ejs";
import { Car } from "./interfaces/cars"
import { MongoClient } from "mongodb";
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');

const dotenv = require('dotenv');
dotenv.config();
console.log("[server] Successfully parsed ENV values");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("port", 4469);
app.use(express.json());
app.use(cookieParser());

const saltRounds = 2; // this is just 2 as this application isn't major -- and to remove strain on the server

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

async function fetchVehciles() {
    const documents = await vehiclesCollection.find({}).toArray();
    const convertedData: Car[] = documents.map(doc => ({
        name: doc.name,
        type: doc.type,
        class: doc.class,
        playstyle: doc.playstyle,
        image: doc.image
    }));
    return convertedData;
}

async function changeVehicleName(name: string, newName: string) {
    await vehiclesCollection.updateOne({ name: name }, { $set: { name: newName } });
}

async function changeVehicleType(name: string, newType: string) {
    await vehiclesCollection.updateOne({ name: name }, { $set: { type: newType } });
}

async function changeVehicleClass(name: string, newClass: string) {
    await vehiclesCollection.updateOne({ name: name }, { $set: { class: newClass } });
}

async function changeVehicleImage(name: string, newImage: string) {
    await vehiclesCollection.updateOne({ name: name }, { $set: { image: newImage } });
}

async function validateCookie(cookie: string) {
    const documents = await sessionsCollection.countDocuments({ sessionCookie: cookie });
    if (documents > 0) {
        return true;
    } else {
        return false;
    }
}

async function isUserAdmin(cookie: string) {
    const sessionInfo = await sessionsCollection.findOne({ sessionCookie: cookie });
    const username = sessionInfo?.username;
    const userinfo = await accountCollection.findOne({ username: username });
    if (userinfo?.role === "admin") {
        return true;
    } else {
        return false;
    }
}

async function isUsernameTaken(username: string) {
    const documents = await accountCollection.countDocuments({ username: username });
    if (documents > 0) {
        return true;
    } else {
        return false;
    }
}

const client = new MongoClient(process.env.MONGODB_URI ?? "mongodb://localhost:27017");
client.connect();

const db = client.db("milestone");
const vehiclesCollection = db.collection("part3");
const accountCollection = db.collection("account");
const sessionsCollection = db.collection("sessions");
console.log("[server] Successfully initialized collections");

app.get("/", async (req, res) => {

    const cookie = req.cookies.sessionCookie;

    const session = await validateCookie(cookie);

    if (!session) {
        return res.redirect("/login");
    }


    let filteredVehicles = await fetchVehciles();

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

    const session = await validateCookie(cookie);

    if (!session) {
        return res.redirect("/login");
    }

    let name: string = req.params.name;
    let vehicles = await fetchVehciles();

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

    const isAdmin = await isUserAdmin(req.cookies.sessionCookie);

    res.render("car.ejs", { nameCar: nameCar, type: type, image: image, carClass: carClass, rarity: rarity, playstyle1: playstyle1, playstyle2: playstyle2, isAdmin: isAdmin });
});

app.post("/api/change", async (req, res) => {
    console.log(req.body);
    const { name, newName, newType, newClass, newImage } = req.body;
    await changeVehicleName(name, newName);
    await changeVehicleType(name, newType);
    await changeVehicleClass(name, newClass);
    await changeVehicleImage(name, newImage);
    console.log("[server] Name changed successfully");
});

type ClassName = string;

app.get("/classes", async (req, res) => {

    const cookie = req.cookies.sessionCookie;

    const session = await validateCookie(cookie);

    if (!session) {
        return res.redirect("/login");
    }

    let uniqueClasses: ClassName[] = [];

    let filteredVehicles = await fetchVehciles();

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

    const session = await validateCookie(cookie);

    if (!session) {
        return res.redirect("/login");
    }

    let name: string = req.params.name.toLowerCase();

    let filteredVehicles = await fetchVehciles();
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

    const session = validateCookie(cookie);

    if (!session) {
        return res.redirect("/login");
    }

    let uniquePlaystyles: ClassName[] = [];
    let filteredVehicles = await fetchVehciles();

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

    const session = await validateCookie(cookie);

    if (!session) {
        return res.redirect("/login");
    }

    let name: string = req.params.name.toLowerCase();

    let filteredVehicles = await fetchVehciles();
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

    const session = await validateCookie(cookie);

    if (session) {
        return res.redirect("/");
    }

    res.render("login.ejs");
})

app.post("/api/login", async (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    console.log(password);

    const account = await accountCollection.findOne({ username: username });

    if (account) {
        if (bcrypt.compareSync(password, account.password)) {

            const sessionCookie = makeCookie(100);

            const sessionDetails = {
                username: username,
                sessionCookie: sessionCookie
            }

            await sessionsCollection.insertOne(sessionDetails);

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

    const session = await validateCookie(cookie);

    if (session) {
        return res.redirect("/");
    }

    res.render('register.ejs');
});

app.post("/api/register", async (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    const account = await isUsernameTaken(username);
    console.log(account);

    if (account) {
        return res.status(409).json({ message: "Gebruikersnaam is al in gebruik." });
    } else {
        const hashedPassword = await bcrypt.hashSync(password, saltRounds);
        const newAccount = {
            username: username,
            password: hashedPassword,
            role: "user"
        }
        await accountCollection.insertOne(newAccount);
        return res.status(200).json({ message: "Succes" });
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('sessionCookie');
    res.redirect('/login');
});


app.listen(app.get("port"), async () => {
    const documentCount = await vehiclesCollection.countDocuments({});
    const accountCount = await accountCollection.countDocuments({});

    if (documentCount === 0) {
        console.log("[server] Fetching data from API");
        const response = await fetch("https://raw.githubusercontent.com/vstudiocode/milestone-3/main/data.json");
        const data = await response.json();

        for (const car of data) {
            await vehiclesCollection.insertOne(car);
        }
        console.log("[server] Data inserted into MongoDB");
    }

    if (accountCount === 0) {
        const adminPassword = process.env.ADMINPASSWORD ?? "none";
        const adminPass = await bcrypt.hashSync(adminPassword, saltRounds);
        const adminAccount = {
            username: "admin",
            password: adminPass,
            role: "admin"
        }
        await accountCollection.insertOne(adminAccount);
        console.log("[server] Admin account created");

        const userPassword = process.env.USERPASSWORD ?? "none";
        const userPass = await bcrypt.hashSync(userPassword, saltRounds);
        const userAccount = {
            username: "user",
            password: userPass,
            role: "user"
        }

        await accountCollection.insertOne(userAccount);
        console.log("[server] User account created");
    }

    console.log("[server] http://localhost:" + app.get("port"));
});