(function () {
  // 💬 Chat Button
  const btn = document.createElement("button");
  btn.innerText = "💬";
  btn.style = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: black;
    color: white;
    border: none;
    cursor: pointer;
    z-index: 9999;
  `;
  document.body.appendChild(btn);

  // 📦 Chat Box
  const box = document.createElement("div");
  box.style = `
    display: none;
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 320px;
    height: 420px;
    background: #111;
    color: white;
    border-radius: 10px;
    padding: 10px;
    z-index: 9999;
    font-family: Arial;
  `;

  box.innerHTML = `
    <div style="font-weight:bold; margin-bottom:10px;">AI Assistant</div>
    <div id="chat-messages" style="height:300px; overflow-y:auto; font-size:14px;"></div>
    <input id="chat-input" placeholder="Ask something..." style="width:70%; padding:6px;" />
    <button id="send-btn">Send</button>
  `;

  document.body.appendChild(box);

  // 🔁 Toggle Chat
  btn.onclick = () => {
    box.style.display = box.style.display === "none" ? "block" : "none";
  };

  // 📩 Send Message
  async function sendMessage() {
    const input = document.getElementById("chat-input");
    const msg = input.value.trim();
    if (!msg) return;

    const chat = document.getElementById("chat-messages");

    chat.innerHTML += `<div><b>You:</b> ${msg}</div>`;
    input.value = "";

    try {
      const res = await fetch("https://chatbot-v4tn.onrender.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: msg,
          userId: "user1",
          clientId: "default"
        })
      });

      const data = await res.json();

      chat.innerHTML += `<div><b>Bot:</b> ${data.reply}</div>`;
      chat.scrollTop = chat.scrollHeight;

    } catch (err) {
      chat.innerHTML += `<div style="color:red;">Error connecting</div>`;
    }
  }

  // 🎯 Button click
  box.querySelector("#send-btn").onclick = sendMessage;

  // ⌨️ Enter key
  box.querySelector("#chat-input").addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendMessage();
  });

})();
