const API_URL = "/chat";

const USER_ID = "user123";
const CLIENT_ID = "client123";

async function sendMessage() {
    const input = document.getElementById("user-input");
    const message = input.value.trim();

    if (!message) return;

    addMessage(message, "user");
    input.value = "";

    const chatBox = document.getElementById("chat-box");

    const msg = document.createElement("div");
    msg.classList.add("message", "bot");
    chatBox.appendChild(msg);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                message,
                userId: USER_ID,
                clientId: CLIENT_ID
            })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            msg.innerText += decoder.decode(value);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

    } catch {
        msg.innerText = "⚠️ Error";
    }
}

function addMessage(text, sender) {
    const chatBox = document.getElementById("chat-box");

    const msg = document.createElement("div");
    msg.classList.add("message", sender);
    msg.innerText = text;

    chatBox.appendChild(msg);
}

function setTheme(event, theme) {
    document.body.className = theme;
}
