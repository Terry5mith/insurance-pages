(() => {
    const EXPANDED_ICON = "\u2212";
    const COLLAPSED_ICON = "+";
    const FAQ_ANIMATION_DURATION = 320;
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function prefersReducedMotion() {
        return reduceMotionQuery.matches;
    }

    function cleanFaqAnswerStyles(answer) {
        answer.style.height = "";
        answer.style.maxHeight = "";
        answer.style.opacity = "";
        answer.style.overflow = "";
        answer.style.paddingTop = "";
        answer.style.paddingBottom = "";
    }

    function getPanelHeight(panel) {
        const currentHeight = panel.getBoundingClientRect().height;
        return currentHeight > 0 ? currentHeight : panel.scrollHeight;
    }

    function ensureFaqAnswerInner(answer) {
        if (answer.querySelector(":scope > .faq-answer-inner")) {
            return;
        }

        const inner = document.createElement("div");
        inner.className = "faq-answer-inner";

        while (answer.firstChild) {
            inner.appendChild(answer.firstChild);
        }

        answer.appendChild(inner);
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

    function afterFaqPanelTransition(answer, callback) {
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
            if (event.target === answer && (event.propertyName === "height" || event.propertyName === "opacity")) {
                finish();
            }
        }

        answer.addEventListener("transitionend", onTransitionEnd);
        answer.faqAnimationTimer = window.setTimeout(finish, FAQ_ANIMATION_DURATION + 80);
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
            answer.hidden = false;
            cleanFaqAnswerStyles(answer);
            answer.style.height = "0px";
            answer.style.opacity = "0";

            const targetHeight = answer.scrollHeight;

            afterFaqPanelTransition(answer, () => {
                cleanFaqAnswerStyles(answer);

                if (options.scroll) {
                    scrollFaqItemIntoView(item);
                }
            });

            answer.faqAnimationFrame = window.requestAnimationFrame(() => {
                answer.faqAnimationFrame = null;
                item.classList.add("active");
                answer.style.height = `${targetHeight}px`;
                answer.style.opacity = "1";
            });

            return;
        }

        answer.hidden = false;
        cleanFaqAnswerStyles(answer);
        answer.style.height = `${getPanelHeight(answer)}px`;
        answer.style.opacity = "1";

        afterFaqPanelTransition(answer, () => {
            item.classList.remove("is-closing");
            answer.hidden = true;
            cleanFaqAnswerStyles(answer);
        });

        answer.faqAnimationFrame = window.requestAnimationFrame(() => {
            answer.faqAnimationFrame = null;
            item.classList.add("is-closing");
            item.classList.remove("active");
            answer.style.height = "0px";
            answer.style.opacity = "0";
        });
    }

    function initFaqAccordions() {
        document.querySelectorAll(".faq-item, .faq-item2").forEach((item) => {
            const button = item.querySelector(":scope > .faq-question");
            const answer = item.querySelector(":scope > .faq-answer");

            if (!button || !answer) {
                return;
            }

            ensureFaqAnswerInner(answer);
            setFaqItemState(item, item.classList.contains("active"));

            button.addEventListener("click", () => {
                const shouldOpen = !item.classList.contains("active");

                item.classList.remove("page-animate");

                setFaqItemState(item, shouldOpen, {
                    animate: true,
                    scroll: shouldOpen,
                });
            });
        });
    }

    function cleanCoverContentStyles(content) {
        content.style.height = "";
        content.style.opacity = "";
        content.style.overflow = "";
    }

    function cancelCoverAnimation(content) {
        if (content.coverAnimationFrame) {
            window.cancelAnimationFrame(content.coverAnimationFrame);
            content.coverAnimationFrame = null;
        }

        if (content.coverAnimationTimer) {
            window.clearTimeout(content.coverAnimationTimer);
            content.coverAnimationTimer = null;
        }

        if (content.coverAnimationCleanup) {
            content.coverAnimationCleanup();
            content.coverAnimationCleanup = null;
        }
    }

    function afterCoverContentTransition(content, callback) {
        let complete = false;

        function finish() {
            if (complete) {
                return;
            }

            complete = true;
            content.removeEventListener("transitionend", onTransitionEnd);
            window.clearTimeout(content.coverAnimationTimer);
            content.coverAnimationTimer = null;
            content.coverAnimationCleanup = null;
            callback();
        }

        function onTransitionEnd(event) {
            if (event.target === content && (event.propertyName === "height" || event.propertyName === "opacity")) {
                finish();
            }
        }

        content.addEventListener("transitionend", onTransitionEnd);
        content.coverAnimationTimer = window.setTimeout(finish, FAQ_ANIMATION_DURATION + 80);
        content.coverAnimationCleanup = () => {
            complete = true;
            content.removeEventListener("transitionend", onTransitionEnd);
            window.clearTimeout(content.coverAnimationTimer);
            content.coverAnimationTimer = null;
        };
    }

    function setCoverItemState(item, expanded, options = {}) {
        const button = item.querySelector(".insurance-form-accordion-header");
        const content = item.querySelector(".insurance-form-accordion-content");
        const animate = Boolean(options.animate) && !prefersReducedMotion();

        if (content) {
            cancelCoverAnimation(content);
        }

        if (button) {
            button.setAttribute("aria-expanded", String(expanded));
        }

        if (!content) {
            item.classList.toggle("active", expanded);
            return;
        }

        const alreadyExpanded = item.classList.contains("active") &&
            !item.classList.contains("is-closing") &&
            !content.hidden;
        const alreadyCollapsed = !item.classList.contains("active") &&
            !item.classList.contains("is-closing") &&
            content.hidden;

        if ((expanded && alreadyExpanded) || (!expanded && alreadyCollapsed)) {
            cleanCoverContentStyles(content);
            return;
        }

        if (!animate) {
            item.classList.toggle("active", expanded);
            item.classList.remove("is-closing");
            content.hidden = !expanded;
            cleanCoverContentStyles(content);
            return;
        }

        if (expanded) {
            item.classList.remove("is-closing");
            content.hidden = false;
            cleanCoverContentStyles(content);
            content.style.height = "0px";
            content.style.opacity = "0";

            const targetHeight = content.scrollHeight;

            afterCoverContentTransition(content, () => {
                cleanCoverContentStyles(content);
            });

            content.coverAnimationFrame = window.requestAnimationFrame(() => {
                content.coverAnimationFrame = null;
                item.classList.add("active");
                content.style.height = `${targetHeight}px`;
                content.style.opacity = "1";
            });

            return;
        }

        content.hidden = false;
        cleanCoverContentStyles(content);
        content.style.height = `${getPanelHeight(content)}px`;
        content.style.opacity = "1";

        afterCoverContentTransition(content, () => {
            item.classList.remove("is-closing");
            content.hidden = true;
            cleanCoverContentStyles(content);
        });

        content.coverAnimationFrame = window.requestAnimationFrame(() => {
            content.coverAnimationFrame = null;
            item.classList.add("is-closing");
            item.classList.remove("active");
            content.style.height = "0px";
            content.style.opacity = "0";
        });
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
                    items.forEach((sibling) => {
                        if (sibling !== item) {
                            setCoverItemState(sibling, false, { animate: true });
                        }
                    });
                    setCoverItemState(item, shouldOpen, { animate: true });
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

    function initMainInsuranceTypesCarousel() {
        document.querySelectorAll(".main-insurance-types-section").forEach((section) => {
            const track = section.querySelector(".main-insurance-types-track");
            const cards = Array.from(section.querySelectorAll(".main-insurance-type-card"));
            const dots = Array.from(section.querySelectorAll(".main-insurance-types-dot"));

            if (!track || !cards.length || !dots.length) {
                return;
            }

            if (track.dataset.carouselReady !== "true") {
                dots.forEach((dot, index) => {
                    dot.addEventListener("click", () => {
                        const card = cards[index];

                        if (!card) {
                            return;
                        }

                        track.scrollTo({
                            left: card.offsetLeft - track.offsetLeft - ((track.clientWidth - card.offsetWidth) / 2),
                            behavior: prefersReducedMotion() ? "auto" : "smooth",
                        });
                    });
                });

                track.addEventListener("scroll", () => {
                    window.requestAnimationFrame(updateDots);
                }, { passive: true });

                track.dataset.carouselReady = "true";
            }

            function updateDots() {
                const trackCenter = track.scrollLeft + (track.clientWidth / 2);
                const currentIndex = cards.reduce((closestIndex, card, index) => {
                    const closestCard = cards[closestIndex];
                    const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
                    const closestCenter = closestCard.offsetLeft + (closestCard.offsetWidth / 2);

                    return Math.abs(cardCenter - trackCenter) < Math.abs(closestCenter - trackCenter)
                        ? index
                        : closestIndex;
                }, 0);

                dots.forEach((dot, index) => {
                    const active = index === currentIndex;
                    dot.classList.toggle("active", active);

                    if (active) {
                        dot.setAttribute("aria-current", "true");
                    } else {
                        dot.removeAttribute("aria-current");
                    }
                });
            }

            updateDots();
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
        initMainInsuranceTypesCarousel();
        initOtherTypesDots();
        initRoadScrollAnimation();
        initPageAnimations();
    });

    window.addEventListener("resize", initMainInsuranceTypesCarousel);
    window.addEventListener("resize", initOtherTypesDots);
})();
