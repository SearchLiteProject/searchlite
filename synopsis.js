// npm
import Sqlite from 'better-sqlite3'
import SearchLite from './searchlite.js'

// create your own DB
const db = Sqlite('tmp/synopsis.db')

// as recommended by 'better-sqlite3'
db.pragma('journal_mode = WAL')

// here you can use `db` however you like
// create tables, insert data, query, etc

// create a new SearchLite instance
const sl = new SearchLite(db)

// add three documents (under the 'dataset=recipe')
sl.ens(
  'recipe',
  'https://www.bbcgoodfood.com/recipes/easy-rocky-road',
  'Easy rocky road',
  'Great for a bake sale, a gift, or simply an afternoon treat to enjoy with a cup of tea, this rocky road is quick to make and uses mainly storecupboard ingredients.'
)
sl.ens(
  'recipe',
  'https://www.bbcgoodfood.com/recipes/collection/chocolate-chip-cookie-recipes',
  'Chocolate chip cookie recipes',
  'Indulge in the ultimate sweet treat on your next tea break: homemade chocolate chip cookies. They pair perfectly with a cup of tea or glass of milk.'
)
sl.ens(
  'recipe',
  'https://www.bbcgoodfood.com/recipes/the-big-double-cheeseburger-secret-sauce',
  'The ultimate beef burger',
  'Forget the takeaway and make these double decker homemade cheeseburgers. With gherkins, crisp lettuce and a secret sauce, they take some beating. Have with chips.'
)
sl.ens(
  'recipe',
  'https://www.bbcgoodfood.com/recipes/beef-burgers-learn-make',
  'Beef burgers – learn to make',
  'Learn how to make succulent beef burgers with just four ingredients. An easy recipe for perfect homemade patties'
)

// try some searches
console.log('recipe / chocolate:', sl.search('recipe', 'chocolate'))
console.log()

console.log('recipe / tea:', sl.search('recipe', 'tea'))
console.log()

console.log('recipe / beef:', sl.search('recipe', 'beef'))
console.log()
