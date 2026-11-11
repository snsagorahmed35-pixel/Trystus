const $ = s => document.querySelector(s);
const modal = $("#modal"), form = $("#authForm");
let mode = "register";
function openAuth(next) {
  mode = next; modal.classList.add("show");
  $("#modalTitle").textContent = next === "register" ? "অ্যাকাউন্ট তৈরি করুন" : "লগইন করুন";
  $("#nameField").style.display = next === "register" ? "block" : "none";
  form.elements.ageConfirmed.parentElement.style.display = next === "register" ? "flex" : "none";
  $("#formMessage").textContent = "";
}
$("#registerOpen").onclick = $("#heroJoin").onclick = $("#joinBottom").onclick = () => openAuth("register");
$("#loginOpen").onclick = () => openAuth("login");
$("#close").onclick = () => modal.classList.remove("show");
modal.addEventListener("click", e => { if(e.target === modal) modal.classList.remove("show"); });
form.addEventListener("submit", async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  data.ageConfirmed = form.elements.ageConfirmed.checked;
  try {
    const r = await fetch(`/api/${mode}`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    const out = await r.json();
    if(!r.ok) throw new Error(out.error || "সমস্যা হয়েছে");
    $("#formMessage").textContent = mode === "register" ? "অ্যাকাউন্ট তৈরি হয়েছে।" : "লগইন সফল হয়েছে।";
    setTimeout(()=>modal.classList.remove("show"),900);
  } catch(err) { $("#formMessage").textContent = err.message; }
});
async function loadProfiles() {
  const q = encodeURIComponent($("#search").value || "");
  const host = $("#profiles");
  try {
    const r = await fetch(`/api/profiles?q=${q}`), out = await r.json();
    host.innerHTML = "";
    if(!out.profiles.length) { host.innerHTML = '<p class="muted">এখনো কোনো অনুমোদিত প্রোফাইল নেই। পরে আবার দেখুন।</p>'; return; }
    out.profiles.forEach(p => {
      const card = document.createElement("article"); card.className = "profile";
      const title = document.createElement("h3"); title.textContent = p.displayName;
      const city = document.createElement("small"); city.textContent = p.city;
      const about = document.createElement("p"); about.textContent = p.about;
      card.append(title,city,about); host.append(card);
    });
  } catch { host.textContent = "প্রোফাইল লোড করা যায়নি।"; }
}
$("#searchBtn").onclick = loadProfiles;
loadProfiles();
