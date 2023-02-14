// local
import setup, { insDocs } from './util/setup.js'

// setup
const { test, filename, db, sl } = setup()

const recipes = [
  [ 'recipe', 'chicken-drumsticks', 'Chicken Drumsticks', 'Chicken drumsticks and things that go with it.', { ingredient: [ 'chicken' ], cuisine: [ "american" ], difficulty: [ "easy" ], diet: [ "vegetarian" ] } ],
  [ 'recipe', 'honey-soy-chicken', 'Honey Soy Chicken', 'Lots of chicken, honey, and soy!', { ingredient: [ 'chicken', 'honey' ], category: [ "appetiser", "desert", "dinner" ], cuisine: [ "chinese" ], difficulty: [ "easy" ], diet: [ "gluten-free" ] } ],
]

const expChicken = [
  {
    id: 1,
    dataset: 'recipe',
    location: 'chicken-drumsticks',
    title: 'Chicken Drumsticks',
    body: 'Chicken drumsticks and things that go with it.',
    relevance: -0.0000019411764705882353,
    term: recipes[0][4],
  },
  {
    id: 2,
    dataset: 'recipe',
    location: 'honey-soy-chicken',
    title: 'Honey Soy Chicken',
    body: 'Lots of chicken, honey, and soy!',
    relevance: -0.0000019411764705882353,
    term: recipes[1][4],
  },
]

test('03-terms: get one doc', t => {
  t.plan(1)

  insDocs(sl, recipes)

  const exp = {
    id: 2,
    dataset: 'recipe',
    location: 'honey-soy-chicken',
    title: 'Honey Soy Chicken',
    body: 'Lots of chicken, honey, and soy!',
    term: {
      ingredient: [ 'chicken', 'honey' ],
      category: [ "appetiser", "desert", "dinner" ],
      cuisine: [ "chinese" ],
      difficulty: [ "easy" ],
      diet: [ "gluten-free" ],
    },
    updates: 1,
  }

  const recipe1 = sl.get('recipe', 'honey-soy-chicken')
  console.log('recipe1:', recipe1)
  delete recipe1.inserted
  delete recipe1.updated
  t.deepEqual(recipe1, exp, "Got a chicken recipe with multiple terms")

  t.end()
})
