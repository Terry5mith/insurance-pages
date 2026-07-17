(() => {
    const EXPANDED_ICON = "\u2212";
    const COLLAPSED_ICON = "+";
    const FAQ_ANIMATION_DURATION = 360;
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function prefersReducedMotion() {
        return reduceMotionQuery.matches;
    }

    function directAccordionItems(container) {
        return Array.from(container.children).filter((child) => (
            child.classList &&
            (child.classList.contains("faq-item") || child.classList.contains("faq-item2"))
        ));
    }

    function cleanFaqAnswerStyles(answer) {
        answer.style.height = "";
        answer.style.maxHeight = "";
        answer.style.opacity = "";
        answer.style.overflow = "";
        answer.style.paddingTop = "";
        answer.style.paddingBottom = "";
    }

    function cancelFaqAnimation(answer) {
        if (answer.faqAnimationFrame) {
            window.cancelAnimationFrame(answer.faqAnimationFrame);
            answer.faqAnimationFrame = null;
        }

        if (answer.faqAnimationTimer) {
            window.clearTimeout(answer.faqAnimationTimer);
            answer.faqAnimationTimer = null;
        }

        if (answer.faqAnimationCleanup) {
            answer.faqAnimationCleanup();
            answer.faqAnimationCleanup = null;
        }
    }

    function afterFaqHeightTransition(answer, callback) {
        let complete = false;

        function finish() {
            if (complete) {
                return;
            }

            complete = true;
            answer.removeEventListener("transitionend", onTransitionEnd);
            window.clearTimeout(answer.faqAnimationTimer);
            answer.faqAnimationTimer = null;
            answer.faqAnimationCleanup = null;
            callback();
        }

        function onTransitionEnd(event) {
            if (event.target === answer && event.propertyName === "height") {
                finish();
            }
        }

        answer.addEventListener("transitionend", onTransitionEnd);
        answer.faqAnimationTimer = window.setTimeout(finish, FAQ_ANIMATION_DURATION + 120);
        answer.faqAnimationCleanup = () => {
            complete = true;
            answer.removeEventListener("transitionend", onTransitionEnd);
            window.clearTimeout(answer.faqAnimationTimer);
            answer.faqAnimationTimer = null;
        };
    }

    function scrollFaqItemIntoView(item) {
        const rect = item.getBoundingClientRect();
        const needsScroll = rect.top < 16 || rect.bottom > window.innerHeight - 24;

        if (!needsScroll) {
            return;
        }

        item.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "nearest",
        });
    }

    function setFaqItemState(item, expanded, options = {}) {
        const button = item.querySelector(":scope > .faq-question");
        const answer = item.querySelector(":scope > .faq-answer");
        const icon = button ? button.querySelector(".faq-icon") : null;
        const animate = Boolean(options.animate) && !prefersReducedMotion();

        if (answer) {
            cancelFaqAnimation(answer);
        }

        if (button) {
            button.setAttribute("aria-expanded", String(expanded));
        }

        if (icon) {
            icon.textContent = expanded ? EXPANDED_ICON : COLLAPSED_ICON;
        }

        if (!answer) {
            item.classList.toggle("active", expanded);
            return;
        }

        const alreadyExpanded = item.classList.contains("active") &&
            !item.classList.contains("is-closing") &&
            !answer.hidden;
        const alreadyCollapsed = !item.classList.contains("active") &&
            !item.classList.contains("is-closing") &&
            answer.hidden;

        if ((expanded && alreadyExpanded) || (!expanded && alreadyCollapsed)) {
            cleanFaqAnswerStyles(answer);
            return;
        }

        if (!animate) {
            item.classList.toggle("active", expanded);
            item.classList.remove("is-closing");
            answer.hidden = !expanded;
            cleanFaqAnswerStyles(answer);

            if (expanded && options.scroll) {
                scrollFaqItemIntoView(item);
            }

            return;
        }

        if (expanded) {
            item.classList.remove("is-closing");
            item.classList.add("active");
            answer.hidden = false;
            cleanFaqAnswerStyles(answer);

            const targetStyles = window.getComputedStyle(answer);
            const targetPaddingTop = targetStyles.paddingTop;
            const targetPaddingBottom = targetStyles.paddingBottom;
            const targetHeight = answer.scrollHeight;

            answer.style.overflow = "hidden";
            answer.style.height = "0px";
            answer.style.paddingTop = "0px";
            answer.style.paddingBottom = "0px";
            answer.style.opacity = "0";
            answer.offsetHeight;

            answer.faqAnimationFrame = window.requestAnimationFrame(() => {
                answer.faqAnimationFrame = null;
                answer.style.height = `${targetHeight}px`;
                answer.style.paddingTop = targetPaddingTop;
                answer.style.paddingBottom = targetPaddingBottom;
                answer.style.opacity = "1";
            });

            afterFaqHeightTransition(answer, () => {
                cleanFaqAnswerStyles(answer);

                if (options.scroll) {
                    scrollFaqItemIntoView(item);
                }
            });

            return;
        }

        item.classList.add("is-closing");
        answer.hidden = false;
        cleanFaqAnswerStyles(answer);

        const currentStyles = window.getComputedStyle(answer);
        const currentPaddingTop = currentStyles.paddingTop;
        const currentPaddingBottom = currentStyles.paddingBottom;
        const currentHeight = answer.scrollHeight;

        answer.style.overflow = "hidden";
        answer.style.height = `${currentHeight}px`;
        answer.style.paddingTop = currentPaddingTop;
        answer.style.paddingBottom = currentPaddingBottom;
        answer.style.opacity = "1";
        answer.offsetHeight;

        answer.faqAnimationFrame = window.requestAnimationFrame(() => {
            answer.faqAnimationFrame = null;
            answer.style.height = "0px";
            answer.style.paddingTop = "0px";
            answer.style.paddingBottom = "0px";
            answer.style.opacity = "0";
        });

        afterFaqHeightTransition(answer, () => {
            item.classList.remove("active", "is-closing");
            answer.hidden = true;
            cleanFaqAnswerStyles(answer);
        });
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

                siblings.forEach((sibling) => sibling.classList.remove("page-animate"));

                siblings.forEach((sibling) => {
                    const siblingIsOpen = sibling.classList.contains("active") ||
                        sibling.classList.contains("is-closing");

                    if (sibling !== item && siblingIsOpen) {
                        setFaqItemState(sibling, false, { animate: true });
                    }
                });

                setFaqItemState(item, shouldOpen, {
                    animate: true,
                    scroll: shouldOpen,
                });
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
        document.querySelectorAll(".other-types-section").forEach((section) => {
            const slider = section.querySelector(".other-types-slider") || section;
            const cards = Array.from(slider.querySelectorAll(".types-card-container"));
            const existingDots = section.nextElementSibling && section.nextElementSibling.classList.contains("carousel-dots")
                ? section.nextElementSibling
                : null;

            if (!window.matchMedia("(max-width: 768px)").matches || cards.length < 2) {
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
                section.parentNode.insertBefore(dotsContainer, section.nextSibling);
            }

            const dots = Array.from(dotsContainer.querySelectorAll(".carousel-dot"));

            function updateDots() {
                const firstCard = cards[0];
                const styles = window.getComputedStyle(slider);
                const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
                const cardWidth = firstCard ? firstCard.offsetWidth + gap : 1;
                const currentIndex = Math.round(slider.scrollLeft / cardWidth);

                dots.forEach((dot, index) => {
                    dot.classList.toggle("active", index === currentIndex);
                });
            }

            slider.addEventListener("scroll", updateDots, { passive: true });
            updateDots();
        });
    }

    function initRoadScrollAnimation() {
        const wrapper = document.querySelector(".guide-wrapper");
        const cars = wrapper ? Array.from(wrapper.querySelectorAll(".road-car")) : [];
        const svg = wrapper ? wrapper.querySelector(".road-svg") : null;
        const roadPath = wrapper ? wrapper.querySelector(".road-center") : null;

        if (!wrapper || !cars.length) {
            return;
        }

        const reduceMotion = prefersReducedMotion();
        const pathPositions = [
            { progress: 0.13, travel: 0.06 },
            { progress: 0.25, travel: 0.058 },
            { progress: 0.39, travel: 0.054 },
            { progress: 0.59, travel: 0.06 },
            { progress: 0.735, travel: 0.062 },
            { progress: 0.845, travel: 0.05 },
            { progress: 0.925, travel: 0.044 },
        ];
        const movement = [
            { x: 88, y: 0, r: 0 },
            { x: 78, y: 0, r: 0 },
            { x: 68, y: 10, r: 3 },
            { x: -52, y: 70, r: 7 },
            { x: -78, y: 0, r: 0 },
            { x: 0, y: 76, r: 0 },
            { x: 0, y: 70, r: 0 },
        ];

        let pathLength = 0;
        let ticking = false;

        function syncPathMetrics() {
            if (!svg || !roadPath || typeof roadPath.getTotalLength !== "function") {
                wrapper.classList.remove("road-path-cars-ready");
                return false;
            }

            pathLength = roadPath.getTotalLength();
            wrapper.classList.toggle("road-path-cars-ready", pathLength > 0);
            return pathLength > 0;
        }

        function setCarOnRoad(car, config, eased) {
            const svgRect = svg.getBoundingClientRect();
            const wrapperRect = wrapper.getBoundingClientRect();
            const viewBox = svg.viewBox.baseVal;

            if (!viewBox.width || !viewBox.height) {
                return;
            }

            const progress = Math.max(0, Math.min(0.985, config.progress + eased * config.travel));
            const distance = progress * pathLength;
            const tangentOffset = Math.max(pathLength * 0.002, 1);
            const point = roadPath.getPointAtLength(distance);
            const before = roadPath.getPointAtLength(Math.max(0, distance - tangentOffset));
            const after = roadPath.getPointAtLength(Math.min(pathLength, distance + tangentOffset));
            const x = svgRect.left - wrapperRect.left + ((point.x - viewBox.x) / viewBox.width) * svgRect.width;
            const y = svgRect.top - wrapperRect.top + ((point.y - viewBox.y) / viewBox.height) * svgRect.height;
            const angle = Math.atan2(after.y - before.y, after.x - before.x) * (180 / Math.PI);

            car.style.left = `${x.toFixed(2)}px`;
            car.style.top = `${y.toFixed(2)}px`;
            car.style.setProperty("--road-angle", `${angle.toFixed(2)}deg`);
        }

        function updateCars() {
            const rect = wrapper.getBoundingClientRect();
            const range = window.innerHeight + rect.height;
            const rawProgress = (window.innerHeight - rect.top) / range;
            const progress = Math.max(0, Math.min(1, rawProgress));
            const eased = reduceMotion ? 0 : progress * progress * (3 - (2 * progress));
            const canUsePath = pathLength > 0 || syncPathMetrics();

            cars.forEach((car, index) => {
                if (canUsePath) {
                    setCarOnRoad(car, pathPositions[index % pathPositions.length], eased);
                    return;
                }

                const move = movement[index % movement.length];
                car.style.setProperty("--scroll-x", `${(eased * move.x).toFixed(2)}px`);
                car.style.setProperty("--scroll-y", `${(eased * move.y).toFixed(2)}px`);
                car.style.setProperty("--scroll-rotate", `${(eased * move.r).toFixed(2)}deg`);
            });

            ticking = false;
        }

        function requestUpdate() {
            if (ticking) {
                return;
            }

            ticking = true;
            window.requestAnimationFrame(updateCars);
        }

        function requestResizeUpdate() {
            syncPathMetrics();
            requestUpdate();
        }

        syncPathMetrics();
        updateCars();
        if (!reduceMotion) {
            window.addEventListener("scroll", requestUpdate, { passive: true });
        }
        window.addEventListener("resize", requestResizeUpdate);
    }

    function initPageAnimations() {
        const animatedElements = new Set();
        const baseElements = Array.from(document.querySelectorAll([
            ".insurance-section",
            ".insurance-form-section",
            ".whats-covered-section",
            ".other-types-section",
            ".optional-addons-section",
            ".tips-heading-section",
            ".guide-wrapper",
            ".faq-section",
            ".types-card",
            ".tip-card",
            ".faq-item",
            ".faq-item2",
        ].join(",")));

        function queueAnimatedElement(element) {
            if (element) {
                animatedElements.add(element);
            }
        }

        baseElements.forEach((element) => {
            if (element.matches(".topcashback-faq-section, .car-insurance-faq-section")) {
                element.dataset.scrollRevealComplete = "true";
                element.classList.add("is-visible");
                return;
            }

            queueAnimatedElement(element);
        });

        document.querySelectorAll(".topcashback-faq-section, .car-insurance-faq-section").forEach((section) => {
            section.dataset.scrollRevealComplete = "true";
            section.classList.add("is-visible");
            section.querySelectorAll(".faq-title, .faq-item, .faq-right").forEach(queueAnimatedElement);
        });

        const elements = Array.from(animatedElements);

        if (!elements.length) {
            return;
        }

        document.documentElement.classList.add("animate-ready");
        const revealedElements = new WeakSet();
        let previousScrollY = window.scrollY || document.documentElement.scrollTop || 0;
        let scrollDirection = "down";

        function updateScrollDirection() {
            const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;

            if (currentScrollY > previousScrollY) {
                scrollDirection = "down";
            } else if (currentScrollY < previousScrollY) {
                scrollDirection = "up";
            }

            previousScrollY = currentScrollY;
        }

        function revealElement(element, animate = true) {
            if (revealedElements.has(element) || element.dataset.scrollRevealComplete === "true") {
                return;
            }

            revealedElements.add(element);
            element.dataset.scrollRevealComplete = "true";

            if (!animate) {
                element.classList.add("reveal-without-transition");
            }

            element.classList.add("is-visible");

            if (element.matches(".faq-item, .faq-item2")) {
                window.setTimeout(() => {
                    element.classList.remove("page-animate");
                }, FAQ_ANIMATION_DURATION + 160);
            }

            if (!animate) {
                window.requestAnimationFrame(() => {
                    element.classList.remove("reveal-without-transition");
                });
            }
        }

        elements.forEach((element, index) => {
            element.classList.add("page-animate");
            element.style.setProperty("--animation-delay", `${Math.min(index * 28, 240)}ms`);
        });

        if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
            elements.forEach((element) => revealElement(element, false));
            return;
        }

        window.addEventListener("scroll", updateScrollDirection, { passive: true });

        const observedElements = new Set(elements);
        const observer = new IntersectionObserver((entries) => {
            updateScrollDirection();

            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const enteredWhileScrollingDown = scrollDirection === "down" || entry.boundingClientRect.top >= 0;
                revealElement(entry.target, enteredWhileScrollingDown);
                observer.unobserve(entry.target);
                observedElements.delete(entry.target);
            });

            if (!observedElements.size) {
                observer.disconnect();
                window.removeEventListener("scroll", updateScrollDirection);
            }
        }, {
            rootMargin: "0px 0px -12% 0px",
            threshold: 0.12,
        });

        elements.forEach((element) => observer.observe(element));
    }

    document.addEventListener("DOMContentLoaded", () => {
        initFaqAccordions();
        initCoverAccordions();
        initTipsCarousel();
        initOtherTypesDots();
        initRoadScrollAnimation();
        initPageAnimations();
    });

    window.addEventListener("resize", initOtherTypesDots);
})();
