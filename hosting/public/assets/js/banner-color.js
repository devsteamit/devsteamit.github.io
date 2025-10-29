// Dynamic banner color based on exam code from API
(function () {
    const API_URL = 'https://devsteamit.github.io/data/v2/available-exams/exams.json';
    let examData = null;

    // Fallback colors in case API fails
    const fallbackColors = {
        'aifc01': '#384350',  // Foundational
        'clfc02': '#384350',  // Foundational
        'mlac02': '#3A3BF7',  // Associate
        'deac02': '#3A3BF7',  // Associate
        'saac02': '#3A3BF7',  // Associate
        'dvac02': '#3A3BF7'   // Associate
    };

    function getExamCodeFromRequest() {
        // Try to get exam code from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        let examCode = urlParams.get('examcode') || urlParams.get('exam') || urlParams.get('code');

        // If not in URL params, try to get from hash
        if (!examCode && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            examCode = hashParams.get('examcode') || hashParams.get('exam') || hashParams.get('code');
        }

        // If not in URL, try to get from pathname
        if (!examCode) {
            const pathSegments = window.location.pathname.split('/').filter(segment => segment);
            // Look for exam code patterns in the path (check against known patterns)
            examCode = pathSegments.find(segment => {
                const code = segment.toLowerCase();
                return /^[a-z]{2,4}[a-z]?\d{2}$/.test(code); // Pattern like aifc01, clfc02, etc.
            });
        }

        // If still not found, try to get from localStorage (for persistence)
        if (!examCode) {
            examCode = localStorage.getItem('examCode');
        }

        return examCode ? examCode.toLowerCase() : null;
    }

    async function fetchExamData() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            examData = data;
            console.log('Exam data loaded successfully');
            return data;
        } catch (error) {
            console.error('Failed to fetch exam data:', error);
            return null;
        }
    }

    function findExamByFlavor(examCode) {
        if (!examData || !examData.exams) {
            return null;
        }

        return examData.exams.find(exam =>
            exam.flavor && exam.flavor.toLowerCase() === examCode.toLowerCase()
        );
    }

    function cleanExamTitle(title) {
        if (!title) return title;

        // Remove "Exam" from the end of the title (case insensitive)
        return title.replace(/\s+exam\s*$/i, '').trim();
    }

    function updateExamContent(examCode) {
        const exam = findExamByFlavor(examCode);
        if (!exam) {
            console.log(`No exam data found for code: ${examCode}`);
            return false;
        }

        // Update page title - remove "Exam" from end
        if (exam.title) {
            const cleanTitle = cleanExamTitle(exam.title);

            const pageTitle = document.querySelector('.pageTitle');
            if (pageTitle) {
                pageTitle.textContent = cleanTitle;
            }

            // Also update document title
            document.title = cleanTitle;
        }

        // Update app name - remove "Exam" from end
        if (exam.title) {
            const cleanTitle = cleanExamTitle(exam.title);

            const appName = document.querySelector('.appName');
            if (appName) {
                appName.textContent = cleanTitle;
            }

            // Also update header name
            const headerName = document.querySelector('.headerName');
            if (headerName) {
                headerName.textContent = "Your PATH to Fully Certified Golden Jacket";
            }
        }

        // Update app description - combine description and level
        let fullDescription = exam.description || '';
        let level = exam.level || '';

        if (level){
            const appLevel = document.querySelector('.appLevel');
            if (appLevel) {
                appLevel.textContent = level;
            }
        }

        if (fullDescription) {
            const appDescription = document.querySelector('.appDescription');
            if (appDescription) {
                appDescription.textContent = fullDescription;
            }

            // Also update meta description
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', fullDescription);
            }
        }

        // Update app price/level display
        if (exam.level) {
            const appPrice = document.querySelector('.appPrice');
            if (appPrice) {
                appPrice.textContent = exam.level;
            }
        }

        // Update app icon/image (preserve header icon, update main content icon only)
        if (exam.imageUrl) {
            console.log(`Attempting to update icon with URL: ${exam.imageUrl}`);
            
            // Update main app icon in content area only
            const appIconLarge = document.querySelector('.appIconLarge');
            if (appIconLarge) {
                console.log('Found .appIconLarge element, updating src');
                appIconLarge.src = exam.imageUrl;
                appIconLarge.alt = cleanExamTitle(exam.title) || 'Exam Icon';
                
                // Add error handling for image loading
                appIconLarge.onerror = function() {
                    console.error(`Failed to load exam icon: ${exam.imageUrl}`);
                    // Fallback to original icon if exam icon fails to load
                    this.src = './assets/brain_512.png';
                };
                
                appIconLarge.onload = function() {
                    console.log(`Successfully loaded exam icon: ${exam.imageUrl}`);
                };
            } else {
                console.error('Could not find .appIconLarge element');
            }

            // Keep header icon as original app icon - DO NOT UPDATE
            // const headerIcon = document.querySelector('.headerIcon');
            // This preserves the original brain_512.png in the header

            // Do NOT update iPhone screen preview - keep original screenshots
            // const iphoneScreen = document.querySelector('.iphoneScreen');
            // This preserves the original app screenshots in the device preview
        } else {
            console.log('No imageUrl found in exam data');
        }

        // Update banner color and add jacket image
        if (exam.color) {
            const imageWrapper = document.querySelector('.imageWrapper');
            if (imageWrapper) {
                imageWrapper.style.backgroundColor = exam.color;

                // Add jacket-small.png as background image - optimized smaller version
                imageWrapper.style.backgroundImage = 'url(./assets/jacket-small.png)';
                imageWrapper.style.backgroundRepeat = 'no-repeat';
                imageWrapper.style.backgroundSize = 'auto 100%'; // Smaller size - 60% of container height
                imageWrapper.style.backgroundPosition = 'right center'; // Position on the right side

                console.log('Banner updated with jacket.png background');
            }

            // Also update CSS custom property for potential other uses
            document.documentElement.style.setProperty('--banner-color', exam.color);
        }

        // Update Play Store button URL based on package
        if (exam.package) {
            const playStoreLink = document.querySelector('.playStoreLink');
            if (playStoreLink) {
                // Create Google Play Store URL from package name
                const playStoreUrl = `https://play.google.com/store/apps/details?id=${exam.package}`;
                playStoreLink.href = playStoreUrl;
                console.log(`Play Store URL updated to: ${playStoreUrl}`);
            }
        }

        // Hide App Store button
        const appStoreLink = document.querySelector('.appStoreLink');
        if (appStoreLink) {
            appStoreLink.style.display = 'none';
            console.log('App Store button hidden');
        }

        // Add level as CSS class for styling
        if (exam.level) {
            document.body.classList.remove('foundational', 'associate', 'professional');
            document.body.classList.add(exam.level.toLowerCase());
        }

        console.log(`Updated content for exam: ${cleanExamTitle(exam.title)} (${examCode}) - ${exam.level} Level`);
        return true;
    }

    function setBannerColor(examCode, color = null) {
        let targetColor = color;

        // If no color provided, try to find it from exam data
        if (!targetColor && examData) {
            const exam = findExamByFlavor(examCode);
            if (exam && exam.color) {
                targetColor = exam.color;
                console.log(`Found color ${targetColor} for exam ${examCode} from API`);
            }
        }

        // Fallback to hardcoded colors if API data not available
        if (!targetColor) {
            targetColor = fallbackColors[examCode.toLowerCase()];
            if (targetColor) {
                console.log(`Using fallback color ${targetColor} for exam ${examCode}`);
            }
        }

        if (targetColor) {
            // Store exam code for future use
            localStorage.setItem('examCode', examCode);

            // Apply the color to the banner
            const imageWrapper = document.querySelector('.imageWrapper');
            if (imageWrapper) {
                imageWrapper.style.backgroundColor = targetColor;
            }

            // Also update CSS custom property for potential other uses
            document.documentElement.style.setProperty('--banner-color', targetColor);

            console.log(`Banner color set to ${targetColor} for exam code: ${examCode}`);
            return true;
        } else {
            console.log(`No color found for exam code: ${examCode}`);
            return false;
        }
    }

    async function initializeExamContent() {
        const examCode = getExamCodeFromRequest();
        if (!examCode) {
            console.log('No exam code found');
            return;
        }

        console.log(`Initializing exam content for code: ${examCode}`);

        // Try to set color immediately with fallback
        setBannerColor(examCode);

        // Fetch exam data and update all content
        await fetchExamData();
        if (examData) {
            updateExamContent(examCode);
        }
    }

    // Initialize when DOM is ready
    function init() {
        initializeExamContent();
    }

    // Run when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose functions globally for manual control
    window.setBannerColor = setBannerColor;
    window.updateExamContent = updateExamContent;
    window.getExamCodeFromRequest = getExamCodeFromRequest;
    window.fetchExamData = fetchExamData;
    window.findExamByFlavor = findExamByFlavor;
})();