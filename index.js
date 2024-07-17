require('dotenv').config()
const express = require("express");
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');
const port = process.env.PORT || 5000;
const cors = require("cors")

const app = express();

app.use(cors())
app.use(express.json());

app.get("/", (req, res) => res.send("Server is running successfully"))
app.listen(port, ()=> console.log(`App running on port ${port}`))

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s7sbkwf.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
      // Send a ping to confirm a successful connection
      const allUsersCollection = client.db("mobile_financial_service").collection("all_users")
      let saltRounds = 10;

      app.post("/create-users", async (req, res) => {
          const values = req.body;
          const { name, email, number, PIN, userType } = values;
          bcrypt.hash(PIN, saltRounds,async function (err, hash) {
             
              
              const formatDoc = {
      user_name: name,
      user_email: email,
      user_number: number,
      user_pin: hash,
        user_type: userType === "Yes" ? "Agent" : "General User",
      status: "Pending"
              };
              const result = await allUsersCollection.insertOne(formatDoc);
          res.send(result);
              
    // Store hash in your password DB.
          });
         
          
      })
    
    app.get("/my-data", async (req, res) => {
      // const { numberOrEmail, PIN } = req.body;
      let query = {}
      const { pn, pin } = req.query;
      if (pn.includes("@")) {
        query = {user_email: pn}
      } else {
        query = {user_number: pn}
      }
      console.log(pn, pin);
      console.log(query);
      
      const result = await allUsersCollection.findOne(query);
      console.log(result);
      if (result) {
        bcrypt.compare(pin, result.user_pin, function(err, resp) {
        if (resp) {
     return res.send(result);
        } else {
          return res.send({message: "Password does'nt match"})
    }
});
      }
      else {
        return res.send({message: "User Not found"})
      }
      
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
