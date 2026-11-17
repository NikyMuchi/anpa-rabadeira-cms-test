document.addEventListener("DOMContentLoaded", () => {
    // Mobile nav toggle
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".main-nav");

    if (toggle && nav) {
        const setNavState = (isOpen) => {
            if (isOpen && typeof window.closeSiteSearch === "function") {
                window.closeSiteSearch({ restoreFocus: false });
            }
            nav.classList.toggle("is-open", isOpen);
            toggle.setAttribute("aria-expanded", String(isOpen));
            toggle.setAttribute("aria-label", isOpen ? "Pechar menú" : "Abrir menú");
            document.body.classList.toggle("nav-open", isOpen);
        };

        window.closeMobileNav = () => {
            setNavState(false);
        };

        toggle.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = nav.classList.contains("is-open");
            setNavState(!isOpen);
        });

        // Close nav on link click (mobile)
        nav.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                setNavState(false);
            });
        });

        // Close nav on Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && nav.classList.contains("is-open")) {
                setNavState(false);
                toggle.focus();
            }
        });

        // Close nav when clicking outside
        document.addEventListener("click", (e) => {
            if (nav.classList.contains("is-open")) {
                const header = document.querySelector(".site-header");
                if (header && !header.contains(e.target)) {
                    setNavState(false);
                }
            }
        });

        // Reset if resized to desktop
        window.addEventListener("resize", () => {
            if (window.innerWidth > 900 && nav.classList.contains("is-open")) {
                setNavState(false);
            }
        });
    }
});

