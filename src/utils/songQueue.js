const songQueue = {
  songs: [],
  currentIndex: -1,
  playedSongs: [],

  initializeQueue(songsArray = [], currentIndex = 0) {
    if (!Array.isArray(songsArray)) {
      this.songs = [];
      this.currentIndex = -1;
      this.playedSongs = [];
      return this.getVisibleSongs();
    }

    this.songs = [...songsArray];
    if (this.songs.length === 0) {
      this.currentIndex = -1;
    } else {
      this.currentIndex = Math.max(
        0,
        Math.min(currentIndex, this.songs.length - 1),
      );
    }
    this.playedSongs = [];
    return this.getVisibleSongs();
  },

  addSongs(songsArray) {
    this.songs = Array.isArray(songsArray) ? [...songsArray] : [];
    if (this.currentIndex === -1 && this.songs.length > 0) {
      this.currentIndex = 0;
    }
    return this.getVisibleSongs();
  },

  appendSongs(songsArray) {
    if (!Array.isArray(songsArray) || songsArray.length === 0) {
      return this.getVisibleSongs();
    }

    const newSongs = songsArray.filter(
      (newSong) =>
        !this.songs.some((existingSong) => existingSong.path === newSong.path),
    );

    if (newSongs.length > 0) {
      this.songs = [...this.songs, ...newSongs];
      if (this.currentIndex === -1 && this.songs.length > 0) {
        this.currentIndex = 0;
      }
    }

    return this.getVisibleSongs();
  },

  removeSong(index) {
    if (index < 0 || index >= this.getVisibleSongs().length)
      return this.getVisibleSongs();

    const actualIndex = index + this.currentIndex;
    if (actualIndex >= 0 && actualIndex < this.songs.length) {
      this.songs.splice(actualIndex, 1);
      if (this.songs.length === 0) {
        this.currentIndex = -1;
      } else if (this.currentIndex >= this.songs.length) {
        this.currentIndex = this.songs.length - 1;
      }
    }

    return this.getVisibleSongs();
  },

  clearQueue() {
    this.songs = [];
    this.currentIndex = -1;
    this.playedSongs = [];
    return [];
  },

  getCurrentSong() {
    if (this.currentIndex >= 0 && this.currentIndex < this.songs.length) {
      return this.songs[this.currentIndex];
    }
    return null;
  },

  getCurrentIndex() {
    return this.currentIndex;
  },

  setCurrentIndex(index) {
    if (index >= 0 && index < this.songs.length) {
      this.currentIndex = index;
    }
  },

  getAllSongs() {
    return [...this.songs];
  },

  updateSongMetadata(path, metadataUpdate) {
    if (!path || !metadataUpdate) return false;
    let updated = false;
    this.songs = this.songs.map((song) => {
      if (song.path === path) {
        updated = true;
        return {
          ...song,
          metadata: {
            ...(song.metadata || {}),
            ...metadataUpdate,
          },
        };
      }
      return song;
    });
    return updated;
  },

  getVisibleSongs() {
    if (this.currentIndex < 0 || this.currentIndex >= this.songs.length) {
      return [];
    }
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
    return this.getCurrentSong();
  },

  previousSong() {
    if (this.playedSongs.length > 0) {
      const previousSong = this.playedSongs.pop();
      this.songs.splice(this.currentIndex, 0, previousSong);
      return previousSong;
    }

    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.getCurrentSong();
    }

    return this.getCurrentSong();
  },

  shuffleQueue() {
    if (this.songs.length <= 1) return this.getVisibleSongs();

    const upcomingSongs = this.songs.slice(this.currentIndex + 1);

    for (let i = upcomingSongs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [upcomingSongs[i], upcomingSongs[j]] = [
        upcomingSongs[j],
        upcomingSongs[i],
      ];
    }

    this.songs = [
      ...this.songs.slice(0, this.currentIndex + 1),
      ...upcomingSongs,
    ];
    return this.getVisibleSongs();
  },
};

export default songQueue;
