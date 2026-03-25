// ================= FEEDBACK HANDLER =================

document.getElementById("feedbackForm").addEventListener("submit", e => {
  e.preventDefault();

  const feedback = {
    name: document.getElementById("fbName").value.trim(),
    email: document.getElementById("fbEmail").value.trim(),
    message: document.getElementById("fbMessage").value.trim(),
    time: new Date().toISOString()
  };

  if (!feedback.name || !feedback.email || !feedback.message) {
    alert("Please fill all fields");
    return;
  }

  // Store locally (MVP behavior)
  const list = JSON.parse(localStorage.getItem("veridex_feedback")) || [];
  list.push(feedback);
  localStorage.setItem("veridex_feedback", JSON.stringify(list));

  alert("Thank you! Your feedback has been sent to the moderator.");

  e.target.reset();
});