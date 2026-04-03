document.addEventListener("DOMContentLoaded", () => {

    const API = window.location.origin; // ✅ same backend

    const input = document.getElementById("user-input");
    const chatBox = document.getElementById("chat-box");
    const sendBtn = document.getElementById("send-btn");

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
            const res = await fetch(`${API}/chat-stream`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ message })
            });

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            let full = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                full += chunk;
                botMsg.innerText = full;
            }

        } catch (err) {
            botMsg.innerText = "Error";
            console.error(err);
        }
    }

    function setTheme(theme) {
        document.body.className = theme;
    }

    sendBtn.addEventListener("click", sendMessage);

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    window.setTheme = setTheme;
});
