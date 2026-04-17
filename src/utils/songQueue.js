const songQueue = {
    songs: [],
    currentIndex: -1,
    playedSongs: [],

    addSongs(songsArray) {
        this.songs = [...songsArray];
        if (this.currentIndex === -1 && this.songs.length > 0) this.currentIndex = 0;
        return this.getVisibleSongs();
    },

    appendSongs(songsArray) {
        if (!Array.isArray(songsArray) || songsArray.length === 0) {
            return this.getVisibleSongs();
        }

        const newSongs = songsArray.filter(newSong => {
            return !this.songs.some(existingSong => existingSong.path === newSong.path);
        });

        if (newSongs.length > 0) {
            this.songs = [...this.songs, ...newSongs];
            if (this.currentIndex === -1 && this.songs.length > 0) {
                this.currentIndex = 0;
            }
        }

        return this.getVisibleSongs();
    },

    removeSong(index) {
        if (index < 0 || index >= this.songs.length) return false;

        const actualIndex = index + this.currentIndex;

        if (actualIndex === this.currentIndex) {
            this.songs.splice(actualIndex, 1);
            if (this.songs.length === 0) {
                this.currentIndex = -1;
            }
        } else {
            this.songs.splice(actualIndex, 1);
        }

        return this.getVisibleSongs();
    },

    clearQueue() {
        const currentSong = this.getCurrentSong();
        this.playedSongs = currentSong ? [currentSong] : [];
        this.songs = [];
        this.currentIndex = -1;
        return this.getVisibleSongs();
    },

    getCurrentSong() {
        const song =
            this.currentIndex >= 0 && this.currentIndex < this.songs.length
                ? this.songs[this.currentIndex]
                : null;
        return song;
    },

    getVisibleSongs() {
        return this.songs.slice(this.currentIndex);
    },

    getQueue() {
        return this.getVisibleSongs();
    },

    nextSong() {
        if (this.songs.length === 0) return null;

        if (this.currentIndex >= this.songs.length - 1) {
            return this.getCurrentSong();
        }

        const currentSong = this.getCurrentSong();
        if (currentSong) {
            this.playedSongs.push(currentSong);
        }

        this.currentIndex++;
        const song = this.songs[this.currentIndex];
        return song;
    },

    previousSong() {
        if (this.playedSongs.length === 0) {
            if (this.currentIndex > 0) {
                this.currentIndex = 0;
            }
            return this.getCurrentSong();
        }

        const previousSong = this.playedSongs.pop();
        this.songs.splice(this.currentIndex, 0, previousSong);

        return previousSong;
    },

    shuffleQueue() {
        if (this.songs.length <= 1) return this.getVisibleSongs();

        const currentSong = this.getCurrentSong();
        const upcomingSongs = this.songs.slice(this.currentIndex + 1);

        for (let i = upcomingSongs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [upcomingSongs[i], upcomingSongs[j]] = [upcomingSongs[j], upcomingSongs[i]];
        }

        this.songs = [...this.songs.slice(0, this.currentIndex + 1), ...upcomingSongs];

        return this.getVisibleSongs();
    },
};

export default songQueue;
