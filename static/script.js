const USER_ID = localStorage.getItem("uid") || "demoUser";
const CLIENT_ID = "client123";

function addMessage(text, sender) {
    const chatBox = document.getElementById("chat-box");

    const msg = document.createElement("div");
    msg.classList.add("message", sender);
    msg.innerText = text;

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;

    return msg;
}

async function sendMessage() {
    const input = document.getElementById("user-input");
    const message = input.value.trim();

    if (!message) return;

    addMessage(message, "user");
    input.value = "";

    const botMsg = addMessage("", "bot");

    const response = await fetch("/chat-stream", {
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

    let fullText = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullText += chunk;
        botMsg.innerText = fullText;
    }
}

// New Chat
function newChat() {
    document.getElementById("chat-box").innerHTML = "";
}

// Theme toggle
function toggleTheme() {
    document.body.classList.toggle("light");
}

// Enter key
document.getElementById("user-input")
.addEventListener("keypress", function(e) {
    if (e.key === "Enter") sendMessage();
});
