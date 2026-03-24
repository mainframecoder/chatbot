const API_URL = "https://ai-widget-1.onrender.com/chat";

document.getElementById("send-btn").addEventListener("click", sendMessage);

async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value;

  if (!message) return;

  const chatBox = document.getElementById("chat-box");

  chatBox.innerHTML += `<p><b>You:</b> ${message}</p>`;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        userId: "user_1",
        clientId: "client_1"
      }),
    });

    const data = await res.json();

    chatBox.innerHTML += `<p><b>Bot:</b> ${data.reply}</p>`;
  } catch (err) {
    chatBox.innerHTML += `<p style="color:red;">⚠️ Server error. Try again.</p>`;
    console.error(err);
  }

  input.value = "";
}
