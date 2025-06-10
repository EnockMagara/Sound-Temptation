// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Horizontal scroll functionality for sounds section
    const horizontalContainer = document.querySelector('.horizontal-scroll-container');
    const narrativeSections = document.querySelectorAll('.narrative-section');
    const playButtons = document.querySelectorAll('.play-btn');
    const audioToggle = document.getElementById('audioToggle');
    const navigationIcon = document.getElementById('navigationIcon');
    
    let currentAudio = null;
    let currentSection = 0;
    let isAutoScrolling = false;
    let audioCompleted = false;
    let canNavigate = true;
    let audioContextUnlocked = false;
    
    // Set initial active states
    if (narrativeSections.length > 0) {
        narrativeSections[0].classList.add('active');
    }
    
    // Initialize sounds section
    initializeSoundsSection();
    
    function initializeSoundsSection() {
        currentSection = 0;
        updateActiveNarrativeSection();
        setupHorizontalScroll();
        setupAudioControls();
        setupBranchingChoice();
        setupAudioUnlock();
    }

    // Setup audio unlock functionality for Firefox
    function setupAudioUnlock() {
        const audioUnlockContainer = document.getElementById('audioUnlockContainer');
        const audioUnlockBtn = document.getElementById('audioUnlockBtn');
        
        if (audioUnlockBtn) {
            audioUnlockBtn.addEventListener('click', function() {
                // Create a silent audio element to test and unlock audio context
                const silentAudio = document.createElement('audio');
                silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==';
                silentAudio.volume = 0;
                
                const playPromise = silentAudio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        audioContextUnlocked = true;
                        audioUnlockContainer.style.display = 'none';
                        showNotification('Audio enabled! Scroll right to begin the story.');
                    }).catch(() => {
                        showNotification('Please try clicking the button again to enable audio.');
                    });
                }
            });
        }
        
        // Show unlock button after a short delay if in a restricted environment
        setTimeout(() => {
            checkAudioPermissions();
        }, 1000);
    }

    // Check if we need to show audio unlock button
    function checkAudioPermissions() {
        const audioUnlockContainer = document.getElementById('audioUnlockContainer');
        
        // Test if we can play audio without user interaction
        const testAudio = document.createElement('audio');
        testAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==';
        testAudio.volume = 0;
        
        const playPromise = testAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Autoplay is allowed
                audioContextUnlocked = true;
            }).catch(() => {
                // Autoplay is blocked - show unlock button
                if (audioUnlockContainer && !audioContextUnlocked) {
                    audioUnlockContainer.style.display = 'block';
                }
            });
        }
    }

    // Setup branching choice functionality
    function setupBranchingChoice() {
        const choiceButtons = document.querySelectorAll('.choice-btn');
        
        choiceButtons.forEach(button => {
            button.addEventListener('click', function() {
                const choice = this.getAttribute('data-choice');
                handleChoice(choice);
            });
        });
    }

    // Handle user choice
    function handleChoice(choice) {
        // Stop any current audio
        stopCurrentAudio();
        
        // Hide current section
        const currentNarrativeSection = narrativeSections[currentSection];
        if (currentNarrativeSection) {
            currentNarrativeSection.style.display = 'none';
        }
        
        // Show appropriate ending
        let targetSection;
        if (choice === 'sleep') {
            targetSection = document.querySelector('.ending-sleep');
            showNotification('He chooses rest over communion...');
        } else if (choice === 'pray') {
            targetSection = document.querySelector('.ending-pray');
            showNotification('He chooses faith over flesh...');
        }
        
        if (targetSection) {
            targetSection.style.display = 'flex';
            // Scroll to the ending
            setTimeout(() => {
                targetSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    inline: 'start' 
                });
            }, 100);
        }
    }

    // Restart story function (global for button onclick)
    window.restartStory = function() {
        // Hide all endings
        document.querySelector('.ending-sleep').style.display = 'none';
        document.querySelector('.ending-pray').style.display = 'none';
        
        // Reset all state variables
        currentSection = 0;
        audioCompleted = false;
        canNavigate = true;
        stopCurrentAudio();
        
        scrollToSection(0, true);
        updateActiveNarrativeSection();
        
        // Reset branching choice visibility
        const branchingChoice = document.querySelector('.branching-choice');
        if (branchingChoice) {
            branchingChoice.style.display = 'none';
        }
        
        // Show home section again
        const homeSection = document.querySelector('[data-section="0"]');
        if (homeSection) {
            homeSection.style.display = 'flex';
        }
        
        showNotification('Story reset. Choose your path again...');
    }
    
    // Setup horizontal scroll functionality
    function setupHorizontalScroll() {
        if (!horizontalContainer) return;
        
        // Mouse wheel horizontal scroll
        horizontalContainer.addEventListener('wheel', function(e) {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                this.scrollLeft += e.deltaY;
            }
        });
        
        // Touch swipe for mobile
        let startX = 0;
        let scrollStartX = 0;
        
        horizontalContainer.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            scrollStartX = this.scrollLeft;
        });
        
        horizontalContainer.addEventListener('touchmove', function(e) {
            if (!startX) return;
            
            const currentX = e.touches[0].clientX;
            const diffX = startX - currentX;
            this.scrollLeft = scrollStartX + diffX;
        });
        
        horizontalContainer.addEventListener('touchend', function() {
            startX = 0;
            scrollStartX = 0;
        });
        
        // Scroll event to update active section
        horizontalContainer.addEventListener('scroll', function() {
            if (isAutoScrolling) return;
            
            const scrollLeft = this.scrollLeft;
            const sectionWidth = window.innerWidth;
            const newSection = Math.round(scrollLeft / sectionWidth);
            
            // Prevent manual scroll to next section if audio hasn't completed
            if (newSection > currentSection && !canNavigate && newSection > 0) {
                // Snap back to current section
                scrollToSection(currentSection, false);
                showNotification('Please wait for the audio to finish before proceeding...');
                return;
            }
            
            if (newSection !== currentSection && newSection >= 0 && newSection < narrativeSections.length) {
                currentSection = newSection;
                updateActiveNarrativeSection();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                navigateSection(e.key === 'ArrowRight' ? 1 : -1);
            } else if (e.key === ' ') {
                e.preventDefault();
                toggleCurrentAudio();
            }
        });
    }
    
    // Navigate between sections
    function navigateSection(direction) {
        // Prevent navigation if audio is still playing (except going back)
        if (!canNavigate && direction > 0) {
            showNotification('Please wait for the audio to finish before proceeding...');
            return;
        }
        
        const newSection = currentSection + direction;
        if (newSection >= 0 && newSection < narrativeSections.length) {
            currentSection = newSection;
            scrollToSection(currentSection);
            updateActiveNarrativeSection();
        }
    }
    
    // Scroll to specific section
    function scrollToSection(sectionIndex, smooth = true) {
        if (!horizontalContainer) return;
        
        isAutoScrolling = true;
        const targetScrollLeft = sectionIndex * window.innerWidth;
        
        if (smooth) {
            horizontalContainer.scrollTo({
                left: targetScrollLeft,
                behavior: 'smooth'
            });
            
            // Reset auto-scrolling flag after animation
            setTimeout(() => {
                isAutoScrolling = false;
            }, 500);
        } else {
            horizontalContainer.scrollLeft = targetScrollLeft;
            isAutoScrolling = false;
        }
    }

    
    // Update active narrative section
    function updateActiveNarrativeSection() {
        const indicators = document.querySelectorAll('.section-indicator');
        
        narrativeSections.forEach((section, index) => {
            if (index === currentSection) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
        
        // Update section indicators
        indicators.forEach((indicator, index) => {
            if (index === currentSection) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
        
        // Auto-play audio when entering a chapter (skip home section)
        if (currentSection > 0) {
            autoPlayChapterAudio();
        }
    }
    
    // Auto-play audio for current chapter
    function autoPlayChapterAudio() {
        // Stop any current audio first
        stopCurrentAudio();
        
        const currentNarrativeSection = narrativeSections[currentSection];
        if (!currentNarrativeSection) return;
        
        const playButton = currentNarrativeSection.querySelector('.play-btn');
        const audioElement = currentNarrativeSection.querySelector('audio');
        
        if (playButton && audioElement) {
            // Reset audio completed state
            audioCompleted = false;
            canNavigate = false;
            
            // Try to play audio, but handle autoplay restrictions gracefully
            attemptAutoplay(playButton, audioElement);
        }
    }

    // Attempt autoplay with fallback for browser restrictions
    function attemptAutoplay(playButton, audioElement, isUserInitiated = false) {
        if (isUserInitiated) {
            audioContextUnlocked = true;
        }
        
        // Try to play the audio
        const playAttempt = audioElement.play();
        
        if (playAttempt !== undefined) {
            playAttempt.then(() => {
                // Autoplay succeeded
                audioContextUnlocked = true;
                updatePlayButtonState(playButton, audioElement, true);
                const sectionIndex = parseInt(audioElement.getAttribute('data-section')) || currentSection;
                showNotification(`Playing Chapter ${sectionIndex}`);
            }).catch(error => {
                // Autoplay failed - show user-friendly message
                console.log('Autoplay prevented by browser:', error);
                
                if (!audioContextUnlocked) {
                    showNotification('Click the LISTEN button to start audio and enable autoplay', 5000);
                    
                    // Highlight the play button briefly to draw attention
                    playButton.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
                    setTimeout(() => {
                        playButton.style.boxShadow = '';
                    }, 2000);
                } else {
                    showNotification('Could not play audio - please click LISTEN');
                }
                
                // Reset navigation state since audio didn't start
                audioCompleted = true;
                canNavigate = true;
            });
        }
    }

    // Update button state when audio plays/pauses
    function updatePlayButtonState(playButton, audioElement, isPlaying) {
        const playIcon = playButton.querySelector('.play-icon');
        const playText = playButton.querySelector('.play-text');
        const progressContainer = playButton.closest('.narrative-section').querySelector('.audio-progress');
        
        if (isPlaying) {
            currentAudio = audioElement;
            playButton.classList.add('playing');
            playIcon.textContent = '⏸';
            playText.textContent = 'PAUSE';
            if (progressContainer) {
                progressContainer.classList.add('visible');
            }
            horizontalContainer.classList.add('audio-playing');
        } else {
            playButton.classList.remove('playing');
            playIcon.textContent = '▶';
            playText.textContent = 'LISTEN';
            if (progressContainer) {
                progressContainer.classList.remove('visible');
            }
            horizontalContainer.classList.remove('audio-playing');
            currentAudio = null;
        }
    }
    
    // Setup audio controls
    function setupAudioControls() {
        playButtons.forEach((button, index) => {
            const audioElement = button.closest('.narrative-section').querySelector('audio');
            const progressBar = button.closest('.narrative-section').querySelector('.progress-bar');
            const progressContainer = button.closest('.narrative-section').querySelector('.audio-progress');
            const playIcon = button.querySelector('.play-icon');
            const playText = button.querySelector('.play-text');
            
            if (!audioElement) return;
            
            button.addEventListener('click', function() {
                // Mark as user-initiated interaction to unlock audio context
                audioContextUnlocked = true;
                
                if (currentAudio && currentAudio !== audioElement) {
                    stopCurrentAudio();
                }
                
                if (audioElement.paused) {
                    playAudio(audioElement, button, progressBar, progressContainer, playIcon, playText, index);
                } else {
                    pauseAudio(audioElement, button, progressBar, progressContainer, playIcon, playText);
                }
            });
            
            // Audio progress tracking
            audioElement.addEventListener('timeupdate', function() {
                if (progressBar && this.duration) {
                    const progress = (this.currentTime / this.duration) * 100;
                    progressBar.style.width = progress + '%';
                }
            });
            
            // Audio ended event
            audioElement.addEventListener('ended', function() {
                resetAudioButton(button, progressBar, progressContainer, playIcon, playText);
                currentAudio = null;
                audioCompleted = true;
                canNavigate = true;
                
                // Check if this is "THE MOMENT" section (section 4)
                const sectionData = this.getAttribute('data-section');
                if (sectionData === '4') {
                    showNotification('The moment of choice has arrived...');
                    // Show branching choice after a delay
                    setTimeout(() => {
                        const branchingChoice = document.querySelector('.branching-choice');
                        if (branchingChoice) {
                            branchingChoice.style.display = 'block';
                            branchingChoice.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'center' 
                            });
                        }
                    }, 1500);
                } else {
                    // Immediately move to next section for seamless audio experience
                    if (currentSection < narrativeSections.length - 1) {
                        navigateSection(1);
                    } else {
                        showNotification('Story completed!');
                    }
                }
            });
            
            // Audio error handling
            audioElement.addEventListener('error', function() {
                showNotification('Audio could not be loaded');
                resetAudioButton(button, progressBar, progressContainer, playIcon, playText);
            });
        });
    }
    
    // Play audio
    function playAudio(audioElement, button, progressBar, progressContainer, playIcon, playText, index) {
        audioElement.play().then(() => {
            currentAudio = audioElement;
            button.classList.add('playing');
            playIcon.textContent = '⏸';
            playText.textContent = 'PAUSE';
            if (progressContainer) {
                progressContainer.classList.add('visible');
            }
            // Add sound wave scrollbar effect
            horizontalContainer.classList.add('audio-playing');
            showNotification(`Playing Chapter ${index}`);
        }).catch(error => {
            console.error('Audio playback failed:', error);
            showNotification('Could not play audio');
        });
    }
    
    // Pause audio
    function pauseAudio(audioElement, button, progressBar, progressContainer, playIcon, playText) {
        audioElement.pause();
        button.classList.remove('playing');
        playIcon.textContent = '▶';
        playText.textContent = 'LISTEN';
        currentAudio = null;
        // Remove sound wave scrollbar effect
        horizontalContainer.classList.remove('audio-playing');
        showNotification('Audio paused');
    }
    
    // Reset audio button
    function resetAudioButton(button, progressBar, progressContainer, playIcon, playText) {
        button.classList.remove('playing');
        playIcon.textContent = '▶';
        playText.textContent = 'LISTEN';
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        if (progressContainer) {
            progressContainer.classList.remove('visible');
        }
        // Remove sound wave scrollbar effect
        horizontalContainer.classList.remove('audio-playing');
    }
    
    // Stop current audio
    function stopCurrentAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            
            // Reset button state
            const currentButton = document.querySelector('.play-btn.playing');
            if (currentButton) {
                const progressBar = currentButton.closest('.narrative-section').querySelector('.progress-bar');
                const progressContainer = currentButton.closest('.narrative-section').querySelector('.audio-progress');
                const playIcon = currentButton.querySelector('.play-icon');
                const playText = currentButton.querySelector('.play-text');
                resetAudioButton(currentButton, progressBar, progressContainer, playIcon, playText);
            }
            
            // Remove sound wave scrollbar effect
            horizontalContainer.classList.remove('audio-playing');
            currentAudio = null;
        }
    }
    
    // Toggle current section audio
    function toggleCurrentAudio() {
        // Skip home section (section 0) as it has no audio
        if (currentSection === 0) return;
        
        const currentButton = narrativeSections[currentSection]?.querySelector('.play-btn');
        if (currentButton) {
            currentButton.click();
        }
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
            }
            
            // Add click feedback
            this.style.transform = 'scale(0.9)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    }
    
    // Notification system
    function showNotification(message, duration = 3000) {
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
            max-width: 400px;
            text-align: center;
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
        }, duration);
    }
    
    // Handle resize events
    window.addEventListener('resize', function() {
        scrollToSection(currentSection, false);
    });
    
    // Preload audio files for better performance
    document.querySelectorAll('audio').forEach(audio => {
        audio.preload = 'metadata';
    });
    
    // Debug info (remove in production)
    console.log('Temptation sounds page initialized');
    console.log(`Found ${narrativeSections.length} narrative sections`);
    console.log(`Found ${playButtons.length} play buttons`);
}); 