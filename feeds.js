const tabs = document.querySelectorAll('.tab')
const posts = document.querySelectorAll('.post')
const select = document.querySelector('select[name="changechannel"]')
let selectedChannel = 'All'

select.addEventListener('change', () => {
  selectedChannel = select.value
  posts.forEach((post) => {
    const channel = post.getAttribute('data-channel')
    if (selectedChannel === 'All' || channel === selectedChannel) {
      post.style.display = 'block'
    } else {
      post.style.display = 'none'
    }
  })
  tabs.forEach((tab) => {
    tab.classList.remove('active')
    select.classList.add('selected')
  })
})

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((tab) => {
      tab.classList.remove('active')
    })
    tab.classList.add('active')
    const filter = tab.textContent.trim()
    posts.forEach((post) => {
      const audio = parseInt(post.getAttribute('data-audio'))
      const channel = post.getAttribute('data-channel')
      if (
        filter === 'All' ||
        (filter === 'Posts' && audio === 0) ||
        (filter === 'Podcasts' && audio === 1)
      ) {
        post.style.display = 'block'
      } else {
        post.style.display = 'none'
      }
    })

    select.value = 'All'
    select.classList.remove('selected')
  })
})

document.addEventListener('DOMContentLoaded', function () {
  const btns = document.querySelectorAll('.audio button[data-aid]')
  let caudio = null
  let ppBtn = null
  const fpBtn = document.querySelector('#floating_player #playpausebutton')
  const tl = document.querySelector('#timeline')
  const fsb = document.querySelector('#seekbar')

  fpBtn.addEventListener('click', function () {
    togglePP()
  })

  function togglePP() {
    if (caudio && caudio.paused) {
      caudio.play()
    } else if (caudio) {
      caudio.pause()
    }
  }

  tl.addEventListener('input', function (e) {
    const seekPercentage = fsb.value
    const seekTime = (seekPercentage / 100) * caudio.duration
    caudio.currentTime = seekTime
  })

  const speeds = [1, 1.2, 1.5, 1.75, 2]
  let currentSpeedIndex = 0
  document.getElementById('speed').addEventListener('click', () => {
    currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length
    const speed = speeds[currentSpeedIndex]
    caudio.playbackRate = speed
    document.getElementById('speed').innerText = speed + 'x'
    updatePositionState()
  })
  document.getElementById('plus30').addEventListener('click', () => {
    caudio.currentTime += 30
  })

  function updateAudioTime() {
    const currentTime = caudio.currentTime
    const formattedCurrentTime = formatTime(currentTime)
    const formattedDuration = formatTime(caudio.duration)

    document.getElementById('current_time').textContent = formattedCurrentTime
    document.getElementById('duration').textContent = formattedDuration
    const progress = (currentTime / caudio.duration) * 100
    fsb.value = progress
  }

  function playTime() {
    navigator.mediaSession.playbackState = 'playing'
    fpBtn.classList.toggle('playing')
    ppBtn.classList.toggle('playing')
    updatePositionState()
  }

  function pauseTime() {
    navigator.mediaSession.playbackState = 'paused'
    fpBtn.classList.toggle('playing')
    ppBtn.classList.toggle('playing')
    updatePositionState()
  }

  function formatTime(time) {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2)
  }

  btns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const aid = this.getAttribute('data-aid')
      const audioElem = document.querySelector('audio[aid="' + aid + '"]')
      changePlayback(audioElem)
    })
  })

  function changePlayback(audioElem) {
    const prevPPBtn = ppBtn
    ppBtn = document.querySelector('[data-aid="' + audioElem.getAttribute('aid') + '"]')
    const src = audioElem.getAttribute('src')

    if (caudio && caudio !== audioElem) {
      caudio.pause()
      caudio.removeEventListener('timeupdate', updateAudioTime)
      caudio.removeEventListener('play', playTime)
      caudio.removeEventListener('pause', pauseTime)

      prevPPBtn.classList.remove('playing')
      fpBtn.classList.remove('playing')
      fsb.value = '0'

      if (audioElem.readyState >= 1) {
        startPlayback(audioElem)
      } else {
        audioElem.addEventListener('loadedmetadata', function () {
          startPlayback(audioElem)
        })
      }
    } else if (caudio) {
      togglePP()
    } else {
      if (audioElem.readyState >= 1) {
        startPlayback(audioElem)
      } else {
        audioElem.addEventListener('loadedmetadata', function () {
          startPlayback(audioElem)
        })
      }
    }
  }

  function updatePositionState() {
    navigator.mediaSession.setPositionState({
      duration: caudio.duration,
      playbackRate: caudio.playbackRate,
      position: caudio.currentTime,
    })
  }

  function startPlayback(audioElem) {
    const fp = document.querySelector('#floating_player')
    const closestPost = audioElem.closest('.post')
    document.querySelectorAll('.post.nowplaying').forEach((e) => e.classList.remove('nowplaying'))
    closestPost.classList.add('nowplaying')
    const h2text = closestPost.querySelector('h2').textContent
    document.getElementById('title').innerHTML = h2text
    caudio = audioElem
    caudio.addEventListener('timeupdate', updateAudioTime)
    caudio.addEventListener('play', playTime)
    caudio.addEventListener('pause', pauseTime)
    const audioDur = caudio.duration
    const formattedDur = formatTime(audioDur)
    document.getElementById('duration').textContent = formattedDur
    fp.style.display = 'block'
    setTimeout(function () {
      fp.classList.add('show')
    }, 10)
    caudio.play()

    document.getElementById('speed').innerText = caudio.playbackRate + 'x'
    const mediaAlbumArt =
      'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?url=' +
      encodeURIComponent(closestPost.querySelector('img').src) +
      '&container=focus'
    navigator.mediaSession.metadata = new MediaMetadata({
      title: h2text,
      artist: closestPost.querySelector('.channel').textContent,
      album: 'rssTea',
      artwork: [
        {
          src: mediaAlbumArt + '&resize_w=128&resize_h=128',
          sizes: '128x128',
          type: 'image/png',
        },
        {
          src: mediaAlbumArt + '&resize_w=96&resize_h=96',
          sizes: '96x96',
          type: 'image/png',
        },
        {
          src: mediaAlbumArt + '&resize_w=192&resize_h=192',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: closestPost.querySelector('img').src,
        },
      ],
    })

    const totalAids = document.querySelectorAll('[data-aid]').length
    let nextAid = Math.floor(audioElem.getAttribute('aid')) + 1
    let prevAid = Math.floor(audioElem.getAttribute('aid')) - 1
    if (nextAid > totalAids - 1) {
      nextAid = 0
    }
    if (prevAid < 0) {
      prevAid = totalAids - 1
    }

    navigator.mediaSession.setActionHandler('play', () => {
      caudio.play()
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      caudio.pause()
    })
    // navigator.mediaSession.setActionHandler('seekto', (details) => {
    //   console.log(details)
    //   if (details.fastSeek && caudio) {
    //     const newTime = details.seekTime || 0
    //     caudio.currentTime = newTime
    //   } else if (caudio) {
    //     const currentTime = caudio.currentTime || 0
    //     const seekTime = details.seekTime || 0
    //     caudio.currentTime = currentTime + seekTime
    //   }
    // })
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      changePlayback(document.querySelector('[aid="' + nextAid + '"]'))
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      changePlayback(document.querySelector('[aid="' + prevAid + '"]'))
    })
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      caudio.currentTime = caudio.currentTime - (details.seekOffset || 10)
      updatePositionState()
    })
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      caudio.currentTime = caudio.currentTime + (details.seekOffset || 10)
      updatePositionState()
    })
  }
})

const deviceWidth = screen.width
const deviceHeight = screen.height
const pixelRatio = window.devicePixelRatio || 1

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

canvas.width = deviceWidth * pixelRatio
canvas.height = deviceHeight * pixelRatio

ctx.fillStyle = 'white'
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  ctx.fillStyle = 'black'
}

ctx.fillRect(0, 0, canvas.width, canvas.height)
const iconImage = new Image()
iconImage.src = 'apple-touch-icon.png'

iconImage.onload = function () {
  const x = (canvas.width - iconImage.width) / 2
  const y = (canvas.height - iconImage.height) / 2

  ctx.drawImage(iconImage, x, y)

  const imageDataURL = canvas.toDataURL('image/png')

  const appleTouchStartupImageLink = document.createElement('link')
  appleTouchStartupImageLink.setAttribute('rel', 'apple-touch-startup-image')
  appleTouchStartupImageLink.setAttribute('href', imageDataURL)
  document.head.appendChild(appleTouchStartupImageLink)
}
