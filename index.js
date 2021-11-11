
const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const admin = require("firebase-admin");

const port = process.env.PORT || 5000;


//


const serviceAccount = require('./doctors-portal-93b15-firebase-adminsdk-iaxpm-b0bd2e4282.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ugc7c.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}

async function run() {
    try {
        await client.connect();
        const database = client.db('doctors_portal');
        const appointmentsCollection = database.collection('appointments');
        const usersCollection = database.collection('users');

        app.get('/appointments', verifyToken, async (req, res) => {
            const email = req.query.email;
            const date = req.query.date;

            const query = { email: email, date: date }

            const cursor = appointmentsCollection.find(query);
            const appointments = await cursor.toArray();
            res.json(appointments);
        })

        app.post('/appointments', async (req, res) => {
            const appointment = req.body;
            const result = await appointmentsCollection.insertOne(appointment);
            res.json(result)
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }

        })

    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Doctors portal!')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})




// async function verifyToken(req, res, next) {
//     if (req.headers?.authorization?.startsWith('Bearer ')) {
//         const token = req.headers.authorization.split(' ')[1];

//         try {
//             const decodedUser = await admin.auth().verifyIdToken(token);// 73-9 token verify hole bhitorer data gulo return korbe
//             req.decodedEmail = decodedUser.email;
//         }
//         catch {

//         }

//     }
//     next();
// }

// async function run() {
//     try {
//         await client.connect();
//         console.log('database connected');
//         const database = client.db('doctors_portal');
//         const appointmentsCollection = database.collection('appointments')
//         const usersCollection = database.collection('users');


//         app.get('/appointments', async (req, res) => { //verytoken use kore verify token er mail er sathe url hit kor mail match kore kaj kra jabe
//             const email = req.query.email;
//             const date = new Date(req.query.date).toLocaleDateString();//(72-9) 5 mins...new Date diye string date k object e transfer krte hbe 

//             const query = { email: email, date: date }

//             const cursor = appointmentsCollection.find(query);
//             const appointments = await cursor.toArray();
//             res.json(appointments);
//         })

//         app.post('/appointments', async (req, res) => {
//             const appointment = req.body;
//             const result = await appointmentsCollection.insertOne(appointment);
//             console.log(result);
//             res.json(result)
//         });

//         app.post('/users', async (req, res) => {
//             const user = req.body;
//             const result = await usersCollection.insertOne(user);
//             console.log(result);
//             res.json(result);
//         });

//         app.get('/users/:email', async (req, res) => {
//             const email = req.params.email;
//             const query = { email: email };
//             const user = await usersCollection.findOne(query);
//             let isAdmin = false;
//             if (user?.role === 'admin') {
//                 isAdmin = true;
//             }
//             res.json({ admin: isAdmin });
//         })

//         //update
//         app.put('/users', async (req, res) => {
//             const user = req.body;
//             console.log('put', user);
//             const filter = { email: user.email };
//             const options = { upsert: true }; //filter kore same email er kichu na pele thn insert kore dibe tai upsart :true dewa hoise 
//             const updateDoc = { $set: user };
//             const result = await usersCollection.updateOne(filter, updateDoc, options);
//             res.json(result);
//         });

//         app.put('/users/admin', verifyToken, async (req, res) => {
//             const user = req.body;
//             console.log('put', req.decodedEmail); //73-9 thik moto id verify hole verifyToken function thke decodedEmail pawa jabe console e ..makeAdmin client filetheke hit korar por url e 
//             const requester = req.decodedEmail;
//             if (requester) {
//                 const requesterAccount = await usersCollection.findOne({ email: requester });
//                 if (requesterAccount.role === 'admin') {
//                     const filter = { email: user.email };
//                     const updateDoc = { $set: { role: 'admin' } };
//                     const result = await usersCollection.updateOne(filter, updateDoc);
//                     res.json(result);
//                 }
//             }
//             else {
//                 res.status(403).json({ message: 'you do not have access to make admin' })
//             }

//         })


//     }

//     finally {
//         // await client.close();
//     }
// }

// run().catch(console.dir);

// app.get('/', (req, res) => {
//     res.send('Hello Doctors portal!')
// })

// app.listen(port, () => {
//     console.log(`listening at ${port}`)
// })

// app.get('/users')// onek kichu database theke niye asha server e
// app.post('/users') //onek kichu post korar jnnw database e
// app.get('/users/:id') //1 jon paite
// app.put('/users/:id'); // 1 jon k rakhte
// app.delete('/users/:id') //1 jon k delete korte
// users: get
// users: post