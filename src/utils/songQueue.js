const songQueue = {
    songs: [],
    currentIndex: -1,

    addSongs(songsArray) {
        console.log('Adding songs to queue:', songsArray);
        this.songs = [...songsArray];
        if (this.currentIndex === -1 && this.songs.length > 0) this.currentIndex = 0;
        return this.songs;
    },

    appendSongs(songsArray) {
        console.log('Appending songs to queue:', songsArray);
        this.songs = [...this.songs, ...songsArray];
        if (this.currentIndex === -1 && this.songs.length > 0) this.currentIndex = 0;
        return this.songs;
    },

    removeSong(index) {
        console.log('Removing song at index:', index);
        if (index < 0 || index >= this.songs.length) return false;

        if (this.currentIndex > index) this.currentIndex--;
        else if (this.currentIndex === index && index === this.songs.length - 1) {
            this.currentIndex = this.songs.length > 1 ? 0 : -1;
        }

        this.songs.splice(index, 1);
        if (this.songs.length === 0) this.currentIndex = -1;

        console.log('Queue after removal:', this.songs, 'Current index:', this.currentIndex);
        return true;
    },

    clearQueue() {
        console.log('Clearing queue');
        this.songs = [];
        this.currentIndex = -1;
        return true;
    },

    getCurrentSong() {
        const song =
            this.currentIndex >= 0 && this.currentIndex < this.songs.length
                ? this.songs[this.currentIndex]
                : null;
        console.log('Current song index:', this.currentIndex, 'Current song:', song);
        return song;
    },

    getQueue() {
        return this.songs;
    },

    nextSong() {
        if (this.songs.length === 0) return null;

        if (this.currentIndex >= this.songs.length - 1) {
            console.log('Reached end of queue');
            return this.getCurrentSong();
        }

        this.currentIndex++;
        const song = this.songs[this.currentIndex];
        console.log('Next song index:', this.currentIndex, 'Song:', song);
        return song;
    },

    previousSong() {
        if (this.songs.length === 0) return null;

        if (this.currentIndex <= 0) this.currentIndex = 0;
        else this.currentIndex--;

        const song = this.songs[this.currentIndex];
        console.log('Previous song index:', this.currentIndex, 'Song:', song);
        return song;
    },

    shuffleQueue() {
        console.log('Shuffling queue');
        if (this.songs.length <= 1) return this.songs;

        const currentSong = this.getCurrentSong();

        for (let i = this.songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.songs[i], this.songs[j]] = [this.songs[j], this.songs[i]];
        }

        if (currentSong) {
            const newIndex = this.songs.findIndex((song) => song.path === currentSong.path);
            this.currentIndex = newIndex !== -1 ? newIndex : 0;
        }

        console.log('Queue after shuffle:', this.songs);
        return this.songs;
    },
};

export default songQueue;
