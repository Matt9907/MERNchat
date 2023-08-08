export default function Chat(){
    return(
        <div className="flex h-screen">
            <div className = "bg-white w-1/3 flex-col">
                Contacts
            </div>
            <div className="flex flex-col bg-blue-50 w-2/3 p-2">
                <div className="flex-grow"> 
                messages with selected persons
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