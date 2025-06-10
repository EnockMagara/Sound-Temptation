// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Navigation functionality
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    const audioToggle = document.getElementById('audioToggle');
    const navigationIcon = document.getElementById('navigationIcon');
    

    
    // Set initial active states
    updateActiveNav('home');
    
    // Navigation click handlers
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            showSection(target);
            updateActiveNav(target);
            
            // Add click feedback
            this.style.transform = 'translateY(-2px) scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
        
        // Add hover effects
        item.addEventListener('mouseenter', function() {
            this.style.letterSpacing = '2px';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.letterSpacing = '1px';
        });
    });
    
    // Show specific section
    function showSection(targetId) {
        sections.forEach(section => {
            if (section.id === targetId) {
                section.classList.add('active');
                // Add entrance animation
                section.style.opacity = '0';
                section.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    section.style.opacity = '1';
                    section.style.transform = 'translateY(0)';
                }, 10);
            } else {
                section.classList.remove('active');
                section.style.opacity = '';
                section.style.transform = '';
                section.style.transition = '';
            }
        });
    }
    
    // Update active navigation state
    function updateActiveNav(activeTarget) {
        navItems.forEach(item => {
            if (item.getAttribute('data-target') === activeTarget) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    

    
    // Global audio control functionality
    let globalAudioPlaying = false;
    
    if (audioToggle) {
    audioToggle.addEventListener('click', function() {
            globalAudioPlaying = !globalAudioPlaying;
        
        const soundWaves = this.querySelectorAll('.sound-wave');
        const audioControl = this.querySelector('.audio-control') || this;
        
            if (globalAudioPlaying) {
            // Start "playing" animation
            soundWaves.forEach((wave, index) => {
                wave.style.animationPlayState = 'running';
                wave.style.animationDuration = `${1.2 + (index * 0.1)}s`;
            });
            audioControl.style.background = '#ffffff';
            audioControl.style.color = '#000000';
            
            // Add sound wave scrollbar effect to body
            document.body.classList.add('audio-playing');
            
            // Show playing state
            setTimeout(() => {
                    if (globalAudioPlaying) {
                        showNotification('♪ Ambient audio playing...');
                }
            }, 300);
            
        } else {
            // Stop animation
            soundWaves.forEach(wave => {
                wave.style.animationPlayState = 'paused';
            });
            audioControl.style.background = '#000000';
            audioControl.style.color = '#ffffff';
            
            // Remove sound wave scrollbar effect from body
            document.body.classList.remove('audio-playing');
        }
        
        // Add click feedback
        this.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);
    });
    }
    
    // Notification system
    function showNotification(message) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 120px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: #ffffff;
            padding: 15px 25px;
            border: 2px solid #ffffff;
            font-size: 0.9rem;
            font-weight: 600;
            letter-spacing: 1px;
            z-index: 2000;
            opacity: 0;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            pointer-events: none;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Intersection observer for animations
    const observeElements = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        // Observe team members, process items, etc.
        document.querySelectorAll('.team-member, .process-item, .insight-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
            });
        };
        
    // Initialize intersection observer
    setTimeout(observeElements, 100);
    
    // Show navigation icon animation
    function showNavigationIcon() {
        if (navigationIcon) {
            navigationIcon.classList.add('active');
        }
    }
    
    // Hide navigation icon animation
    function hideNavigationIcon() {
        if (navigationIcon) {
            navigationIcon.classList.remove('active');
        }
    }
    
    // Smooth scroll behavior for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Debug info (remove in production)
    console.log('Temptation website initialized');
        
    // Make navigation functions global for other scripts
    window.showNavigationIcon = showNavigationIcon;
    window.hideNavigationIcon = hideNavigationIcon;
});
            
// Global function for Enter Story button
function enterStory() {
    const navigationIcon = document.getElementById('navigationIcon');
    
    // Show mystical animation
    if (navigationIcon) {
        navigationIcon.classList.add('active');
    }
    
    // Add animation before navigation for dramatic effect
        setTimeout(() => {
        window.location.href = 'sounds.html';
    }, 500); // 0.5 seconds of mystical animation
}

// Global function for SOUNDS navigation
function enterSounds() {
    const navigationIcon = document.getElementById('navigationIcon');
    
    // Show mystical animation
    if (navigationIcon) {
        navigationIcon.classList.add('active');
    }
    
    // Add animation before navigation for dramatic effect
    setTimeout(() => {
        window.location.href = 'sounds.html';
    }, 500); // 0.5 seconds of mystical animation
}
