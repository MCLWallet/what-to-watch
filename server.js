/**
 * This is the main Node.js server script for your project
 * Check out the two endpoints this back-end API provides in fastify.get and fastify.post below
 */

const path = require("path");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false,
});

// ADD FAVORITES ARRAY VARIABLE FROM TODO HERE

// Setup our static files
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// Formbody lets us parse incoming forms
fastify.register(require("@fastify/formbody"));

// View is a templating manager for fastify
fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

/**
 * Our home page route
 *
 * Returns src/pages/index.hbs with data built into it
 */
fastify.get("/", function (request, reply) {
  // params is an object we'll pass to our handlebars template
  let params = { seo: seo };

  if (request.query.id) {
    // Load watchlist data file
    const watchlist = require("./src/watchlist.json");
    const movie = watchlist.find((movie) => movie.Const === request.query.id);
    const movieError = null;

    if (!movie) {
      params.movieError = "Sorry, we couldn't find that movie.";
    }

    params = {
      color: getRandomColor(),
      colorError: null,
      movie: movie,
      movieError: movieError,
      seo: seo,
    };
  }
  // The Handlebars code will be able to access the parameter values and build them into the page
  return reply.view("/src/pages/index.hbs", params);
});

/**
 * Our get route to server the watchlist page as a JSON file
 *
 * Returns src/watchlist.json
 *
 */
fastify.get("/watchlist", function (request, reply) {
  // Load watchlist data file
  const watchlist = require("./src/watchlist.json");

  // If we have a query parameter, we'll return a single movie
  if (request.query.id) {
    const movie = watchlist.find((movie) => movie.Const === request.query.id);
    const movieError = null;

    // If we can't find the movie, we'll return an error
    if (!movie) {
      return reply.send({ error: "Sorry, we couldn't find that movie." });
    }
    // Otherwise, we'll return the movie
    else {
      return reply.send(movie);
    }
  }
  if (request.query.genres) {
    const genres = request.query.genres.split(",");
    const filteredWatchlist = watchlist.filter((movie) => {
      const movieGenres = movie.Genres.split(", ");
      return genres.every((genre) => movieGenres.includes(genre));
    });
    return reply.send(filteredWatchlist);
  }
  // Otherwise, we'll return the entire watchlist
  else {
    return reply.send(watchlist);
  }
});

/**
 * Our get route to serve a single movie from the watchlist by id
 *
 * Returns src/watchlist.json
 *
 * Accepts a query parameter indicating the movie id
 *
 */
fastify.get("/watchlist/:id", function (request, reply) {
  // Load watchlist data file
  const watchlist = require("./src/watchlist.json");
  const id = request.params.id;
  const movie = watchlist.find((movie) => movie.Const === id);
  return reply.send(movie);
});

/**
 * Endpoint to get a single random movie
 *
 * Returns a random movie object from watchlist.json
 */
fastify.get("/random", function (request, reply) {
  const randomMovie = getRandomMovie();
  return reply.send(randomMovie);
});

/**
 * Our POST route to handle and react to form submissions
 *
 * Accepts body data indicating the user choice
 */
fastify.post("/", function (request, reply) {
  // Build the params object to pass to the template
  let params = { seo: seo };

  // If someone clicks the "what should I watch?" button, we'll pick a random movie for them
  // We need to load our color data file, pick one at random, and add it to the params

  // Add the movie & color properties to the params object
  params = {
    color: getRandomColor(),
    colorError: null,
    movie: getRandomMovie(),
    movieError: null,
    seo: seo,
  };

  // redirect to the home page with the query parameter
  return reply.redirect(`/?id=${params.movie.Const}`, params);
});

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);

// function that returns a random index from an array
function getRandomIndex(array) {
  return array[(array.length * Math.random()) << 0];
}

function getRandomMovie() {
  const watchlist = require("./src/watchlist.json");
  const allMovies = Object.keys(watchlist);
  let currentMovie = getRandomIndex(allMovies);
  return watchlist[currentMovie];
}

function getRandomColor() {
  const colors = require("./src/colors.json");
  const allColors = Object.keys(colors);
  let currentColor = getRandomIndex(allColors);
  return colors[currentColor];
}
