document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menuToggle");
  const toast = document.getElementById("toast");
  const year = document.getElementById("year");
  const navLinks = document.querySelectorAll(".side-menu a");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("open");

    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
    }
  }

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", function () {
      const opened = sidebar.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(opened));
      menuToggle.setAttribute(
        "aria-label",
        opened ? "Close menu" : "Open menu"
      );
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      const href = link.getAttribute("href");
      const target = href ? document.getElementById(href.slice(1)) : null;

      if (target) {
        event.preventDefault();

        history.replaceState(null, "", href);

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        navLinks.forEach(function (item) {
          item.classList.toggle("active", item === link);
        });

        closeSidebar();
      }
    });
  });

  if (toast) {
    document.querySelectorAll("[data-message]").forEach(function (button) {
      button.addEventListener("click", function () {
        toast.textContent =
          button.getAttribute("data-message") || "Please try again later.";

        toast.classList.add("show");

        setTimeout(function () {
          toast.classList.remove("show");
        }, 3000);
      });
    });
  }

  // POLYGON referral link: local frontend testing only
  const referralInput = document.getElementById("referralLink");
  const copyReferralButton = document.getElementById("copyReferralLink");
  const referralMessage = document.getElementById("referralMessage");

  if (referralInput) {
    let referralCode = localStorage.getItem("polygonReferralCode");

    if (!referralCode) {
      referralCode = "POLY-MEMBER-001";
      localStorage.setItem("polygonReferralCode", referralCode);
    }

    const referralUrl = new URL(window.location.href);
    referralUrl.searchParams.set("ref", referralCode);
    referralInput.value = referralUrl.toString();
  }

  if (copyReferralButton && referralInput) {
    copyReferralButton.addEventListener("click", async function () {
      try {
        await navigator.clipboard.writeText(referralInput.value);
        if (referralMessage) {
          referralMessage.textContent = "Referral link copied successfully!";
        }
      } catch (error) {
        referralInput.focus();
        referralInput.select();
        const copied = document.execCommand("copy");

        if (referralMessage) {
          referralMessage.textContent = copied
            ? "Referral link copied successfully!"
            : "Please select and copy the link manually.";
        }
      }
    });
  }

});

