const userId = "user_1";
const clientId = "client_1";
let chatId = "chat_1";

// 🔥 Load usage
async function loadUsage() {
  try {
    const res = await fetch(`/usage/${clientId}/${userId}`);
    const data = await res.json();

    const usageEl = document.getElementById("usage");
    if (usageEl) {
      usageEl.innerText =
        `${data.tokens} / ${data.limit} tokens (${data.plan})`;
    }
  } catch (err) {
    console.error("Usage error:", err);
  }
}

// 🚀 Send message
async function send() {
  const input = document.getElementById("msg");
  const chatBox = document.getElementById("chat-box");

  const text = input.value.trim();
  if (!text) return;

  // 👉 user message
  const userMsg = document.createElement("div");
  userMsg.className = "msg user";
  userMsg.innerText = text;
  chatBox.appendChild(userMsg);

  // 👉 bot message container (for streaming)
  const botMsg = document.createElement("div");
  botMsg.className = "msg bot";
  chatBox.appendChild(botMsg);

  input.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        userId,
        clientId,
        chatId
      })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      botMsg.innerText += decoder.decode(value);
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    loadUsage();

  } catch (err) {
    botMsg.innerText = "❌ Error connecting to server";
    console.error(err);
  }
}

// 🔥 Enter key support
document.getElementById("msg").addEventListener("keypress", function (e) {
  if (e.key === "Enter") send();
});

// init
loadUsage();
