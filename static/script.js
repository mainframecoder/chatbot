const API = "";

let token = localStorage.getItem("token");

async function login() {
  const email = prompt("Email");
  const password = prompt("Password");

  const res = await fetch(API + "/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  token = data.token;
  localStorage.setItem("token", token);

  loadHistory();
}

async function sendMessage() {
  const input = document.getElementById("input");
  const text = input.value;
  input.value = "";

  addMessage(text, "user");

  const res = await fetch(API + "/chat?token=" + token, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ message: text })
  });

  const data = await res.json();

  // typing effect
  const div = addMessage("", "bot");
  let i = 0;

  const interval = setInterval(() => {
    div.innerText += data.response[i];
    i++;
    if (i >= data.response.length) clearInterval(interval);
  }, 20);
}

async function loadHistory() {
  const res = await fetch(API + "/history?token=" + token);
  const data = await res.json();

  document.getElementById("messages").innerHTML = "";

  data.forEach(m => addMessage(m.text, m.role));
}

function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.innerText = text;
  document.getElementById("messages").appendChild(div);
  return div;
}

if (!token) login();
else loadHistory();
