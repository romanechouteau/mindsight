// import { render } from 'pug';
import { htmlUtils } from '../../Tools/utils'
import template from '../../../templates/spotify.template'

export default class SpotifyManager {

    searchTracks: {name: string; uri: string; artists: any[]}[]
    deviceId: string
    player: string
    accessToken: string
    domElements: {
        player: HTMLElement
    }

    constructor() {
        this.setHUD()
        console.log(template);
    }

    // auth () {
    //     fetch('https://accounts.spotify.com/login/password')
    //     https://accounts.spotify.com/en/authorize?response_type=token&client_id=adaaf209fb064dfab873a71817029e0d&redirect_uri=https:%2F%2Fdeveloper.spotify.com%2Fdocumentation%2Fweb-playback-sdk%2Fquick-start%2F&scope=streaming%20user-read-email%20user-modify-playback-state%20user-read-private&show_dialog=true
    // }

    setListeners (player) {
        // Error handling
        player.addListener('initialization_error', ({ message }) => { console.error(message); });
        player.addListener('authentication_error', ({ message }) => { console.error(message); });
        player.addListener('account_error', ({ message }) => { console.error(message); });
        player.addListener('playback_error', ({ message }) => { console.error(message); });
        // Playback status updates
        player.addListener('player_state_changed', state => { 
            // console.log(state.paused);
            // console.log(state.paused);
            if (state.paused === false && state.track_window?.current_track) {
                this.domElements.player.innerText = `Currently Playing : ${state.track_window.current_track.name} - ${state.track_window.current_track.artists[0].name}`
            } else {
                this.domElements.player.innerText = ''
            }
            console.log(state);
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

    setHUD() {
        htmlUtils.addToDOM(template)
        this.registerDomNodes()
        window.onSpotifyWebPlaybackSDKReady = () => {
            const token = 'BQCi51p3g0pBQ9Wmw74-icp0oalSqIwvevbDUOBdzjVqa1eiWHgmDcrpguUjIJdUglFg5noRMNfqsyWmuOkMjbVFF_7tbImVFSbcpmPHecTLQ-1BQqgYRIAFyJa7nztNzzsVav2ftutxcivuiLxCgRWXmocrMlUtBYcT8OefJGONoudOTuyx8p4';
            const player = new Spotify.Player({
                name: 'Web Playback SDK Quick Start Player',
                getOAuthToken: cb => { cb(token); }
            });
            this.setListeners(player);
            // Connect to the player!
            player.connect().then(success => {

                if (success) {
                    console.log('The Web Playback SDK successfully connected to Spotify!');
                }

            })
            document.querySelector('input').addEventListener('keyup', el => {
                fetch(`https://api.spotify.com/v1/search?q=${el.target.value}&type=track`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.accessToken}`
                    },
                })
                    .then(res => res.json())
                    .then(res => {
                        console.log(res);
                        this.searchTracks = []
                        for (const track of res.tracks.items) {
                            this.searchTracks.push(track)
                        }
                        this.renderTrackList()
                    });
            })
        };
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
            $track.addEventListener('click', ev => {
                this.handleSetTrack(ev.target.dataset.uri)
                this.resetSearch()
                this.registerMusicMood(track)
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

        };
        play({
            spotify_uri: uri,
        });
    }

    registerMusicMood(track: Spotify.Track) {
        const [artistName, trackName] = [track.artists[0].name.replace(' ', '-'), track.name.replace(' ', '-')];
        const parser = new DOMParser()
        fetch(`https://genius.com/${artistName}-${trackName}-lyrics`)
            .then(res => res.text())
            .then(html => {
                const doc = parser.parseFromString(html, 'text/html');
                const lyrics = (doc.querySelector('.lyrics p') as HTMLElement).innerText;
            })
    }
}