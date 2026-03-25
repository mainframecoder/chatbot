const API_URL = "https://ai-widget-uhpi.onrender.com/chat";

// ================= USER ID =================
function getUserId() {
  let id = localStorage.getItem("userId");
  if (!id) {
    id = "user_" + Math.random().toString(36).substring(2);
    localStorage.setItem("userId", id);
  }
  return id;
}

// ================= FORMAT RESPONSE =================
function formatReply(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") // bold
    .replace(/\n/g, "<br>"); // line breaks
}

// ================= ADD MESSAGE =================
function addMessage(content, type) {
  const chatBox = document.getElementById("chat-box");

  const msg = document.createElement("p");
  msg.classList.add("message", type);
  msg.innerHTML = content;

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  return msg;
}

// ================= SEND MESSAGE =================
async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();

  if (!message) return;

  // Show user message
  addMessage(`<b>You:</b> ${message}`, "user");
  input.value = "";

  // Show typing
  const thinkingMsg = addMessage(`<b>Bot:</b> <span class="typing"></span>`, "bot");

  try {
    let res;

    // Retry logic (Render sleep fix)
    for (let i = 0; i < 3; i++) {
      try {
        res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: message,
            userId: getUserId(),
            clientId: "client_1"
          })
        });

        if (res.ok) break;

      } catch (err) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    if (!res) throw new Error("No response");

    const data = await res.json();

    // Replace typing with actual response
    thinkingMsg.innerHTML = `<b>Bot:</b> ${formatReply(data.reply)}`;

  } catch (err) {
    thinkingMsg.innerHTML = "⚠️ Server waking up or error. Try again.";
    console.error(err);
  }
}
