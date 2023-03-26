const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId  } = require('mongodb');
const { query } = require('express');
const app = express();
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

const port = process.env.PORT|| 5000;

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.BD_USER}:${process.env.BD_PASSWORD}@cluster0.8qoxdwe.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




async function run(){
    try{
        const ProductCollection= client.db("Resale").collection("ResaleCollection");
        const categoryCollection= client.db("Resale").collection("categoryProducts");
        const bookingCollection= client.db("Resale").collection("bookingProducts");
        const usersCollection = client.db('Resale').collection('users');
        const paymentsCollection = client.db('Resale').collection('payment');

        app.get('/products', async(req,res)=>{
            const query ={};
            const cursor = ProductCollection.find(query);
            const products = await cursor.toArray();
            
            res.send(products)
        });

        app.get('/products/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {id:id};
            const products = await ProductCollection.findOne(query);
            res.send(products)
        });


        app.get('/product-category', async(req,res)=>{
            const query = {};
            const category = await categoryCollection.find(query).toArray();
            res.send(category);
        });

        app.get('/product-category/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {category_id: id};
            const result = await categoryCollection.find(query).toArray();
            res.send(result);
        })

        // productBooking

        app.post('/bookings', async(req,res)=>{
            const booking = req.body;
            const query = {
                itemsName: booking.itemsName,
                email: booking.email,

            }
            alreadyBooked = await bookingCollection.find(query).toArray();

            if(alreadyBooked.length){
                const message = `You already have a booking this ${booking.itemsName}`;
                return res.send({acknowledged:false, message})
            }

            const result = await bookingCollection.insertOne(booking);
            res.send(result);

        });

        app.get('/bookings', async(req,res)=>{
            const query = {};
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        });

        app.get('/bookings/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)}
            const booking = await bookingCollection.findOne(query);
            res.send(booking)
        });

        app.get('/bookings', async(req,res)=>{
            const email = req.query.email;
            const query = {email:email}
            const booking = await bookingCollection.find(query).toArray();
            res.send(booking);
        });

        app.get('/bookings', async(req,res)=>{
            const email=req.query.email;
            const query= {email:email};
            const booking = await bookingCollection.find(query).toArray();
            res.send(booking);
        });

        app.post('/addProducts', async(req,res)=>{
            const addProduct = req.body;
            const result = await categoryCollection.insertOne(addProduct)
            res.send(result);
        });

        app.get('/addProducts', async(req,res)=>{
           const query={};
            const result = await categoryCollection.find(query).toArray();
            res.send(result);
        })
        
        app.delete('/addProducts/:id', async(req,res)=>{
            const id = req.params.id;
            const filter= {_id:ObjectId(id)};
            const result = await categoryCollection.deleteOne(filter);
            res.send(result)
        });

        
        app.get('/jwt', async(req,res)=>{
            const email= req.query.email;
            const query= {email:email};
            const user = await usersCollection.findOne(query);
            if(user){
                const token =jwt.sign({email}, process.env.ACCESS_TOKEN,{expiresIn:'7h'})
                return res.send({accessToken:token});

            }
            // console.log(user);
            res.status(403).send({accessToken:' '})
        });

        app.get('/users', async(req,res)=>{
            const query ={};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });


       
        app.post('/users',async(req,res)=>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/users/admin/:email', async(req,res)=>{
            const email = req.params.email;
           const query = {email}
            const user = await usersCollection.findOne(query);
            res.send({isAdmin: user?.rol === 'admin'})
        })



        app.put('/users/admin/:id',async(req,res)=>{
            const id = req.params.id;
            const filter = { _id:ObjectId(id)}
            const options = { upsert:true };
            const updateDoc={
                $set:{
                    rol :'admin'
                }
            }
            const result = await usersCollection.updateOne(filter,updateDoc,options);
            res.send(result);
        })

        app.put('/users/:id',  async(req,res)=>{
            
            
            
            const id = req.params.id;
            const filter = { _id:ObjectId(id)}
            const options = { upsert:true };
            const updateDoc={
                $set:{
                    role:'verified'
                }
            }
            const result = await usersCollection.updateOne(filter,updateDoc,options);
            res.send(result);
        });

        app.delete('/users/:id', async(req,res)=>{
            
            const id = req.params.id;
            console.log(id);
            const filter = { _id:ObjectId(id) } ;
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
            console.log(result);
        });

        app.post('/create-payment-intent', async(req,res)=>{

            const booking = req.body;
            const price = booking.itemsPrice;
            const amount= price*100;
           
            const paymentIntent = await stripe.paymentIntents.create({
                currency:'usd',
                amount: amount,
                "payment_method_types":[
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });

        });

        app.post('/payments', async(req,res)=>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = {_id:ObjectId(id)};
            const updateDoc= {
                $set:{
                    paid:true,
                    transactionId:payment.transactionId

                }
            }
            const updateResult = await bookingCollection.updateOne(filter,updateDoc)
            res.send(result);
        })

    }
   finally{

   }
}
run().catch(error=>{
    console.log(error)
});

app.get('/', async(req,res)=>{
    res.send('Simple Node server running')
});





app.listen(port,()=>{
    console.log(`simple not server running on ${port}`)
});
