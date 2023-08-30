import { useContext,useEffect,useRef , useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import {UserContext} from "./UserContext.jsx"
import {uniqBy} from "lodash";
import axios from "axios";
import Contact from "./Contact";


export default function Chat(){
    const [ws, setWs] = useState(null);
    const[onlinePeople,setOnlinePeople] = useState({});
    const [offlinePeople, setOfflinePeole] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMessageText,setNewMessageText] = useState('');
    const [messages, setMessages] = useState('');
    const {username,id,setId, setUsername} = useContext(UserContext);
    const divUnderMessage = useRef();

    useEffect(() =>{
        connectToWs();
    }, [selectedUserId]);



    function connectToWs(){
    const ws = new WebSocket('ws://localhost:5173');
    setWs(ws);
    ws.addEventListener('message',handleMessage )
    ws.addEventListener('close', () => {
        setTimeout(() =>{
            console.log('Disconnected. Reconnecting Now');
            connectToWs();
        }, 1000);

    });
 }
    

function showOnlinePeople(peopleArray){
    const people = {};
    peopleArray.forEach(({userId,username}) => {
        people[userId] = username;
    });
    setOnlinePeople(people);

    }
        
  






function handleMessage(ev){
    const messageData = JSON.parse(ev.data);
    console.log([ev, messageData]);
    if('online' in messageData){
        showOnlinePeople(messageData.online);
    }else if('text' in messageData){
        if(messageData.sender === selectedUserId){
        setMessages(prev => ([...prev, {...messageData}]));
    }
}

}
function logout(){
    axios.post('/logout').then(() =>{
        setWs(null);
        setId(null);
        setUsername(null);
    });
}



function sendMessage(ev){
    ev.preventDefault();
    ws.send(JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
    
}));
   setNewMessageText('');
   setMessages(prev => ([...prev,{
    text: newMessageText, 
    sender: id,
    recipient: selectedUserId,
    _id: Date.now(),
}]));



}

useEffect(() =>{
    const div = divUnderMessage.current;
    if(div){
        div.scrollIntoView({behavior:'smooth', block:'end'});
    }
}, [messages]);

useEffect(() =>{
    axios.get('/people').then(res =>{
        const offlinePeopleArray = res.data
        .filter(p => p._id !== id)
        .filter(p => !Object.keys(onlinePeople).includes(p._id));
        const offlinePeople = {};
        offlinePeopleArray.forEach(p => {
            offlinePeople[p._id] = p;
        });
        setOfflinePeole(offlinePeople);
    });

}, [onlinePeople]);

useEffect(() =>{
    if(selectedUserId){
        axios.get('/messages/' + selectedUserId).then(res => {
            setMessages(res.data);
        });

    }

} , [selectedUserId]);

const onlinePeopleExcUs = {...onlinePeople};
delete onlinePeopleExcUs[id];

const messageWithoutDupe = uniqBy(messages, '_id');



    return(
        <div className="flex h-screen">
            <div className = "bg-white w-1/3 ">
                <Logo />
                {Object.keys(onlinePeopleExcUs).map(userId =>(
                    <Contact 
                    key = {userId}
                    id={userId} 
                    online ={true}
                    username = {onlinePeopleExcUs[userId]}
                    onClick = {() => {setSelectedUserId(userId);console.log({userId})}}
                    selected = {userId === selectedUserId} />

                ))}
                {Object.keys(offlinePeople).map(userId =>(
                    <Contact 
                    key = {userId}
                    id={userId} 
                    online ={false}
                    username = {offlinePeople[userId].username}
                    onClick = {() => setSelectedUserId(userId)}
                    selected = {userId === selectedUserId} />

                ))}
            </div>
            <div className="p-2 text-center flex items-center">
               <span className="mr-2 text-sm text-gray-600 flex"> 
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
</svg>
               {username}
               </span>
                    <button 
                    onClick={logout}
                    className="text-sm bg-blue-100 py-1 px-2 text-gray-500 border rounded-sm">
                        Logout
                        </button>
            </div>
            <div className="flex flex-col bg-blue-50 w-2/3 p-2">
                <div className="flex-grow"> 
                {!selectedUserId && (
                    <div className="flex h-full flex-grow items-center justify-center"> 
                    <div className="text-gray-300">&larr; Select a Contact</div>
                    </div>
                )}
                {!!selectedUserId &&(
                    
                        <div className="relative h-full  ">
                    <div className="overflow-y-scroll position-absolute top-0 left-0 right-0 bottom-2">
                        {messageWithoutDupe.map(message =>(
                            <div key = {message._id} className={(message.sender===id ? 'text-right':'text-left')}>

                            <div className={" text-left inline-block p-2 my-2 rounded-md text-sm " + (message.sender===id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500')}> 
                                sender: {message.sender}<br />
                                my id: {id}<br />
                               {message.text}
                                </div>
                                </div>
                        ))}
                        <div ref ={divUnderMessage}></div>
                        </div>
                        </div>

                )}
                </div>
                {!!selectedUserId && (
                <form className="flex gap-2" onSubmit={sendMessage}>
                    <input 
                    type = "text" 
                    value = {newMessageText}
                    onChange={ev => setNewMessageText(ev.target.value)}
                    placeholder="Type your message here" 
                    className="bg-white flex-grow border p-2 rounded-sm" />
                    <button type="submit" className="bg-blue-500 p-2 text-white rounded-sm">
                    Send
                    </button>
                </form>
                )}
            </div>
            </div>
    );
}