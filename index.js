const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { query } = require('express');
const app = express();
require('dotenv').config();

const port = process.env.PORT|| 5000;

// middleware
app.use(express.json());
app.use(cors());



const uri = `mongodb+srv://${process.env.BD_USER}:${process.env.BD_PASSWORD}@cluster0.8qoxdwe.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




async function run(){
    try{
        const ProductCollection= client.db("Resale").collection("ResaleCollection");
        const categoryCollection= client.db("Resale").collection("categoryProducts");
        const bookingCollection= client.db("Resale").collection("bookingProducts");

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
                const message =`you already have booking this ${booking.itemsName}`;
                return res.send({acknowledged:false, message})
            }
            const result = await bookingCollection.insertOne(booking);
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
