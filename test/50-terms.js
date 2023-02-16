// local
import setup, { insDocs, copy, clean } from './util/setup.js'

// setup
const { test, filename, db, sl } = setup()

const recipes = [
  [
    'recipe',
    'chicken-drumsticks',
    'Chicken Drumsticks',
    'Chicken drumsticks and things that go with it.',
    { ingredient: [ 'chicken' ], cuisine: [ "american" ], difficulty: [ "easy" ], diet: [ "vegetarian" ] },
  ],
  [
    'recipe',
    'honey-soy-chicken',
    'Honey Soy Chicken',
    'Lots of chicken, honey, and soy!',
    { ingredient: [ 'chicken', 'honey' ], category: [ "appetiser", "desert", "dinner" ], cuisine: [ "chinese" ], difficulty: [ "hard" ], diet: [ "gluten-free" ] },
  ],
]

insDocs(sl, recipes)

const expChicken = [
  {
    id: 1,
    dataset: 'recipe',
    location: 'chicken-drumsticks',
    title: 'Chicken Drumsticks',
    body: 'Chicken drumsticks and things that go with it.',
    // relevance: -0.0000019411764705882353,
    term: recipes[0][4],
  },
  {
    id: 2,
    dataset: 'recipe',
    location: 'honey-soy-chicken',
    title: 'Honey Soy Chicken',
    body: 'Lots of chicken, honey, and soy!',
    // relevance: -0.0000019411764705882353,
    term: recipes[1][4],
  },
]

test('50-terms: search recipes', t => {
  t.plan(1)

  const results = sl.search('recipe', 'chicken')
  clean(results)
  t.deepEqual(results, expChicken, 'Expected chicken recipes')

  t.end()
})

test('50-terms: search with no query gives everything', t => {
  t.plan(2)

  const exp = copy(expChicken)
  exp.forEach(r => r.relevance = 0)

  const chicken1 = sl.search('recipe', '')
  t.deepEqual(chicken1, exp, 'Expected all recipes with 0 relevance')

  const chicken2 = sl.search('recipe')
  t.deepEqual(chicken2, exp, 'Expected all recipes with 0 relevance')

  t.end()
})

test('50-terms: search recipes with a term', t => {
  t.plan(2)

  const exp = copy(expChicken)
  clean(exp)
  exp[0].relevance = 0
  exp[1].relevance = 0

  const chicken1 = sl.search('recipe', '', { ingredient: [ 'honey' ] })
  t.deepEqual(chicken1, [ exp[1] ], 'Expected chicken recipe with honey')

  const chicken2 = sl.search('recipe', '', { cuisine: [ 'american' ] })
  t.deepEqual(chicken2, [ exp[0] ], 'Expected chicken recipe from US of A')

  t.end()
})
