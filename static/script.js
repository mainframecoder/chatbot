const API_URL = "/chat";

const USER_ID = "user123";
const CLIENT_ID = "client123";

// SEND MESSAGE
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

// ADD MESSAGE
function addMessage(text, sender) {
    const chatBox = document.getElementById("chat-box");

    const msg = document.createElement("div");
    msg.classList.add("message", sender);
    msg.innerText = text;

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// TYPING
function showTyping(show) {
    document.getElementById("typing").classList.toggle("hidden", !show);
}

// ENTER KEY
document.getElementById("user-input")
.addEventListener("keypress", function(e) {
    if (e.key === "Enter") sendMessage();
});

// THEME SWITCH
function setTheme(theme) {
    document.body.className = theme;
}
