// Global audio object to maintain playback state
let globalAudio = null;
let audioContext = null;
let gainNode = null;
let audioSource = null;
let currentApiIndex = -1; // Track the currently playing API song index

// API keys and configuration
const API_KEY = "AIzaSyBh1InWxs4JuX6TSSiFAf7XUZg27hxrwZM"; // YouTube Data API key
const RAPID_API_KEY = "c02fe9318dmshb025ae9c63d7d10p1d3687jsn0c68ee69334b"; // RapidAPI key
const MAX_RESULTS = 10; // Maximum number of songs to fetch from API

// Audio processing nodes for Dolby Atmos-like effects
let spatialNode = null;
let reverbNode = null;
let stereoEnhancerNode = null;
let dolbyEnabled = false;

// Additional filters for Dolby Atmos simulation
let bassEnhancer = null;
let midEnhancer = null;
let highEnhancer = null;
let dynamicsProcessor = null;
let analyzerNode = null;
let impulseResponseBuffer = null;

// Speech recognition variables
let recognition = null;
let isListening = false;

// Tracking for API search results
let apiSearchResults = [];

function secondsToTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs() {
    try {
        const response = await fetch('http://127.0.0.1:5500/songs/');
        const html = await response.text();
        const div = document.createElement("div");
        div.innerHTML = html;

        const anchors = div.getElementsByTagName("a");
        const songs = [];

        for (const anchor of anchors) {
            if (anchor.href.endsWith(".mp3")) {
                songs.push(anchor.href.split("/songs/")[1]);
            }
        }
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

function initAudioContext() {
    try {
        // Create the audio context if not already created
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain node for volume control
            gainNode = audioContext.createGain();
            gainNode.gain.value = 1.0; // Default gain
            
            // Initialize Dolby Atmos-like effects
            initDolbyAtmosEffects();
            
            // Connect gain node to destination (output)
            gainNode.connect(audioContext.destination);
        }
        
        return true;
    } catch (e) {
        console.error("Failed to initialize AudioContext:", e);
        return false;
    }
}

function initDolbyAtmosEffects() {
    try {
        // Create stereo panner for enhanced stereo field
        spatialNode = audioContext.createStereoPanner();
        
        // Create convolver node for reverb effect
        reverbNode = audioContext.createConvolver();
        
        // Create biquad filter for stereo enhancement
        stereoEnhancerNode = audioContext.createBiquadFilter();
        stereoEnhancerNode.type = "peaking";
        stereoEnhancerNode.frequency.value = 1500;
        stereoEnhancerNode.Q.value = 1;
        stereoEnhancerNode.gain.value = 0;
        
        // Create additional filters for Dolby Atmos simulation
        // Bass enhancer
        bassEnhancer = audioContext.createBiquadFilter();
        bassEnhancer.type = "lowshelf";
        bassEnhancer.frequency.value = 200;
        bassEnhancer.gain.value = 3;
        
        // Mid clarity
        midEnhancer = audioContext.createBiquadFilter();
        midEnhancer.type = "peaking";
        midEnhancer.frequency.value = 1000;
        midEnhancer.Q.value = 0.9;
        midEnhancer.gain.value = 2;
        
        // High sparkle
        highEnhancer = audioContext.createBiquadFilter();
        highEnhancer.type = "highshelf";
        highEnhancer.frequency.value = 6000;
        highEnhancer.gain.value = 3;
        
        // Create dynamics processor for better sound presence
        dynamicsProcessor = audioContext.createDynamicsCompressor();
        dynamicsProcessor.threshold.value = -24;
        dynamicsProcessor.knee.value = 10;
        dynamicsProcessor.ratio.value = 3;
        dynamicsProcessor.attack.value = 0.02;
        dynamicsProcessor.release.value = 0.3;
        
        // Load impulse response for reverb
        loadImpulseResponse();
        
        console.log("Dolby Atmos-like effects initialized");
    } catch (e) {
        console.error("Error creating Dolby Atmos effects:", e);
    }
}

function connectAudioChain() {
    try {
        if (!audioSource || !gainNode) return false;
        
        // Disconnect any existing connections
        audioSource.disconnect();
        
        if (dolbyEnabled) {
            // Connect with Dolby Atmos-like effects chain
            audioSource.connect(bassEnhancer);
            bassEnhancer.connect(midEnhancer);
            midEnhancer.connect(highEnhancer);
            highEnhancer.connect(stereoEnhancerNode);
            stereoEnhancerNode.connect(spatialNode);
            spatialNode.connect(dynamicsProcessor);
            dynamicsProcessor.connect(reverbNode);
            reverbNode.connect(gainNode);
            
            // Apply Dolby settings
            applyDolbySettings();
            
            console.log("Connected with Dolby Atmos effects enabled");
        } else {
            // Connect directly to gain node (bypass effects)
            audioSource.connect(gainNode);
            console.log("Connected with standard audio chain");
        }
        
        return true;
    } catch (e) {
        console.error("Error connecting audio chain:", e);
        return false;
    }
}

function applyDolbySettings() {
    // Enhance stereo field
    spatialNode.pan.value = 0; // Center but with enhanced processing
    
    // Set reverb level based on content
    reverbNode.buffer = impulseResponseBuffer;
    
    // Apply dynamic EQ based on audio content
    analyzeDynamicEQ();
}

function analyzeDynamicEQ() {
    // Create analyzer to adjust EQ settings dynamically
    if (!analyzerNode) {
        analyzerNode = audioContext.createAnalyser();
        analyzerNode.fftSize = 2048;
        
        // Insert analyzer in the chain
        audioSource.connect(analyzerNode);
        
        // Start regular analysis
        setInterval(() => {
            if (!dolbyEnabled) return;
            
            const bufferLength = analyzerNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyzerNode.getByteFrequencyData(dataArray);
            
            // Calculate energy in different frequency bands
            const bassEnergy = calculateBandEnergy(dataArray, 0, 50, bufferLength);
            const midEnergy = calculateBandEnergy(dataArray, 50, 200, bufferLength);
            const highEnergy = calculateBandEnergy(dataArray, 200, 350, bufferLength);
            
            // Adjust EQ based on audio content
            const bassGain = Math.max(3, 5 - bassEnergy / 20);
            const midGain = Math.max(1, 3 - midEnergy / 30);
            const highGain = Math.max(2, 4 - highEnergy / 25);
            
            // Apply the dynamic EQ smoothly
            bassEnhancer.gain.setTargetAtTime(bassGain, audioContext.currentTime, 0.3);
            midEnhancer.gain.setTargetAtTime(midGain, audioContext.currentTime, 0.3);
            highEnhancer.gain.setTargetAtTime(highGain, audioContext.currentTime, 0.3);
        }, 500);
    }
}

function calculateBandEnergy(dataArray, startBin, endBin, totalBins) {
    let energy = 0;
    for (let i = startBin; i < endBin && i < totalBins; i++) {
        energy += dataArray[i];
    }
    return energy / (endBin - startBin);
}

function loadImpulseResponse() {
    // Generate a sophisticated impulse response for reverb
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * 3.0; // 3 second impulse response
    impulseResponseBuffer = audioContext.createBuffer(2, length, sampleRate);
    
    // Fill both channels with more realistic room impulse response
    for (let channel = 0; channel < 2; channel++) {
        const data = impulseResponseBuffer.getChannelData(channel);
        
        // Early reflections
        for (let i = 0; i < length * 0.1; i++) {
            // Early reflections with random timing and amplitude
            const reflection = Math.random() * 0.5 - 0.25;
            if (Math.random() > 0.9) {
                data[i] = reflection * Math.pow(0.9, i / (length * 0.01));
            }
        }
        
        // Main reverb tail with exponential decay
        for (let i = Math.floor(length * 0.1); i < length; i++) {
            // Random noise with exponential decay, more realistic
            const decay = Math.pow(0.9, (i - length * 0.1) / (length * 0.2));
            data[i] = (Math.random() * 2 - 1) * decay * 0.5;
            
            // Add some modulation to simulate air movement
            if (i % 17 === 0) {
                data[i] *= 1.2;
            }
        }
    }
    
    // Set the impulse response
    reverbNode.buffer = impulseResponseBuffer;
}

function toggleDolbyAtmos() {
    if (!audioContext || !audioSource) {
        console.warn("Audio not initialized yet");
        return false;
    }
    
    dolbyEnabled = !dolbyEnabled;
    connectAudioChain();
    
    // Update UI to show Dolby status
    const dolbyButton = document.getElementById("dolby-toggle");
    if (dolbyButton) {
        if (dolbyEnabled) {
            dolbyButton.classList.add("active");
            dolbyButton.querySelector("span").textContent = "Dolby Atmos: ON";
        } else {
            dolbyButton.classList.remove("active");
            dolbyButton.querySelector("span").textContent = "Dolby Atmos: OFF";
        }
    }
    
    return dolbyEnabled;
}

function playMusic(track, currentSong, pause = false) {
    // Disconnect any existing audio source to prevent issues
    if (audioSource) {
        try {
            audioSource.disconnect();
        } catch (e) {
            console.log("Error disconnecting previous source:", e);
        }
    }
    
    currentSong.src = "songs/" + track;
    
    // Update global audio reference
    globalAudio = currentSong;
    
    // Initialize audio context on first use
    if (!audioContext && !initAudioContext()) {
        console.error("Could not initialize audio context, audio effects won't work");
    }
    
    // When the audio element is ready, connect it to the Web Audio API
    currentSong.addEventListener('canplay', function connectAudio() {
        if (audioContext && !audioSource) {
            try {
                audioSource = audioContext.createMediaElementSource(currentSong);
                
                // Connect the audio chain with or without Dolby effects
                connectAudioChain();
                
                // Set initial volume from volume control
                const volumeControl = document.getElementById("volumeControl");
                if (volumeControl) {
                    const volumeValue = parseFloat(volumeControl.value);
                    gainNode.gain.value = volumeValue;
                    updateVolumePercentage(volumeValue);
                    updateVolumeHighlight(volumeValue);
                }
                
                // Remove this listener once connected
                currentSong.removeEventListener('canplay', connectAudio);
            } catch (e) {
                console.error("Error connecting audio:", e);
            }
        }
    }, { once: true });

    if (!pause) {
        currentSong.play()
            .then(() => {
                play.src = "images/pause.svg";
            })
            .catch(err => {
                console.error("Error playing song:", err);
                play.src = "images/play.svg";
            });
    } else {
        play.src = "images/play.svg";
    }

    // Display song name without .mp3 extension
    const songName = decodeURI(track).replace(/\.mp3$/i, "");
    document.querySelector(".songinfo").innerHTML = songName;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

// Function to navigate without stopping music
function navigateWithoutStopping(url) {
    if (globalAudio && globalAudio.src) {
        localStorage.setItem('currentSongSrc', globalAudio.src);
        localStorage.setItem('currentSongTime', globalAudio.currentTime.toString());
        localStorage.setItem('isPlaying', (!globalAudio.paused).toString());
        localStorage.setItem('currentVolume', globalAudio.volume.toString());
        console.log("Saved playback state:", {
            src: globalAudio.src,
            time: globalAudio.currentTime,
            isPlaying: !globalAudio.paused
        });
    } else {
        console.log("No audio playing to save");
    }
    window.location.href = url;
}

let songs;

// Speech recognition setup
function setupSpeechRecognition() {
    try {
        window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (window.SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            
            // When speech is recognized
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                const searchInput = document.getElementById('search-input');
                searchInput.value = transcript;
                
                // Trigger search if needed
                if (document.getElementById('search-btn')) {
                    // Auto-trigger search after voice input
                    document.getElementById('search-btn').click();
                }
                
                // Visual feedback when done
                toggleMicrophoneState(false);
            };
            
            recognition.onerror = function(event) {
                console.error('Speech recognition error', event.error);
                toggleMicrophoneState(false);
            };
            
            recognition.onend = function() {
                toggleMicrophoneState(false);
            };
            
            // Set up mic button click event
            const micContainer = document.querySelector('.mic-container');
            if (micContainer) {
                micContainer.style.cursor = 'pointer';
                micContainer.addEventListener('click', toggleSpeechRecognition);
            }
        } else {
            console.error('Speech recognition not supported in this browser');
            // Hide microphone if not supported
            const micContainer = document.querySelector('.mic-container');
            if (micContainer) {
                micContainer.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error setting up speech recognition:', error);
        // Hide microphone on error
        const micContainer = document.querySelector('.mic-container');
        if (micContainer) {
            micContainer.style.display = 'none';
        }
    }
}

function toggleSpeechRecognition() {
    if (!recognition) return;
    
    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
            toggleMicrophoneState(true);
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            toggleMicrophoneState(false);
        }
    }
}

function toggleMicrophoneState(listening) {
    isListening = listening;
    const micIcon = document.querySelector('.mic-ico');
    
    if (micIcon) {
        if (listening) {
            micIcon.classList.add('listening');
        } else {
            micIcon.classList.remove('listening');
        }
    }
}

async function main() {
    const playButton = document.getElementById("play");
    const previousButton = document.getElementById("previous");
    const nextButton = document.getElementById("next");
    const volumeControl = document.getElementById("volumeControl");

    // Initialize Audio Context for volume boost
    initAudioContext();
    
    // Setup speech recognition
    setupSpeechRecognition();
    
    let currentSong = new Audio();
    currentSong.volume = 1.0; // Set default volume to max
    
    // Set global audio reference
    globalAudio = currentSong;
    
    // Update playlist links to use continuous playback
    document.querySelectorAll('.card .play a').forEach(link => {
        const href = link.getAttribute('href');
        link.href = "javascript:void(0);";
        link.onclick = function(e) { 
            e.preventDefault();
            navigateWithoutStopping(href); 
        };
    });

    // Get the list of all songs
    songs = await getSongs();
    if (songs.length === 0) {
        console.error("No songs found!");
        return;
    }
    
    // Check if there's a previously playing song from localStorage
    const savedSongSrc = localStorage.getItem('currentSongSrc');
    const savedSongTime = localStorage.getItem('currentSongTime');
    const wasPlaying = localStorage.getItem('isPlaying') === 'true';
    const savedVolume = localStorage.getItem('currentVolume');
    
    console.log("Retrieved playback state:", {
        src: savedSongSrc,
        time: savedSongTime,
        isPlaying: wasPlaying
    });
    
    if (savedSongSrc) {
        try {
            // Extract the song name from the saved path
            let trackName = "";
            let fromHomePlaylist = false;
            
            // Determine which playlist the song is from
            if (savedSongSrc.includes("/songs/")) {
                trackName = decodeURIComponent(savedSongSrc.split("/songs/")[1]);
                fromHomePlaylist = true;
            } else if (savedSongSrc.includes("/happy123/")) {
                trackName = decodeURIComponent(savedSongSrc.split("/happy123/")[1]);
            } else if (savedSongSrc.includes("/play2/")) {
                trackName = decodeURIComponent(savedSongSrc.split("/play2/")[1]);
            } else if (savedSongSrc.includes("/play3/")) {
                trackName = decodeURIComponent(savedSongSrc.split("/play3/")[1]);
            } else if (savedSongSrc.includes("/play4/")) {
                trackName = decodeURIComponent(savedSongSrc.split("/play4/")[1]);
            }
            
            // If song is from home songs directory and exists in our list
            if (fromHomePlaylist && songs.includes(trackName)) {
                // Play from home playlist
                playMusic(trackName, currentSong, true);
            } else {
                // Direct setting of audio source for cross-playlist playback
                currentSong.src = savedSongSrc;
                document.querySelector(".songinfo").innerHTML = trackName || "Playing from another playlist";
            }
            
            // Set the time to where it was
            if (savedSongTime) {
                currentSong.currentTime = parseFloat(savedSongTime);
            }
            
            // Set volume if available
            if (savedVolume) {
                const parsedVolume = parseFloat(savedVolume);
                currentSong.volume = parsedVolume;
                volumeControl.value = parsedVolume;
                updateVolumePercentage(parsedVolume);
            }
            
            // Resume playing if it was playing before
            if (wasPlaying) {
                currentSong.play()
                    .then(() => {
                        playButton.src = "images/pause.svg";
                    })
                    .catch(err => {
                        console.error("Error resuming playback:", err);
                        playButton.src = "images/play.svg";
                    });
            }
        } catch (error) {
            console.error("Error restoring playback:", error);
            // Fallback to first song
            playMusic(songs[0], currentSong, true);
        }
    } else {
        // No saved song, set the first song without playing it
        playMusic(songs[0], currentSong, true);
    }

    // Display all songs in the playlist
    const songList = document.querySelector(".songlist ul");
    for (const song of songs) {
        // Remove .mp3 extension from display name
        const songName = song.replaceAll("%20", " ").replace(/\.mp3$/i, "");
        songList.innerHTML += `
            <li>
                <img class="invert" src="images/music.svg" alt="">
                <div class="info">
                    <div>${songName}</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="images/play.svg" alt="">
                </div>
            </li>`;
    }

    // Attach event listeners to each song
    const songItems = Array.from(songList.getElementsByTagName("li"));
    songItems.forEach((item, index) => {
        item.addEventListener("click", () => {
            const displayedName = item.querySelector(".info div").innerText.trim();
            // Use the corresponding index in the songs array to get the original filename
            if (index < songs.length) {
                playMusic(songs[index], currentSong);
            } else {
                // Try to find a matching song if index doesn't work
                const matchingSong = songs.find(s => 
                    s.replaceAll("%20", " ").replace(/\.mp3$/i, "") === displayedName
                );
                if (matchingSong) {
                    playMusic(matchingSong, currentSong);
                } else {
                    console.error("Could not find matching song:", displayedName);
                }
            }
        });
    });

    // Modify Play/Pause button functionality to work with both local and API tracks
    playButton.addEventListener("click", () => {
        if (!globalAudio) return;
        
        if (globalAudio.paused) {
            globalAudio.play()
                .then(() => {
                    playButton.src = "images/pause.svg";
                })
                .catch(err => {
                    console.error("Error playing on button click:", err);
                });
        } else {
            globalAudio.pause();
            playButton.src = "images/play.svg";
        }
    });

    // Handle Previous/Next for API tracks
    let currentApiIndex = -1;
    
    previousButton.addEventListener("click", () => {
        // Check if we're playing an API track
        if (currentApiIndex >= 0 && apiSearchResults.length > 0) {
            const newIndex = Math.max(0, currentApiIndex - 1);
            if (newIndex !== currentApiIndex) {
                currentApiIndex = newIndex;
                playAPITrack(currentApiIndex);
            }
            return;
        }
        
        // Otherwise use regular local song navigation
        const index = songs.indexOf(currentSong.src.split("/").pop());
        if (index > 0) {
            playMusic(songs[index - 1], currentSong);
        }
    });

    nextButton.addEventListener("click", () => {
        // Check if we're playing an API track
        if (currentApiIndex >= 0 && apiSearchResults.length > 0) {
            const newIndex = Math.min(apiSearchResults.length - 1, currentApiIndex + 1);
            if (newIndex !== currentApiIndex) {
                currentApiIndex = newIndex;
                playAPITrack(currentApiIndex);
            }
            return;
        }
        
        // Otherwise use regular local song navigation
        const index = songs.indexOf(currentSong.src.split("/").pop());
        if (index < songs.length - 1) {
            playMusic(songs[index + 1], currentSong);
        }
    });

    // Handle playback progress
    currentSong.addEventListener("timeupdate", () => {
        const currentTime = secondsToTime(currentSong.currentTime);
        const duration = secondsToTime(currentSong.duration);

        document.querySelector(".songtime").innerHTML = `${currentTime} / ${duration}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar functionality
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        const percent = e.offsetX / e.target.getBoundingClientRect().width;
        currentSong.currentTime = currentSong.duration * percent;
    });

    // Hamburger menu toggle
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Volume control
    volumeControl.value = 1.0; // Default to 100%
    updateVolumePercentage(1.0);

    volumeControl.addEventListener("input", () => {
        const volumeValue = parseFloat(volumeControl.value);
        
        if (gainNode) {
            // Apply volume to gain node (supports values above 1.0)
            gainNode.gain.value = volumeValue;
            
            // Keep HTML5 audio at max volume when boost is applied
            currentSong.volume = 1.0;
        } else {
            // Fallback when Web Audio API is not available
            currentSong.volume = Math.min(1, volumeValue);
        }
        
        updateVolumePercentage(volumeValue);
        updateVolumeHighlight(volumeValue);
    });

    // Function to update volume percentage display
    function updateVolumePercentage(volumeValue) {
        const volumePercentage = document.querySelector('.volume-percentage');
        if (volumePercentage) {
            // Convert volume value to percentage (0-200%)
            const percentage = Math.round(volumeValue * 100);
            volumePercentage.textContent = `${percentage}%`;
        }
    }
    
    // Function to highlight volume when over 100%
    function updateVolumeHighlight(volumeValue) {
        const volumePercentage = document.querySelector('.volume-percentage');
        const volumeSlider = document.getElementById('volumeControl');
        const volumeIcon = document.querySelector('.volume img');
        
        if (volumePercentage) {
            if (volumeValue > 1.0) {
                volumePercentage.classList.add('high-volume');
            } else {
                volumePercentage.classList.remove('high-volume');
            }
        }
        
        if (volumeSlider) {
            if (volumeValue > 1.0) {
                volumeSlider.classList.add('high-volume');
            } else {
                volumeSlider.classList.remove('high-volume');
            }
        }
        
        if (volumeIcon) {
            if (volumeValue > 1.0) {
                volumeIcon.classList.add('high-volume');
            } else {
                volumeIcon.classList.remove('high-volume');
            }
        }
    }
    
    // Keyboard controls
    document.addEventListener("keydown", (e) => {
        switch (e.code) {
            case "Space":
                if (currentSong.paused) {
                    currentSong.play();
                    playButton.src = "images/pause.svg";
                } else {
                    currentSong.pause();
                    playButton.src = "images/play.svg";
                }
                break;
            case "ArrowRight":
                nextButton.click();
                break;
            case "ArrowLeft":
                previousButton.click();
                break;
            case "ArrowUp":
                // Increase volume by 10% but cap at 200%
                const newVolumeUp = Math.min(2, parseFloat(volumeControl.value) + 0.1);
                volumeControl.value = newVolumeUp;
                
                if (gainNode) {
                    gainNode.gain.value = newVolumeUp;
                    currentSong.volume = 1.0; // Keep HTML5 audio at max
                } else {
                    currentSong.volume = Math.min(1, newVolumeUp);
                }
                
                updateVolumePercentage(newVolumeUp);
                updateVolumeHighlight(newVolumeUp);
                break;
            case "ArrowDown":
                // Decrease volume by 10% but don't go below 0
                const newVolumeDown = Math.max(0, parseFloat(volumeControl.value) - 0.1);
                volumeControl.value = newVolumeDown;
                
                if (gainNode) {
                    gainNode.gain.value = newVolumeDown;
                    currentSong.volume = Math.min(1, newVolumeDown); // Scale HTML5 audio below 100%
                } else {
                    currentSong.volume = newVolumeDown;
                }
                
                updateVolumePercentage(newVolumeDown);
                updateVolumeHighlight(newVolumeDown);
                break;
        }
    });
    
    // Add beforeunload event to save current playback state when leaving
    window.addEventListener('beforeunload', function() {
        if (globalAudio && globalAudio.src) {
            localStorage.setItem('currentSongSrc', globalAudio.src);
            localStorage.setItem('currentSongTime', globalAudio.currentTime.toString());
            localStorage.setItem('isPlaying', (!globalAudio.paused).toString());
            localStorage.setItem('currentVolume', globalAudio.volume.toString());
        }
    });

    // Add search button functionality
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', performSearch);
        
        // Also trigger search on Enter key
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    }
}

// Function to search songs using external API
async function searchSongsAPI(query) {
    if (!query) return [];
    
    try {
        // Show loading indicator
        const songList = document.querySelector(".songlist ul");
        songList.innerHTML = '<li class="loading-results">Searching online for songs...</li>';
        
        // Try JioSaavn API first
        try {
            const response = await fetch(`https://saavn-api-v2.p.rapidapi.com/search/songs?query=${encodeURIComponent(query)}&page=1&limit=${MAX_RESULTS}`, {
                method: "GET",
                headers: {
                    "X-RapidAPI-Key": RAPID_API_KEY,
                    "X-RapidAPI-Host": "saavn-api-v2.p.rapidapi.com"
                }
            });
            
            const data = await response.json();
            
            if (data && data.data && data.data.results && data.data.results.length > 0) {
                // Process the results
                apiSearchResults = data.data.results.map(song => ({
                    id: song.id,
                    title: song.name,
                    artist: song.primaryArtists,
                    album: song.album.name,
                    duration: song.duration,
                    image: song.image[1].link,
                    url: song.downloadUrl[song.downloadUrl.length - 1].link,
                    source: "jiosaavn"
                }));
                
                return apiSearchResults;
            } else {
                throw new Error("No results from JioSaavn API");
            }
        } catch (jioError) {
            console.error("JioSaavn API error:", jioError);
            throw jioError; // Pass to YouTube fallback
        }
    } catch (error) {
        console.error("Error searching songs via JioSaavn API:", error);
        
        // Fallback to YouTube API if JioSaavn fails
        try {
            console.log("Trying YouTube API fallback...");
            const ytResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${MAX_RESULTS}&q=${encodeURIComponent(query + " audio")}&type=video&key=${API_KEY}`);
            const ytData = await ytResponse.json();
            
            if (ytData && ytData.items && ytData.items.length > 0) {
                // Process YouTube results
                apiSearchResults = ytData.items.map(item => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    artist: item.snippet.channelTitle,
                    image: item.snippet.thumbnails.medium.url,
                    source: "youtube"
                }));
                
                return apiSearchResults;
            } else {
                throw new Error("No results from YouTube API");
            }
        } catch (ytError) {
            console.error("Error with YouTube API fallback:", ytError);
            
            // If both APIs fail, try the Deezer API as a last resort
            try {
                console.log("Trying Deezer API as last resort...");
                const deezerResponse = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${MAX_RESULTS}&output=json`);
                const deezerData = await deezerResponse.json();
                
                if (deezerData && deezerData.data && deezerData.data.length > 0) {
                    apiSearchResults = deezerData.data.map(track => ({
                        id: track.id,
                        title: track.title,
                        artist: track.artist.name,
                        album: track.album.title,
                        duration: track.duration,
                        image: track.album.cover_medium,
                        preview: track.preview,
                        source: "deezer"
                    }));
                    
                    return apiSearchResults;
                }
            } catch (deezerError) {
                console.error("All API fallbacks failed:", deezerError);
            }
            
            return []; // Return empty if all APIs fail
        }
    }
}

// Function to play song from API result
function playAPITrack(index) {
    if (index < 0 || index >= apiSearchResults.length) {
        console.error("Invalid track index");
        return;
    }
    
    // Set current API index for prev/next navigation
    currentApiIndex = index;
    
    const track = apiSearchResults[index];
    console.log("Playing API track:", track);
    
    // Disconnect existing audio connections
    if (audioSource) {
        try {
            audioSource.disconnect();
            audioSource = null;
        } catch (e) {
            console.log("Error disconnecting previous source:", e);
        }
    }
    
    // Create new audio element if needed
    if (!globalAudio) {
        globalAudio = new Audio();
    }
    
    // Set source based on API source
    if (track.source === "youtube") {
        // Handle YouTube source - this would need a proxy or YouTube player API
        alert("YouTube playback requires YouTube iframe API integration. Feature coming soon!");
        return;
    } else if (track.source === "deezer") {
        // Deezer provides preview URLs
        if (track.preview) {
            globalAudio.src = track.preview;
        } else {
            alert("No preview available for this Deezer track.");
            return;
        }
    } else if (track.source === "jiosaavn") {
        // Direct URL playback from JioSaavn
        globalAudio.src = track.url;
    } else {
        alert("Unsupported source type or missing URL.");
        return;
    }
    
    // Initialize Web Audio API for this source
    if (!audioContext) {
        initAudioContext();
    }
    
    // Connect audio context when ready
    globalAudio.addEventListener('canplay', function connectAPI() {
        try {
            if (audioContext && !audioSource) {
                audioSource = audioContext.createMediaElementSource(globalAudio);
                
                // Connect the audio processing chain
                connectAudioChain();
                
                // Update volume
                const volumeControl = document.getElementById("volumeControl");
                if (volumeControl && gainNode) {
                    const volumeValue = parseFloat(volumeControl.value);
                    gainNode.gain.value = volumeValue;
                    updateVolumePercentage(volumeValue);
                    updateVolumeHighlight(volumeValue);
                }
            }
            
            // Remove this one-time listener
            globalAudio.removeEventListener('canplay', connectAPI);
        } catch (e) {
            console.error("Error connecting API audio source:", e);
        }
    }, { once: true });
    
    // Start playback
    globalAudio.play()
        .then(() => {
            // Update play button UI
            const playButton = document.getElementById("play");
            if (playButton) {
                playButton.src = "images/pause.svg";
            }
            
            // Update now playing info
            document.querySelector(".songinfo").innerHTML = `${track.title} - ${track.artist}`;
            document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
            
            // Update time display
            globalAudio.addEventListener("timeupdate", () => {
                const currentTime = secondsToTime(globalAudio.currentTime);
                const duration = secondsToTime(globalAudio.duration);
                document.querySelector(".songtime").innerHTML = `${currentTime} / ${duration}`;
                document.querySelector(".circle").style.left = (globalAudio.currentTime / globalAudio.duration) * 100 + "%";
            });
        })
        .catch(err => {
            console.error("Error playing API song:", err);
            alert("Couldn't play this song. Please try another one.");
            
            const playButton = document.getElementById("play");
            if (playButton) {
                playButton.src = "images/play.svg";
            }
        });
    
    // Mark the track as currently playing in the UI
    updateAPIPlayingUI(index);
}

// Update UI to show which track is currently playing
function updateAPIPlayingUI(index) {
    const songItems = document.querySelectorAll(".songlist ul li");
    songItems.forEach((item, i) => {
        if (i === index && item.classList.contains('api-result')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Function to display API search results
function displayAPISearchResults(results) {
    const songList = document.querySelector(".songlist ul");
    
    // Clear existing song list
    songList.innerHTML = '';
    
    if (!results || results.length === 0) {
        songList.innerHTML = '<li class="no-results">No songs found from API search</li>';
        return;
    }
    
    // Add section header
    songList.innerHTML = '<li class="search-section-header"><h3>Search Results from Music API</h3></li>';
    
    // Add each result
    results.forEach((song, index) => {
        songList.innerHTML += `
            <li class="api-result" data-index="${index}">
                <div class="song-thumbnail">
                    <img src="${song.image || 'images/music.svg'}" alt="${song.title}">
                </div>
                <div class="info">
                    <div class="song-title">${song.title}</div>
                    <div class="song-artist">${song.artist}</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="images/play.svg" alt="">
                </div>
            </li>
        `;
    });
    
    // Add click event to play songs
    document.querySelectorAll(".songlist ul li.api-result").forEach(item => {
        item.addEventListener("click", function() {
            const index = parseInt(this.getAttribute("data-index"), 10);
            playAPITrack(index);
        });
    });
}

// Enhanced search function that uses both local and API search
async function performSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) return;
    
    console.log('Searching for:', query);
    
    // Search local songs first
    const localResults = songs.filter(song => 
        song.toLowerCase().includes(query)
    );
    
    // Then search API
    const apiResults = await searchSongsAPI(query);
    
    // Display combined results with API results first
    displayCombinedSearchResults(apiResults, localResults);
}

// Display combined results from API and local search
function displayCombinedSearchResults(apiResults, localResults) {
    const songList = document.querySelector(".songlist ul");
    
    // Clear existing song list
    songList.innerHTML = '';
    
    if (apiResults.length === 0 && localResults.length === 0) {
        songList.innerHTML = '<li class="no-results">No songs found matching your search</li>';
        return;
    }
    
    // Add API results section
    if (apiResults.length > 0) {
        songList.innerHTML += '<li class="search-section-header"><h3>Online Music Results</h3></li>';
        
        apiResults.forEach((song, index) => {
            songList.innerHTML += `
                <li class="api-result" data-index="${index}">
                    <div class="song-thumbnail">
                        <img src="${song.image || 'images/music.svg'}" alt="${song.title}">
                    </div>
                    <div class="info">
                        <div class="song-title">${song.title}</div>
                        <div class="song-artist">${song.artist}</div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="images/play.svg" alt="">
                    </div>
                </li>
            `;
        });
    }
    
    // Add local results section if any exist
    if (localResults.length > 0) {
        songList.innerHTML += '<li class="search-section-header"><h3>Your Library</h3></li>';
        
        localResults.forEach(song => {
            // Remove .mp3 extension from display name
            const songName = song.replaceAll("%20", " ").replace(/\.mp3$/i, "");
            songList.innerHTML += `
                <li class="local-result">
                    <img class="invert" src="images/music.svg" alt="">
                    <div class="info">
                        <div>${songName}</div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="images/play.svg" alt="">
                    </div>
                </li>`;
        });
    }
    
    // Add event listeners to API results
    document.querySelectorAll(".songlist ul li.api-result").forEach(item => {
        item.addEventListener("click", function() {
            const index = parseInt(this.getAttribute("data-index"), 10);
            playAPITrack(index);
        });
    });
    
    // Add event listeners to local results
    document.querySelectorAll(".songlist ul li.local-result").forEach((item, index) => {
        item.addEventListener("click", function() {
            const displayedName = this.querySelector(".info div").innerText.trim();
            // Find corresponding original song to play
            const matchingSong = localResults.find(s => 
                s.replaceAll("%20", " ").replace(/\.mp3$/i, "") === displayedName
            );
            
            if (matchingSong) {
                playMusic(matchingSong, globalAudio || new Audio());
            } else {
                console.error("Could not find matching local song:", displayedName);
            }
        });
    });
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', main);

// Add event listener for the logo refresh functionality
document.addEventListener('DOMContentLoaded', function() {
    const refreshHomeBtn = document.getElementById('refresh-home');
    if (refreshHomeBtn) {
        refreshHomeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // If we have a playing song, save its state first
            if (globalAudio && globalAudio.src) {
                localStorage.setItem('currentSongSrc', globalAudio.src);
                localStorage.setItem('currentSongTime', globalAudio.currentTime.toString());
                localStorage.setItem('isPlaying', (!globalAudio.paused).toString());
                localStorage.setItem('currentVolume', globalAudio.volume.toString());
                console.log("Saved playback state before refresh");
            }
            // Refresh the page
            window.location.reload();
        });
    }
});

// Add Dolby Atmos button to the UI when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create and add Dolby Atmos toggle button to the playbar
    const playbar = document.querySelector('.bar');
    if (playbar) {
        const dolbyToggle = document.createElement('div');
        dolbyToggle.className = 'dolby-toggle';
        dolbyToggle.id = 'dolby-toggle';
        dolbyToggle.innerHTML = `
            <img src="images/dolby.svg" alt="Dolby Atmos" class="dolby-icon">
            <span>Dolby Atmos: OFF</span>
        `;
        
        // Insert before the volume control
        const volumeControl = document.querySelector('.volume');
        if (volumeControl) {
            playbar.insertBefore(dolbyToggle, volumeControl);
        } else {
            playbar.appendChild(dolbyToggle);
        }
        
        // Add event listener
        dolbyToggle.addEventListener('click', toggleDolbyAtmos);
    }
    
    // Add Dolby Atmos keyboard shortcut (Alt+D)
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === 'd') {
            toggleDolbyAtmos();
            e.preventDefault();
        }
    });
});
