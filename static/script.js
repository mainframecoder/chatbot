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

    let fullText = "";
    let cursor = true;

    const cursorInterval = setInterval(() => {
        msg.innerHTML = renderMarkdown(fullText + (cursor ? "▌" : ""));
        cursor = !cursor;
    }, 400);

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
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;

            msg.innerHTML = renderMarkdown(fullText + "▌");
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        clearInterval(cursorInterval);

        msg.innerHTML = renderMarkdown(fullText);
        addCopyButtons(msg);

    } catch (err) {
        msg.innerText = "⚠️ Error";
        clearInterval(cursorInterval);
    }
}

function renderMarkdown(text) {
    return marked.parse(text);
}

function addCopyButtons(container) {
    container.querySelectorAll("pre").forEach(block => {
        const btn = document.createElement("button");
        btn.innerText = "Copy";
        btn.className = "copy-btn";

        btn.onclick = () => {
            navigator.clipboard.writeText(block.innerText);
            btn.innerText = "Copied!";
            setTimeout(() => btn.innerText = "Copy", 1000);
        };

        block.appendChild(btn);
    });
}

function addMessage(text, sender) {
    const chatBox = document.getElementById("chat-box");

    const msg = document.createElement("div");
    msg.classList.add("message", sender);

    if (sender === "bot") {
        msg.innerHTML = renderMarkdown(text);
    } else {
        msg.innerText = text;
    }

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function setTheme(event, theme) {
    document.body.className = theme;
}
