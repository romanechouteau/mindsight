export default function initMenu(cb: Function) {
    let popup, token
    const spotifyButton = document.querySelector('#grant-spotify'), subtitlesButton = document.querySelector('#toggle-subtitles')
    spotifyButton.addEventListener('click', () => {
        let scopes = encodeURIComponent("streaming user-read-email user-read-private")
        popup = window.open(
            `https://accounts.spotify.com/authorize?client_id=${'fbaee31da10a4d8188d31f883f05c100'}&response_type=token&redirect_uri=${'http://localhost:8080'}&scope=${scopes}&show_dialog=true`,
            'Login with Spotify',
            'width=800,height=600'
        )

        // @ts-ignore
        window.spotifyCallback = (token: string) => {
            cb(token)
            popup.close()
          }
    })

    token = window.location.hash.substr(1).split('&')[0].split("=")[1]
    
    if (token) {
        // @ts-ignore
        window.opener.spotifyCallback(token)
    }
}