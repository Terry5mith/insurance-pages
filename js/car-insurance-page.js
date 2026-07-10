(() => {
    const EXPANDED_ICON = "\u2212";
    const COLLAPSED_ICON = "+";

    function directAccordionItems(container) {
        return Array.from(container.children).filter((child) => (
            child.classList &&
            (child.classList.contains("faq-item") || child.classList.contains("faq-item2"))
        ));
    }

    function setFaqItemState(item, expanded) {
        const button = item.querySelector(":scope > .faq-question");
        const answer = item.querySelector(":scope > .faq-answer");
        const icon = button ? button.querySelector(".faq-icon") : null;

        item.classList.toggle("active", expanded);

        if (button) {
            button.setAttribute("aria-expanded", String(expanded));
        }

        if (answer) {
            answer.hidden = !expanded;
        }

        if (icon) {
            icon.textContent = expanded ? EXPANDED_ICON : COLLAPSED_ICON;
        }
    }

    function initFaqAccordions() {
        document.querySelectorAll(".faq-item, .faq-item2").forEach((item) => {
            const button = item.querySelector(":scope > .faq-question");
            const answer = item.querySelector(":scope > .faq-answer");

            if (!button || !answer) {
                return;
            }

            setFaqItemState(item, item.classList.contains("active"));

            button.addEventListener("click", () => {
                const parent = item.parentElement;
                const siblings = parent ? directAccordionItems(parent) : [item];
                const shouldOpen = !item.classList.contains("active");

                siblings.forEach((sibling) => setFaqItemState(sibling, false));
                setFaqItemState(item, shouldOpen);
            });
        });
    }

    function setCoverItemState(item, expanded) {
        const button = item.querySelector(".insurance-form-accordion-header");
        const content = item.querySelector(".insurance-form-accordion-content");

        item.classList.toggle("active", expanded);

        if (button) {
            button.setAttribute("aria-expanded", String(expanded));
        }

        if (content) {
            content.hidden = !expanded;
        }
    }

    function initCoverAccordions() {
        document.querySelectorAll(".insurance-form-mobile-table").forEach((accordion) => {
            const items = Array.from(accordion.querySelectorAll(".insurance-form-accordion-item"));

            items.forEach((item) => {
                const button = item.querySelector(".insurance-form-accordion-header");

                if (!button) {
                    return;
                }

                setCoverItemState(item, item.classList.contains("active"));

                button.addEventListener("click", () => {
                    const shouldOpen = !item.classList.contains("active");
                    items.forEach((sibling) => setCoverItemState(sibling, false));
                    setCoverItemState(item, shouldOpen);
                });
            });
        });
    }

    function initTipsCarousel() {
        document.querySelectorAll(".carousel").forEach((carousel) => {
            const slides = Array.from(carousel.querySelectorAll(".slide"));
            const dots = Array.from(carousel.querySelectorAll(".dot"));
            let current = Math.max(0, slides.findIndex((slide) => slide.classList.contains("active")));
            let startX = 0;

            function goToSlide(index) {
                if (!slides.length) {
                    return;
                }

                current = Math.max(0, Math.min(index, slides.length - 1));

                slides.forEach((slide, slideIndex) => {
                    slide.classList.toggle("active", slideIndex === current);
                });

                dots.forEach((dot, dotIndex) => {
                    const active = dotIndex === current;
                    dot.classList.toggle("active", active);

                    if (active) {
                        dot.setAttribute("aria-current", "true");
                    } else {
                        dot.removeAttribute("aria-current");
                    }
                });
            }

            dots.forEach((dot, index) => {
                dot.addEventListener("click", () => goToSlide(index));
            });

            carousel.addEventListener("touchstart", (event) => {
                startX = event.touches[0].clientX;
            }, { passive: true });

            carousel.addEventListener("touchend", (event) => {
                const endX = event.changedTouches[0].clientX;
                const diff = startX - endX;

                if (diff > 50) {
                    goToSlide(current + 1);
                }

                if (diff < -50) {
                    goToSlide(current - 1);
                }
            }, { passive: true });

            goToSlide(current);
        });
    }

    function initOtherTypesDots() {
        document.querySelectorAll(".other-types-section").forEach((slider) => {
            const cards = Array.from(slider.querySelectorAll(".types-card-container"));
            const existingDots = slider.nextElementSibling && slider.nextElementSibling.classList.contains("carousel-dots")
                ? slider.nextElementSibling
                : null;

            if (!window.matchMedia("(max-width: 576px)").matches || cards.length < 2) {
                if (existingDots) {
                    existingDots.remove();
                }
                return;
            }

            const dotsContainer = existingDots || document.createElement("div");
            dotsContainer.className = "carousel-dots";
            dotsContainer.innerHTML = "";

            cards.forEach((card, index) => {
                const dot = document.createElement("button");
                dot.type = "button";
                dot.className = index === 0 ? "carousel-dot active" : "carousel-dot";
                dot.setAttribute("aria-label", `Show car insurance type ${index + 1}`);

                dot.addEventListener("click", () => {
                    slider.scrollTo({
                        left: card.offsetLeft - slider.offsetLeft,
                        behavior: "smooth",
                    });
                });

                dotsContainer.appendChild(dot);
            });

            if (!existingDots) {
                slider.parentNode.insertBefore(dotsContainer, slider.nextSibling);
            }

            const dots = Array.from(dotsContainer.querySelectorAll(".carousel-dot"));

            function updateDots() {
                const firstCard = cards[0];
                const cardWidth = firstCard ? firstCard.offsetWidth + 20 : 1;
                const currentIndex = Math.round(slider.scrollLeft / cardWidth);

                dots.forEach((dot, index) => {
                    dot.classList.toggle("active", index === currentIndex);
                });
            }

            slider.addEventListener("scroll", updateDots, { passive: true });
            updateDots();
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        initFaqAccordions();
        initCoverAccordions();
        initTipsCarousel();
        initOtherTypesDots();
    });

    window.addEventListener("resize", initOtherTypesDots);
})();
