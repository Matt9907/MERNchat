const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jsonToken = require('jsonwebtoken');
const cors = require('cors');
const User = require('./models/User');

dotenv.config();
mongoose.connect(process.env.MONGO_URL);
    
const jsonSecret = process.env.JSON_SECRET;


const app = express();
app.use(express.json());
app.use(cors({
    credentials:true,
    origin: process.env.CLIENT_URL,
}));

app.get('/test', (req,res) =>{
    res.json('test ok');
});

app.post('/register', async (req,res) =>{
    const {username, password} = req.body;
    try{
        const createUser = await User.create({username, password});
        jsonToken.sign({userId: createUser, _id}, jsonSecret,{}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).status(201).json('ok')({
                _id: createUser._id,
            });
            
        });

    }catch(err){
        if(err) throw err;
        res.status(500).json('error');

    }
});
    

    
 






app.listen(4000);


//DB Pass: fzhQw778tOHjuY7r