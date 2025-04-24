// Converts seconds to a time format (MM:SS)
function secondsToTime(seconds) {
    if (isNaN(seconds) || seconds <= 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

// Fetches the list of songs from the "play2" directory
async function getsongs() {
    try {
        const response = await fetch('play2/');
        const html = await response.text();
        const div = document.createElement("div");
        div.innerHTML = html;

        const songElements = div.getElementsByTagName("a");
        const songs = [];
        for (let element of songElements) {
            if (element.href.endsWith(".mp3")) {
                songs.push(decodeURIComponent(element.href.split("play2/")[1])); // Decode URI
            }
        }
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

// Function to play or pause the music
const playMusic = (track, currentsong, pause = false) => {
    currentsong.src = `play2/${track}`; // Set the audio source
    if (!pause) {
        currentsong.play();
        document.querySelector("#play").src = "images/pause.svg"; // Change play button to pause icon
    } else {
        currentsong.pause();
        document.querySelector("#play").src = "images/play.svg";
    }
    document.querySelector(".songinfo").innerText = decodeURIComponent(track); // Update song info
    document.querySelector(".songtime").innerText = "00:00 / 00:00"; // Reset song time display
};

let songs = []; // Variable to store the list of songs

// Main function
async function main() {
    const play = document.querySelector("#play");
    const previous = document.querySelector("#previous");
    const next = document.querySelector("#next");
    const currentsong = new Audio();

    // Fetch the list of songs
    songs = await getsongs();
    if (songs.length === 0) {
        console.error("No songs found!");
        return;
    }

    // Display songs in the playlist
    const songul = document.querySelector(".songlist ul");
    songul.innerHTML = ""; // Clear existing content
    songs.forEach((song, index) => {
        songul.innerHTML += `
            <li>
                <img class="invert" src="images/music.svg" alt="Music Icon">
                <div class="info">${song.replaceAll("%20", " ")}</div>
                <div class="playnow">
                    <img class="invert play-icon" src="images/play.svg" alt="Play Now">
                </div>
            </li>`;
    });

    // Attach click events to the playlist
    Array.from(songul.getElementsByTagName("li")).forEach((li, index) => {
        li.addEventListener("click", () => {
            playMusic(songs[index], currentsong);
        });
    });

    // Play/Pause button functionality
    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "images/pause.svg";
        } else {
            currentsong.pause();
            play.src = "images/play.svg";
        }
    });

    // Previous and Next button functionality
    previous.addEventListener("click", () => {
        const index = songs.indexOf(decodeURIComponent(currentsong.src.split("/").pop()));
        if (index > 0) {
            playMusic(songs[index - 1], currentsong);
        }
    });

    next.addEventListener("click", () => {
        const index = songs.indexOf(decodeURIComponent(currentsong.src.split("/").pop()));
        if (index < songs.length - 1) {
            playMusic(songs[index + 1], currentsong);
        }
    });

    // Update song time and progress bar
    currentsong.addEventListener("timeupdate", () => {
        const currentTime = secondsToTime(currentsong.currentTime);
        const duration = secondsToTime(currentsong.duration);
        document.querySelector(".songtime").innerText = `${currentTime} / ${duration}`;
        const progress = (currentsong.currentTime / currentsong.duration) * 100 || 0;
        document.querySelector(".circle").style.left = `${progress}%`;
    });

    // Seekbar functionality
    const seekbar = document.querySelector(".seekbar");
    seekbar.addEventListener("click", (e) => {
        const percent = (e.offsetX / seekbar.offsetWidth) * 100;
        currentsong.currentTime = (currentsong.duration * percent) / 100;
    });

    // Initialize first song
    playMusic(songs[0], currentsong, true);
}

main(); // Run the music player
