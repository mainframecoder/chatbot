(function () {
  // 💬 Button
  const btn = document.createElement("div");
  btn.innerHTML = "💬";
  btn.style = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 55px;
    height: 55px;
    background: linear-gradient(135deg, #6d28d9, #2563eb);
    color: white;
    border-radius: 50%;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:22px;
    cursor:pointer;
    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
    z-index:9999;
  `;
  document.body.appendChild(btn);

  // 📦 Chatbox
  const box = document.createElement("div");
  box.style = `
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 340px;
    height: 480px;
    background: #0f172a;
    border-radius: 16px;
    box-shadow: 0 15px 40px rgba(0,0,0,0.6);
    display: none;
    flex-direction: column;
    overflow: hidden;
    font-family: Arial;
    z-index:9999;
  `;

  box.innerHTML = `
    <div style="padding:14px; background:linear-gradient(135deg,#6d28d9,#2563eb); font-weight:bold;">
      AI Assistant
    </div>

    <div id="chat-messages" style="flex:1; padding:10px; overflow-y:auto;"></div>

    <div style="display:flex; border-top:1px solid #1f2937;">
      <input id="chat-input" placeholder="Ask about products..." 
        style="flex:1; padding:10px; border:none; background:#111827; color:white;">
      <button id="send-btn" style="padding:10px; background:#2563eb; color:white; border:none;">
        ➤
      </button>
    </div>
  `;

  document.body.appendChild(box);

  // Toggle
  btn.onclick = () => {
    box.style.display = box.style.display === "none" ? "flex" : "none";
  };

  // Message UI
  function addMsg(text, sender) {
    const chat = document.getElementById("chat-messages");

    const div = document.createElement("div");
    div.style = `
      margin:6px 0;
      padding:8px 12px;
      border-radius:12px;
      max-width:75%;
      ${sender === "user" 
        ? "background:#2563eb; margin-left:auto;" 
        : "background:#1f2937;"}
    `;
    div.innerText = text;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  // Send
  async function sendMessage() {
    const input = document.getElementById("chat-input");
    const msg = input.value.trim();
    if (!msg) return;

    addMsg(msg, "user");
    input.value = "";

    try {
      const res = await fetch("https://chatbot-v4tn.onrender.com/chat", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          message: msg,
          userId: "user1",
          clientId: "store1"
        })
      });

      const data = await res.json();
      addMsg(data.reply, "bot");

    } catch {
      addMsg("Error connecting", "bot");
    }
  }

  // Events
  box.querySelector("#send-btn").onclick = sendMessage;
  box.querySelector("#chat-input").addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });

})();
