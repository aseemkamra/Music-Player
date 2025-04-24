function secondsToTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Pad with leading zeros if needed
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0'); 

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getsongs() {
    let a = await fetch('http://127.0.0.1:5500/songs/');
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split("/songs/")[1]);
        }
    }
    return songs;
}

const playMusic = (track, currentsong, pause = false) => {
    currentsong.src = "songs/" + track;
    if (!pause) {
        currentsong.play();
        play.src = "images/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

// Function to filter songs based on the search bar input
function filterSongs(songs, query) {
    return songs.filter(song => song.toLowerCase().includes(query.toLowerCase()));
}

let songs;

async function main() {
    play.src = "images/play.svg";
    let currentsong = new Audio(); // Initialize the audio element here

    // get the list of all songs
    songs = await getsongs();
    playMusic(songs[0], currentsong, true);

    // show all songs in the playlist
    let songul = document.querySelector(".songlist").getElementsByTagName("ul")[0];

    // Function to display songs in the list
    function displaySongs(songs) {
        songul.innerHTML = ""; // Clear the list before updating
        for (const song of songs) {
            songul.innerHTML += `<li>
                <img class="invert" src="images/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")} </div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="images/play.svg" alt="">
                </div>
            </li>`;
        }

        // attach an event listener to each song
        Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", () => {
                let track = e.querySelector(".info").firstElementChild.innerHTML.trim();
                playMusic(track, currentsong);
            });
        });
    }

    // Initially display all songs
    displaySongs(songs);

    // Event listener for search bar input
    document.getElementById("searchBar").addEventListener("input", function() {
        const query = this.value;
        const filteredSongs = filterSongs(songs, query);
        displaySongs(filteredSongs); // Update the song list based on search
    });

    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "images/pause.svg";
        } else {
            currentsong.pause();
            play.src = "images/play.svg";
        }
    });

    // listen for timeupdate event
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToTime(currentsong.currentTime)}/
        ${secondsToTime(currentsong.duration)}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    // add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = ((e.offsetX / e.target.getBoundingClientRect().width) * 100);
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = (currentsong.duration * percent) / 100;
    });

    // add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // add an event listener to previous and next
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) playMusic(songs[index - 1], currentsong, true);
    });

    next.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1], currentsong); // Directly play the next song
        }
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        // Spacebar to toggle play/pause
        if (e.code === 'Space') {
            if (currentsong.paused) {
                currentsong.play();
                play.src = "images/pause.svg";
            } else {
                currentsong.pause();
                play.src = "images/play.svg";
            }
        }

        // Right Arrow (Next Song)
        if (e.code === 'ArrowRight') {
            let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
            if ((index + 1) < songs.length) {
                playMusic(songs[index + 1], currentsong); // Directly play the next song
            }
        }

        // Left Arrow (Previous Song)
        if (e.code === 'ArrowLeft') {
            let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
            if ((index - 1) >= 0) {
                playMusic(songs[index - 1], currentsong, true); // Directly play the previous song
            }
        }

        // Up Arrow (Volume Up)
        if (e.code === 'ArrowUp') {
            currentsong.volume = Math.min(1, currentsong.volume + 0.1); // Increase volume by 10%
        }

        // Down Arrow (Volume Down)
        if (e.code === 'ArrowDown') {
            currentsong.volume = Math.max(0, currentsong.volume - 0.1); // Decrease volume by 10%
        }
    });

    // Volume control
    let volumeControl = document.getElementById('volumeControl');
    currentsong.volume = 0.5;
    volumeControl.addEventListener('input', function () {
        currentsong.volume = volumeControl.value;
    });
}

	main();
	