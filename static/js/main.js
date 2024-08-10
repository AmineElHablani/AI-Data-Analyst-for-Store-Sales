function getBotResponse(){
    let userInput = document.getElementById("userMessage") 
    let newUserMessage = document.createElement("div");
    let userMessage = userInput.value
    newUserMessage.innerHTML=`<p> ${userMessage}</p>`
    newUserMessage.className = "user-message"

    let conversationBody = document.getElementById("chatbotBody")
    //append the new message to the conversation body 
    conversationBody.append(newUserMessage)
    conversationBody.scrollTop = conversationBody.scrollHeight;  // automaticaly scroll => always show the lastest messages
    userInput.value=''
    userInput.disabled = true
    //get the bot's message
    $.get("/get", { msg: userMessage }).done(function(data) { // send the user message as a variable name msg to /get (as a http get)
        ///.done = when the user message has been sent successfully, execute this callback function
        //data is the variable returned from our flask chatbot function
        
        let botMessage = document.createElement("div");
        botMessage.innerHTML=`<p> ${data}</p>`
        botMessage.className = "bot-message"
        conversationBody.append(botMessage)
        conversationBody.scrollTop = conversationBody.scrollHeight;
        userInput.disabled = false
 
      });

    

}

document.getElementById("userMessage").addEventListener('keypress',function(e){
    if(e.key === 'Enter'){
        let text = document.getElementById("userMessage").value
        if (text !== ""){
            getBotResponse()
        }
    }
})