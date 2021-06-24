// @ts-ignore
import store from '@store/index'

export default class SpotifyManager {

    searchTracks: {name: string; uri: string; id: string; artists: any[]}[]
    deviceId: string
    // @ts-ignore
    player: Spotify.Player
    accessToken: string
    domElements: {
        player: HTMLElement
    }
    playTracker: number

    constructor() {
        this.setHUD()
    }

    setListeners (player) {
        // Error handling
        player.addListener('initialization_error', ({ message }) => { console.error(message); });
        player.addListener('authentication_error', ({ message }) => { console.error(message); });
        player.addListener('account_error', ({ message }) => { console.error(message); });
        player.addListener('playback_error', ({ message }) => { console.error(message); });
        // Playback status updates
        player.addListener('player_state_changed', state => {
            if (state.paused === false && state.track_window?.current_track) {
                this.domElements.player.innerText = `Currently Playing : ${state.track_window.current_track.name} - ${state.track_window.current_track.artists[0].name}`
            } else {
                this.domElements.player.innerText = ''
            }
         });
        // Ready
        player.addListener('ready', ({ device_id }) => {
            console.log('device has gone online', device_id);
            this.searchTracks = [];
            this.deviceId = device_id;
            this.player = player;
            player._options.getOAuthToken(access_token => this.accessToken = access_token)
        });
        // Not Ready
        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
        });
    }

    registerDomNodes() {
        this.domElements = {player: document.querySelector('.player')}
    }

    async getToken(): Promise<string> {
        // see https://www.notion.so/aymericarn/API-6cf45e2e89b84034b7c8034863ea690d
        const res = await fetch('https://notion-api.splitbee.io/v1/page/6cf45e2e89b84034b7c8034863ea690d')
        const json = await res.json();
        const token = json[Object.keys(json)[1]].value.properties.title[0][0]
        return token
    }

    addScript() {
        const script = document.createElement('script');
        script.setAttribute('src','https://sdk.scdn.co/spotify-player.js');
        document.body.appendChild(script);
    }

    setHUD() {
        this.registerDomNodes()
        this.addScript()
        window.onSpotifyWebPlaybackSDKReady = async () => {
            const token = await this.getToken()
            const player = new Spotify.Player({
                name: 'Web Playback SDK Quick Start Player',
                getOAuthToken: cb => { cb(token); }
            });
            this.setListeners(player);
            // Connect to the player!
            player.connect().then(success => {
                if (success) console.log('The Web Playback SDK successfully connected to Spotify!');
            })
        };
    }

    handleSearch(value) {
        if (!value.length) return this.resetSearch()
        fetch(`https://api.spotify.com/v1/search?q=${value}&type=track`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`
            },
        })
            .then(res => res.json())
            .then(res => {
                this.searchTracks = []
                for (let i = 0; i < 4; i++) {
                    if (res.tracks && res.tracks.items[i]) {
                        this.searchTracks.push(res.tracks.items[i])
                    }
                }
                this.renderTrackList()
            });
    }

    resetSearch() {
        document.querySelector('input').value = ''
        this.searchTracks = []
        this.renderTrackList()
    }

    // todo: extract attaching event listeners
    renderTrackList() {
        document.querySelector('.results').innerHTML = ''
        this.searchTracks.forEach(track => {
            const $track = document.createElement('p')
            $track.textContent = track.name + ' - ' + track.artists[0].name
            $track.dataset.uri = track.uri
            $track.dataset.id = track.id
            $track.addEventListener('click', ev => {
                // @ts-ignore
                this.handleSetTrack(ev.target.dataset.uri)
                this.resetSearch()
                // @ts-ignore
                this.registerMusicMood(track)
                // @ts-ignore
                this.setParticlesMovement(ev.target.dataset.id)
            })
            document.querySelector('.results').appendChild($track)
        })
    }

    handleSetTrack(uri: string) {
        const play = ({
            spotify_uri,
        }) => {
            fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
                method: 'PUT',
                body: JSON.stringify({ uris: [spotify_uri] }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
            })
            .then(res => res.json().then(json => console.log(json)))
            // repeat track
            fetch(`https://api.spotify.com/v1/me/player/repeat?device_id=${this.deviceId}&state=track`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
            })
            .then(res => res.json().then(json => console.log(json)))
        };
        play({
            spotify_uri: uri,
        });
    }

    registerMusicMood(track: Spotify.Track) {
        const [artistName, trackName] = [track.artists[0].name.replace(' ', '-'), track.name.replace(' ', '-')];
        const parser = new DOMParser()
        fetch(`https://mindsight-cors.herokuapp.com/https://genius.com/${artistName}-${trackName}-lyrics`, { headers: { 'X-Requested-With': 'XMLHTTPRequest' } })
            .then(res => res.text())
            .then(html => {
                const doc = parser.parseFromString(html, 'text/html');
                const lyrics = (doc.querySelector('.lyrics p') as HTMLElement).innerText;
            })
    }

    async setParticlesMovement(trackId: string) {
        const res = await fetch(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`
            },
        })
        const meta = await res.json()
        this.playTracker = window.setInterval(async() => {
            if (this.player.paused) return
            const { position } = await this.player.getCurrentState()
            let iterator = 0
            while (position/1000 > meta.sections[iterator].start) {
                iterator++
            }
            if (store.state.spotifyAudioData.sectionIndex === iterator) return
            const { tempo, loudness } = meta.sections[iterator]
            const offset = meta.beats[0].start
            store.dispatch('setSpotifyAudioData', { tempo, loudness, iterator, sectionIndex: iterator, offset })
        }, 1000)
    }
}