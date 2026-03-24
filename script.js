const API_URL = "/chat";

function getUserId() {
  let id = localStorage.getItem("userId");
  if (!id) {
    id = "user_" + Math.random().toString(36).substring(2);
    localStorage.setItem("userId", id);
  }
  return id;
}

async function sendMessage() {
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");

  const message = input.value.trim();
  if (!message) return;

  chatBox.innerHTML += `<p><b>You:</b> ${message}</p>`;
  input.value = "";

  const id = Date.now();
  chatBox.innerHTML += `<p id="${id}">Thinking...</p>`;

  try {
    const res = await fetch(API_URL, {
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

    const data = await res.json();

    document.getElementById(id).innerHTML =
      `<b>Bot:</b> ${data.reply}`;

  } catch (err) {
    document.getElementById(id).innerHTML =
      "⚠️ Server error. Try again.";
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}
