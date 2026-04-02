const API_URL = "/chat"; // ✅ FIXED

// ✅ Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("send-btn");
  const input = document.getElementById("user-input");

  sendBtn.addEventListener("click", sendMessage);

  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
});

async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();

  if (!message) return;

  const chatBox = document.getElementById("chat-box");

  chatBox.innerHTML += `<p><b>You:</b> ${message}</p>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        userId: "user_1",
        clientId: "client_1",
      }),
    });

    const data = await res.json();

    chatBox.innerHTML += `<p><b>Bot:</b> ${data.reply}</p>`;
  } catch (err) {
    chatBox.innerHTML += `<p style="color:red;">⚠️ Server error. Try again.</p>`;
    console.error(err);
  }

  input.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;
}
