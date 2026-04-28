/*
 *  Author: Daniel Yu
 * Date Created: 2026-03-23
 * Description: AJAX password strength checker.
 * On input with debounce, sends password to PHP,
 * updates UI (green/red border + feedback text),
 * shows loading spinner while waiting for response.
 */

document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const feedbackDiv = document.getElementById('feedback');

    if (!passwordInput || !loadingSpinner || !feedbackDiv) {
        console.error('Required elements not found');
        return;
    }

    let abortController = null;
    let debounceTimer = null;

    function setLoading(isLoading) {
        if (isLoading) {
            loadingSpinner.classList.add('active');
            feedbackDiv.innerHTML = '';
        } else {
            loadingSpinner.classList.remove('active');
        }
    }

    function updateStrengthUI(isStrong) {
        if (isStrong) {
            passwordInput.classList.remove('weak');
            passwordInput.classList.add('strong');
            feedbackDiv.innerHTML = '<span class="strong-icon">✓</span> Strong password! All requirements met.';
            feedbackDiv.style.color = '#2b7a4b';
        } else {
            passwordInput.classList.remove('strong');
            passwordInput.classList.add('weak');
            feedbackDiv.innerHTML = '<span class="weak-icon">✗</span> Weak password. Please meet all requirements.';
            feedbackDiv.style.color = '#c92a2a';
        }
    }

    passwordInput.addEventListener('input', function(event) {
        const password = event.target.value;

        if (password === '') {
            passwordInput.classList.remove('strong', 'weak');
            feedbackDiv.innerHTML = '';
            loadingSpinner.classList.remove('active');
            return;
        }

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (abortController) {
                abortController.abort();
            }
            abortController = new AbortController();
            const signal = abortController.signal;

            const url = `check_password.php?password=${encodeURIComponent(password)}`;
            setLoading(true);

            fetch(url, { signal })
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.text();
                })
                .then(data => {
                    const isStrong = (data.trim() === 'strong');
                    updateStrengthUI(isStrong);
                })
                .catch(error => {
                    if (error.name === 'AbortError') {
                        console.log('Request aborted');
                    } else {
                        console.error('Fetch error:', error);
                        feedbackDiv.innerHTML = '⚠️ Error checking password. Try again later.';
                        feedbackDiv.style.color = '#e67700';
                        passwordInput.classList.remove('strong', 'weak');
                    }
                })
                .finally(() => {
                    if (abortController && abortController.signal === signal) {
                        setLoading(false);
                    }
                });
        }, 100);
    });
});