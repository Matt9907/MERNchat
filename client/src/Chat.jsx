import { useContext,useEffect,useRef , useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import {UserContext} from "./UserContext.jsx"
import axios from "axios";


export default function Chat(){
    const [ws, setWs] = useState(null);
    const[onlinePeople,setOnlinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const {username,id} = useContext(UserContext);

useEffect(() =>{
    const ws = new WebSocket('ws://localhost:5173');
    setWs(ws);
    ws.addEventListener('message',handleMessage )
} ,[]);

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
    }

}

const onlinePeopleExcUs = {...onlinePeople};
delete onlinePeopleExcUs[id];



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
                </div>
                <div className="flex gap-2 ">
                    <input 
                    type = "text" 
                    placeholder="Type your message here" 
                    className="bg-white flex-grow border p-2 rounded-sm" />
                    <button className="bg-blue-500 p-2 text-white rounded-sm">
                    Send
                    </button>
                </div>
            </div>
            </div>
    );
}