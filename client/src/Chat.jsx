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