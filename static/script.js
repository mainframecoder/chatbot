const API_URL = "/chat"; // SAME BACKEND (important)

const messagesDiv = document.getElementById("messages");
const input = document.getElementById("input");

function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.innerText = text;
  messagesDiv.appendChild(div);

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  // typing indicator
  const typing = document.createElement("div");
  typing.className = "msg bot";
  typing.innerText = "Typing...";
  messagesDiv.appendChild(typing);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    typing.remove();
    addMessage(data.response, "bot");

  } catch (err) {
    typing.innerText = "Error connecting to server";
  }
}

function newChat() {
  messagesDiv.innerHTML = "";
}

// ENTER key support
input.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});
