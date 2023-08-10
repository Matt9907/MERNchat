const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jsonToken = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const ws = require('ws');

dotenv.config();
mongoose.connect(process.env.MONGO_URL);
    
const jsonSecret = process.env.JSON_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);


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

app.post('/login',async (req,res) =>{
    const {username, password} = req.body;
    const foundUser = await User.findOne({username});
    if (foundUser){
       const passOk = bcrypt.compareSync(password, foundUser.password);
       if(passOk){
        jsonToken.sign({userId:createdUser, _id,username}, jsonSecret, {}, (err,token) =>{

        
        res.cookie('token', token, {sameSite:'none', secure:true}).json({
            id: foundUser._id,
        });
       });
       }
    }
});

app.post('/register', async (req,res) =>{
    const {username, password} = req.body;
    try{
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
        const createUser = await User.create({
            username:username, 
            password:hashedPassword,
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
    

    
 






const server = app.listen(4000);

const wss=new ws.WebSocketServer({server});

wss.on('connection',(connection, req) =>{
 const cookies = req.headers.cookie;
 if (cookies){
    const tokenCookieString = cookies.split(';').find(str => str.startsWith("token="));
    if(tokenCookieString){
        const token = tokenCookieString.split('=')[1];
        if(token){
            jsonToken.verify(token,jsonSecret,{},(error,userData) =>{
                if(err) throw err;
                const {userId,username} = userData;
                connection.userId = userId;
                connection.username = username;


            });
        }
    }
 }    

[...wss.clients].forEach(client => {
    client.send(JSON.stringify({
      online:  [...wss.clients].map(c => ({userId:c.userId,username:c.username}))
    }))
});


});



//DB Pass: fzhQw778tOHjuY7r