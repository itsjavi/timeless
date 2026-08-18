const NOT_FOUND_SUBJECTS = [
  'Cupcake',
  'Muffin',
  'Pastry',
  'Recipe',
  'Toast',
  'Doughnut',
  'Peeler',
  'Mixing Bowl',
  'Brownie',
  'Batter',
  'Pancake',
  'Sticky slime',
  'Humans',
]

const NOT_FOUND_SENTENCES = [
  'The frosting filed a redirect and left no forwarding address.',
  'This URL went through the salad spinner and came out as confetti.',
  'We opened the tin and found only a very judgmental semicolon.',
  'The page is at a potluck under the name undefined.',
  '404: The layout is stable, but the content is emotionally unavailable.',
  'This route was last seen arguing with a lamp about semantic HTML.',
  'It exists in theory, next to the clean measuring spoon nobody can find.',
  'We asked the server for crumbs. It returned headers and a legal disclaimer.',
  'A casserole has more route information than this link.',
  'The missing asset left a note: gone to become a design token.',
  'A robot tried to debug it with a whisk. The whisk opened six tabs and resigned.',
  'The robot measured the URL in teaspoons and rounded down to absolutely not.',
  'A robot used a rolling pin as a keyboard. It typed a perfect rectangle and zero valid URLs.',
  'The robot opened DevTools on the blender and marked the route as a firmware concern.',
  'A robot tried to npm install the page. The oven is now asking for sudo.',
  'The robot fixed the link with a torque wrench. It is now 404 pixels to the left.',
  'A robot scanned the address with a label maker and renamed the whole site "Tuesday".',
  'The robot tried to hydrate the route with club soda. Refreshing, but still missing.',
  'A robot put the URL in the dishwasher to remove bugs. It removed the route.',
  'The robot brought a soldering iron to a CSS problem. The stylesheet wisely left.',
  'The alien mistook the URL for a tiny moon and assigned it a suspicious orbit.',
  'The alien translated "404" as "boil the navigation until polite".',
  'The alien saw breadcrumbs and followed them directly into /undefined.',
  'An alien asked if the page was responsive. It responded by vanishing.',
  'The alien filed the route under "round Earth snacks and forbidden CSS".',
  'The alien tried to pay for access with three buttons and a warm design token.',
  'The alien confused the back button with a ceremonial gong and dismissed the entire page.',
  'The alien inspected the markup, whispered "semantic enough", and teleported the DOM.',
  'The route left during standup and only updated the ticket with "vibes".',
  'The page is in a meeting called Final Final v3, and nobody has the invite.',
  'A bundler looked at the asset and decided it was tree-shakable.',
  'CSS found the content, but JavaScript is still waiting for hydration.',
  'The page is visually hidden, emotionally visible, and technically not here.',
  'We put the route in a card. The card immediately requested time off.',
  'The URL took the scenic path through cache invalidation and forgot why it left.',
  'The database returned one row: "lol no".',
  'The page was last deployed to a napkin with excellent uptime.',
  'Someone said "quick polish" near the navbar, and it entered witness protection.',
  'The link passed QA by hiding behind a modal nobody can close.',
  'The asset is cached in a place even the cache refuses to document.',
  'The router saw the address, whispered "interesting", and walked into a wall.',
  'The server made eye contact with the request and pretended to be a printer.',
  'The URL joined a monorepo and has not been heard from since.',
  'The build completed successfully, which is how we know the page escaped earlier.',
  'The link brought a map, ignored it, and invented a cul-de-sac.',
  'The font loaded. The content did not. Classic.',
  'The redirect chain formed a conga line and left the building.',
  'The sitemap insists this page is fictional but well-dressed.',
  'The CDN says it saw the asset yesterday wearing sunglasses.',
  'The browser asked politely. The server replied with interpretive silence.',
]

const NOT_FOUND_ARTWORKS = [
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

const title = document.querySelector('[data-not-found-title]')
const sentence = document.querySelector('[data-not-found-sentence]')
const reroll = document.querySelector('[data-not-found-reroll]')
const artwork = document.querySelector('[data-not-found-art]')
const artworkImage = document.querySelector('[data-not-found-art-image]')

let currentSubjectIndex = -1
let currentSentenceIndex = -1

function randomIndex(length: number, currentIndex = -1): number {
  if (length < 2) return 0

  let nextIndex = currentIndex
  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * length)
  }
  return nextIndex
}

function showRandomNotFound() {
  currentSubjectIndex = randomIndex(NOT_FOUND_SUBJECTS.length, currentSubjectIndex)
  currentSentenceIndex = randomIndex(NOT_FOUND_SENTENCES.length, currentSentenceIndex)

  const subject = NOT_FOUND_SUBJECTS[currentSubjectIndex]

  if (title instanceof HTMLElement) {
    title.textContent = `${subject} not found`
  }

  if (!(sentence instanceof HTMLElement)) return

  sentence.textContent = NOT_FOUND_SENTENCES[currentSentenceIndex]
  document.title = `${subject} Not Found - Timeless`
}

function showRandomArtwork() {
  const selected = NOT_FOUND_ARTWORKS[randomIndex(NOT_FOUND_ARTWORKS.length)]

  if (artworkImage instanceof HTMLImageElement) {
    artworkImage.src = selected.src
  }

  if (artwork instanceof HTMLElement) {
    artwork.setAttribute('aria-label', selected.alt)
  }
}

showRandomArtwork()
showRandomNotFound()
reroll?.addEventListener('click', showRandomNotFound)
