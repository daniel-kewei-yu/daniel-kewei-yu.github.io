(function () {
    // Canvas setup
    const canvas = document.getElementById('paintCanvas');
    const ctx = canvas.getContext('2d');

    // White background via CSS is enough, but clear once to start fresh
    canvas.style.backgroundColor = 'white';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Brush definitions
    const brushes = {
        largeCircle: { shape: 'circle', baseSize: 10 },
        smallCircle: { shape: 'circle', baseSize: 5 },
        largeSquare: { shape: 'square', baseSize: 20 },
        smallSquare: { shape: 'square', baseSize: 10 }
    };

    // Current brush (default small circle)
    let currentBrush = { ...brushes.smallCircle };

    // Current color (default black)
    let currentColor = '#000000';

    // Drawing flag
    let drawing = false;

    // Helper to get effective size (doubled if Alt pressed)
    function getEffectiveSize(altPressed) {
        let size = currentBrush.baseSize;
        if (altPressed) {
            size *= 2;
        }
        return size;
    }

    // Core drawing function called from mousemove
    function drawAt(x, y, ctrlPressed, altPressed) {
        // Boundary check
        if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) {
            return;
        }

        if (ctrlPressed) {
            // Eraser mode: clear a square (base size 20, doubled with Alt)
            let eraserSize = 20;
            if (altPressed) {
                eraserSize *= 2;
            }
            ctx.clearRect(x - eraserSize / 2, y - eraserSize / 2, eraserSize, eraserSize);
            return;
        }

        // Normal drawing
        const size = getEffectiveSize(altPressed);
        ctx.fillStyle = currentColor;

        if (currentBrush.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Square brush
            ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
    }

    // Update status display
    function updateStatus() {
        let shapeName;
        if (currentBrush.shape === 'circle') {
            shapeName = 'circle';
        } else {
            shapeName = 'square';
        }

        let sizeDesc;
        if (currentBrush.baseSize === 5) {
            sizeDesc = 'small';
        } else if (currentBrush.baseSize === 10) {
            sizeDesc = 'large'; // large circle is 10, small square is 10? Wait small square is 10, large square is 20.
            // The brushes: smallCircle baseSize=5, largeCircle=10, smallSquare=10, largeSquare=20.
            // So baseSize 10 could be either large circle or small square. We'll use a more descriptive approach.
            // Let's base on shape to make it clearer:
            if (currentBrush.shape === 'circle') {
                sizeDesc = 'large';
            } else {
                sizeDesc = 'small';
            }
        } else if (currentBrush.baseSize === 20) {
            sizeDesc = 'large';
        } else {
            sizeDesc = 'unknown';
        }

        const friendly = sizeDesc + ' ' + shapeName + ' · ' + currentColor;
        document.getElementById('brushStatus').innerText = friendly;
    }

    // Clear canvas with confirmation
    function clearCanvasWithConfirm() {
        const ok = confirm('Clear the entire canvas?');
        if (!ok) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Event listeners for drawing
    canvas.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent dragging / selection
        drawing = true;
        drawAt(e.offsetX, e.offsetY, e.ctrlKey, e.altKey);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        e.preventDefault();
        drawAt(e.offsetX, e.offsetY, e.ctrlKey, e.altKey);
    });

    canvas.addEventListener('mouseup', () => {
        drawing = false;
    });

    canvas.addEventListener('mouseleave', () => {
        drawing = false;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Brush buttons
    document.getElementById('brushLargeCircle').addEventListener('click', () => {
        currentBrush = { ...brushes.largeCircle };
        updateStatus();
    });
    document.getElementById('brushSmallCircle').addEventListener('click', () => {
        currentBrush = { ...brushes.smallCircle };
        updateStatus();
    });
    document.getElementById('brushLargeSquare').addEventListener('click', () => {
        currentBrush = { ...brushes.largeSquare };
        updateStatus();
    });
    document.getElementById('brushSmallSquare').addEventListener('click', () => {
        currentBrush = { ...brushes.smallSquare };
        updateStatus();
    });

    // Color input
    const colorInput = document.getElementById('colorInput');
    colorInput.addEventListener('input', (e) => {
        currentColor = e.target.value;
        updateStatus();
    });
    colorInput.addEventListener('change', (e) => {
        currentColor = e.target.value;
        updateStatus();
    });

    // Clear button
    document.getElementById('clearButton').addEventListener('click', clearCanvasWithConfirm);

    // Keyboard: Backspace / Delete clear canvas
    window.addEventListener('keydown', (e) => {
        const key = e.key;
        if (key === 'Backspace' || key === 'Delete') {
            e.preventDefault(); // Avoid navigating back
            clearCanvasWithConfirm();
        }
    });

    // Initialize status
    updateStatus();
})();