const ARTWORKS = [
  {
    src: '/assets/avif/hero-art-01.avif',
    alt: '1950s-style illustration of a Black nonbinary maker in a retro kitchen holding reusable UI component recipe cards.',
  },
  {
    src: '/assets/avif/hero-art-02.avif',
    alt: '1950s-style illustration of a South Asian man reviewing UI component recipe cards in a retro kitchen workshop.',
  },
  {
    src: '/assets/avif/hero-art-03.avif',
    alt: '1950s-style illustration of an East Asian woman arranging reusable UI component cards beside pastries in a retro kitchen workshop.',
  },
  {
    src: '/assets/avif/hero-art-04.avif',
    alt: '1950s-style illustration of a Latino man arranging reusable UI component recipe cards beside cookies in a retro kitchen workshop.',
  },
  {
    src: '/assets/avif/hero-art-05.avif',
    alt: '1950s-style illustration of a Middle Eastern woman checking UI component recipe cards beside pastries in a retro kitchen workshop.',
  },
  {
    src: '/assets/avif/hero-art-06.avif',
    alt: '1950s-style illustration of an older white man reviewing UI component recipe cards beside pastries in a retro kitchen workshop.',
  },
  {
    src: '/assets/avif/hero-art-07.avif',
    alt: '1950s-style illustration of a friendly appliance-like robot baker holding cookies and reusable UI component recipe cards in a retro kitchen workshop.',
  },
  {
    src: '/assets/avif/hero-art-08.avif',
    alt: '1950s-style illustration of a slender atomic-age robot assistant arranging UI component blueprints and mixing batter in a retro kitchen laboratory.',
  },
  {
    src: '/assets/avif/hero-art-09.avif',
    alt: '1950s-style illustration of a boxy riveted retro robot baker holding pastries and UI component recipe cards in a vintage kitchen workshop.',
  },
  {
    src: '/assets/avif/hero-art-10.avif',
    alt: '1950s-style illustration of a friendly teal alien blob baker holding pastries and UI component recipe cards in a retro kitchen workshop.',
  },
]

const SEQUENCE_KEY = 'timeless-50s-art-sequence-v1'
const LAST_KEY = 'timeless-50s-last-art-v1'
const ROTATION_INTERVAL = 7200

function shuffle(values: number[]): number[] {
  const out = [...values]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function readSequence() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEQUENCE_KEY) || '[]')
    if (Array.isArray(parsed) && parsed.every((value) => Number.isInteger(value))) {
      return parsed.filter((value) => value >= 0 && value < ARTWORKS.length)
    }
  } catch {
    return []
  }
  return []
}

function writeSequence(sequence: number[], selected: number): void {
  try {
    window.localStorage.setItem(SEQUENCE_KEY, JSON.stringify(sequence))
    window.localStorage.setItem(LAST_KEY, String(selected))
  } catch {
    return
  }
}

function getLastSelected() {
  try {
    const last = Number(window.localStorage.getItem(LAST_KEY))
    return Number.isInteger(last) ? last : -1
  } catch {
    return -1
  }
}

function nextArtworkIndex() {
  const allIndexes = ARTWORKS.map((_, index) => index)
  const lastSelected = getLastSelected()
  let sequence = readSequence()

  if (sequence.length === 0) {
    sequence = shuffle(allIndexes)
  }

  if (sequence[0] === lastSelected && sequence.length > 1) {
    const swapIndex = sequence.findIndex((value) => value !== lastSelected)
    ;[sequence[0], sequence[swapIndex]] = [sequence[swapIndex], sequence[0]]
  }

  const selected = sequence.shift() ?? Math.floor(Math.random() * ARTWORKS.length)
  writeSequence(sequence, selected)
  return selected
}

function createArtworkLayer(index: number, isActive = false): HTMLImageElement {
  const artwork = ARTWORKS[index]
  const image = new Image()
  image.className = isActive ? 'hero__art-image is-active' : 'hero__art-image'
  image.src = artwork.src
  image.alt = ''
  image.decoding = 'async'
  image.loading = 'eager'
  image.setAttribute('aria-hidden', 'true')
  image.dataset.artworkIndex = String(index)
  return image
}

function waitForImage(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve()
  return new Promise((resolve) => {
    image.addEventListener('load', () => resolve(), { once: true })
    image.addEventListener('error', () => resolve(), { once: true })
  })
}

function preserveScrollPosition(callback: () => void): void {
  const x = window.scrollX
  const y = window.scrollY
  const previousScrollBehavior = document.documentElement.style.scrollBehavior

  callback()

  if (window.scrollX !== x || window.scrollY !== y) {
    document.documentElement.style.scrollBehavior = 'auto'
    window.scrollTo(x, y)
    document.documentElement.style.scrollBehavior = previousScrollBehavior
  }
}

async function showArtwork(
  stage: HTMLElement,
  index: number,
  currentImage?: HTMLImageElement,
): Promise<HTMLImageElement> {
  const nextImage = createArtworkLayer(index)
  preserveScrollPosition(() => {
    stage.append(nextImage)
  })

  await waitForImage(nextImage)

  preserveScrollPosition(() => {
    nextImage.classList.add('is-active')
    currentImage?.classList.remove('is-active')
  })

  const artwork = ARTWORKS[index]
  stage.setAttribute('aria-label', artwork.alt)
  document.documentElement.dataset.artwork = String(index + 1)

  window.setTimeout(() => {
    preserveScrollPosition(() => {
      currentImage?.remove()
    })
  }, 1400)

  return nextImage
}

const stage = document.getElementById('hero-artwork')
if (stage instanceof HTMLElement) {
  let currentImage: HTMLImageElement | undefined

  showArtwork(stage, nextArtworkIndex()).then((image) => {
    currentImage = image

    window.setInterval(() => {
      showArtwork(stage, nextArtworkIndex(), currentImage).then((nextImage) => {
        currentImage = nextImage
      })
    }, ROTATION_INTERVAL)
  })
}
