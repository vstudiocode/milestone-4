import { MongoClient } from "mongodb";

import { Car } from "./interfaces/cars"
import { Account } from "./interfaces/account"
import { Session } from "./interfaces/sessions"

const dotenv = require('dotenv');
dotenv.config();
console.log("[database] Successfully parsed ENV values");

const bcrypt = require('bcrypt');
const saltRounds = 2; // only 2 as this application isn't that critical and we only have 0.1 core on render :)

const client = new MongoClient(process.env.MONGODB_URI ?? "mongodb://localhost:27017");
client.connect();

const db = client.db("milestone");
const vehiclesCollection = db.collection<Car>("part3");
const accountCollection = db.collection<Account>("account");
const sessionsCollection = db.collection<Session>("sessions");
console.log("[database] Successfully initialized collections");

export async function fetchVehicles(): Promise<Car[]> {
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

export async function changeVehicleName(name: string, newName: string) {
    await vehiclesCollection.updateOne({ name: name }, { $set: { name: newName } });
}

export async function changeVehicleType(name: string, newType: string) {
    await vehiclesCollection.updateOne({ name: name }, { $set: { type: newType } });
}

export async function changeVehicleClass(name: string, newClass: string) {
    await vehiclesCollection.updateOne({ name: name }, { $set: { class: newClass } });
}

export async function changeVehicleImage(name: string, newImage: string) {
    await vehiclesCollection.updateOne({ name: name }, { $set: { image: newImage } });
}

export async function validateCookie(cookie: string): Promise<boolean> {
    const documents = await sessionsCollection.countDocuments({ cookie: cookie });
    return documents > 0;
}

export async function isUserAdmin(cookie: string): Promise<boolean> {
    const sessionInfo = await sessionsCollection.findOne({ cookie: cookie });
    const username = sessionInfo?.username;
    const userinfo = await accountCollection.findOne({ username: username });
    return userinfo?.role === "admin";
}

export async function isUsernameTaken(username: string): Promise<boolean> {
    const documents = await accountCollection.countDocuments({ username: username });
    return documents > 0;
}

export async function setupAccount(username: string, password: string, role: string) {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newAccount: Account = {
        username: username,
        password: hashedPassword,
        role: role
    }
    await accountCollection.insertOne(newAccount);
}

export async function setupSession(username: string, sessionCookie: string) {
    const newSession: Session = {
        username: username,
        cookie: sessionCookie
    }
    await sessionsCollection.insertOne(newSession);
}

export async function getAccountInfo(username: string): Promise<Account | null> {
    const account = await accountCollection.findOne({ username: username });
    return account;
}

export async function setupDatabase() {
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
        const adminPass = await bcrypt.hash(adminPassword, saltRounds);
        const adminAccount: Account = {
            username: "admin",
            password: adminPass,
            role: "admin"
        }
        await accountCollection.insertOne(adminAccount);
        console.log("[server] Admin account created");

        const userPassword = process.env.USERPASSWORD ?? "none";
        const userPass = await bcrypt.hash(userPassword, saltRounds);
        const userAccount: Account = {
            username: "user",
            password: userPass,
            role: "user"
        }

        await accountCollection.insertOne(userAccount);
        console.log("[server] User account created");
    }
}

export async function deleteSession(cookie: string) {
    await sessionsCollection.deleteOne({ cookie: cookie });
}