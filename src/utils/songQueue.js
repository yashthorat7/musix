const songQueue = {
    songs: [],
    currentIndex: -1,
    playedSongs: [],

    addSongs(songsArray) {
        console.log('Adding songs to queue:', songsArray);
        this.songs = [...songsArray];
        if (this.currentIndex === -1 && this.songs.length > 0) this.currentIndex = 0;
        return this.getVisibleSongs();
    },

    appendSongs(songsArray) {
        if (!Array.isArray(songsArray) || songsArray.length === 0) {
            console.warn('Invalid songs array provided to appendSongs');
            return this.getVisibleSongs();
        }

        console.log('Appending songs to queue. Current queue:', this.songs);
        console.log('New songs to append:', songsArray);

        const newSongs = songsArray.filter(newSong => {
            const isDuplicate = this.songs.some(existingSong => existingSong.path === newSong.path);
            if (isDuplicate) {
                console.log('Skipping duplicate song:', newSong.path);
            }
            return !isDuplicate;
        });

        if (newSongs.length > 0) {
            console.log('Adding new songs to queue:', newSongs);
            this.songs = [...this.songs, ...newSongs];
            if (this.currentIndex === -1 && this.songs.length > 0) {
                console.log('Setting initial currentIndex to 0');
                this.currentIndex = 0;
            }
        }

        console.log('Updated queue:', this.songs);
        console.log('Current index:', this.currentIndex);
        return this.getVisibleSongs();
    },

    removeSong(index) {
        console.log('Removing song at index:', index);
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

        console.log('Queue after removal:', this.songs, 'Current index:', this.currentIndex);
        return this.getVisibleSongs();
    },

    clearQueue() {
        console.log('Clearing queue');
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
        console.log('Current song index:', this.currentIndex, 'Current song:', song);
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
            console.log('Reached end of queue');
            return this.getCurrentSong();
        }

        const currentSong = this.getCurrentSong();
        if (currentSong) {
            this.playedSongs.push(currentSong);
        }

        this.currentIndex++;
        const song = this.songs[this.currentIndex];
        console.log('Next song index:', this.currentIndex, 'Song:', song);
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

        console.log('Previous song index:', this.currentIndex, 'Song:', previousSong);
        return previousSong;
    },

    shuffleQueue() {
        console.log('Shuffling queue');
        if (this.songs.length <= 1) return this.getVisibleSongs();

        const currentSong = this.getCurrentSong();
        const upcomingSongs = this.songs.slice(this.currentIndex + 1);

        for (let i = upcomingSongs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [upcomingSongs[i], upcomingSongs[j]] = [upcomingSongs[j], upcomingSongs[i]];
        }

        this.songs = [...this.songs.slice(0, this.currentIndex + 1), ...upcomingSongs];

        console.log('Queue after shuffle:', this.songs);
        return this.getVisibleSongs();
    },
};

export default songQueue;
