import { useContext,useEffect,useRef , useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import {UserContext} from "./UserContext.jsx"
import {uniqBy} from "lodash";
import axios, { Axios } from "axios";


export default function Chat(){
    const [ws, setWs] = useState(null);
    const[onlinePeople,setOnlinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMessageText,setNewMessageText] = useState('');
    const [messages, setMessages] = useState('');
    const {username,id} = useContext(UserContext);
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
    if('online' in messageData){
        showOnlinePeople(messageData.online);
    }else if('text' in messageData){
        setMessages(prev => ([...prev, {...messageData}]));
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
                    <div key={userId} onClick ={() => setSelectedUserId(userId)} 
                    className={"border-b border-gray-100 flex items-center gap-2 cursor-pointer"+(userId === selectedUserId ? 'bg-blue-50' :'')}>
                        {userId === selectedUserId && (
                            <div className="w-1 bg-blue-500 h-12 rounded-r-md"></div>
                        ) }
                        <div className="flex gap-2 py-2 pl-4 items-center">
                        <Avatar username={onlinePeople[userId]} userId={[userId]} />
                    
                    <span className="text-gray-800">{onlinePeople[userId]}</span>
                     </div>
                        </div>
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