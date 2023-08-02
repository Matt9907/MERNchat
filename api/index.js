const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jsonToken = require('jsonwebtoken');
const cors = require('cors');
const User = require('./models/User');

dotenv.config();
mongoose.connect(process.env.MONGO_URL);
    
const jsonSecret = process.env.JSON_SECRET;


const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    credentials:true,
    origin: process.env.CLIENT_URL,
}));

app.get('/test', (req,res) =>{
    res.json('test ok');
});

app.get('/profile', (req,res) =>{
    const {token} = req.cookies?.token;
    if(token){
    jsonToken.verify(token,jsonSecret,{},(err, userData) =>{
        if(err) throw err;
        res.json(userData);
    });
}else{
    res.status(401).json('no token');
}


});

app.post('/register', async (req,res) =>{
    const {username, password} = req.body;
    try{
        const createUser = await User.create({
            username:username, 
            password:password
        });
        
        jsonToken.sign({userId: createUser._id, username}, jsonSecret,{}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, {sameSite:'none', secure:true}).status(201).json({
                id: createUser._id,
            });
            
        });

    }catch(err){
        if(err) throw err;
        res.status(500).json('error');

    }
});
    

    
 






app.listen(4000);


//DB Pass: fzhQw778tOHjuY7r