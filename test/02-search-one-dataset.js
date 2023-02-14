// local
import setup, { insDocs } from './util/setup.js'

// setup
const { test, filename, db, sl } = setup()

const recipes = [
  [ 'recipe', 'honey-soy-chicken', 'Honey Soy Chicken', 'Lots of chicken, honey, and soy!' ],
  [ 'recipe', 'chicken-drumsticks', 'Chicken Drumsticks', 'Chicken drumsticks and things that go with it.'],
  [ 'recipe', 'beef-wellington', 'Beef Wellington', 'Beef and some other stuff.'],
]

const expChicken = [
  {
    id: 1,
    dataset: 'recipe',
    location: 'honey-soy-chicken',
    title: 'Honey Soy Chicken',
    body: 'Lots of chicken, honey, and soy!',
    relevance: -0.0000019257294429708225,
    term: {},
  },
  {
    id: 2,
    dataset: 'recipe',
    location: 'chicken-drumsticks',
    title: 'Chicken Drumsticks',
    body: 'Chicken drumsticks and things that go with it.',
    relevance: -0.0000019257294429708225,
    term: {},
  },
]

const expBeef = [
  {
    id: 3,
    dataset: 'recipe',
    location: 'beef-wellington',
    title: 'Beef Wellington',
    body: 'Beef and some other stuff.',
    relevance: -1.007770116451384,
    term: {},
  }
]

const expFish = []

// tests
test('02-search-one-dataset: search recipes', t => {
  t.plan(3)

  insDocs(sl, recipes)

  const chicken = sl.search('recipe', 'chicken')
  t.deepEqual(chicken, expChicken, 'Expected chicken recipes')

  const beef = sl.search('recipe', 'beef')
  t.deepEqual(beef, expBeef, 'Expected beef recipes')

  const fish = sl.search('recipe', 'fish')
  t.deepEqual(fish, expFish, 'Expected fish recipes')

  t.end()
})

test('02-search-one-dataset: search cars', t => {
  t.plan(1)

  const chicken = sl.search('car', 'chicken')
  t.deepEqual(chicken, [], 'No chicken in the car dataset')

  t.end()
})
