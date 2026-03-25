const submitContainer = document.getElementById("submitContainer");
const loginBlock = document.getElementById("loginBlock");
const sourcesContainer = document.getElementById("sourcesContainer");
const addSourceBtn = document.getElementById("addSourceBtn");

/* ===============================
   ACCESS CONTROL (unchanged)
=============================== */

function updateSubmitVisibility() {

  const token = localStorage.getItem("veridex_token");
  const verified = localStorage.getItem("veridex_verified");

  if (!token) {
    loginBlock.style.display = "block";
    submitContainer.style.display = "none";
    return;
  }

  if (verified !== "true") {
    loginBlock.innerHTML = `
      <h2>Email Verification Required</h2>
      <p>Please verify your email to unlock claim submission.</p>
    `;
    loginBlock.style.display = "block";
    submitContainer.style.display = "none";
    return;
  }

  loginBlock.style.display = "none";
  submitContainer.style.display = "block";
}

updateSubmitVisibility();

/* ===============================
   ERROR + LOADER ELEMENTS
=============================== */

const claimError = document.getElementById("claimError");
const sourceError = document.getElementById("sourceError");
const submitBtn = document.getElementById("submitBtn");
const btnText = document.getElementById("btnText");
const btnLoader = document.getElementById("btnLoader");

function clearErrors() {
  if (claimError) claimError.textContent = "";
  if (sourceError) sourceError.textContent = "";
}

/* ===============================
   REAL-TIME VALIDATION
=============================== */

const claimInput = document.getElementById("claimText");

claimInput.addEventListener("input", () => {

  const text = claimInput.value.trim();

  if (!text) {
    claimError.textContent = "Claim is required";
    return;
  }

  if (text.length < 10) {
    claimError.textContent = "Minimum 10 characters required";
    return;
  }

  if (text.length > 500) {
    claimError.textContent = "Maximum 500 characters allowed";
    return;
  }

  const invalidPattern = /[<>$%{}]/;
  if (invalidPattern.test(text)) {
    claimError.textContent = "Invalid characters detected";
    return;
  }

  claimError.textContent = "";
});

sourcesContainer.addEventListener("input", () => {

  const blocks = document.querySelectorAll(".source-block");

  for (let block of blocks) {

    const type = block.querySelector(".sourceType").value;
    const url = block.querySelector(".sourceURL").value.trim();
    const file = block.querySelector(".referenceFile").files[0];

    if (!type) {
      sourceError.textContent = "Select source type";
      return;
    }

    if (!url && !file) {
      sourceError.textContent = "Provide URL or upload file";
      return;
    }

    if (url) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(url)) {
        sourceError.textContent = "Invalid URL format";
        return;
      }
    }

    if (file && file.size > 5 * 1024 * 1024) {
      sourceError.textContent = "File must be < 5MB";
      return;
    }
  }

  sourceError.textContent = "";
});

/* ===============================
   MULTIPLE SOURCE BLOCKS
=============================== */

const maxSources = 5;

function createSourceBlock() {

  const count = document.querySelectorAll(".source-block").length;

  if (count >= maxSources) {
    sourceError.textContent = "Maximum 5 sources allowed";
    return;
  }

  const block = document.createElement("div");
  block.className = "source-block";

  block.innerHTML = `
    <select class="sourceType">
      <option value="">Select source type</option>
      <option value="official">Official</option>
      <option value="media">Media</option>
      <option value="document">Document</option>
      <option value="user">Public / Social</option>
    </select>

    <input type="url" class="sourceURL"
      placeholder="https://example.com/reference">

    <input type="file" class="referenceFile"
      accept=".pdf,.jpg,.png">

    <hr>
  `;

  sourcesContainer.appendChild(block);
}

addSourceBtn.addEventListener("click", createSourceBlock);
createSourceBlock();

/* ===============================
   SUBMIT CLAIM
=============================== */

submitBtn.addEventListener("click", async () => {

  clearErrors();

  const token = localStorage.getItem("veridex_token");

  const claimText =
    document.getElementById("claimText").value.trim();

  /* VALIDATION */

  if (!claimText) {
    claimError.textContent = "Claim is required";
    return;
  }

  if (claimText.length < 10 || claimText.length > 500) {
    claimError.textContent = "Claim must be 10–500 characters";
    return;
  }

  const invalidPattern = /[<>$%{}]/;
  if (invalidPattern.test(claimText)) {
    claimError.textContent = "Invalid characters detected";
    return;
  }

  const blocks = document.querySelectorAll(".source-block");

  if (blocks.length === 0) {
    sourceError.textContent = "At least one reference required";
    return;
  }

  let validSources = 0;

  for (let block of blocks) {

    const type = block.querySelector(".sourceType").value;
    const url = block.querySelector(".sourceURL").value.trim();
    const file = block.querySelector(".referenceFile").files[0];

    if (!type) {
      sourceError.textContent = "Select source type";
      return;
    }

    if (!url && !file) {
      sourceError.textContent = "Provide URL or upload file";
      return;
    }

    if (url) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(url)) {
        sourceError.textContent = "Enter valid URL";
        return;
      }
    }

    if (file && file.size > 5 * 1024 * 1024) {
      sourceError.textContent = "File must be less than 5MB";
      return;
    }

    validSources++;
  }

  if (validSources === 0) {
    sourceError.textContent = "At least one valid source required";
    return;
  }

  /* LOADING */

  submitBtn.disabled = true;
  btnText.textContent = "Submitting...";
  btnLoader.classList.remove("hidden");

  try {

    /* CREATE CLAIM */
    const claimRes = await fetch(`${API_BASE}/claims`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ claimText })
    });

    const claimData = await claimRes.json();

    if (!claimRes.ok) {
      claimError.textContent = claimData.error;
      throw new Error();
    }

    /* ADD SOURCES */
    for (let block of blocks) {

      const type = block.querySelector(".sourceType").value;
      const url = block.querySelector(".sourceURL").value.trim();
      const file = block.querySelector(".referenceFile").files[0];

      if (!type) continue;

      const formData = new FormData();
      formData.append("claimId", claimData._id);
      formData.append("sourceType", type);

      if (url) formData.append("sourceURL", url);
      if (file) formData.append("referenceFile", file);

      await fetch(`${API_BASE}/sources`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
    }

    /* WAIT FOR EVALUATION */
    await new Promise(resolve => setTimeout(resolve, 400));

    /* GET UPDATED CLAIM */
    const res = await fetch(`${API_BASE}/claims/${claimData._id}`);
    const updatedClaim = await res.json();

    /* SUCCESS SCREEN */
    submitContainer.innerHTML = `
      <div style="text-align:center; padding:40px;">
        <h2 style="color:green;">✅ Claim Submitted Successfully</h2>

        <p style="margin-top:20px; font-size:18px;">
          Reliability Score: <b>${updatedClaim.reliabilityScore ?? "Calculating..."}</b>
        </p>

        <p style="font-size:16px; margin-top:10px;">
          Confidence Level: <b>${updatedClaim.confidenceLevel || "Pending"}</b>
        </p>

        <button onclick="window.location.href='index.html'"
          style="margin-top:20px; padding:10px 20px;">
          Go to Home
        </button>
      </div>
    `;

  } catch (err) {

    console.error(err);

    submitBtn.disabled = false;
    btnText.textContent = "Submit Claim";
    btnLoader.classList.add("hidden");
  }

});