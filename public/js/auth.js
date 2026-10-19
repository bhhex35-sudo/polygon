import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  let topbar = null;
  for (let i = 0; i < 20; i++) {
    topbar = document.querySelector(".topbar");
    if (topbar) break;
    await new Promise(r => setTimeout(r, 100));
  }

  if (!topbar) {
    console.error("POLYGON: Dashboard header not found.");
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    .polygon-auth-btn {
      background: #7545e8; color: white; border: 0;
      border-radius: 10px; padding: 11px 16px;
      cursor: pointer; font-weight: 600;
    }
    .polygon-auth-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(5, 3, 15, .88);
      display: flex; align-items: center; justify-content: center;
      padding: 16px; overflow-y: auto;
    }
    .polygon-auth-card {
      width: 100%; max-width: 410px; padding: 26px;
      border: 1px solid #39275c; border-radius: 18px;
      background: #110c20; color: #f5f0ff;
      font-family: inherit; box-sizing: border-box;
    }
    .polygon-auth-card * { box-sizing: border-box; }
    .polygon-auth-card h2 { margin: 0 0 8px; }
    .polygon-auth-card p { color: #b9adcf; line-height: 1.5; }
    .polygon-auth-card label {
      display: block; margin: 14px 0 6px; font-size: 14px;
    }
    .polygon-auth-card input {
      width: 100%; padding: 12px; border-radius: 9px;
      border: 1px solid #44345f; background: #0b0718;
      color: white; font-size: 16px;
    }
    .polygon-auth-card button {
      width: 100%; padding: 12px; margin-top: 12px;
      border: 0; border-radius: 9px; cursor: pointer;
      background: #7545e8; color: white; font-weight: 600;
    }
    .polygon-auth-card .polygon-secondary {
      background: #241938; border: 1px solid #49356b;
    }
    .polygon-auth-card .polygon-close {
      background: transparent; color: #d2c5e8;
      border: 1px solid #44345f;
    }
    .polygon-auth-message {
      min-height: 22px; overflow-wrap: anywhere;
      font-size: 14px;
    }
  `;
  document.head.appendChild(style);

  const authButton = document.createElement("button");
  authButton.className = "polygon-auth-btn";
  authButton.textContent = "Login / Sign up";
  authButton.type = "button";
  authButton.style.marginLeft = "auto";
  topbar.appendChild(authButton);

  const overlay = document.createElement("div");
  overlay.className = "polygon-auth-overlay";
  overlay.hidden = true;
  overlay.style.display = "none";

  overlay.innerHTML = `
    <section class="polygon-auth-card"
      role="dialog" aria-modal="true" aria-labelledby="polygonAuthTitle">
      <h2 id="polygonAuthTitle">Welcome to POLYGON</h2>
      <p id="polygonAuthDescription">Sign in or create your account.</p>

      <div id="polygonAuthForm">
        <button type="button" id="polygonGoogle">Continue with Google</button>

        <form id="polygonEmailForm">
          <label for="polygonEmail">Email address</label>
          <input id="polygonEmail" type="email"
            autocomplete="email" required maxlength="254">

          <label for="polygonPassword">Password</label>
          <input id="polygonPassword" type="password"
            autocomplete="current-password" required minlength="6">

          <div id="polygonPhoneWrap" hidden>
            <label for="polygonPhone">Phone number (optional)</label>
            <input id="polygonPhone" type="tel"
              autocomplete="tel" maxlength="30">
          </div>

          <button type="submit" id="polygonSubmit">Sign in</button>
        </form>

        <button type="button" class="polygon-secondary"
          id="polygonSwitch">Create an account</button>
      </div>

      <p id="polygonAuthMessage" class="polygon-auth-message"
        role="status" aria-live="polite"></p>

      <button type="button" class="polygon-close"
        id="polygonClose">Close</button>
    </section>
  `;

  document.body.appendChild(overlay);

  const $ = (id) => overlay.querySelector("#" + id);
  let mode = "login";
  let currentUser = null;
  let busy = false;

  function showMessage(message) {
    $("polygonAuthMessage").textContent = message;
  }

  function renderMode() {
    const signup = mode === "signup";

    $("polygonAuthTitle").textContent =
      signup ? "Create your POLYGON account" : "Welcome to POLYGON";

    $("polygonAuthDescription").textContent = signup
      ? "Create your account using your email and password."
      : "Sign in to your existing account.";

    $("polygonSubmit").textContent = signup ? "Create account" : "Sign in";
    $("polygonSwitch").textContent = signup
      ? "Already have an account? Sign in"
      : "Create an account";

    $("polygonPhoneWrap").hidden = !signup;
    $("polygonPhone").required = false;
    $("polygonPassword").autocomplete =
      signup ? "new-password" : "current-password";

    showMessage("");
  }

  function openModal(nextMode = "login") {
    mode = nextMode;
    renderMode();
    overlay.hidden = false;
    overlay.style.display = "flex";
    $("polygonEmail").focus();
  }

  function closeModal() {
    overlay.hidden = true;
    overlay.style.display = "none";
  }

  function updateAccount(user) {
    currentUser = user || null;

    authButton.textContent = currentUser
      ? "Account"
      : "Login / Sign up";

    const profile = document.querySelector(".profile");
    if (profile) {
      const name = profile.querySelector("strong");
      const detail = profile.querySelector("small");

      if (name) {
        name.textContent = currentUser
          ? (currentUser.user_metadata?.full_name ||
             currentUser.email || "POLYGON Member")
          : "Welcome, Member";
      }

      if (detail) {
        detail.textContent = currentUser
          ? currentUser.email
          : "Account Preview";
      }
    }

    const avatar = document.querySelector(".top-profile");
    if (avatar) {
      avatar.textContent = currentUser
        ? (currentUser.email?.[0] || "P").toUpperCase()
        : "P";
    }

    if (currentUser) {
      $("polygonAuthTitle").textContent = "Your POLYGON account";
      $("polygonAuthDescription").textContent =
        currentUser.email || "Signed in";
      $("polygonAuthForm").hidden = true;
      showMessage("You are signed in.");
      $("polygonClose").textContent = "Close";
    } else {
      $("polygonAuthForm").hidden = false;
      $("polygonClose").textContent = "Close";
    }
  }

  authButton.addEventListener("click", () => {
    if (currentUser) {
      openModal("login");
      $("polygonAuthForm").hidden = true;
      $("polygonAuthTitle").textContent = "Your POLYGON account";
      $("polygonAuthDescription").textContent =
        currentUser.email || "Signed in";
      showMessage("You are signed in.");

      let logout = $("polygonLogout");
      if (!logout) {
        logout = document.createElement("button");
        logout.id = "polygonLogout";
        logout.textContent = "Sign out";
        logout.className = "polygon-secondary";
        $("polygonAuthForm").after(logout);

        logout.addEventListener("click", async () => {
          if (busy) return;
          busy = true;
          logout.disabled = true;

          const { error } = await supabase.auth.signOut();

          busy = false;
          logout.disabled = false;

          if (error) {
            showMessage("Sign out failed. Please try again.");
            return;
          }

          $("polygonLogout").remove();
          closeModal();
        });
      }
    } else {
      openModal("login");
    }
  });

  $("polygonClose").addEventListener("click", closeModal);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeModal();
  });

  $("polygonSwitch").addEventListener("click", () => {
    mode = mode === "login" ? "signup" : "login";
    renderMode();
  });

  $("polygonGoogle").addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    showMessage("Connecting to Google...");
    $("polygonGoogle").disabled = true;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + window.location.pathname
        }
      });

      if (error) showMessage(error.message);
    } catch {
      showMessage("Google sign-in could not start. Please try again.");
    } finally {
      busy = false;
      $("polygonGoogle").disabled = false;
    }
  });

  $("polygonEmailForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;

    busy = true;
    $("polygonSubmit").disabled = true;
    showMessage("Please wait...");

    const email = $("polygonEmail").value.trim();
    const password = $("polygonPassword").value;
    const phone = $("polygonPhone").value.trim();

    try {
      if (mode === "signup") {
        const options = {
          data: {}
        };

        if (phone) options.data.phone_number = phone;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options
        });

        if (error) throw error;

        if (data.session) {
          showMessage("Account created successfully!");
          closeModal();
        } else {
          showMessage(
            "Account request submitted. Check your email to confirm your account."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        showMessage("Signed in successfully!");
        closeModal();
      }
    } catch (error) {
      const messages = {
        "Invalid login credentials":
          "Email or password is incorrect.",
        "User already registered":
          "An account with this email already exists."
      };

      showMessage(
        messages[error.message] ||
        error.message ||
        "Authentication failed. Please try again."
      );
    } finally {
      busy = false;
      $("polygonSubmit").disabled = false;
    }
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    updateAccount(session?.user || null);
  });

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;
    updateAccount(data.session?.user || null);
  } catch (error) {
    console.error("POLYGON session check failed:", error);
    showMessage("Could not check your session. Refresh and try again.");
  }
});

