// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Global elements
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    
    // Burger menu elements
    const burgerMenu = document.getElementById('burgerMenu');
    const navItemsContainer = document.getElementById('navItems');
    const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');

    const audioUnlockContainer = document.getElementById('audioUnlockContainer');
    const audioUnlockBtn = document.getElementById('audioUnlockBtn');

    // Story Book specific elements
    const horizontalContainer = document.querySelector('.horizontal-scroll-container');
    const narrativeSections = document.querySelectorAll('.narrative-section');
    const playButtons = document.querySelectorAll('.play-btn');

    // Homepage specific elements
    const homeScrollContainer = document.querySelector('.home-scroll-container');
    const homePanels = document.querySelectorAll('.home-panel');
    let currentHomePanel = 0;

    // New Global Audio Player elements
    const globalVolumeControlContainer = document.getElementById('volumeControlContainer');
    const globalVolumeIcon = document.getElementById('volumeIcon');
    const globalVolumeSlider = document.getElementById('globalVolumeSlider');
    const globalMediaPlayer = document.getElementById('globalMediaPlayer');
    const globalPlayPauseBtn = document.getElementById('globalPlayPauseBtn');
    const globalSeekSlider = document.getElementById('globalSeekSlider');
    const currentTimeDisplay = document.getElementById('currentTime');
    const totalTimeDisplay = document.getElementById('totalTime');
    const playbackSpeedSelector = document.getElementById('playbackSpeedSelector');

    let currentAudio = null; // Currently playing audio element
    let currentPlayButton = null; // Reference to the play button of the current audio
    let currentSection = 0;
    let isAutoScrolling = false;
    let audioCompleted = false;
    let canNavigate = true;
    let audioContextUnlocked = false; // Initialize to false
    let hasCompletedStory = false; // Track if user has completed the story
    let isFastForwardMode = false; // Track fast-forward mode state
    let autoAdvanceEnabled = true; // Track if auto-advance is enabled
    let isRestarting = false; // Track if story is being restarted

    // Add fast-forward mode indicator to the DOM
    const fastForwardIndicator = document.createElement('div');
    fastForwardIndicator.className = 'fast-forward-mode';
    fastForwardIndicator.innerHTML = '<span class="icon">⏩</span> Fast-Forward Mode';
    document.body.appendChild(fastForwardIndicator);

    // Add auto-advance mode indicator to the DOM
    const autoAdvanceIndicator = document.createElement('div');
    autoAdvanceIndicator.className = 'auto-advance-mode active';
    autoAdvanceIndicator.innerHTML = '<span class="icon">🔄</span> Auto-Advance: ON';
    document.body.appendChild(autoAdvanceIndicator);

    // Function to toggle fast-forward mode
    function toggleFastForwardMode() {
        isFastForwardMode = !isFastForwardMode;
        fastForwardIndicator.classList.toggle('active');
        
        // Only show/hide based on current section
        const activeSection = document.querySelector('.section.active');
        if (activeSection && activeSection.id === 'sounds') {
            if (isFastForwardMode) {
                fastForwardIndicator.style.display = 'flex';
            } else {
                fastForwardIndicator.style.display = 'none';
            }
        }
        
        updateNavigationButtons();
    }

    // Function to toggle auto-advance mode
    function toggleAutoAdvanceMode() {
        autoAdvanceEnabled = !autoAdvanceEnabled;
        autoAdvanceIndicator.classList.toggle('active');
        autoAdvanceIndicator.innerHTML = autoAdvanceEnabled ? 
            '<span class="icon">🔄</span> Auto-Advance: ON' : 
            '<span class="icon">⏸️</span> Auto-Advance: OFF';
        
        // If enabling auto-advance, check if current audio has already ended
        if (autoAdvanceEnabled) {
            console.log('Auto-advance enabled - checking if current audio has already ended');
            const currentNarrativeSection = narrativeSections[currentSection];
            if (currentNarrativeSection) {
                const currentAudioElement = currentNarrativeSection.querySelector('audio');
                if (currentAudioElement && currentAudioElement.ended) {
                    console.log('Current audio has already ended - immediately triggering auto-advance');
                    // Small delay to ensure the toggle completes and UI updates
                    setTimeout(() => {
                        autoAdvanceToNextPanel();
                    }, 100);
                } else if (audioCompleted) {
                    console.log('Audio marked as completed - immediately triggering auto-advance');
                    // Small delay to ensure the toggle completes and UI updates
                    setTimeout(() => {
                        autoAdvanceToNextPanel();
                    }, 100);
                } else {
                    console.log('Audio not yet completed - auto-advance will trigger when current audio ends');
                }
            }
        }
    }

    // Function to update navigation buttons state
    function updateNavigationButtons() {
        const currentNarrativeSection = narrativeSections[currentSection];
        if (!currentNarrativeSection) return;

        const prevBtn = currentNarrativeSection.querySelector('.prev-btn');
        const nextBtn = currentNarrativeSection.querySelector('.next-btn');

        if (prevBtn) {
            // Previous button is always enabled except for first section
            prevBtn.disabled = currentSection === 0;
        }

        if (nextBtn) {
            // Show next button only if:
            // 1. Audio is completed OR
            // 2. Fast-forward mode is active OR
            // 3. User has completed the story before
            if (audioCompleted || isFastForwardMode || hasCompletedStory) {
                nextBtn.classList.add('visible');
            } else {
                nextBtn.classList.remove('visible');
            }
        }
    }

    // Initially hide the global media player and volume control
    if (globalMediaPlayer) {
        globalMediaPlayer.style.display = 'none';
    }
    if (globalVolumeControlContainer) {
        globalVolumeControlContainer.style.display = 'none';
    }

    // Attempt to unlock audio context immediately on user interaction
    function unlockAudioContext() {
        // Only attempt if not already unlocked
        if (audioContextUnlocked) return; 
        console.log('Attempting to unlock audio context...');

        const silentAudio = document.createElement('audio');
        silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==';
        silentAudio.volume = 0;

        const playPromise = silentAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                audioContextUnlocked = true;
                if (audioUnlockContainer) {
                    audioUnlockContainer.style.display = 'none'; // Hide the unlock button if successful
                }
                console.log('Audio context unlocked successfully.');
            }).catch(e => {
                console.error('Failed to unlock audio context:', e);
                if (audioUnlockContainer) {
                    audioUnlockContainer.style.display = 'flex'; // Show unlock button if it failed
                }
            });
        }
    }

    // Call unlockAudioContext on first user interaction
    document.body.addEventListener('click', unlockAudioContext, { once: true });
    document.body.addEventListener('keydown', unlockAudioContext, { once: true });

    // --- Initial Setup ---
    // Set initial active states for navigation and sections
    updateActiveNav('home');
    showSection('home'); // Ensure home section is visible on load

    // Initialize sounds section (if it exists on the page)
    if (document.getElementById('sounds')) {
        // Debug: Log all narrative sections and their indices
        console.log('=== NARRATIVE SECTIONS DEBUG ===');
        narrativeSections.forEach((section, index) => {
            console.log(`Index ${index}: data-section="${section.dataset.section}", classes="${section.className}", display="${section.style.display}"`);
        });
        console.log('=== END DEBUG ===');
        
        initializeSoundsSection();
    }

    // Initialize homepage horizontal scroll
    if (document.getElementById('home') && homeScrollContainer) {
        initializeHomepageScroll();
    }

    // Initialize behind scenes overlay functionality
    initializeBehindScenesOverlay();

    // --- Burger Menu Setup ---
    function setupBurgerMenu() {
        if (burgerMenu && navItemsContainer) {
            burgerMenu.addEventListener('click', function() {
                // Toggle burger menu active state
                this.classList.toggle('active');
                
                // Toggle mobile menu visibility
                navItemsContainer.classList.toggle('mobile-menu-open');
                
                // Toggle backdrop
                if (mobileMenuBackdrop) {
                    mobileMenuBackdrop.classList.toggle('active');
                }
                
                // Prevent body scroll when menu is open
                if (navItemsContainer.classList.contains('mobile-menu-open')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            });

            // Close menu when clicking navigation items
            navItems.forEach(item => {
                item.addEventListener('click', function() {
                    closeMobileMenu();
                });
            });

            // Close menu when clicking backdrop
            if (mobileMenuBackdrop) {
                mobileMenuBackdrop.addEventListener('click', function() {
                    closeMobileMenu();
                });
            }

            // Close menu when clicking outside (on larger content)
            document.addEventListener('click', function(e) {
                if (!burgerMenu.contains(e.target) && !navItemsContainer.contains(e.target)) {
                    closeMobileMenu();
                }
            });

            // Close menu on window resize to desktop size
            window.addEventListener('resize', function() {
                if (window.innerWidth > 768) {
                    closeMobileMenu();
                }
            });
        }
    }

    function closeMobileMenu() {
        if (burgerMenu && navItemsContainer) {
            burgerMenu.classList.remove('active');
            navItemsContainer.classList.remove('mobile-menu-open');
            if (mobileMenuBackdrop) {
                mobileMenuBackdrop.classList.remove('active');
            }
            document.body.style.overflow = '';
        }
    }

    // Initialize burger menu
    setupBurgerMenu();

    // --- Navigation (Global) ---
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            showSection(targetId);
            updateActiveNav(targetId);



            // If navigating to 'sounds' section, stop any currently playing audio
            if (targetId === 'sounds') {
                console.log('Navigating to Story Book section.');
                stopCurrentAudio();
                // Ensure the sounds section home is active
                currentSection = 0;
                updateActiveNarrativeSection();
                // Show unlock button if on sounds home
                if (audioUnlockContainer) {
                    // Only show if audio context is not yet unlocked
                    if (!audioContextUnlocked) {
                        audioUnlockContainer.style.display = 'flex';
                    } else {
                        audioUnlockContainer.style.display = 'none';
                    }
                }
                // Ensure global media player is visible when entering Story Book
                if (globalMediaPlayer) {
                    globalMediaPlayer.style.display = 'flex';
                }
                if (globalVolumeControlContainer) {
                    globalVolumeControlContainer.style.display = 'flex'; // Show volume control on story book
                }
                // Show auto-advance indicator in story book
                if (autoAdvanceIndicator) {
                    autoAdvanceIndicator.style.display = 'flex';
                }
                // Show fast-forward indicator if active
                if (fastForwardIndicator && isFastForwardMode) {
                    fastForwardIndicator.style.display = 'flex';
                }
            } else {
                console.log('Navigating away from Story Book section. Stopping audio.');
                stopCurrentAudio(); // Stop any audio playing when leaving sounds section
                if (globalMediaPlayer) {
                    globalMediaPlayer.style.display = 'none'; // Hide global media player outside story book
                }
                if (globalVolumeControlContainer) {
                    globalVolumeControlContainer.style.display = 'none'; // Hide volume control outside story book
                }
                // Hide auto-advance indicator outside story book
                if (autoAdvanceIndicator) {
                    autoAdvanceIndicator.style.display = 'none';
                }
                // Hide fast-forward indicator outside story book
                if (fastForwardIndicator) {
                    fastForwardIndicator.style.display = 'none';
                }
            }
            
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
    

    
    // --- Homepage Horizontal Scroll Logic ---
    function initializeHomepageScroll() {
        console.log('Initializing Homepage horizontal scroll...');
        setupHomepageScroll();
    }

    // Setup homepage horizontal scroll functionality
    function setupHomepageScroll() {
        if (!homeScrollContainer) return;

        let isScrolling = false;
        let scrollTimeout;

        // Smooth horizontal scrolling with mouse wheel
        homeScrollContainer.addEventListener('wheel', function(e) {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                
                // Use requestAnimationFrame for smooth scrolling
                if (!isScrolling) {
                    isScrolling = true;
                    requestAnimationFrame(() => {
                        // Smooth scroll with easing
                        const scrollAmount = e.deltaY * 0.8; // Reduce sensitivity for smoother feel
                        this.scrollBy({
                            left: scrollAmount,
                            behavior: 'auto' // We handle smoothness manually
                        });
                        isScrolling = false;
                    });
                }
            }
        }, { passive: false });

        // Enhanced touch support for mobile with momentum
        let startX = 0;
        let startY = 0;
        let scrollStartX = 0;
        let isTouch = false;
        let touchStartTime = 0;
        let lastTouchX = 0;
        let velocity = 0;

        homeScrollContainer.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            scrollStartX = this.scrollLeft;
            isTouch = true;
            touchStartTime = Date.now();
            lastTouchX = startX;
            velocity = 0;
            
            // Clear any ongoing momentum
            clearTimeout(scrollTimeout);
        }, { passive: true });

        homeScrollContainer.addEventListener('touchmove', function(e) {
            if (!isTouch) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = startX - currentX;
            const diffY = startY - currentY;
            
            // Only handle horizontal scrolling if it's primarily horizontal movement
            if (Math.abs(diffX) > Math.abs(diffY)) {
                e.preventDefault();
                
                // Calculate velocity for momentum
                const currentTime = Date.now();
                const timeDiff = currentTime - touchStartTime;
                if (timeDiff > 0) {
                    velocity = (lastTouchX - currentX) / timeDiff;
                }
                lastTouchX = currentX;
                
                // Smooth scroll update
                const newScrollLeft = scrollStartX + diffX;
                this.scrollLeft = Math.max(0, Math.min(newScrollLeft, this.scrollWidth - this.clientWidth));
            }
        }, { passive: false });

        homeScrollContainer.addEventListener('touchend', function() {
            if (!isTouch) return;
            
            // Add momentum scrolling
            if (Math.abs(velocity) > 0.5) {
                const momentumDistance = velocity * 300; // Adjust multiplier for desired momentum
                const targetScroll = this.scrollLeft + momentumDistance;
                
                this.scrollTo({
                    left: Math.max(0, Math.min(targetScroll, this.scrollWidth - this.clientWidth)),
                    behavior: 'smooth'
                });
            }
            
            // Reset touch state
            startX = 0;
            startY = 0;
            scrollStartX = 0;
            isTouch = false;
            velocity = 0;
        }, { passive: true });

        // Keyboard navigation for homepage only
        document.addEventListener('keydown', function(e) {
            // Only handle keyboard navigation when on homepage
            const activeSection = document.querySelector('.section.active');
            if (activeSection && activeSection.id === 'home') {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const direction = e.key === 'ArrowRight' ? 1 : -1;
                    navigateHomePanel(direction);
                }
            }
        });

        // Update active home panel based on scroll position with throttling
        let scrollTimer;
        homeScrollContainer.addEventListener('scroll', function() {
            // Throttle scroll events for better performance
            if (scrollTimer) clearTimeout(scrollTimer);
            
            scrollTimer = setTimeout(() => {
                const scrollLeft = this.scrollLeft;
                const panelWidth = window.innerWidth;
                const newPanel = Math.round(scrollLeft / panelWidth);

                if (newPanel !== currentHomePanel && newPanel >= 0 && newPanel < homePanels.length) {
                    currentHomePanel = newPanel;
                    updateActiveHomePanel();
                }
            }, 50); // Throttle to every 50ms for smoother experience
        }, { passive: true });
    }

    // Navigate between home panels
    function navigateHomePanel(direction) {
        const newPanel = currentHomePanel + direction;
        if (newPanel >= 0 && newPanel < homePanels.length) {
            currentHomePanel = newPanel;
            scrollToHomePanel(currentHomePanel);
            updateActiveHomePanel();
        }
    }

    // Scroll to specific home panel with enhanced smoothness
    function scrollToHomePanel(panelIndex) {
        if (!homeScrollContainer) return;
        const targetScrollLeft = homePanels[panelIndex].offsetLeft;
        
        // Use smooth scrolling with snap-to behavior
        homeScrollContainer.scrollTo({
            left: targetScrollLeft,
            behavior: 'smooth'
        });
        
        // Ensure we snap to the exact position after animation
        setTimeout(() => {
            if (Math.abs(homeScrollContainer.scrollLeft - targetScrollLeft) > 10) {
                homeScrollContainer.scrollLeft = targetScrollLeft;
            }
        }, 500);
    }

    // Update active home panel state
    function updateActiveHomePanel() {
        homePanels.forEach((panel, index) => {
            if (index === currentHomePanel) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
    }

    // --- Story Book Section Logic (Merged from sound.js) ---
    function initializeSoundsSection() {
        console.log('Initializing Story Book section...');
        currentSection = 0;
        updateActiveNarrativeSection();
        setupAudioControls();
        setupBranchingChoice();
        setupAudioUnlock();
        setupGlobalMediaPlayer(); // Initialize global media player
        setupHorizontalScroll(); // Initialize horizontal scroll for sounds section
    }

    // Setup audio unlock functionality
    function setupAudioUnlock() {
        console.log('Setting up audio unlock...');
        if (audioUnlockBtn) {
            audioUnlockBtn.addEventListener('click', function() {
                console.log('Audio unlock button clicked.');
                unlockAudioContext(); // Use the common unlock function
            });
        }
        // Initial check for unlock button visibility
        if (audioUnlockContainer && !audioContextUnlocked) {
            console.log('Audio unlock container set to display flex (initially visible).');
            audioUnlockContainer.style.display = 'flex';
        } else {
            console.log('Audio unlock container set to display none (initially hidden).');
            audioUnlockContainer.style.display = 'none';
        }
    }

    // Check if we need to show audio unlock button (this function is now less critical as unlock is attempted on first interaction)
    function checkAudioPermissions() {
        // This function is largely redundant now as audio context is attempted on first interaction.
        // Its display logic is handled by setupAudioUnlock and unlockAudioContext.
        console.log('checkAudioPermissions called (redundant now).');
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
        console.log('Handling choice:', choice);
        
        // Disable intersection observer during choice transition
        isAutoScrolling = true;
        
        stopCurrentAudio();

        const currentNarrativeSection = narrativeSections[currentSection];
        if (currentNarrativeSection) {
            currentNarrativeSection.style.display = 'none';
        }

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
            
            // Update current section to the target section index
            const targetSectionIndex = Array.from(narrativeSections).indexOf(targetSection);
            console.log('Choice made:', choice, 'targetSectionIndex:', targetSectionIndex, 'targetSection dataset:', targetSection.dataset.section);
            
            if (targetSectionIndex !== -1) {
                currentSection = targetSectionIndex;
                console.log('Updated currentSection to:', currentSection);
            } else {
                console.error('Could not find targetSectionIndex for choice:', choice);
            }
            
            setTimeout(() => {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'start'
                });
                
                // Handle audio for both choices
                if (audioContextUnlocked) {
                    const audioElement = targetSection.querySelector('audio');
                    const playButton = targetSection.querySelector('.play-btn');
                    
                    if (audioElement && playButton) {
                        console.log('Found audio element for choice:', choice);
                        console.log('Audio src:', audioElement.src || audioElement.currentSrc);
                        console.log('Audio source elements:', audioElement.querySelectorAll('source'));
                        
                        currentAudio = audioElement;
                        currentPlayButton = playButton;
                        updateGlobalMediaPlayer(audioElement);
                        
                        if (choice === 'sleep') {
                            console.log('Auto-playing alternative.mp3 for sleep choice');
                            
                            // Add event listener to return to first section when audio ends
                            audioElement.addEventListener('ended', function sleepAudioEndHandler() {
                                console.log('Sleep audio ended, returning to first section');
                                showNotification('Returning to the beginning...');
                                
                                // Hide the sleep ending section
                                targetSection.style.display = 'none';
                                
                                // Reset to first section
                                currentSection = 0;
                                audioCompleted = false;
                                canNavigate = true;
                                
                                // Show and scroll to first section
                                const firstSection = narrativeSections[0];
                                if (firstSection) {
                                    firstSection.style.display = 'flex';
                                    scrollToSection(0);
                                    updateActiveNarrativeSection();
                                    updateNavigationButtons();
                                }
                                
                                // Remove this event listener to prevent multiple triggers
                                audioElement.removeEventListener('ended', sleepAudioEndHandler);
                            }, { once: true });
                            
                        } else if (choice === 'pray') {
                            console.log('Auto-playing audio for pray choice - story will continue');
                            console.log('Pray choice: currentSection updated to:', currentSection);
                            console.log('Pray choice: targetSectionIndex is:', targetSectionIndex);
                            console.log('Pray choice: autoAdvanceEnabled is:', autoAdvanceEnabled);
                            
                            // For pray choice, ensure auto-advance continues the story
                            audioCompleted = false;
                            canNavigate = false; // Prevent manual navigation during auto-advance
                            
                            // Remove any existing ended listeners to prevent conflicts
                            audioElement.onended = null;
                            
                            // Add event listener for auto-advance continuation
                            audioElement.addEventListener('ended', function prayAudioEndHandler() {
                                console.log('=== PRAY AUDIO ENDED ===');
                                console.log('Current section when pray audio ended:', currentSection);
                                console.log('Current narrative section dataset:', narrativeSections[currentSection].dataset.section);
                                console.log('Auto-advance enabled:', autoAdvanceEnabled);
                                
                                audioCompleted = true;
                                canNavigate = true;
                                updateNavigationButtons();
                                
                                // Trigger auto-advance to next panel if enabled
                                if (autoAdvanceEnabled) {
                                    console.log('Calling autoAdvanceToNextPanel from pray audio end handler');
                                    autoAdvanceToNextPanel();
                                } else {
                                    console.log('Auto-advance is disabled, not advancing');
                                }
                                
                                // Remove this event listener to prevent multiple triggers
                                audioElement.removeEventListener('ended', prayAudioEndHandler);
                            }, { once: true });
                        }
                        
                        // For sleep and pray choices, we need to override the default playAudio behavior
                        if (choice === 'sleep' || choice === 'pray') {
                            // Manually handle the audio play without using playAudio function to avoid conflicts
                            currentAudio = audioElement;
                            currentPlayButton = playButton;
                            
                            audioElement.play().then(() => {
                                console.log('Choice audio playback started successfully for:', audioElement.src);
                                updatePlayButtonState(playButton, audioElement, true);
                                canNavigate = false;
                                audioCompleted = false;
                                updateGlobalMediaPlayer(audioElement);
                                updateNavigationButtons();
                            }).catch(e => {
                                console.error("Error playing choice audio:", e);
                                showNotification('Failed to play audio. Please try again.');
                            });
                        } else {
                            // For other cases, use normal playAudio function
                            playAudio(audioElement, playButton, playButton.querySelector('.play-icon'), playButton.querySelector('.play-text'));
                        }
                    }
                } else {
                    showNotification('Please enable audio first (bottom left icon)!');
                }
                
                // Update active section and navigation
                // First remove active class from all sections
                narrativeSections.forEach(section => {
                    section.classList.remove('active');
                });
                
                // Add active class to the target section
                targetSection.classList.add('active');
                
                // Force scroll to the target section to ensure proper positioning
                scrollToSection(currentSection);
                
                console.log('Active section updated - currentSection is now:', currentSection);
                console.log('Target section classList:', targetSection.classList.toString());
                
                updateNavigationButtons();
                
                // Re-enable intersection observer after choice transition is complete
                setTimeout(() => {
                    isAutoScrolling = false;
                    console.log('Choice transition complete - intersection observer re-enabled');
                }, 500);
            }, 100);
        }
    }

    // Restart story function
    window.restartStory = function() {
        console.log('Restarting story...');
        
        // Set restart flag to prevent observer interference
        isRestarting = true;
        
        // Comprehensive cleanup
        stopAllAudio(); // Stop ALL audio elements, not just current one
        
        // Reset all story state variables
        currentSection = 0;
        audioCompleted = false;
        canNavigate = true;
        hasCompletedStory = false;
        
        // Reset auto-scroll flag to prevent conflicts
        isAutoScrolling = false;
        
        // Hide ending sections
        const endingSleep = document.querySelector('.ending-sleep');
        const endingPray = document.querySelector('.ending-pray');
        if (endingSleep) endingSleep.style.display = 'none';
        if (endingPray) endingPray.style.display = 'none';

        // Hide branching choice
        const branchingChoice = document.querySelector('.branching-choice');
        if (branchingChoice) {
            branchingChoice.style.display = 'none';
        }

        // Ensure home section is visible
        const homeSection = document.querySelector('[data-section="0"]');
        if (homeSection) {
            homeSection.style.display = 'flex';
        }
        
        // Remove active class from all sections first
        narrativeSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Scroll to home section first
        scrollToSection(0, true);
        
        // Delay the section activation to prevent multiple audio triggers
        setTimeout(() => {
            // Only update the active class without triggering audio autoplay
            narrativeSections[0].classList.add('active');
            updateNavigationButtons();
            
            // Clear restart flag after everything is settled
            setTimeout(() => {
                isRestarting = false;
            }, 200);
        }, 600); // Wait for scroll animation to complete
        
        showNotification('Story reset. Choose your path again...');
    }

    // Setup horizontal scroll functionality
    function setupHorizontalScroll() {
        console.log('Setting up horizontal scroll...');
        if (!horizontalContainer) return;

        horizontalContainer.addEventListener('wheel', function(e) {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                this.scrollLeft += e.deltaY;
            }
        });

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

        horizontalContainer.addEventListener('scroll', function() {
            if (isAutoScrolling) {
                console.log('Scroll event ignored - isAutoScrolling is true');
                return;
            }

            const scrollLeft = this.scrollLeft;
            const sectionWidth = window.innerWidth;
            const newSection = Math.round(scrollLeft / sectionWidth);

            // Block forward navigation if auto-advance is enabled
            if (autoAdvanceEnabled && newSection > currentSection) {
                scrollToSection(currentSection, false);
                showNotification('Auto-advance is enabled. Navigation will happen automatically when audio finishes.');
                return;
            }

            if (newSection > currentSection && !canNavigate && newSection > 0) {
                scrollToSection(currentSection, false);
                showNotification('Please wait for the audio to finish before proceeding...');
                return;
            }

            if (newSection !== currentSection && newSection >= 0 && newSection < narrativeSections.length && !isAutoScrolling) {
                console.log('Scroll detected. New section:', newSection, 'Old section:', currentSection);
                console.log('isAutoScrolling status:', isAutoScrolling);
                console.log('Audio completed status:', audioCompleted);
                console.log('Can navigate status:', canNavigate);
                
                // Additional protection: Don't allow scroll changes during active audio playback in auto-advance mode
                if (autoAdvanceEnabled && currentAudio && !currentAudio.paused && !audioCompleted) {
                    console.log('Blocking scroll detection - audio is playing and auto-advance is active');
                    
                    // Force scroll back to correct position
                    const targetScrollLeft = narrativeSections[currentSection].offsetLeft;
                    if (Math.abs(this.scrollLeft - targetScrollLeft) > 50) {
                        console.log('Forcing scroll back to correct position:', targetScrollLeft);
                        this.scrollLeft = targetScrollLeft;
                    }
                    return;
                }
                
                currentSection = newSection;
                updateActiveNarrativeSection(); // This will handle the active class and potentially play audio
            }
        });

        document.addEventListener('keydown', function(e) {
            // Only handle Story Book navigation when on sounds section
            const activeSection = document.querySelector('.section.active');
            if (activeSection && activeSection.id === 'sounds') {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const direction = e.key === 'ArrowRight' ? 1 : -1;
                    
                    // Block forward navigation if auto-advance is enabled
                    if (autoAdvanceEnabled && direction > 0) {
                        showNotification('Auto-advance is enabled. Navigation will happen automatically when audio finishes.');
                        return;
                    }
                    
                    navigateSection(direction);
                } else if (e.key === ' ') {
                    e.preventDefault();
                    toggleCurrentAudio();
                }
            }
        });
    }

    // Navigate between sections
    function navigateSection(direction) {
        console.log('navigateSection called with direction:', direction, 'currentSection:', currentSection);
        
        // Block forward navigation if auto-advance is enabled
        if (autoAdvanceEnabled && direction > 0) {
            showNotification('Auto-advance is enabled. Navigation will happen automatically when audio finishes.');
            return;
        }
        
        if (!canNavigate && direction > 0) {
            showNotification('Please wait for the audio to finish before proceeding...');
            return;
        }

        const newSection = currentSection + direction;
        if (newSection >= 0 && newSection < narrativeSections.length) {
            currentSection = newSection;
            scrollToSection(currentSection);
            updateActiveNarrativeSection(); // This will trigger playback on new panel
        }
    }

    // Scroll to specific section
    function scrollToSection(sectionIndex, smooth = true) {
        console.log('Scrolling to section:', sectionIndex, 'isAutoScrolling set to true');
        if (!horizontalContainer) return;

        isAutoScrolling = true;
        const targetScrollLeft = narrativeSections[sectionIndex].offsetLeft;
        
        console.log('Target scroll position:', targetScrollLeft);
        console.log('Current scroll position:', horizontalContainer.scrollLeft);

        horizontalContainer.scrollTo({
            left: targetScrollLeft,
            behavior: smooth ? 'smooth' : 'auto'
        });

        setTimeout(() => {
            isAutoScrolling = false;
            console.log('scrollToSection: isAutoScrolling set to false after 2000ms');
        }, 2000);
    }


    // Update active narrative section and related states
    function updateActiveNarrativeSection(skipAutoplay = false, forceAutoplay = false) {
        console.log('Updating active narrative section. Current section:', currentSection, 'skipAutoplay:', skipAutoplay, 'forceAutoplay:', forceAutoplay);
        
        if (!skipAutoplay) {
            stopCurrentAudio(); // ✅ STOP previous audio before activating new panel
        }
        
        narrativeSections.forEach((section, index) => {
            if (index === currentSection) {
                section.classList.add('active');

                // Only autoplay if not skipping autoplay (used during restart)
                if (!skipAutoplay) {
                    // Autoplay audio for current panel if it has audio and context is unlocked
                    const audio = section.querySelector('audio');
                    const playButton = section.querySelector('.play-btn');
                    if (audio && playButton) {
                        console.log('Audio element and play button found for panel', section.dataset.section);
                        
                        // Update current audio references regardless of autoplay
                        currentAudio = audio;
                        currentPlayButton = playButton;
                        updateGlobalMediaPlayer(audio);
                        
                        // Autoplay conditions:
                        // 1. Force autoplay (from auto-advance) OR
                        // 2. Auto-advance is disabled AND audio is paused AND context is unlocked
                        if ((forceAutoplay || !autoAdvanceEnabled) && audio.paused && audioContextUnlocked) {
                            const reason = forceAutoplay ? 'auto-advance requested' : 'auto-advance disabled';
                            console.log(`Attempting autoplay for panel ${section.dataset.section}. Reason: ${reason}.`);
                            playAudio(audio, playButton, playButton.querySelector('.play-icon'), playButton.querySelector('.play-text'));
                        } else if (autoAdvanceEnabled && !forceAutoplay) {
                            console.log('Auto-advance is enabled for panel', section.dataset.section, '. Skipping autoplay - will be handled by auto-advance.');
                        } else if (!audio.paused) {
                            console.log('Audio for panel', section.dataset.section, 'is already playing.');
                            updatePlayButtonState(playButton, audio, true);
                        } else if (!audioContextUnlocked) {
                            console.log('Audio context not unlocked for panel', section.dataset.section, 'autoplay.');
                            showNotification('Please enable audio first (bottom left icon)!');
                        }
                    } else {
                        console.log('No audio or play button found for panel', section.dataset.section);
                    }
                }

            } else {
                section.classList.remove('active');
            }
        });
    }

    // Attempt autoplay for chapter audio (if any)
    function autoPlayChapterAudio() {
        // This function is now fully redundant. Autoplay is handled by updateActiveNarrativeSection.
        console.log('autoPlayChapterAudio called (redundant).');
    }

    // Function to attempt autoplay (re-added for clarity in case of other uses)
    function attemptAutoplay(playButton, audioElement, isUserInitiated = false) {
        // This function is now fully redundant. Autoplay is handled by updateActiveNarrativeSection.
        console.log('attemptAutoplay called (redundant).');
        if (!audioElement || !playButton || !audioContextUnlocked) return;

        if (audioElement.paused) {
            playAudio(audioElement, playButton, playButton.querySelector('.play-icon'), playButton.querySelector('.play-text'));
        }
    }

    // Update play button state (icon and text)
    function updatePlayButtonState(playButton, audioElement, isPlaying) {
        console.log('updatePlayButtonState called. isPlaying:', isPlaying, 'for audio:', audioElement.src);
        const playIcon = playButton.querySelector('.play-icon');
        const playText = playButton.querySelector('.play-text');

        if (isPlaying) {
            playButton.classList.add('playing');
            playIcon.textContent = '⏸';
            playText.textContent = 'PAUSE';
        } else {
            playButton.classList.remove('playing');
            playIcon.textContent = '▶';
            playText.textContent = 'PLAY';
        }
    }

    // Setup audio controls for each narrative section
    function setupAudioControls() {
        console.log('Setting up audio controls for play buttons.');
        playButtons.forEach(button => {
            button.addEventListener('click', function() {
                console.log('Play button clicked for panel:', this.closest('.narrative-section').dataset.section);
                const narrativeSection = this.closest('.narrative-section');
                const audio = narrativeSection.querySelector('audio');

                if (audio) {
                    if (!audioContextUnlocked) {
                        showNotification('Please enable audio first (bottom left icon)!');
                        console.log('Audio context not unlocked. Cannot play audio.');
                        return;
                    }

                    if (currentAudio && currentAudio !== audio) {
                        console.log('Another audio is playing. Stopping:', currentAudio.src);
                        // If another audio is playing, stop it and reset its button
                        currentAudio.pause();
                        if (currentPlayButton) {
                            resetAudioButton(currentPlayButton);
                        }
                    }

                    if (audio.paused) {
                        console.log('Audio is paused. Playing audio:', audio.src);
                        playAudio(audio, this, this.querySelector('.play-icon'), this.querySelector('.play-text'));
                    } else {
                        console.log('Audio is playing. Pausing audio:', audio.src);
                        pauseAudio(audio, this, this.querySelector('.play-icon'), this.querySelector('.play-text'));
                    }
                }
            });
        });
    }

    // Play audio logic
    function playAudio(audioElement, button, playIcon, playText) {
        console.log('playAudio called for:', audioElement.src, '. currentAudio:', currentAudio ? currentAudio.src : 'none');
        currentAudio = audioElement;
        currentPlayButton = button;
        
        // Remove any existing ended event listeners to prevent duplicates
        audioElement.onended = null;
        
        audioElement.play().then(() => {
            console.log('Audio playback started successfully for:', audioElement.src);
            updatePlayButtonState(button, audioElement, true);
            canNavigate = false;
            audioCompleted = false;
            updateGlobalMediaPlayer(audioElement);
            updateNavigationButtons(); // Hide next button when audio starts
        }).catch(e => {
            console.error("Error playing audio:", e);
            showNotification('Failed to play audio. Please try again.');
        });

        audioElement.onended = () => {
            console.log('=== AUDIO ENDED ===');
            console.log('Audio ended for:', audioElement.src);
            console.log('Current section when audio ended:', currentSection);
            console.log('Current section data-section:', narrativeSections[currentSection] ? narrativeSections[currentSection].dataset.section : 'undefined');
            
            updatePlayButtonState(button, audioElement, false);
            canNavigate = true;
            audioCompleted = true;
            updateNavigationButtons(); // Show next button when audio ends
            
            // If this is the last section, mark story as completed
            if (currentSection === narrativeSections.length - 1) {
                hasCompletedStory = true;
                // Enable fast-forward mode after completing the story
                if (!isFastForwardMode) {
                    toggleFastForwardMode();
                    showNotification('Fast-forward mode enabled! You can now navigate freely.');
                }
            }
            
            // Auto-advance to next panel after audio ends immediately
            console.log('Calling autoAdvanceToNextPanel from audio end handler');
            autoAdvanceToNextPanel();
        };
    }

    // Pause audio logic
    function pauseAudio(audioElement, button, playIcon, playText) {
        console.log('pauseAudio called for:', audioElement.src);
        audioElement.pause();
        updatePlayButtonState(button, audioElement, false);
        canNavigate = true;
        if (globalPlayPauseBtn) globalPlayPauseBtn.textContent = '▶'; // Update global player button
    }

    // Reset audio button to initial state
    function resetAudioButton(button) {
        console.log('resetAudioButton called for button:', button);
        button.classList.remove('playing');
        button.querySelector('.play-icon').textContent = '▶';
        button.querySelector('.play-text').textContent = 'PLAY';
    }

    // Stop any audio currently playing across all sections
    function stopCurrentAudio() {
        console.log('stopCurrentAudio called. currentAudio:', currentAudio ? currentAudio.src : 'none', 'currentPlayButton:', currentPlayButton);
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
            currentAudio.currentTime = 0; // Rewind the audio
            if (currentPlayButton) {
                resetAudioButton(currentPlayButton); // Use currentPlayButton here
            }
        }
        currentAudio = null; // Clear current audio reference
        currentPlayButton = null; // Clear currentPlayButton reference
    }

    // Stop ALL audio elements (for restart functionality)
    function stopAllAudio() {
        console.log('stopAllAudio called - stopping all audio elements');
        // Stop all audio elements in the document
        document.querySelectorAll('audio').forEach(audio => {
            if (!audio.paused) {
                console.log('Stopping audio:', audio.src);
                audio.pause();
                audio.currentTime = 0;
            }
        });
        
        // Reset all play buttons
        document.querySelectorAll('.play-btn').forEach(button => {
            resetAudioButton(button);
        });
        
        // Clear current references
        currentAudio = null;
        currentPlayButton = null;
        
        // Reset global media player
        if (globalMediaPlayer) {
            globalPlayPauseBtn.textContent = '▶';
            globalSeekSlider.value = 0;
            currentTimeDisplay.textContent = '0:00';
            totalTimeDisplay.textContent = '0:00';
        }
    }

    // Toggle play/pause for current section audio (for spacebar)
    function toggleCurrentAudio() {
        console.log('toggleCurrentAudio called.');
        const currentNarrativeSection = narrativeSections[currentSection];
        if (currentNarrativeSection) {
            const audio = currentNarrativeSection.querySelector('audio');
            const button = currentNarrativeSection.querySelector('.play-btn');

            if (audio && button) {
                if (!audioContextUnlocked) {
                    showNotification('Please enable audio first (bottom left icon)!');
                    console.log('Audio context not unlocked. Cannot toggle audio.');
                    return;
                }
                // Ensure currentAudio and currentPlayButton are set for spacebar toggle
                currentAudio = audio;
                currentPlayButton = button;

                if (audio.paused) {
                    console.log('Toggling to play via spacebar.');
                    playAudio(audio, button, button.querySelector('.play-icon'), button.querySelector('.play-text'));
                } else {
                    console.log('Toggling to pause via spacebar.');
                    pauseAudio(audio, button, button.querySelector('.play-icon'), button.querySelector('.play-text'));
                }
            }
        }
    }

    // Show a temporary notification message
    let notificationTimeout;
    function showNotification(message, duration = 3000) {
        let notification = document.getElementById('notification');
        if (!notification) {
            const newNotification = document.createElement('div');
            newNotification.id = 'notification';
            newNotification.style.cssText = 'position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: rgba(255, 255, 255, 0.9); color: #000; padding: 10px 20px; border-radius: 5px; z-index: 10000; opacity: 0; transition: opacity 0.3s ease-in-out;';
            document.body.appendChild(newNotification);
            notification = newNotification;
        }

        notification.textContent = message;
        notification.style.opacity = '1';

        clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(() => {
            notification.style.opacity = '0';
        }, duration);
    }

    // Function to navigate between panels (from sounds.html buttons)
    window.navigatePanel = function(direction) {
        console.log('navigatePanel called with direction:', direction, 'from section:', currentSection);
        
        // Block forward navigation if auto-advance is enabled
        if (autoAdvanceEnabled && direction > 0) {
            showNotification('Auto-advance is enabled. Navigation will happen automatically when audio finishes.');
            return;
        }
        
        // If trying to go forward and not allowed, show notification
        if (direction > 0 && !audioCompleted && !isFastForwardMode && !hasCompletedStory) {
            showNotification('Please wait for the audio to finish before proceeding...');
            return;
        }

        stopCurrentAudio();
        
        // Temporarily hide panel navigation buttons from screen readers during transition
        document.querySelectorAll('.panel-navigation button').forEach(btn => {
            btn.setAttribute('aria-hidden', 'true');
        });

        const currentNarrativeSection = narrativeSections[currentSection];
        let newSectionIndex = currentSection + direction;

        // Handle branching choice from Panel 4
        if (currentNarrativeSection.dataset.section === '4' && direction === 1) {
            console.log('Branching choice from Panel 4 detected via manual navigation.');
            const branchingChoice = currentNarrativeSection.querySelector('.branching-choice');
            if (branchingChoice) {
                branchingChoice.style.display = 'flex';
                console.log('Branching choice shown via manual navigation');
                showNotification('Choose your path...');
            } else {
                console.log('ERROR: Branching choice element not found in Panel 4 (manual navigation)');
            }
            return;
        }

        // Hide branching choice if leaving Panel 4
        const panel4 = document.querySelector('.narrative-section[data-section="4"]');
        if (panel4) {
            const branchingChoice = panel4.querySelector('.branching-choice');
            if (branchingChoice) {
                branchingChoice.style.display = 'none';
            }
        }

        // Handle navigation from ending panels back to Panel 4
        if (currentNarrativeSection.classList.contains('ending-sleep') && direction === -1) {
            newSectionIndex = Array.from(narrativeSections).findIndex(sec => sec.dataset.section === '4');
            console.log('Navigating back from sleep ending to Panel 4. New section index:', newSectionIndex);
            
            if (newSectionIndex !== -1) {
                currentSection = newSectionIndex;
                scrollToSection(currentSection);
                updateActiveNarrativeSection();
                updateNavigationButtons();
                
                // Restore accessibility after transition
                setTimeout(() => {
                    document.querySelectorAll('.panel-navigation button').forEach(btn => {
                        btn.removeAttribute('aria-hidden');
                    });
                }, 500);
                return; // Important: Exit early to prevent further processing
            }
        } else if (currentNarrativeSection.classList.contains('ending-pray') && direction === -1) {
            newSectionIndex = Array.from(narrativeSections).findIndex(sec => sec.dataset.section === '4');
            console.log('Navigating back from pray ending to Panel 4. New section index:', newSectionIndex);
            
            if (newSectionIndex !== -1) {
                currentSection = newSectionIndex;
                scrollToSection(currentSection);
                updateActiveNarrativeSection();
                updateNavigationButtons();
                
                // Restore accessibility after transition
                setTimeout(() => {
                    document.querySelectorAll('.panel-navigation button').forEach(btn => {
                        btn.removeAttribute('aria-hidden');
                    });
                }, 500);
                return; // Important: Exit early to prevent further processing
            }
        } else if (newSectionIndex >= 0 && newSectionIndex < narrativeSections.length) {
            let targetSection = narrativeSections[newSectionIndex];
            // Skip hidden sections if they are not the target
            while (targetSection && targetSection.style.display === 'none') {
                newSectionIndex += direction;
                if (newSectionIndex < 0 || newSectionIndex >= narrativeSections.length) {
                    targetSection = null;
                    break;
                }
                targetSection = narrativeSections[newSectionIndex];
            }

            if (targetSection) {
                currentSection = newSectionIndex;
                console.log('Navigated to new section index:', currentSection, 'dataset.section:', targetSection.dataset.section);
                const newAudioElement = targetSection.querySelector('audio');
                const newPlayButton = targetSection.querySelector('.play-btn');

                if (newAudioElement && newPlayButton) {
                    console.log('Found new audio element and play button for new panel.');
                    // If there's audio on the new panel, set it as current and autoplay if unlocked and paused
                    currentAudio = newAudioElement;
                    currentPlayButton = newPlayButton;
                    updateGlobalMediaPlayer(newAudioElement); // Update global player with new audio

                    if (audioContextUnlocked && newAudioElement.paused) {
                        console.log('Attempting to autoplay new panel audio.');
                        // Add a small delay to ensure the DOM is updated and prevent conflicts with screen readers
                        setTimeout(() => {
                            // Announce panel change to screen readers without interfering with audio
                            const announceEl = document.getElementById('sr-announcements');
                            if (announceEl) {
                                announceEl.textContent = `Panel ${targetSection.dataset.section} audio playing`;
                            }
                            playAudio(newAudioElement, newPlayButton, newPlayButton.querySelector('.play-icon'), newPlayButton.querySelector('.play-text'));
                        }, 200);
                    } else if (!audioContextUnlocked) {
                        console.log('Audio context not unlocked for new panel autoplay.');
                        showNotification('Please enable audio first (bottom left icon)!');
                    }

                } else {
                    console.log('No audio element or play button found for new panel.');
                    // If no audio on the new panel, clear current audio and reset global player display
                    currentAudio = null;
                    currentPlayButton = null;
                    if (globalMediaPlayer) {
                        globalPlayPauseBtn.textContent = '▶';
                        globalSeekSlider.value = 0;
                        currentTimeDisplay.textContent = '0:00';
                        totalTimeDisplay.textContent = '0:00';
                    }
                }
            } else {
                console.log('No valid target section found for navigation.');
                return;
            }
        } else {
            console.log('New section index out of bounds for navigation.');
            return;
        }

        scrollToSection(currentSection);
        updateActiveNarrativeSection();
        updateNavigationButtons(); // Update button visibility after navigation
        
        // Restore accessibility of navigation buttons after transition
        setTimeout(() => {
            document.querySelectorAll('.panel-navigation button').forEach(btn => {
                btn.removeAttribute('aria-hidden');
            });
        }, 500);
    };

    // --- New Global Volume Control Logic ---
    if (globalVolumeControlContainer && globalVolumeIcon && globalVolumeSlider) {
        console.log('Setting up global volume controls.');
        globalVolumeIcon.addEventListener('click', () => {
            console.log('Global volume icon clicked.');
            globalVolumeSlider.classList.toggle('active');
        });

        globalVolumeSlider.addEventListener('input', (event) => {
            const volume = parseFloat(event.target.value);
            console.log('Global volume slider changed to:', volume);
            // Apply volume to current audio if playing
            if (currentAudio) {
                currentAudio.volume = volume;
                console.log('Applied volume to current audio:', currentAudio.src);
            }
            // Also apply to all other audio elements, just in case
            document.querySelectorAll('audio').forEach(audio => {
                audio.volume = volume;
            });
        });
    }

    // --- New Global Media Player Logic ---
    function setupGlobalMediaPlayer() {
        console.log('Setting up global media player.');
        if (!globalMediaPlayer) return;

        globalPlayPauseBtn.addEventListener('click', () => {
            console.log('Global play/pause button clicked.');
            if (currentAudio) {
                if (currentAudio.paused) {
                    console.log('Global player: current audio paused, attempting to play.');
                    currentAudio.play();
                    globalPlayPauseBtn.textContent = '⏸';
                } else {
                    console.log('Global player: current audio playing, attempting to pause.');
                    currentAudio.pause();
                    globalPlayPauseBtn.textContent = '▶';
                }
                // Sync individual play button state (if currentPlayButton exists)
                if (currentPlayButton) {
                    updatePlayButtonState(currentPlayButton, currentAudio, !currentAudio.paused);
                }
            } else {
                console.log('Global player: No current audio to play/pause.');
            }
        });

        globalSeekSlider.addEventListener('input', () => {
            if (currentAudio) {
                const seekTime = currentAudio.duration * (globalSeekSlider.value / 100);
                currentAudio.currentTime = seekTime;
                console.log('Global seek slider changed. Seeking to:', seekTime);
            }
        });

        // Handle playback speed changes
        if (playbackSpeedSelector) {
            playbackSpeedSelector.addEventListener('change', (e) => {
                const speed = parseFloat(e.target.value);
                console.log('Playback speed changed to:', speed);
                if (currentAudio) {
                    currentAudio.playbackRate = speed;
                    console.log('Applied playback rate to current audio:', currentAudio.src);
                }
                // Save the selected speed for future audio elements
                document.querySelectorAll('audio').forEach(audio => {
                    if (audio !== currentAudio) {
                        audio.playbackRate = speed;
                    }
                });
                showNotification(`Playback speed set to ${speed}x`);
            });
        }

        // Update global media player state as audio plays
        document.querySelectorAll('audio').forEach(audioElement => {
            audioElement.addEventListener('timeupdate', () => {
                if (audioElement === currentAudio) {
                    const progress = (audioElement.currentTime / audioElement.duration) * 100;
                    globalSeekSlider.value = progress;
                    currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
                    // console.log('Time update for:', audioElement.src, 'Time:', audioElement.currentTime);
                }
            });

            audioElement.addEventListener('loadedmetadata', () => {
                if (audioElement === currentAudio) {
                    totalTimeDisplay.textContent = formatTime(audioElement.duration);
                    globalSeekSlider.max = 100;
                    globalSeekSlider.value = 0;
                    console.log('Loaded metadata for:', audioElement.src, 'Duration:', audioElement.duration);
                }
            });

            audioElement.addEventListener('play', () => {
                if (audioElement === currentAudio) {
                    globalPlayPauseBtn.textContent = '⏸';
                    console.log('Global player button set to PAUSE (audio playing).');
                    // Keep global media player visible in story book
                    const activeSectionElement = document.querySelector('.section.active');
                    if (globalMediaPlayer && activeSectionElement && activeSectionElement.id === 'sounds') {
                        globalMediaPlayer.style.display = 'flex';
                    }
                }
            });

            audioElement.addEventListener('pause', () => {
                if (audioElement === currentAudio) {
                    globalPlayPauseBtn.textContent = '▶';
                    console.log('Global player button set to PLAY (audio paused).');
                }
            });

                        audioElement.addEventListener('ended', () => {
                if (audioElement === currentAudio) {
                    globalPlayPauseBtn.textContent = '▶';
                    globalSeekSlider.value = 0;
                    currentTimeDisplay.textContent = '0:00';
                    console.log('Global player: Audio ended.');
                    // Note: Auto-advance logic is handled in playAudio function's onended handler
                }
            });
        });
    }

    // Function to set the current audio for the global player
    function updateGlobalMediaPlayer(audioElement) {
        const audioSrc = audioElement.src || audioElement.currentSrc || (audioElement.querySelector('source') ? audioElement.querySelector('source').src : 'no source found');
        console.log('updateGlobalMediaPlayer called for:', audioSrc, 'currentAudio:', currentAudio ? (currentAudio.src || currentAudio.currentSrc) : 'none');
        if (currentAudio && currentAudio !== audioElement) {
            console.log('Pausing previous currentAudio in updateGlobalMediaPlayer:', currentAudio.src);
            currentAudio.pause(); // Pause previous audio if different
            // Also reset its button if it was playing and not the new one
            if (currentPlayButton && currentPlayButton !== audioElement.closest('.narrative-section').querySelector('.play-btn')) {
                resetAudioButton(currentPlayButton);
            }
        }
        currentAudio = audioElement; // Set the new current audio
        
        // Apply current playback speed to the new audio
        if (playbackSpeedSelector) {
            const selectedSpeed = parseFloat(playbackSpeedSelector.value);
            currentAudio.playbackRate = selectedSpeed;
            console.log('Applied playback rate', selectedSpeed, 'to new current audio');
        }
        
        globalPlayPauseBtn.textContent = currentAudio.paused ? '▶' : '⏸';
        globalSeekSlider.value = (currentAudio.currentTime / currentAudio.duration) * 100 || 0;
        currentTimeDisplay.textContent = formatTime(currentAudio.currentTime);
        totalTimeDisplay.textContent = formatTime(currentAudio.duration);
        
        // Only show global media player if we're in the Story Book section
        const activeSection = document.querySelector('.section.active');
        if (globalMediaPlayer && activeSection && activeSection.id === 'sounds') {
            globalMediaPlayer.style.display = 'flex';
        }
    }

    // Helper to format time
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Auto-advance to next panel when audio ends
    function autoAdvanceToNextPanel() {
        if (!autoAdvanceEnabled) {
            console.log('Auto-advance is disabled - not advancing to next panel');
            return;
        }
        
        console.log('=== AUTO-ADVANCE STARTING ===');
        console.log('Auto-advancing to next panel from section:', currentSection);
        
        const currentNarrativeSection = narrativeSections[currentSection];
        const currentDataSection = currentNarrativeSection.dataset.section;
        
        console.log('Current section details:', {
            currentSection,
            dataSection: currentDataSection,
            hasSleepClass: currentNarrativeSection.classList.contains('ending-sleep'),
            hasPrayClass: currentNarrativeSection.classList.contains('ending-pray')
        });
        
        // Handle Panel 4 - show branching choice only if it's the original Panel 4
        if (currentDataSection === '4' && 
            !currentNarrativeSection.classList.contains('ending-sleep') && 
            !currentNarrativeSection.classList.contains('ending-pray')) {
            console.log('Original Panel 4 audio ended - showing branching choice');
            const branchingChoice = currentNarrativeSection.querySelector('.branching-choice');
            if (branchingChoice) {
                branchingChoice.style.display = 'flex';
                showNotification('Choose your path...');
                
                // Ensure we don't auto-advance past the choice
                audioCompleted = true;
                canNavigate = true;
                updateNavigationButtons();
            }
            return;
        }
        
        // Handle sleep ending - this should not auto-advance (handled by sleep choice logic)
        if (currentNarrativeSection.classList.contains('ending-sleep')) {
            console.log('Sleep ending - auto-advance handled separately');
            return;
        }
        
        // Handle pray ending - continue to Panel 7
        if (currentNarrativeSection.classList.contains('ending-pray')) {
            console.log('Pray ending completed - continuing to Panel 7');
            const panel7 = document.querySelector('[data-section="7"]');
            if (panel7) {
                // Make sure Panel 7 is visible
                panel7.style.display = 'flex';
                
                // Prevent scroll interference during auto-advance
                isAutoScrolling = true;
                
                currentSection = Array.from(narrativeSections).indexOf(panel7);
                console.log('Moving from pray ending to Panel 7, new currentSection:', currentSection);
                
                // Reset flags for the new section
                audioCompleted = false;
                canNavigate = false;
                
                scrollToSection(currentSection);
                updateActiveNarrativeSection(false, true); // forceAutoplay = true
                updateNavigationButtons();
                
                // Re-enable scroll detection after transition (extended timeout)
                setTimeout(() => {
                    isAutoScrolling = false;
                    console.log('Auto-advance from pray to Panel 7 complete');
                }, 2000);
                
                return;
            }
        }
        
        // For all other panels, find the next sequential panel
        let nextSectionIndex = currentSection + 1;
        let nextSection = narrativeSections[nextSectionIndex];
        
        console.log('Looking for next section after:', currentSection);
        console.log('Current section data-section:', currentNarrativeSection.dataset.section);
        console.log('Next section index would be:', nextSectionIndex);
        console.log('Next section element:', nextSection);
        console.log('Next section data-section:', nextSection ? nextSection.dataset.section : 'none');
        console.log('Next section display style:', nextSection ? nextSection.style.display : 'none');
        
        // Special protection: Ensure Panel 3 always goes to Panel 4
        if (currentDataSection === '3') {
            console.log('=== PANEL 3 DETECTED - APPLYING PROTECTION ===');
            const panel4 = document.querySelector('[data-section="4"]');
            if (panel4) {
                nextSection = panel4;
                nextSectionIndex = Array.from(narrativeSections).indexOf(panel4);
                console.log('PANEL 3 PROTECTION: Forcing advance to Panel 4, index:', nextSectionIndex);
                console.log('Panel 4 element:', panel4);
                console.log('Panel 4 display style:', panel4.style.display);
                console.log('Panel 4 classes:', panel4.className);
            } else {
                console.error('CRITICAL ERROR: Panel 4 not found when advancing from Panel 3!');
            }
        }
        
        // Skip hidden sections
        while (nextSection && nextSection.style.display === 'none') {
            console.log('Skipping hidden section:', nextSectionIndex, 'data-section:', nextSection.dataset.section);
            nextSectionIndex++;
            if (nextSectionIndex >= narrativeSections.length) {
                nextSection = null;
                break;
            }
            nextSection = narrativeSections[nextSectionIndex];
        }
        
        if (nextSection && nextSectionIndex < narrativeSections.length) {
            console.log('Auto-advancing to section:', nextSectionIndex, 'dataset.section:', nextSection.dataset.section);
            
            // Special case: If the next section is Panel 4, proceed normally (it will handle the branching choice when its audio ends)
            if (nextSection.dataset.section === '4') {
                console.log('Next section is Panel 4 - proceeding normally to allow branching choice');
                // Don't skip Panel 4, let it proceed normally
            }
            // Skip ending sections that should be hidden
            else if (nextSection.classList.contains('ending-sleep') || 
                nextSection.classList.contains('ending-pray')) {
                console.log('Skipping ending section, looking for next valid section');
                // Try to find the next non-ending section
                let searchIndex = nextSectionIndex + 1;
                while (searchIndex < narrativeSections.length) {
                    const candidate = narrativeSections[searchIndex];
                    if (candidate && 
                        !candidate.classList.contains('ending-sleep') && 
                        !candidate.classList.contains('ending-pray') &&
                        candidate.style.display !== 'none') {
                        nextSection = candidate;
                        nextSectionIndex = searchIndex;
                        break;
                    }
                    searchIndex++;
                }
            }
            
            if (nextSection && 
                !nextSection.classList.contains('ending-sleep') && 
                !nextSection.classList.contains('ending-pray')) {
                
                // Prevent scroll interference during auto-advance
                isAutoScrolling = true;
                
                // Reset flags for the new section
                audioCompleted = false;
                canNavigate = false;
                
                // Navigate to next panel
                currentSection = nextSectionIndex;
                scrollToSection(currentSection);
                updateActiveNarrativeSection(false, true); // forceAutoplay = true
                updateNavigationButtons();
                
                // Re-enable scroll detection after transition (extended timeout)
                setTimeout(() => {
                    isAutoScrolling = false;
                    console.log('Regular auto-advance complete to section', nextSectionIndex);
                }, 2000);
                
                console.log('Auto-advance completed - moved to section', nextSectionIndex);
            } else {
                console.log('Reached end of story');
                hasCompletedStory = true;
                if (!isFastForwardMode) {
                    toggleFastForwardMode();
                    showNotification('Story completed! Fast-forward mode enabled.');
                }
            }
        } else {
            console.log('No valid next section found - story complete');
            hasCompletedStory = true;
            if (!isFastForwardMode) {
                toggleFastForwardMode();
                showNotification('Story completed! Fast-forward mode enabled.');
            }
        }
    }

    // Intersection Observer for active section detection
    const observeElements = () => {
        console.log('Setting up Intersection Observer for narrative sections.');
        const observerOptions = {
            root: horizontalContainer, // Observe within the scroll container
            rootMargin: '0px',
            threshold: 0.7 // Section is active when 70% or more is visible
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isRestarting && !isAutoScrolling) {
                    const activeSection = entry.target; // The currently active section
                    const sectionIndex = Array.from(narrativeSections).indexOf(activeSection);
                    console.log('Intersection Observer: Section', sectionIndex, 'is intersecting.');
                    if (sectionIndex !== -1 && sectionIndex !== currentSection) {
                        console.log('Intersection Observer: Current section changed to', sectionIndex);
                        currentSection = sectionIndex;
                        // Manually trigger the navigation logic to handle audio and button states
                        // This is important for smooth scrolling and keyboard navigation
                        // stopCurrentAudio(); // Already handled by navigatePanel or direct play
                        const newAudioElement = activeSection.querySelector('audio');
                        const newPlayButton = activeSection.querySelector('.play-btn');

                        if (newAudioElement && newPlayButton) {
                            console.log('Intersection Observer: Found audio and play button for new active section.');
                            currentAudio = newAudioElement;
                            currentPlayButton = newPlayButton;
                            // Only update global media player if we're in the Story Book section
                            const activeSection = document.querySelector('.section.active');
                            if (activeSection && activeSection.id === 'sounds') {
                                updateGlobalMediaPlayer(newAudioElement); // Update global player
                            }
                            
                            // Only autoplay if auto-advance is disabled or if audio context is unlocked and audio is paused
                            // This prevents conflicts with auto-advance functionality
                            if (!autoAdvanceEnabled && audioContextUnlocked && newAudioElement.paused) {
                                console.log('Intersection Observer: Attempting autoplay for new active section (auto-advance disabled).');
                                // Add a delay to prevent conflicts with screen reader announcements
                                setTimeout(() => {
                                    playAudio(newAudioElement, newPlayButton, newPlayButton.querySelector('.play-icon'), newPlayButton.querySelector('.play-text'));
                                }, 300);
                            } else if (autoAdvanceEnabled) {
                                console.log('Intersection Observer: Auto-advance is enabled, skipping autoplay - will be handled by auto-advance.');
                            }
                        } else {
                            console.log('Intersection Observer: No audio or play button for new active section.');
                            currentAudio = null;
                            currentPlayButton = null;
                            if (globalMediaPlayer) {
                                globalPlayPauseBtn.textContent = '▶';
                                globalSeekSlider.value = 0;
                                currentTimeDisplay.textContent = '0:00';
                                totalTimeDisplay.textContent = '0:00';
                            }
                        }
                        updateActiveNarrativeSection(); // Update active class for UI
                    }
                }
            });
        }, observerOptions);

        narrativeSections.forEach(section => {
            observer.observe(section);
        });
    };

    // Call observeElements after initial setup for Story Book
    if (document.getElementById('sounds')) {
        observeElements();
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            toggleFastForwardMode();
            showNotification(isFastForwardMode ? 'Fast-forward mode enabled!' : 'Fast-forward mode disabled.');
        }
        if (e.altKey && e.key.toLowerCase() === 'a') {
            e.preventDefault();
            toggleAutoAdvanceMode();
            showNotification(autoAdvanceEnabled ? 'Auto-advance enabled!' : 'Auto-advance disabled.');
        }
    });

    // Add click functionality to auto-advance indicator
    autoAdvanceIndicator.addEventListener('click', function() {
        toggleAutoAdvanceMode();
        showNotification(autoAdvanceEnabled ? 'Auto-advance enabled!' : 'Auto-advance disabled.');
    });

    // Initialize navigation buttons state
    updateNavigationButtons();

    // Add click event for 'Enter the Story' button to navigate to Story Book
    const ctaBtn = document.querySelector('.cta-btn');
    if (ctaBtn) {
        ctaBtn.addEventListener('click', function() {
            showSection('sounds');
            updateActiveNav('sounds');
            // Remove forced scroll to top to allow natural scrolling
        });
    }

    // Behind Scenes Overlay Functionality
    function initializeBehindScenesOverlay() {
        const overlayImage = document.querySelector('.bhs-overlay-image');
        const playIndicator = document.querySelector('.overlay-play-indicator');
        
        if (overlayImage && playIndicator) {
            // Function to hide overlay and show video
            function hideOverlay() {
                overlayImage.style.opacity = '0';
                overlayImage.style.pointerEvents = 'none';
                playIndicator.style.opacity = '0';
                playIndicator.style.pointerEvents = 'none';
                showNotification('Double-click anywhere on the video to restore the overlay');
            }

            // Function to show overlay
            function showOverlay() {
                overlayImage.style.opacity = '1';
                overlayImage.style.pointerEvents = 'auto';
                playIndicator.style.opacity = '1';
                playIndicator.style.pointerEvents = 'auto';
                showNotification('Overlay restored');
            }

            // Add click events to both overlay image and play indicator
            overlayImage.addEventListener('click', hideOverlay);
            playIndicator.addEventListener('click', hideOverlay);

            // Add double-click event to video container to restore overlay
            const videoContainer = document.querySelector('.video-container');
            if (videoContainer) {
                videoContainer.addEventListener('dblclick', function(e) {
                    // Only restore if clicking on the container, not the overlay
                    if (e.target === this || e.target.tagName === 'IFRAME') {
                        showOverlay();
                    }
                });
            }

            // Add context menu prevention
            overlayImage.addEventListener('contextmenu', function(e) {
                e.preventDefault();
            });
        }
    }
});
