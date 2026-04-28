(function () {
    // DOM elements
    const textarea = document.getElementById('memoText');
    const saveBtn = document.getElementById('saveBtn');
    const revertBtn = document.getElementById('revertBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageDisplay = document.getElementById('pageDisplay');
    const pageNumSpan = document.getElementById('pageNum');

    // Constants
    const TOTAL_PAGES = 50;
    const STORAGE_KEY_PAGES = 'memoPages';
    const STORAGE_KEY_CURRENT = 'memoCurrentPage';

    // State
    let pages = [];               // array of 50 strings (saved content)
    let currentPage = 0;          // zero-based index

    // Load data from localStorage
    function loadFromStorage() {
        // Load pages array
        const savedPages = localStorage.getItem(STORAGE_KEY_PAGES);
        if (savedPages) {
            try {
                pages = JSON.parse(savedPages);
                // Ensure it's an array of length 50 (fill missing with empty strings)
                if (!Array.isArray(pages)) pages = [];
            } catch (e) {
                pages = [];
            }
        } else {
            pages = [];
        }

        // Ensure we have exactly TOTAL_PAGES elements, all strings
        while (pages.length < TOTAL_PAGES) {
            pages.push('');
        }
        if (pages.length > TOTAL_PAGES) {
            pages = pages.slice(0, TOTAL_PAGES);
        }
        for (let i = 0; i < pages.length; i++) {
            if (typeof pages[i] !== 'string') {
                pages[i] = '';
            }
        }

        // Load current page index
        const savedCurrent = localStorage.getItem(STORAGE_KEY_CURRENT);
        if (savedCurrent !== null) {
            let idx = parseInt(savedCurrent, 10);
            if (!isNaN(idx) && idx >= 0 && idx < TOTAL_PAGES) {
                currentPage = idx;
            } else {
                currentPage = 0;
            }
        } else {
            currentPage = 0;
        }
    }

    // Save pages array and current page to localStorage
    function saveToStorage() {
        localStorage.setItem(STORAGE_KEY_PAGES, JSON.stringify(pages));
        localStorage.setItem(STORAGE_KEY_CURRENT, currentPage.toString());
    }

    // Update UI: textarea, page indicator, button states
    function updateUI() {
        // Set textarea to saved content of current page
        textarea.value = pages[currentPage];

        // Update page indicator
        pageDisplay.textContent = `Page ${currentPage + 1} of ${TOTAL_PAGES}`;
        pageNumSpan.textContent = currentPage + 1;

        // Enable/disable navigation buttons
        prevBtn.disabled = (currentPage === 0);
        nextBtn.disabled = (currentPage === TOTAL_PAGES - 1);

        // Update save/revert buttons based on whether textarea matches saved
        updateButtonState();
    }

    // Enable/disable save and revert based on equality with saved page
    function updateButtonState() {
        const currentText = textarea.value;
        const savedText = pages[currentPage];
        const isMatch = (currentText === savedText);

        saveBtn.disabled = isMatch;
        revertBtn.disabled = isMatch;
    }

    // Save current textarea content to pages array and localStorage
    function saveCurrentPage() {
        pages[currentPage] = textarea.value;
        saveToStorage();
        updateButtonState();  // buttons become disabled
    }

    // Revert textarea to saved content of current page
    function revertCurrentPage() {
        textarea.value = pages[currentPage];
        updateButtonState();
    }

    // Change to a different page
    function changePage(delta) {
        const newPage = currentPage + delta;
        if (newPage < 0 || newPage >= TOTAL_PAGES) return;

        currentPage = newPage;
        saveToStorage(); 
        updateUI();
    }

    // Event listeners
    textarea.addEventListener('input', updateButtonState);

    saveBtn.addEventListener('click', saveCurrentPage);
    revertBtn.addEventListener('click', revertCurrentPage);

    prevBtn.addEventListener('click', () => changePage(-1));
    nextBtn.addEventListener('click', () => changePage(1));

    // Initialize
    loadFromStorage();
    updateUI();
})();