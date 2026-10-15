/* ============================================================
   ROJGAR AI — Dashboard App logic
   Onboarding · view router · calendar · toasts · dropdowns ·
   AI · chat · modals · filters · search · live stats
   ============================================================ */

(function () {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ============================================================
     PROFILE & LIVE STATS (localStorage)
  ============================================================ */
  const LS_PROFILE = "rojgar_profile";
  const LS_STATS = "rojgar_stats";

  const DEMO_PROFILE = {
    name: "Aarav Sharma",
    interests: "Design, AI",
    hobbies: "Sketching, gaming",
    skills: "Basic Python",
    goal: "UX / Product role",
  };

  function loadProfile() {
    try {
      return JSON.parse(localStorage.getItem(LS_PROFILE)) || null;
    } catch (e) {
      return null;
    }
  }
  function loadStats() {
    const s = JSON.parse(localStorage.getItem(LS_STATS) || "null");
    return (
      s || { pathsExplored: 0, hoursSpent: 0, lessonsJoined: 0, connections: 0, applied: 0 }
    );
  }
  function saveStats(s) {
    localStorage.setItem(LS_STATS, JSON.stringify(s));
  }

  let profile = loadProfile();
  let stats = loadStats();

  /* ============================================================
     ONBOARDING
  ============================================================ */
  const onboardOverlay = $("#onboardOverlay");
  const onboardForm = $("#onboardForm");

  function openOnboarding(editMode) {
    const sub = $("#onboardSub");
    if (sub) {
      sub.textContent =
        profile && profile.demo
          ? "You're viewing demo data. Add your own details to log in — stats start fresh."
          : "Set up your profile in 10 seconds — everything below is editable later.";
    }
    if (editMode && profile) {
      $("#obName").value = profile.name;
      $("#obInterests").value = profile.interests;
      $("#obHobbies").value = profile.hobbies;
      $("#obSkills").value = profile.skills;
      $("#obGoal").value = profile.goal;
    }
    onboardOverlay.classList.add("show");
    setTimeout(() => $("#obName").focus(), 300);
  }

  function closeOnboarding() {
    onboardOverlay.classList.remove("show");
    $$("#onboardForm input").forEach((i) => i.classList.remove("error"));
  }

  // Real accounts stay signed in; demo accounts are asked to log in again on every refresh
  if (!profile) {
    openOnboarding(false);
  } else if (profile.demo) {
    openOnboarding(true);
  }

  if (onboardForm) {
    onboardForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = $("#obName").value.trim();
      const interests = $("#obInterests").value.trim();
      const hobbies = $("#obHobbies").value.trim();
      const skills = $("#obSkills").value.trim();
      const goal = $("#obGoal").value;

      let valid = true;
      [["#obName", name], ["#obInterests", interests], ["#obHobbies", hobbies], ["#obSkills", skills]].forEach(
        ([sel, v]) => {
          const inp = $(sel);
          inp.classList.toggle("error", !v);
          if (!v) valid = false;
        }
      );
      const goalSel = $("#obGoal");
      goalSel.classList.toggle("error", !goal);
      if (!goal) valid = false;
      if (!valid) return;

      profile = { name, interests, hobbies, skills, goal, demo: false };
      localStorage.setItem(LS_PROFILE, JSON.stringify(profile));
      stats = { pathsExplored: 0, hoursSpent: 0, lessonsJoined: 0, connections: 0, applied: 0 };
      saveStats(stats);
      closeOnboarding();
      applyProfile();
      toast("🎉", "Welcome, " + name.split(" ")[0] + "!", "Your personal dashboard is ready.");
    });
  }

  const obSkip = $("#obSkip");
  if (obSkip) {
    obSkip.addEventListener("click", function () {
      profile = Object.assign({}, DEMO_PROFILE, { demo: true });
      localStorage.setItem(LS_PROFILE, JSON.stringify(profile));
      closeOnboarding();
      applyProfile();
      toast("✨", "Demo profile loaded", "You'll be asked to log in again on refresh — Edit Profile anytime.");
    });
  }

  /* ---------- Personalize the app with the profile ---------- */
  function initials(name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  function applyProfile() {
    if (!profile) return;
    const first = profile.name.split(" ")[0];

    // avatar initials
    const av = $(".avatar-btn");
    if (av) {
      av.innerHTML = "";
      av.textContent = initials(profile.name);
      av.style.fontSize = "0.85rem";
      av.style.fontFamily = "var(--font-head)";
    }

    // welcome banner on dashboard
    let banner = $("#welcomeBanner");
    const dash = $("#view-dashboard");
    if (dash) {
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "welcomeBanner";
        banner.className = "welcome-banner pop in";
        banner.style.setProperty("--d", "0s");
        dash.insertBefore(banner, dash.firstChild);
      }
      banner.innerHTML =
        '<span class="wb-ico">✦</span><div><h2>Welcome back, ' + first + "</h2><p>Goal: " +
        profile.goal + " · Skills: " + profile.skills + "</p></div>" +
        '<button class="wb-edit" data-action="editprofile">Edit Profile</button>';
    }

    // explore header reflects real interests
    const exHead = $("#exploreHeadText");
    if (exHead) {
      exHead.innerHTML =
        'AI-matched paths based on your interests in <strong>' + profile.interests +
        '</strong>, hobbies of <strong>' + profile.hobbies + '</strong>, and skills in <strong>' +
        profile.skills + "</strong>.";
    }

    // greet in chat + AI panel
    $$(".msg.bot .msg-bubble").forEach((b) => {
      if (b.textContent.indexOf("Hi Aarav") !== -1) {
        b.innerHTML = "Hi " + first + "! 👋 I'm your career navigator. Ask me about careers, skills, or opportunities.";
      }
    });

    // live stat numbers
    refreshStats();
  }

  function refreshStats() {
    // Career paths explored — live counter
    const pathNum = $("#pathsNum");
    if (pathNum) {
      pathNum.setAttribute("data-count", stats.pathsExplored);
      const lab = pathNum.closest(".stat-card");
      if (lab) {
        const sub = $(".stat-sub", lab);
        if (sub) {
          sub.textContent = stats.pathsExplored === 0
            ? "explore careers to start your journey"
            : stats.pathsExplored + " path" + (stats.pathsExplored === 1 ? "" : "s") + " discovered so far";
        }
      }
      if (pathNum.textContent !== String(stats.pathsExplored)) animateCount(pathNum);
    }
    // Skill hours — live counter
    const hourNum = $("#hoursNum");
    if (hourNum) {
      hourNum.setAttribute("data-count", stats.hoursSpent);
      const lab = hourNum.closest(".stat-card");
      if (lab) {
        const sub = lab.querySelectorAll(".stat-sub")[0];
        if (sub) {
          sub.textContent = stats.hoursSpent === 0
            ? "join lessons to start tracking"
            : stats.hoursSpent + " hours spent on upskilling";
        }
      }
      if (hourNum.textContent !== String(stats.hoursSpent)) animateCount(hourNum);
    }
    // connections in community card
    const commNum = $(".comm-num");
    if (commNum) commNum.innerHTML = (1350 + stats.connections) + "<span>+</span>";
  }

  /* ============================================================
     1. VIEW ROUTER — sidebar sections switch views
  ============================================================ */
  const views = ["dashboard", "explore", "skills", "jobs", "learning", "network", "chat"];

  function showView(name) {
    if (!views.includes(name)) name = "dashboard";
    $$(".view").forEach((v) => v.classList.remove("active"));
    const target = $("#view-" + name);
    if (target) target.classList.add("active");
    $$(".side-nav .nav-item").forEach((n) => {
      n.classList.toggle("active", n.getAttribute("data-view") === name);
    });
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    $$(".pop", target).forEach((el) => {
      el.classList.remove("in");
      setTimeout(() => el.classList.add("in"), 30);
    });
    if (name === "dashboard") {
      playDashboardFx();
      refreshStats();
    }
    if (name === "jobs") applyJobFilter($(".chip-filter.active"));
    if (name === "explore") applyProfile();
  }

  $$(".side-nav .nav-item").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      showView(item.getAttribute("data-view"));
      closeMobileMenu();
    });
  });

  /* ============================================================
     2. MOBILE SIDEBAR
  ============================================================ */
  const sidebar = $("#sidebar");
  const overlay = $("#overlay");
  const hamburger = $("#hamburger");

  function openMobileMenu() {
    sidebar.classList.add("open");
    overlay.classList.add("show");
  }
  function closeMobileMenu() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  }
  if (hamburger) hamburger.addEventListener("click", openMobileMenu);
  if (overlay) overlay.addEventListener("click", closeMobileMenu);

  /* ============================================================
     3. TOASTS
  ============================================================ */
  const toastWrap = $("#toastWrap");

  function toast(ico, title, msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML =
      '<span class="t-ico">' + ico + "</span><div><b>" + title + "</b>" +
      (msg ? "<div style='font-size:0.76rem;opacity:0.75;font-weight:500'>" + msg + "</div>" : "") +
      "</div>";
    toastWrap.appendChild(el);
    setTimeout(() => {
      el.classList.add("hide");
      setTimeout(() => el.remove(), 320);
    }, 3400);
  }

  /* ============================================================
     4. MODALS
  ============================================================ */
  const modalOverlay = $("#modalOverlay");
  const modalContent = $("#modalContent");

  function openModal(html) {
    modalContent.innerHTML = html;
    modalOverlay.classList.add("show");
    const c = $("#modalClose");
    if (c) c.onclick = closeModal;
  }
  function closeModal() {
    modalOverlay.classList.remove("show");
  }
  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeModal();
      closeAiPanel();
      closeOnboarding();
    }
  });

  const MODALS = {
    apply: () => {
      stats.applied++;
      saveStats(stats);
      openModal(
        '<h3>Apply for this role?</h3>' +
        '<p class="modal-sub">Your profile, CV and skill tracker will be shared with the recruiter. AI will tailor your cover letter.</p>' +
        '<div class="modal-actions">' +
        '<button class="btn-outline" onclick="document.getElementById(\'modalOverlay\').classList.remove(\'show\')">Cancel</button>' +
        '<button class="btn-primary" id="confirmApply">Apply with AI ✨</button>' +
        "</div>"
      );
      $("#confirmApply").onclick = () => {
        closeModal();
        toast("🎉", "Application sent!", "The recruiter typically replies within 3–5 days.");
      };
    },
    schedule: () => {
      openModal(
        '<h3>Schedule Mock Interview</h3>' +
        '<p class="modal-sub">Pick a slot — the AI interviewer adapts to your target role (' +
        (profile ? profile.goal : "UX Designer") + ").</p>" +
        '<div class="modal-actions">' +
        '<button class="btn-outline" onclick="document.getElementById(\'modalOverlay\').classList.remove(\'show\')">Cancel</button>' +
        '<button class="btn-primary" id="confirmSched">Tomorrow, 4:00 PM</button>' +
        "</div>"
      );
      $("#confirmSched").onclick = () => {
        closeModal();
        toast("📅", "Interview scheduled", "Tomorrow at 4:00 PM — invite sent to your email.");
        selectCalDay(new Date().getDate(), "Mock interview at 4:00 PM");
      };
    },
    upgrade: () => {
      openModal(
        '<h3>Upgrade to Pro 🚀</h3>' +
        '<p class="modal-sub">Unlock unlimited AI roadmaps, priority job alerts, 1:1 mentor sessions and certificate reviews.</p>' +
        '<p style="font-size:1.5rem;font-weight:800;margin:10px 0">₹0 <span style="font-size:0.85rem;color:var(--muted);font-weight:600">first month free · then ₹199/mo</span></p>' +
        '<div class="modal-actions">' +
        '<button class="btn-outline" onclick="document.getElementById(\'modalOverlay\').classList.remove(\'show\')">Maybe later</button>' +
        '<button class="btn-primary" id="confirmUpg">Start free month</button>' +
        "</div>"
      );
      $("#confirmUpg").onclick = () => {
        closeModal();
        toast("⭐", "Welcome to Pro!", "Your free month has started — enjoy all features.");
      };
    },
    roadmap: () => {
      // live stat: exploring a career path
      stats.pathsExplored++;
      saveStats(stats);
      refreshStats();
      showView("learning");
      toast("🗺️", "Roadmap opened", "This career path was added to your explored paths.");
    },
    join: () => {
      stats.lessonsJoined++;
      stats.hoursSpent += 2;
      saveStats(stats);
      refreshStats();
      toast("▶️", "Lesson joined", "+2h added to your skill tracker. Keep going!");
    },
    course: () => {
      stats.lessonsJoined++;
      saveStats(stats);
      refreshStats();
      showView("learning");
      toast("📚", "Course opened", "Progress is being tracked in My Skills.");
    },
    connect: () => {
      stats.connections++;
      saveStats(stats);
      refreshStats();
      toast("🤝", "Request sent", "They'll be notified and can accept your connect request.");
    },
    editprofile: () => openOnboarding(true),
    settings: () => {
      openModal(
        '<h3>Settings</h3>' +
        '<p class="modal-sub">Preferences apply instantly across the app.</p>' +
        '<label style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;font-weight:600;border-bottom:1px solid var(--border)">' +
        'Email notifications' +
        '<input type="checkbox" checked style="width:20px;height:20px;accent-color:#8b5cf6" />' +
        "</label>" +
        '<label style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;font-weight:600;border-bottom:1px solid var(--border)">' +
        'Weekly progress digest' +
        '<input type="checkbox" checked style="width:20px;height:20px;accent-color:#8b5cf6" />' +
        "</label>" +
        '<label style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;font-weight:600">' +
        'Public profile' +
        '<input type="checkbox" style="width:20px;height:20px;accent-color:#8b5cf6" />' +
        "</label>" +
        '<div class="modal-actions">' +
        '<button class="btn-primary" id="resetDemo">Reset demo data</button>' +
        '<button class="btn-outline" onclick="document.getElementById(\'modalOverlay\').classList.remove(\'show\')">Close</button>' +
        "</div>"
      );
      $("#resetDemo").onclick = () => {
        stats = { pathsExplored: 0, hoursSpent: 0, lessonsJoined: 0, connections: 0, applied: 0 };
        saveStats(stats);
        closeModal();
        refreshStats();
        toast("♻️", "Demo data reset", "All stats are back to zero — fresh start!");
      };
    },
    support: () => {
      openModal(
        '<h3>Support Center</h3>' +
        '<p class="modal-sub">We typically reply within a few hours.</p>' +
        '<div class="modal-actions">' +
        '<button class="btn-outline" onclick="document.getElementById(\'modalOverlay\').classList.remove(\'show\')">Close</button>' +
        '<button class="btn-primary" onclick="document.getElementById(\'modalOverlay\').classList.remove(\'show\')">Contact support</button>' +
        "</div>"
      );
      toast("💬", "Support ticket created", "Ticket #RJ-2481 — we'll be in touch soon.");
    },
    profile: () => toast("👤", profile ? "Signed in as " + profile.name : "Profile", "Profile page is part of the full release."),
    billing: () => toast("💳", "Billing", "You're on the free plan — no charges yet."),
    logout: () => {
      openModal(
        '<h3>Log out?</h3>' +
        '<p class="modal-sub">Your progress is saved and will be here when you return.</p>' +
        '<div class="modal-actions">' +
        '<button class="btn-outline" onclick="document.getElementById(\'modalOverlay\').classList.remove(\'show\')">Stay</button>' +
        '<button class="btn-primary" id="confirmOut">Log out</button>' +
        "</div>"
      );
      $("#confirmOut").onclick = () => {
        closeModal();
        localStorage.removeItem(LS_PROFILE);
        profile = null;
        toast("👋", "Logged out", "Log in again to continue with your own data.");
        openOnboarding(false);
      };
    },
    addskill: () => {
      openModal(
        '<h3>Add a skill</h3>' +
        '<p class="modal-sub">AI will map it to your career roadmap.</p>' +
        '<input type="text" id="newSkillName" placeholder="e.g. Figma, SQL, Public speaking…" style="width:100%;border:1.5px solid var(--border);border-radius:11px;padding:11px 14px;font-family:inherit;font-size:0.9rem;margin-bottom:16px;outline:none" />' +
        '<div class="modal-actions">' +
        '<button class="btn-outline" onclick="document.getElementById(\'modalOverlay\').classList.remove(\'show\')">Cancel</button>' +
        '<button class="btn-primary" id="confirmSkill">Add skill</button>' +
        "</div>"
      );
      $("#confirmSkill").onclick = () => {
        const v = $("#newSkillName").value.trim();
        closeModal();
        if (v) {
          stats.hoursSpent += 5;
          saveStats(stats);
          refreshStats();
          toast("🎯", "Skill added", v + " mapped to your roadmap. +5h learning credit.");
        }
      };
    },
    invite: () => toast("✉️", "Invite link copied", "Share it with friends to grow your network."),
    courses: () => showView("learning"),
    interview: () => toast("🎤", "Mock interview", "Starting a practice session for " + (profile ? profile.goal : "your target role") + "…"),
    video: () => toast("📹", "Starting call…", "Launching the classroom video room."),
    chat: () => showView("chat"),
    job: () => showView("jobs"),
    lesson: () => showView("learning"),
    community: () => toast("🎉", "You're in!", "Welcome to the Rojgar community."),
    scholarship: () => toast("🎓", "Scholarship saved", "Deadline June 24 — reminder set."),
    markread: () => {
      $$(".notif-item").forEach((n) => n.classList.remove("unread"));
      toast("✅", "All caught up", "Notifications marked as read.");
    },
    ai: () => openAiPanel(),
  };

  document.addEventListener("click", function (e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.getAttribute("data-action");
    if (MODALS[action]) {
      e.preventDefault();
      MODALS[action]();
    }
  });

  /* ============================================================
     5. DROPDOWNS — profile & notifications
  ============================================================ */
  const profileDrop = $("#profileDrop");
  const profileBtn = $("#profileBtn");
  const notifDrop = $("#notifDrop");
  const notifBtn = $("#notifBtn");

  function closeDropdowns() {
    if (profileDrop) profileDrop.classList.remove("open");
    if (notifDrop) notifDrop.classList.remove("open");
  }

  if (profileBtn) {
    profileBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      const willOpen = !profileDrop.classList.contains("open");
      closeDropdowns();
      profileDrop.classList.toggle("open", willOpen);
    });
  }
  if (notifBtn) {
    notifBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      const willOpen = !notifDrop.classList.contains("open");
      closeDropdowns();
      notifDrop.classList.toggle("open", willOpen);
      if (willOpen) {
        setTimeout(() => $$(".notif-item", notifDrop).forEach((n) => n.classList.add("unread")), 0);
        const d = $(".dot", notifBtn);
        if (d) d.style.display = "none";
      }
    });
  }
  document.addEventListener("click", closeDropdowns);

  /* ============================================================
     6. AI PANEL
  ============================================================ */
  const aiOverlay = $("#aiOverlay");
  const aiPanel = $("#aiPanel");

  function openAiPanel() {
    aiPanel.classList.add("open");
    aiOverlay.classList.add("show");
    setTimeout(() => $("#aiText").focus(), 350);
  }
  function closeAiPanel() {
    aiPanel.classList.remove("open");
    aiOverlay.classList.remove("show");
  }
  if (aiOverlay) aiOverlay.addEventListener("click", closeAiPanel);
  const aiClose = $("#aiClose");
  if (aiClose) aiClose.addEventListener("click", closeAiPanel);

  const AI_REPLIES = [
    "Based on your profile — " +
      (profile ? profile.interests + " interests and " + profile.skills + " skills" : "your inputs") +
      " — <b>UX Designer (94%)</b> and <b>Product Analyst (88%)</b> are your strongest matches.",
    "Your skill gap to " + (profile ? profile.goal : "UX Designer") +
      ": Prototyping (30%), User Research (45%), Design Systems (60%). Your roadmap covers these month by month — you're on track! 🗺️",
    "I found <b>6 matched opportunities</b> for you, including Senior UX Designer at Google (remote) and a Product Analyst internship at Freshworks. Want me to auto-apply? 💼",
    "Great news — you're <b>eligible for 2 scholarships</b> with a June 24 deadline. Your roadmap progress makes you a strong candidate. 🎓",
  ];
  let aiIdx = 0;

  function aiReply() {
    const box = $("#aiMessages");
    const typing = document.createElement("div");
    typing.className = "msg bot";
    typing.innerHTML = '<span class="msg-avatar">AI</span><div class="msg-bubble" style="color:var(--muted)">Typing…</div>';
    box.appendChild(typing);
    box.scrollTop = box.scrollHeight;
    setTimeout(() => {
      typing.remove();
      const msg = document.createElement("div");
      msg.className = "msg bot";
      msg.innerHTML =
        '<span class="msg-avatar">AI</span><div class="msg-bubble">' + AI_REPLIES[aiIdx % AI_REPLIES.length] + "</div>";
      aiIdx++;
      box.appendChild(msg);
      box.scrollTop = box.scrollHeight;
    }, 700 + Math.random() * 500);
  }

  function sendAi() {
    const input = $("#aiText");
    const text = input.value.trim();
    if (!text) return;
    const box = $("#aiMessages");
    const msg = document.createElement("div");
    msg.className = "msg user";
    msg.innerHTML = '<div class="msg-bubble"></div><span class="msg-avatar" style="background:var(--ink)">' +
      (profile ? initials(profile.name) : "You") + "</span>";
    msg.querySelector(".msg-bubble").textContent = text;
    box.appendChild(msg);
    input.value = "";
    box.scrollTop = box.scrollHeight;
    aiReply();
  }
  const aiSend = $("#aiSend");
  if (aiSend) aiSend.addEventListener("click", sendAi);
  const aiText = $("#aiText");
  if (aiText) aiText.addEventListener("keydown", (e) => { if (e.key === "Enter") sendAi(); });

  /* ============================================================
     7. CHAT VIEW
  ============================================================ */
  const chatForm = $("#chatForm");
  const chatText = $("#chatText");

  function chatReply(q) {
    const box = $("#chatMessages");
    const lower = q.toLowerCase();
    let reply;
    if (lower.includes("roadmap") || lower.includes("plan")) {
      reply = "Here's your roadmap: <b>Month 1</b> Design fundamentals ✅ · <b>Month 2</b> Figma + portfolio (current) · <b>Month 3</b> Team hackathon · <b>Month 4</b> Internship applications. Shall I schedule today's lesson? 🗺️";
    } else if (lower.includes("intern") || lower.includes("job") || lower.includes("opportunit")) {
      reply = "I matched <b>6 opportunities</b> to your profile! Top pick: <b>Senior UX Designer at Google</b> (remote, 94% match). Open Job Board to apply — I can draft your cover letter. 💼";
    } else if (lower.includes("skill")) {
      reply = "Your strongest area right now is " + (profile ? profile.skills : "your core skill") +
        ". Biggest gap: <b>Design Systems (60%)</b> — I recommend the UX Design course next. 🎯";
    } else {
      reply = "I can help with <b>career paths</b>, <b>skill gaps</b>, <b>roadmaps</b> and <b>opportunities</b>. Try one of the suggestions below, or ask me anything! ✨";
    }
    const msg = document.createElement("div");
    msg.className = "msg bot";
    msg.innerHTML = '<span class="msg-avatar">AI</span><div class="msg-bubble">' + reply + "</div>";
    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;
  }

  function sendChat() {
    const text = chatText.value.trim();
    if (!text) return;
    const box = $("#chatMessages");
    const msg = document.createElement("div");
    msg.className = "msg user";
    msg.innerHTML = '<div class="msg-bubble"></div><span class="msg-avatar" style="background:var(--ink)">' +
      (profile ? initials(profile.name) : "You") + "</span>";
    msg.querySelector(".msg-bubble").textContent = text;
    box.appendChild(msg);
    chatText.value = "";
    box.scrollTop = box.scrollHeight;
    const typing = document.createElement("div");
    typing.className = "msg bot";
    typing.innerHTML = '<span class="msg-avatar">AI</span><div class="msg-bubble" style="color:var(--muted)">Typing…</div>';
    box.appendChild(typing);
    box.scrollTop = box.scrollHeight;
    setTimeout(() => { typing.remove(); chatReply(text); }, 800 + Math.random() * 600);
  }
  if (chatForm) {
    chatForm.addEventListener("submit", function (e) { e.preventDefault(); sendChat(); });
  }
  $$("#chatSuggestions button").forEach((b) => {
    b.addEventListener("click", function () { chatText.value = b.getAttribute("data-q"); sendChat(); });
  });

  /* ============================================================
     8. CALENDAR — dynamic, navigable, selectable
  ============================================================ */
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let calDate = new Date();
  let selectedDay = null;

  const EVENTS = {
    "6-9": "UX Design lesson · 4:00 PM",
    "6-17": "Portfolio review with mentor",
    "6-24": "Scholarship deadline 🎓",
    "6-27": "Mock interview practice",
  };

  function renderCalendar() {
    const grid = $("#calGrid");
    const monthLabel = $("#calMonth");
    if (!grid) return;
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    monthLabel.textContent = MONTHS[month];

    grid.innerHTML = "";
    const first = new Date(year, month, 1);
    let startCol = (first.getDay() + 6) % 7; // Monday-first offset
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    for (let i = 0; i < 42; i++) {
      const cell = document.createElement("span");
      let dayNum, cellMonth = month, cellYear = year;
      if (i < startCol) {
        dayNum = daysInPrev - startCol + 1 + i;
        cellMonth = month - 1;
        if (cellMonth < 0) { cellMonth = 11; cellYear = year - 1; }
        cell.classList.add("dim");
      } else if (i >= startCol + daysInMonth) {
        dayNum = i - startCol - daysInMonth + 1;
        cellMonth = month + 1;
        if (cellMonth > 11) { cellMonth = 0; cellYear = year + 1; }
        cell.classList.add("dim");
      } else {
        dayNum = i - startCol + 1;
      }
      cell.textContent = dayNum;

      if (isCurrentMonth && dayNum === today.getDate()) {
        cell.style.fontWeight = "800";
        cell.style.color = "var(--purple-dark)";
      }

      const key = (cellMonth + 1) + "-" + dayNum;
      if (EVENTS[key]) cell.classList.add("filled");
      if (selectedDay && selectedDay.month === cellMonth && selectedDay.day === dayNum) {
        cell.classList.remove("filled");
        cell.classList.add("ringed");
      }

      cell.addEventListener("click", () => {
        selectedDay = { month: cellMonth, day: dayNum };
        renderCalendar();
      });
      grid.appendChild(cell);
    }

    const ev = $("#calEvents");
    if (ev) {
      if (selectedDay) {
        const k = (selectedDay.month + 1) + "-" + selectedDay.day;
        ev.innerHTML = EVENTS[k]
          ? "<strong>" + MONTHS[selectedDay.month] + " " + selectedDay.day + "</strong> — " + EVENTS[k]
          : "<strong>" + MONTHS[selectedDay.month] + " " + selectedDay.day + "</strong> — No events. Enjoy the free day!";
      } else {
        ev.textContent = "";
      }
    }
  }

  function shiftMonth(delta) {
    calDate = new Date(calDate.getFullYear(), calDate.getMonth() + delta, 1);
    selectedDay = null;
    renderCalendar();
  }

  const calPrev = $("#calPrev");
  const calNext = $("#calNext");
  if (calPrev) calPrev.addEventListener("click", () => shiftMonth(-1));
  if (calNext) calNext.addEventListener("click", () => shiftMonth(1));

  function selectCalDay(day, label) {
    selectedDay = { month: calDate.getMonth(), day: day };
    if (label) {
      const k = (calDate.getMonth() + 1) + "-" + day;
      EVENTS[k] = label;
    }
    renderCalendar();
  }

  renderCalendar();

  /* ============================================================
     9. JOB BOARD FILTERS
  ============================================================ */
  function applyJobFilter(chip) {
    const f = chip.getAttribute("data-filter");
    $$(".job-tile").forEach((tile) => {
      const types = tile.getAttribute("data-type") || "";
      tile.classList.toggle("hidden", f !== "all" && !types.includes(f));
    });
  }

  $$("#jobFilters .chip-filter").forEach((chip) => {
    chip.addEventListener("click", function () {
      $$("#jobFilters .chip-filter").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      applyJobFilter(chip);
    });
  });

  /* ============================================================
     10. GLOBAL SEARCH — filters jobs & careers live
  ============================================================ */
  const searchInput = $("#globalSearch");
  if (searchInput) {
    searchInput.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      const q = searchInput.value.trim().toLowerCase();
      const box = $(".search");
      box.classList.remove("flash");
      void box.offsetWidth;
      box.classList.add("flash");
      if (!q) {
        applyJobFilter($(".chip-filter.active") || $(".chip-filter"));
        $$(".career-card, .skill-card, .person-card").forEach((c) => (c.style.display = ""));
        toast("🔍", "Search cleared", "Showing everything.");
        return;
      }
      if ($("#view-jobs").classList.contains("active")) {
        let hits = 0;
        $$(".job-tile").forEach((tile) => {
          const match = tile.textContent.toLowerCase().includes(q);
          tile.classList.toggle("hidden", !match);
          if (match) hits++;
        });
        toast("🔍", hits + " job" + (hits === 1 ? "" : "s") + " found", "Matching “" + searchInput.value.trim() + "”");
        return;
      }
      if ($("#view-explore").classList.contains("active")) {
        let hits = 0;
        $$(".career-card").forEach((card) => {
          const match = card.textContent.toLowerCase().includes(q);
          card.style.display = match ? "" : "none";
          if (match) hits++;
        });
        toast("🔍", hits + " career" + (hits === 1 ? "" : "s") + " found", "Matching “" + searchInput.value.trim() + "”");
        return;
      }
      showView("jobs");
      searchInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    });
  }

  /* ============================================================
     11. DROPZONE — file upload simulation
  ============================================================ */
  const dropzone = $("#dropzone");
  if (dropzone) {
    dropzone.addEventListener("click", () => {
      toast("📄", "File picker", "In the full app this opens your files — your CV would be analyzed instantly.");
    });
    ["dragover", "dragenter"].forEach((ev) =>
      dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "var(--purple)";
        dropzone.style.background = "#f6f4ff";
      })
    );
    ["dragleave", "drop"].forEach((ev) =>
      dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "";
        dropzone.style.background = "";
      })
    );
    dropzone.addEventListener("drop", () => {
      toast("🤖", "CV received!", "AI is analyzing your skills — recommendations in ~10 seconds.");
    });
  }

  /* ============================================================
     12. ANIMATIONS — pops, counters, bars, sparkline
  ============================================================ */
  function playDashboardFx() {
    $$(".bar-fill").forEach((b) => b.classList.add("in"));
    const jp = $(".job-progress-fill");
    if (jp) jp.classList.add("in");
  }

  const pops = $$(".pop");
  if ("IntersectionObserver" in window && !reducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    pops.forEach((el) => io.observe(el));
    const first = pops[0];
    if (first) {
      const bio = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              playDashboardFx();
              bio.disconnect();
            }
          });
        },
        { threshold: 0.08 }
      );
      bio.observe(first);
    }
  } else {
    pops.forEach((el) => el.classList.add("in"));
    playDashboardFx();
  }

  /* Counters (live values) */
  const counters = $$("[data-count]");
  function animateCount(el) {
    const target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    const current = parseInt(el.textContent, 10) || 0;
    if (current === target) return;
    const duration = 1300;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(current + (target - current) * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && !reducedMotion) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach((el) => (el.textContent = el.getAttribute("data-count")));
  }

  /* Sidebar bottom links */
  $$(".side-bottom .nav-item").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      closeMobileMenu();
    });
  });

  /* Apply profile once everything is wired */
  applyProfile();
})();
