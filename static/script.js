const userId = "user_1";
const clientId = "client_1";
let chatId = "chat_1";

async function loadUsage(){
  const res = await fetch(`/usage/${clientId}/${userId}`);
  const data = await res.json();

  document.getElementById("usage").innerText =
    `${data.tokens} / ${data.limit} tokens (${data.plan})`;
}

async function send(){
  const text = document.getElementById("msg").value;

  const res = await fetch("/chat",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      message:text,
      userId,
      clientId,
      chatId
    })
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let output = "";

  while(true){
    const {done,value} = await reader.read();
    if(done) break;

    output += decoder.decode(value);
    document.getElementById("chat").innerText = output;
  }

  loadUsage();
}

loadUsage();
