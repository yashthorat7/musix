const songQueue = {
  songs: [],
  currentIndex: -1,

  initializeQueue(songsArray = [], currentIndex = 0) {
    if (!Array.isArray(songsArray)) {
      this.songs = [];
      this.currentIndex = -1;
      return [];
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
    return this.getAllSongs();
  },

  addSongs(songsArray) {
    this.songs = Array.isArray(songsArray) ? [...songsArray] : [];
    if (this.currentIndex === -1 && this.songs.length > 0) {
      this.currentIndex = 0;
    }
    return this.getAllSongs();
  },

  appendSongs(songsArray) {
    if (!Array.isArray(songsArray) || songsArray.length === 0) {
      return this.getAllSongs();
    }

    const newSongs = songsArray.filter(
      (newSong) =>
        newSong &&
        newSong.path &&
        !this.songs.some((existingSong) => existingSong.path === newSong.path),
    );

    if (newSongs.length > 0) {
      this.songs = [...this.songs, ...newSongs];
      if (this.currentIndex === -1 && this.songs.length > 0) {
        this.currentIndex = 0;
      }
    }

    return this.getAllSongs();
  },

  removeSong(index) {
    if (index < 0 || index >= this.songs.length) {
      return this.getAllSongs();
    }

    this.songs.splice(index, 1);

    if (this.songs.length === 0) {
      this.currentIndex = -1;
    } else if (index < this.currentIndex) {
      this.currentIndex--;
    } else if (index === this.currentIndex) {
      if (this.currentIndex >= this.songs.length) {
        this.currentIndex = this.songs.length - 1;
      }
    }

    return this.getAllSongs();
  },

  reorderSongs(fromIndex, toIndex) {
    if (
      fromIndex < 0 ||
      fromIndex >= this.songs.length ||
      toIndex < 0 ||
      toIndex >= this.songs.length ||
      fromIndex === toIndex
    ) {
      return this.getAllSongs();
    }

    const currentSong = this.getCurrentSong();
    const [moved] = this.songs.splice(fromIndex, 1);
    this.songs.splice(toIndex, 0, moved);

    if (currentSong) {
      const newCurrentIndex = this.songs.findIndex(
        (s) =>
          s === currentSong ||
          (s.path && currentSong.path && s.path === currentSong.path),
      );
      if (newCurrentIndex !== -1) {
        this.currentIndex = newCurrentIndex;
      }
    }

    return this.getAllSongs();
  },

  clearQueue() {
    this.songs = [];
    this.currentIndex = -1;
    return [];
  },

  getCurrentSong() {
    if (this.currentIndex >= 0 && this.currentIndex < this.songs.length) {
      return this.songs[this.currentIndex];
    }
    return null;
  },

  getSongAtIndex(index) {
    if (index >= 0 && index < this.songs.length) {
      return this.songs[index];
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

  getQueue() {
    return this.getAllSongs();
  },

  getVisibleSongs() {
    return this.getAllSongs();
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

  nextSong() {
    if (this.songs.length === 0) return null;

    if (this.currentIndex < this.songs.length - 1) {
      this.currentIndex++;
      return this.getCurrentSong();
    }

    return null;
  },

  previousSong() {
    if (this.songs.length === 0) return null;

    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.songs.length - 1;
    }

    return this.getCurrentSong();
  },

  shuffleQueue() {
    if (this.songs.length <= 1) return this.getAllSongs();

    const currentSong = this.getCurrentSong();
    const remaining = this.songs.filter((_, idx) => idx !== this.currentIndex);

    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }

    this.songs = currentSong ? [currentSong, ...remaining] : remaining;
    this.currentIndex = currentSong ? 0 : -1;
    return this.getAllSongs();
  },
};

export default songQueue;
