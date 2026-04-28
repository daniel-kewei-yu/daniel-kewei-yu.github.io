/* 
 * Author: Daniel Yu
 * Date Created: 2026-03-23
 * Description: Handles form submission, sends AJAX request to get_cities.php,
 * displays results, and manages loading state and button disable.
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cityForm');
    const minInput = document.getElementById('min');
    const maxInput = document.getElementById('max');
    const submitBtn = document.getElementById('submitBtn');
    const loadingDiv = document.getElementById('loading');
    const cityList = document.getElementById('cityList');
    const errorMsg = document.getElementById('errorMsg');

    let abortController = null;

    function clearResults() {
        cityList.innerHTML = '';
        errorMsg.textContent = '';
    }

    function setLoading(isLoading) {
        if (isLoading) {
            loadingDiv.style.display = 'block';
            submitBtn.disabled = true;
        } else {
            loadingDiv.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    function displayCities(cities) {
        errorMsg.textContent = '';
        if (!Array.isArray(cities)) {
            if (cities && cities.error) {
                errorMsg.textContent = cities.error;
            } else {
                errorMsg.textContent = 'Unexpected response format.';
            }
            cityList.innerHTML = '';
            return;
        }

        if (cities.length === 0) {
            cityList.innerHTML = '<li>No cities found in that population range.</li>';
            return;
        }

        cityList.innerHTML = '';
        cities.forEach(city => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="city-name">${escapeHtml(city.Name)}</span>
                            <span class="city-population">${Number(city.Population).toLocaleString()}</span>`;
            cityList.appendChild(li);
        });
    }

    // Simple helper to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const min = parseInt(minInput.value);
        const max = parseInt(maxInput.value);

        if (isNaN(min) || isNaN(max) || min < 0 || max < 0) {
            errorMsg.textContent = 'Please enter valid non‑negative numbers.';
            return;
        }
        if (min > max) {
            errorMsg.textContent = 'Min population cannot be greater than max.';
            return;
        }

        clearResults();
        setLoading(true);

        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();

        const url = `get_cities.php?min=${encodeURIComponent(min)}&max=${encodeURIComponent(max)}`;

        fetch(url, { signal: abortController.signal })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                displayCities(data);
            })
            .catch(error => {
                if (error.name === 'AbortError') {
                    console.log('Request aborted');
                } else {
                    console.error('Fetch error:', error);
                    errorMsg.textContent = 'Failed to load cities. Please try again.';
                    cityList.innerHTML = '';
                }
            })
            .finally(() => {
                setLoading(false);
                abortController = null;
            });
    });
});