document.addEventListener("DOMContentLoaded", () => {

    const API = "https://ai-widget-1.onrender.com";

    const USER_ID = localStorage.getItem("uid") || "demoUser";
    const CLIENT_ID = "client123";

    let CURRENT_THREAD = localStorage.getItem("thread") || Date.now().toString();

    const chatBox = document.getElementById("chat-box");
    const input = document.getElementById("user-input");
    const chatList = document.getElementById("chat-list");

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

        input.disabled = true;

        addMessage(message, "user");
        input.value = "";

        const botMsg = addMessage("...", "bot");

        const res = await fetch(`${API}/chat-stream`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                message,
                userId: USER_ID,
                clientId: CLIENT_ID,
                threadId: CURRENT_THREAD
            })
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

        input.disabled = false;

        notify("New message received");
        loadThreads();
    }

    function createNewChat() {
        CURRENT_THREAD = Date.now().toString();
        localStorage.setItem("thread", CURRENT_THREAD);
        chatBox.innerHTML = "";
        loadThreads();
    }

    async function loadThreads() {
        const res = await fetch(`${API}/threads/${CLIENT_ID}/${USER_ID}`);
        const data = await res.json();

        chatList.innerHTML = "";

        data.forEach(t => {
            const div = document.createElement("div");
            div.className = "chat-item";
            div.innerText = t.id;

            div.onclick = () => loadMessages(t.id);

            chatList.appendChild(div);
        });
    }

    async function loadMessages(threadId) {
        CURRENT_THREAD = threadId;
        localStorage.setItem("thread", threadId);

        const res = await fetch(`${API}/messages/${CLIENT_ID}/${USER_ID}/${threadId}`);
        const data = await res.json();

        chatBox.innerHTML = "";

        data.forEach(m => {
            addMessage(m.message, "user");
            addMessage(m.response, "bot");
        });
    }

    function notify(msg) {
        if (Notification.permission === "granted") {
            new Notification(msg);
        } else {
            Notification.requestPermission();
        }
    }

    function setTheme(theme) {
        document.body.className = theme;
        localStorage.setItem("theme", theme);
    }

    // Load initial
    loadThreads();

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) document.body.className = savedTheme;

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    window.sendMessage = sendMessage;
    window.createNewChat = createNewChat;
    window.setTheme = setTheme;
});
