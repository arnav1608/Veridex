/*************************
 * AUTH CHECK (NEW)
 *************************/

const token = localStorage.getItem("veridex_token");
const composer = document.getElementById("discussionComposer");
const loginBlock = document.getElementById("discussionLoginBlock");

function updateDiscussionVisibility() {
  const currentToken = localStorage.getItem("veridex_token");

  if (currentToken) {
    composer.classList.remove("hidden");
    loginBlock.classList.add("hidden");
  } else {
    composer.classList.add("hidden");
    loginBlock.classList.remove("hidden");
  }
}

updateDiscussionVisibility();

/*************************
 * CLAIM CONTEXT
 *************************/
const params = new URLSearchParams(window.location.search);
const claimId = params.get("claimId") || "global";

/*************************
 * CONFIG
 *************************/
const API = "http://localhost:3001";

/*************************
 * STATE
 *************************/
let posts = [];
let currentPostType = "text";
let currentSort = "top";

/*************************
 * UTILS
 *************************/
function relativeTime(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return `${Math.floor(s / 86400)} days ago`;
}

/*************************
 * LOAD POSTS
 *************************/
async function loadPosts() {
  const res = await fetch(`${API}/discussions`);
  posts = await res.json();
  render();

  // ✅ FIX SHARE SCROLL
  if (location.hash) {
    const id = location.hash.substring(1);

    setTimeout(() => {
      const el = document.getElementById(id);

      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        el.style.border = "2px solid cyan";
      }
    }, 300);
  }
}

/*************************
 * POST TYPE SWITCH
 *************************/
function setPostType(type, btn) {
  currentPostType = type;

  document
    .querySelectorAll(".post-type-tabs button")
    .forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  postText.classList.add("hidden");
  postLink.classList.add("hidden");
  postImage.classList.add("hidden");
  pollBox.classList.add("hidden");

  if (type === "text") postText.classList.remove("hidden");
  if (type === "link") postLink.classList.remove("hidden");
  if (type === "image") postImage.classList.remove("hidden");
  if (type === "poll") pollBox.classList.remove("hidden");
}

function addPollOption() {
  const input = document.createElement("input");
  input.className = "poll-option";
  input.placeholder = "Another option";
  pollBox.insertBefore(input, pollBox.querySelector(".add-option"));
}

/*************************
 * CREATE POST (JWT ADDED)
 *************************/
async function createPost() {
  const token = localStorage.getItem("veridex_token");
  if (!token) return updateDiscussionVisibility();

  let post = {
    id: Date.now().toString(), // ✅ FIX ADDED
   claimId: claimId || "global",
    type: currentPostType,
    votes: { up: [], down: [] },
    replies: []
  };

  if (currentPostType === "text") {
    if (!postText.value.trim()) return alert("Write something");
    post.content = postText.value.trim();
  }

  if (currentPostType === "link") {
    if (!postLink.value.trim()) return alert("Paste a link");
    post.link = postLink.value.trim();
  }

  if (currentPostType === "poll") {
    const question = pollQuestion.value.trim();
    const options = [...document.querySelectorAll(".poll-option")]
      .map(o => o.value.trim())
      .filter(Boolean);

    if (!question || options.length < 2)
      return alert("Poll needs a question and at least 2 options");

    post.poll = {
      question,
      options: options.map(o => ({ text: o, votes: [] }))
    };
  }

 if (currentPostType === "image") {
  const files = postImage.files;
  if (!files.length) return alert("Select at least one image");

  post.image = [];

  for (let file of files) {
    const reader = new FileReader();

    await new Promise(resolve => {
      reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;

        img.onload = function () {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const MAX_WIDTH = 600;
          const scale = MAX_WIDTH / img.width;

          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressed = canvas.toDataURL("image/jpeg", 0.6);
          post.image.push(compressed);

          resolve();
        };
      };

      reader.readAsDataURL(file);
    });
  }

  const res = await fetch(`${API}/discussions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(post)
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.error);
    return;
  }

  await loadPosts();

  return; // 🔥🔥🔥 VERY IMPORTANT
}

  const res = await fetch(`${API}/discussions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(post)
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.error);
    return;
  }

  postText.value = "";
  postLink.value = "";
  if (pollQuestion) pollQuestion.value = "";

  await loadPosts();
}
/*************************
 * VOTING (JWT ADDED)
 *************************/
async function vote(postId, type) {
  const token = localStorage.getItem("veridex_token");
  if (!token) return updateDiscussionVisibility();

  await fetch(`${API}/discussions/${postId}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ type })
  });

  await loadPosts();
}

/*************************
 * REPLIES (JWT ADDED)
 *************************/
async function submitReply(parentId) {
  const token = localStorage.getItem("veridex_token");
  if (!token) return updateDiscussionVisibility();

  const box = document.getElementById(`reply-text-${parentId}`);
  if (!box.value.trim()) return;

  const postElement = document.getElementById(parentId)?.closest(".card");
  const postId = postElement?.id || parentId;

  const reply = {
    id: Date.now().toString(),
    parentId: parentId,
    content: box.value.trim(),
    votes: { up: [], down: [] },
    replies: []
  };

  await fetch(`${API}/discussions/${postId}/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(reply)
  });

  box.value = "";
  await loadPosts();
}

/*************************
 * REMAINING CODE UNCHANGED
 *************************/

function toggleReplyBox(id) {
  document.getElementById(`reply-${id}`).classList.toggle("hidden");
}

function countReplies(list) {
  return list.reduce(
    (s, x) => s + 1 + countReplies(x.replies || []),
    0
  );
}

function toggleReplies(id) {
  document.getElementById(`group-${id}`).classList.toggle("hidden");
}

function renderReplies(list, parentId) {
  if (!list || !list.length) return "";

  return `
    <div class="reply-toggle" onclick="toggleReplies('${parentId}')">
      View replies (${countReplies(list)})
    </div>

    <div class="reply-group hidden" id="group-${parentId}">
      ${list
        .map(
          r => `
        <div class="replies">
          <div class="card">
            <b>${r.author?.email || "User"}</b> • ${relativeTime(r.createdAt)}
            <p>${r.content}</p>

            <div class="actions">
  <span onclick="vote('${r.id}','up')">👍 ${r.votes.up.length}</span>
  <span onclick="vote('${r.id}','down')">👎 ${r.votes.down.length}</span>
  <span onclick="toggleReplyBox('${r.id}')">Reply</span>
  <span onclick="copyLink('${r.id}')">🔗 Share</span>
</div>

<div id="reply-${r.id}" class="hidden">
  <textarea id="reply-text-${r.id}"></textarea>
  <button onclick="submitReply('${r.id}')">Post</button>
</div>

            ${renderReplies(r.replies || [], r.id)}
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function renderPost(p) {

  if (p.type === "text") return `<p>${p.content}</p>`;
  if (p.type === "link")
    return `<a href="${p.link}" target="_blank">${p.link}</a>`;
  if (p.type === "image") {
  if (Array.isArray(p.image)) {
    return `
      <div class="image-grid">
        ${p.image.map(img => `
          <img src="${img}" class="post-image-thumb"
               onclick="openImage('${img}')">
        `).join("")}
      </div>
    `;
  }

  return `
    <img src="${p.image}" class="post-image-thumb"
         onclick="openImage('${p.image}')">
  `;
}

  if (p.type === "poll") {
  const total =
    p.poll.options.reduce((s, o) => s + o.votes.length, 0) || 1;

  return `
    <p><b>${p.poll.question}</b></p>
    ${p.poll.options
      .map((o, index) => {
        const pct = Math.round((o.votes.length / total) * 100);
        return `
          <div class="poll-bar"
               onclick="votePoll('${p.id}', ${index})">
            <div class="poll-fill" style="width:${pct}%">
              ${o.text} — ${pct}%
            </div>
          </div>`;
      })
      .join("")}
  `;
}
}
async function votePoll(postId, optionIndex) {
  const token = localStorage.getItem("veridex_token");
  if (!token) return updateDiscussionVisibility();

  await fetch(`${API}/discussions/${postId}/poll`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ optionIndex })
  });

  await loadPosts();
}

function render() {
  let list = [...posts];
const searchTerm =
  document.getElementById("searchBox")?.value?.toLowerCase() || "";

if (searchTerm) {
  list = list.filter(p =>
    p.content?.toLowerCase().includes(searchTerm) ||
    p.link?.toLowerCase().includes(searchTerm)
  );
}
  if (currentSort === "top") {
    list.sort(
      (a, b) =>
        b.votes.up.length -
        b.votes.down.length -
        (a.votes.up.length - a.votes.down.length)
    );
  }

  if (currentSort === "new") {
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
if (currentSort === "discussed") {
  list.sort(
    (a, b) =>
      countReplies(b.replies || []) -
      countReplies(a.replies || [])
  );
}
  feed.innerHTML = list
    .map(
      p => `
    <div class="card" id="${p.id}">
      <b>${p.author?.email || "User"}</b> • ${relativeTime(p.createdAt)}
      ${renderPost(p)}

      <div class="actions">
        <span onclick="vote('${p.id}','up')">👍 ${p.votes.up.length}</span>
        <span onclick="vote('${p.id}','down')">👎 ${p.votes.down.length}</span>
        <span onclick="toggleReplyBox('${p.id}')">Reply</span>
        <span onclick="copyLink('${p.id}')">🔗 Share</span>
      </div>

      <div id="reply-${p.id}" class="hidden">
        <textarea id="reply-text-${p.id}"></textarea>
        <button onclick="submitReply('${p.id}')">Post</button>
      </div>

      ${renderReplies(p.replies || [], p.id)}
    </div>
  `
    )
    .join("");
    
}
function setSort(type) {
  currentSort = type;

  document
    .querySelectorAll(".sort-bar span")
    .forEach(s => s.classList.remove("active"));

  event.target.classList.add("active");

  render();
}
function copyLink(id) {
  const url = `${window.location.origin}/discussion.html#${id}`;
  navigator.clipboard.writeText(url);

  const toast = document.getElementById("toast");
  toast.classList.remove("hidden");

  setTimeout(() => toast.classList.add("hidden"), 2000);
}

function openImage(src) {
  document.getElementById("imageModal").classList.remove("hidden");
  document.getElementById("fullImage").src = src;
}

function closeImage() {
  document.getElementById("imageModal").classList.add("hidden");
}

loadPosts();