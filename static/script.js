const API_URL = "https://ai-widget-1.onrender.com/chat";

// ✅ Wait for DOM to load (FIXES your error)
document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("send-btn");
  const input = document.getElementById("user-input");

  // Click event
  sendBtn.addEventListener("click", sendMessage);

  // Press Enter to send
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

  // ✅ Show user message
  chatBox.innerHTML += `<p><b>You:</b> ${message}</p>`;

  // ✅ Auto scroll
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

    // ✅ Show bot response
    chatBox.innerHTML += `<p><b>Bot:</b> ${data.reply}</p>`;
  } catch (err) {
    chatBox.innerHTML += `<p style="color:red;">⚠️ Server error. Try again.</p>`;
    console.error(err);
  }

  // ✅ Clear input
  input.value = "";

  // ✅ Auto scroll again
  chatBox.scrollTop = chatBox.scrollHeight;
}
