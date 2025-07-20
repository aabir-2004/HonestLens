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
});

// Search function
function performSearch(query) {
    console.log('Searching for:', query);
    
    // Show loading state
    const searchBtn = document.querySelector('.search-btn');
    const originalText = searchBtn.innerHTML;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    searchBtn.disabled = true;

    // Simulate API call
    setTimeout(() => {
        // Reset button
        searchBtn.innerHTML = originalText;
        searchBtn.disabled = false;
        
        // Show result notification
        const truthScore = Math.floor(Math.random() * 100);
        const credibility = getTruthLabel(truthScore);
        showNotification(`Search completed! Truth Score: ${truthScore}% - ${credibility}`);
        
        // Update demo score
        updateDemoScore(truthScore);
    }, 2000);
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