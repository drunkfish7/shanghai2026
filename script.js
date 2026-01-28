document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('feed-container');

    // Create Indicators Container
    const indicatorsContainer = document.createElement('div');
    indicatorsContainer.className = 'indicators';
    document.body.appendChild(indicatorsContainer);

    // Create Viewer Elements
    const viewer = document.createElement('div');
    viewer.className = 'fs-viewer';
    viewer.innerHTML = `
        <div class="fs-close">&times;</div>
        <div class="fs-image-wrapper">
            <img class="fs-img" src="" alt="Full Screen">
        </div>
    `;
    document.body.appendChild(viewer);

    const viewerImg = viewer.querySelector('.fs-img');
    const closeBtn = viewer.querySelector('.fs-close');

    // --- Configuration ---
    // Load local images: 1.jpg to 9.jpg
    const feedItems = [];
    for (let i = 1; i <= 9; i++) {
        feedItems.push({
            image: `images/${i}.jpg`,
        });
    }

    // --- Render Content & Indicators ---
    feedItems.forEach((item, index) => {
        // 1. Create Feed Item
        const div = document.createElement('div');
        div.className = 'feed-item';
        div.setAttribute('data-index', index);

        div.innerHTML = `
            <div class="image-container">
                <img src="${item.image}" alt="Feed Content" loading="lazy">
            </div>
        `;

        // Add Click Handler
        const img = div.querySelector('img');
        img.addEventListener('click', () => {
            openViewer(item.image);
        });

        container.appendChild(div);

        // 2. Create Indicator Dot
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.addEventListener('click', () => {
            div.scrollIntoView({ behavior: 'smooth' });
        });
        indicatorsContainer.appendChild(dot);
    });

    // --- Intersection Observer for Active Indicator ---
    const dots = document.querySelectorAll('.dot');
    const observerOptions = {
        root: container,
        threshold: 0.5 // Trigger when 50% visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = entry.target.getAttribute('data-index');
                updateActiveDot(index);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feed-item').forEach(item => {
        observer.observe(item);
    });

    function updateActiveDot(index) {
        dots.forEach(dot => dot.classList.remove('active'));
        if (dots[index]) {
            dots[index].classList.add('active');
        }
    }

    // --- Viewer Logic (Zoom & Pan) ---
    let scale = 1;
    let pointX = 0;
    let pointY = 0;
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let startDist = 0; // for pinch

    function openViewer(src) {
        viewerImg.src = src;
        viewer.classList.add('active');
        resetZoom();
    }

    function closeViewer() {
        viewer.classList.remove('active');
        setTimeout(() => {
            viewerImg.src = '';
            resetZoom();
        }, 300);
    }

    function resetZoom() {
        scale = 1;
        pointX = 0;
        pointY = 0;
        updateTransform();
    }

    function updateTransform() {
        viewerImg.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    }

    closeBtn.addEventListener('click', closeViewer);
    viewer.addEventListener('click', (e) => {
        // Close if clicking background (not image)
        if (e.target === viewer || e.target.classList.contains('fs-image-wrapper')) {
            closeViewer();
        }
    });

    // Touch Event Handlers
    viewerImg.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            // Pinch start
            isDragging = false;
            startDist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
        } else if (e.touches.length === 1) {
            // Pan start
            if (scale > 1) {
                isDragging = true;
                startX = e.touches[0].pageX - pointX;
                startY = e.touches[0].pageY - pointY;
            }
        }
    });

    viewerImg.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Prevent browser defaults inside viewer

        if (e.touches.length === 2) {
            // Pinch zoom
            const currentDist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );

            if (startDist > 0) {
                const diff = currentDist / startDist;
                // Limit zoom speed and range
                const newScale = scale * diff;
                if (newScale >= 1 && newScale <= 4) {
                    // Simple center zoom for now
                    scale = newScale;
                }
                startDist = currentDist; // Update for next move
                updateTransform();
            }
        } else if (e.touches.length === 1 && isDragging) {
            // Pan
            pointX = e.touches[0].pageX - startX;
            pointY = e.touches[0].pageY - startY;
            updateTransform();
        }
    });

    viewerImg.addEventListener('touchend', (e) => {
        isDragging = false;
        // Reset if zoomed out too much
        if (scale < 1) {
            scale = 1;
            pointX = 0;
            pointY = 0;
            updateTransform();
        }
    });
});
