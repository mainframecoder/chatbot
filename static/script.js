const API_URL = "/chat";

const USER_ID = "user123";
const CLIENT_ID = "client123";

async function sendMessage() {
    const input = document.getElementById("user-input");
    const message = input.value.trim();

    if (!message) return;

    addMessage(message, "user");
    input.value = "";

    showTyping(true);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                userId: USER_ID,
                clientId: CLIENT_ID
            })
        });

        const data = await response.json();

        showTyping(false);
        addMessage(data.reply, "bot");

    } catch (err) {
        showTyping(false);
        addMessage("⚠️ Error connecting to server", "bot");
    }
}

function addMessage(text, sender) {
    const chatBox = document.getElementById("chat-box");

    const msg = document.createElement("div");
    msg.classList.add("message", sender);
    msg.innerText = text;

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping(show) {
    document.getElementById("typing").classList.toggle("hidden", !show);
}

document.getElementById("user-input")
.addEventListener("keypress", function(e) {
    if (e.key === "Enter") sendMessage();
});
