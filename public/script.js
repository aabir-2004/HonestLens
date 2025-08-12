// Set your backend API base URL here (e.g., https://your-app.onrender.com)
const API_BASE = window.location.origin;

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    const sections = document.querySelectorAll('.hero-section, .content-section');
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    const suggestionItems = document.querySelectorAll('.suggestion-item');

    // Navigation switching
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => section.classList.remove('active'));
            
            // Show target section
            const targetElement = document.getElementById(targetSection);
            if (targetElement) {
                targetElement.classList.add('active');
            }
            
            // Add entrance animation
            animateSection(targetElement);
        });
    });

    // Search functionality
    searchBtn.addEventListener('click', function() {
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query);
        }
    });

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query) {
                performSearch(query);
            }
        }
    });

    // Search suggestions
    suggestionItems.forEach(item => {
        item.addEventListener('click', function() {
            const suggestionText = this.querySelector('span').textContent;
            const query = suggestionText.split(': ')[1];
            searchInput.value = query;
            performSearch(query);
        });
    });

    // Search input focus effects
    searchInput.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });

    searchInput.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });

    // Tool cards hover effects
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = 'none';
        });
    });

    // News cards interaction
    const newsCards = document.querySelectorAll('.news-card');
    newsCards.forEach(card => {
        card.addEventListener('click', function() {
            // Add click animation
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'translateY(-5px)';
            }, 150);
        });
    });

    // Share buttons functionality
    const shareButtons = document.querySelectorAll('.share-btn');
    shareButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const cardTitle = this.parentElement.querySelector('h3').textContent;
            showNotification(`${cardTitle} feature coming soon!`);
        });
    });

    // Dynamic truth score animation
    animateTruthScore();

    // Parallax effect for siren lights
    document.addEventListener('mousemove', function(e) {
        const sirenLights = document.querySelectorAll('.siren-light');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        sirenLights.forEach((light, index) => {
            const speed = (index + 1) * 0.5;
            const x = (mouseX - 0.5) * speed * 50;
            const y = (mouseY - 0.5) * speed * 50;
            
            light.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    // Mobile navigation toggle (for responsive design)
    createMobileToggle();

    // Verification tool event listeners
    const urlInput = document.querySelector('.url-input');
    const urlVerifyBtn = document.querySelector('.url-verify-btn');
    const textInput = document.querySelector('.text-input');
    const textVerifyBtn = document.querySelector('.text-verify-btn');
    const imageInput = document.querySelector('.image-input');
    const imageVerifyBtn = document.querySelector('.image-verify-btn');
    const resultSection = document.getElementById('verification-result');
    const resultContent = resultSection ? resultSection.querySelector('.result-content') : null;

    if (urlVerifyBtn && urlInput) {
        urlVerifyBtn.addEventListener('click', async function() {
            const url = urlInput.value.trim();
            if (!isValidUrl(url)) {
                showNotification('Please enter a valid URL.');
                return;
            }
            urlVerifyBtn.disabled = true;
            urlVerifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
            try {
                const res = await fetch(`${API_BASE}/verification/verify-url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                const data = await res.json();
                if (data.success && data.data) {
                    showVerificationResult(data.data);
                } else {
                    showNotification(data.message || 'Verification failed.');
                }
            } catch (err) {
                showNotification('Verification failed. Please try again.');
            } finally {
                urlVerifyBtn.disabled = false;
                urlVerifyBtn.innerHTML = 'Verify URL';
            }
        });
    }

    if (textVerifyBtn && textInput) {
        textVerifyBtn.addEventListener('click', async function() {
            const text = textInput.value.trim();
            if (text.length < 10) {
                showNotification('Please enter at least 10 characters.');
                return;
            }
            textVerifyBtn.disabled = true;
            textVerifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
            try {
                const res = await fetch(`${API_BASE}/verification/verify-text`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
                const data = await res.json();
                if (data.success && data.data) {
                    showVerificationResult(data.data);
                } else {
                    showNotification(data.message || 'Verification failed.');
                }
            } catch (err) {
                showNotification('Verification failed. Please try again.');
            } finally {
                textVerifyBtn.disabled = false;
                textVerifyBtn.innerHTML = 'Verify Text';
            }
        });
    }

    if (imageVerifyBtn && imageInput) {
        imageVerifyBtn.addEventListener('click', async function() {
            if (!imageInput.files || !imageInput.files[0]) {
                showNotification('Please select an image file.');
                return;
            }
            imageVerifyBtn.disabled = true;
            imageVerifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
            try {
                const formData = new FormData();
                formData.append('image', imageInput.files[0]);
                const res = await fetch(`${API_BASE}/verification/verify-image`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success && data.data) {
                    showVerificationResult(data.data);
                } else {
                    showNotification(data.message || 'Verification failed.');
                }
            } catch (err) {
                showNotification('Verification failed. Please try again.');
            } finally {
                imageVerifyBtn.disabled = false;
                imageVerifyBtn.innerHTML = 'Verify Image';
            }
        });
    }

    function showVerificationResult(data) {
        if (resultSection && resultContent) {
            resultSection.style.display = 'block';
            resultContent.innerHTML = `
                <div><strong>Status:</strong> ${data.status || 'processing'}</div>
                <div><strong>Request ID:</strong> ${data.requestId || ''}</div>
                <div><strong>Estimated Time:</strong> ${data.estimatedTime || ''}</div>
                <div><strong>Result:</strong> ${data.result ? JSON.stringify(data.result) : 'Pending'}</div>
            `;
            window.scrollTo({ top: resultSection.offsetTop, behavior: 'smooth' });
        }
    }

    // Tab switching for Verified News
    const trendingTab = document.querySelector('.trending-tab');
    const liveTab = document.querySelector('.live-tab');
    if (trendingTab && liveTab) {
        trendingTab.addEventListener('click', function() {
            trendingTab.classList.add('active');
            liveTab.classList.remove('active');
            fetchTrendingTopics();
        });
        liveTab.addEventListener('click', function() {
            liveTab.classList.add('active');
            trendingTab.classList.remove('active');
            fetchLiveNews();
        });
    }
});

// Helper: Check if string is a URL
function isValidUrl(str) {
    try {
        new URL(str);
        return true;
    } catch (_) {
        return false;
    }
}

// Fetch and display live news
async function fetchLiveNews() {
    try {
        const res = await fetch(`${API_BASE}/news/live?pageSize=6`);
        const data = await res.json();
        if (data.success && data.data.articles) {
            const liveNewsSection = document.querySelector('.news-grid');
            if (liveNewsSection) {
                liveNewsSection.innerHTML = data.data.articles.map(article => `
                    <div class="news-card">
                        <div class="news-badge live"><i class="fas fa-bolt"></i>Live</div>
                        <h3>${article.title}</h3>
                        <p>${article.description || article.content || ''}</p>
                        <div class="news-meta">
                            <span class="source">Source: ${article.source.name || 'Unknown'}</span>
                            <span class="published">${article.publishedAt ? new Date(article.publishedAt).toLocaleString() : ''}</span>
                        </div>
                        <a href="${article.url}" target="_blank" class="news-link">Read More</a>
                    </div>
                `).join('');
            }
        }
    } catch (err) {
        showNotification('Failed to load live news.');
    }
}

// Fetch and display trending topics in Verified News
async function fetchTrendingTopics() {
    try {
        const res = await fetch(`${API_BASE}/news/trending`);
        const data = await res.json();
        if (data.success && data.data.trending) {
            const trendingSection = document.querySelector('.news-grid');
            if (trendingSection) {
                trendingSection.innerHTML = data.data.trending.map(item => `
                    <div class="news-card">
                        <div class="news-badge trending"><i class="fas fa-fire"></i>Trending</div>
                        <h3>${item.title}</h3>
                        <p>Category: ${item.category || 'General'}</p>
                        <div class="news-meta">
                            <span class="source">Source: ${item.source}</span>
                            <span class="truth-score">Avg Truth Score: ${item.avgTruthScore}%</span>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (err) {
        showNotification('Failed to load trending topics.');
    }
}

// Enhanced search function
async function performSearch(query) {
    const searchBtn = document.querySelector('.search-btn');
    const originalText = searchBtn.innerHTML;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    searchBtn.disabled = true;
    try {
        let result;
        if (isValidUrl(query)) {
            // URL verification
            result = await fetch(`${API_BASE}/verification/verify-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: query })
            });
        } else {
            // Text verification
            result = await fetch(`${API_BASE}/verification/verify-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: query })
            });
        }
        const data = await result.json();
        if (data.success && data.data) {
            showNotification(`Verification submitted! Status: ${data.data.status || 'processing'}`);
        } else {
            showNotification(data.message || 'Verification failed.');
        }
    } catch (err) {
        showNotification('Verification failed. Please try again.');
    } finally {
        searchBtn.innerHTML = originalText;
        searchBtn.disabled = false;
    }
}

// Get truth label based on score
function getTruthLabel(score) {
    if (score >= 80) return 'Highly Credible';
    if (score >= 60) return 'Mostly Credible';
    if (score >= 40) return 'Mixed Credibility';
    if (score >= 20) return 'Low Credibility';
    return 'Not Credible';
}

// Update demo truth score
function updateDemoScore(score) {
    const scoreValue = document.querySelector('.score-value');
    const scoreLabel = document.querySelector('.score-label');
    const scoreFill = document.querySelector('.score-fill');
    
    if (scoreValue && scoreLabel && scoreFill) {
        // Animate score change
        let currentScore = parseInt(scoreValue.textContent);
        const increment = score > currentScore ? 1 : -1;
        
        const updateInterval = setInterval(() => {
            currentScore += increment;
            scoreValue.textContent = currentScore + '%';
            scoreFill.style.width = currentScore + '%';
            
            if (currentScore === score) {
                clearInterval(updateInterval);
                scoreLabel.textContent = getTruthLabel(score);
                
                // Update color based on score
                if (score >= 60) {
                    scoreValue.style.color = '#10b981';
                    scoreFill.style.background = 'linear-gradient(90deg, #10b981, #3b82f6)';
                } else if (score >= 40) {
                    scoreValue.style.color = '#f59e0b';
                    scoreFill.style.background = 'linear-gradient(90deg, #f59e0b, #3b82f6)';
                } else {
                    scoreValue.style.color = '#ef4444';
                    scoreFill.style.background = 'linear-gradient(90deg, #ef4444, #3b82f6)';
                }
            }
        }, 50);
    }
}

// Animate truth score on load
function animateTruthScore() {
    const scoreValue = document.querySelector('.score-value');
    if (scoreValue) {
        let score = 0;
        const targetScore = 87;
        
        setTimeout(() => {
            const interval = setInterval(() => {
                score += 2;
                scoreValue.textContent = score + '%';
                
                if (score >= targetScore) {
                    clearInterval(interval);
                    scoreValue.textContent = targetScore + '%';
                }
            }, 30);
        }, 1500);
    }
}

// Section animation
function animateSection(section) {
    if (section) {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            section.style.transition = 'all 0.6s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 100);
    }
}

// Notification system
function showNotification(message) {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>${message}</span>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: rgba(59, 130, 246, 0.9);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 10000;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;

    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 50%;
                transition: background 0.3s ease;
            }
            .notification-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Mobile navigation toggle
function createMobileToggle() {
    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'mobile-nav-toggle';
    mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
    mobileToggle.style.cssText = `
        display: none;
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 10001;
        background: rgba(59, 130, 246, 0.9);
        border: none;
        color: white;
        padding: 1rem;
        border-radius: 10px;
        cursor: pointer;
        backdrop-filter: blur(20px);
    `;

    document.body.appendChild(mobileToggle);

    // Show on mobile
    function checkMobile() {
        if (window.innerWidth <= 768) {
            mobileToggle.style.display = 'block';
        } else {
            mobileToggle.style.display = 'none';
        }
    }

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Toggle functionality
    mobileToggle.addEventListener('click', () => {
        const leftNav = document.querySelector('.left-nav');
        leftNav.classList.toggle('open');
        
        const icon = mobileToggle.querySelector('i');
        if (leftNav.classList.contains('open')) {
            icon.className = 'fas fa-times';
        } else {
            icon.className = 'fas fa-bars';
        }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        const leftNav = document.querySelector('.left-nav');
        if (!leftNav.contains(e.target) && !mobileToggle.contains(e.target)) {
            leftNav.classList.remove('open');
            mobileToggle.querySelector('i').className = 'fas fa-bars';
        }
    });
}