// local
import setup, { insDocs } from './util/setup.js'

// setup
const { test, filename, db, sl } = setup()

const articles = [
  [ 'health', 'running-from-couch-to-5km', 'Running: From Couch to 5KM', 'This is an article about running.' ],
  [ 'health', 'avocado-toast', 'Avocado Toast', "Avocado toast, how it's made, how to eat it."],
  [ 'health', 'weights-and-weightlifing', 'Weights and Weighlifting', 'Never skip leg day!'],
]

const target = articles[0]
const exp = [
  {
    id: 1,
    dataset: target[0],
    location: target[1],
    title: target[2],
    body: target[3],
    relevance: -0.9744072592068033,
    term: {},
  },
]

test('03-stem-search: search articles', t => {
  t.plan(4)

  insDocs(sl, articles)

  const articleRun = sl.search('health', 'run')
  t.deepEqual(articleRun, exp, "Expected article from 'run'")

  const articleRuns = sl.search('health', 'runs')
  t.deepEqual(articleRuns, exp, "Expected article from 'runs'")

  const articleRunning = sl.search('health', 'running')
  t.deepEqual(articleRunning, exp, "Expected article from 'running'")

  const articleRan = sl.search('health', 'ran')
  t.deepEqual(articleRan, [], "Expected no articles from 'ran'")

  t.end()
})
