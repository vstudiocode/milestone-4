import express from "express";
import ejs from "ejs";
import { Car } from "./interfaces/cars"
import { MongoClient } from "mongodb";

const dotenv = require('dotenv');
dotenv.config();
console.log("[server] Successfully parsed ENV values");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("port", 4200);
app.use(express.json());

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

const client = new MongoClient(process.env.MONGODB_URI ?? "mongodb://localhost:27017");
client.connect();

const db = client.db("milestone");
const vehiclesCollection = db.collection("part3");
console.log("[server] Successfully initialized collections");

app.get("/", async (req, res) => {
    

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

    res.render("car.ejs", { nameCar: nameCar, type: type, image: image, carClass: carClass, rarity: rarity, playstyle1: playstyle1, playstyle2: playstyle2 });
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


app.listen(app.get("port"), async () => {
    const documentCount = await vehiclesCollection.countDocuments({});
    console.log("[server] Number of documents:", documentCount);

    if (documentCount === 0) {
        console.log("[server] Fetching data from API");
        const response = await fetch("https://raw.githubusercontent.com/vstudiocode/milestone-3/main/data.json");
        const data = await response.json();
        
        for (const car of data) {
            await vehiclesCollection.insertOne(car);
        }
        console.log("[server] Data inserted into MongoDB");
    }

    console.log("[server] http://localhost:" + app.get("port"));
});