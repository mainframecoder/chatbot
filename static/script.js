document.addEventListener("DOMContentLoaded", () => {

    const USER_ID = localStorage.getItem("uid") || "demoUser";
    const CLIENT_ID = "client123";

    const input = document.getElementById("user-input");
    const chatBox = document.getElementById("chat-box");

    function addMessage(text, sender) {
        const msg = document.createElement("div");
        msg.classList.add("message", sender);
        msg.innerText = text;

        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;

        return msg;
    }

    async function sendMessage() {
        const message = input.value.trim();
        if (!message) return;

        addMessage(message, "user");
        input.value = "";

        const botMsg = addMessage("...", "bot");

        try {
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

        } catch (err) {
            console.error(err);
            botMsg.innerText = "⚠️ Server error";
        }
    }

    function newChat() {
        chatBox.innerHTML = "";
    }

    function toggleTheme() {
        document.body.classList.toggle("light");
    }

    // Enter key
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    // Make global (important for buttons)
    window.sendMessage = sendMessage;
    window.newChat = newChat;
    window.toggleTheme = toggleTheme;
});
