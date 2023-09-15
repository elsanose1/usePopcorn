import { useEffect, useState } from "react";
import StarRating from "./StarRating";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = "182c7ba5";
export default function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState();
  const [query, setQuery] = useState("");
  const [watched, setWatched] = useState(() => {
    const watchedMovies = localStorage.getItem("watchedList");
    return JSON.parse(watchedMovies);
  });

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        setIsLoading(true);
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Somthing went wrong");

        const data = await res.json();
        if (data.Response === "False") throw new Error(data.Error);
        setMovies(data.Search);
        setError("");
      } catch (error) {
        setError(error.message);
        setMovies([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (query.length < 3) {
      setMovies([]);
      setError("");
      return;
    }
    onCloseMovie();
    fetchData();
    return () => controller.abort();
    // const timer = setTimeout(fetchData, 1000);
    // return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    localStorage.setItem("watchedList", JSON.stringify(watched));
  }, [watched]);

  const onSelectMovie = (id) => {
    setSelectedMovieId((selectedId) => (selectedId === id ? null : id));
  };

  const onCloseMovie = () => {
    setSelectedMovieId(null);
  };

  const addWatchedMovie = (movie) => {
    setWatched((watched) => [...watched, movie]);
  };

  const deleteWatchedMovie = (id) => {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  };
  return (
    <>
      <NavBar>
        <Search querys={[query, setQuery]} />
        <NumResults movies={movies} />
      </NavBar>

      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieList onMovieSelect={onSelectMovie} movies={movies} />
          )}
          {!isLoading && error && <ErrorMessage message={error} />}
        </Box>

        <Box>
          {selectedMovieId ? (
            <MovieDetails
              watched={watched}
              movieId={selectedMovieId}
              onClose={onCloseMovie}
              addToList={addWatchedMovie}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMoviesList
                watched={watched}
                onDelete={deleteWatchedMovie}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

const MovieDetails = ({ movieId, onClose, addToList, watched }) => {
  const [rating, setRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [movie, setMovie] = useState({});
  const isExsit = watched.find((item) => item.imdbID === movieId);

  useEffect(() => {
    function escapeBTN(e) {
      if (e.code === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", escapeBTN);

    return () => document.removeEventListener("keydown", escapeBTN);
  }, [onClose]);

  useEffect(() => {
    async function fetchMovie() {
      try {
        setRating(0);

        setIsLoading(true);
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&i=${movieId}`
        );
        if (!res.ok) throw new Error("Somthing went wrong");

        const data = await res.json();
        if (data.Response === "False") throw new Error(data.Error);
        setMovie(data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMovie();
  }, [movieId]);

  useEffect(() => {
    if (!movie.Title) return;
    document.title = `Movie | ${movie.Title}`;

    return () => (document.title = `usePopcorn`);
  }, [movie]);

  const getRating = (rating) => {
    setRating(rating);
  };

  const addMovie = (movie) => {
    if (rating < 1) return;
    const newwatchedMovie = {
      imdbID: movieId,
      Title: movie.Title,
      year: movie.Year,
      Poster: movie.Poster,
      imdbRating: Number(movie.imdbRating),
      runtime: Number(movie.Runtime.split(" ").at(0)),
      userRating: rating,
    };

    addToList(newwatchedMovie);
    onClose();
  };
  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onClose}>
              &larr;
            </button>
            <img src={movie.Poster} alt={movie.Title} />
            <div className="details-overview">
              <h2>{movie.Title}</h2>
              <p>
                {movie.Released} &bull; {movie.Runtime}
              </p>
              <p>{movie.Genre}</p>
              <p>
                <span>⭐</span> {movie.imdbRating} IMDB rating{" "}
              </p>
            </div>
          </header>
          <section>
            <div className="rating">
              {!isExsit ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={getRating}
                    defaultRating={isExsit?.userRating}
                  />
                  {rating > 0 && (
                    <button
                      className="btn-add"
                      onClick={(e) => {
                        addMovie(movie);
                      }}
                    >
                      Add to list
                    </button>
                  )}{" "}
                </>
              ) : (
                <p>You rated this movie ( {isExsit.userRating}🌟)</p>
              )}
            </div>
            <p>
              <em>{movie.Plot}</em>
            </p>
            <p>Starring {movie.Actors}</p>
            <p>Directed by {movie.Director}</p>
          </section>
        </>
      )}
    </div>
  );
};

const Loader = () => {
  return <p className="loader">Loading...</p>;
};
const ErrorMessage = ({ message }) => {
  return <p className="error">{message}</p>;
};

function NavBar({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Search({ querys }) {
  const [query, setQuery] = querys;

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>

      {isOpen && children}
    </div>
  );
}

/*
function WatchedBox() {
  const [watched, setWatched] = useState(tempWatchedData);
  const [isOpen2, setIsOpen2] = useState(true);

  return (
    <div className="box">
      <button
        className="btn-toggle"
        onClick={() => setIsOpen2((open) => !open)}
      >
        {isOpen2 ? "–" : "+"}
      </button>

      {isOpen2 && (
        <>
          <WatchedSummary watched={watched} />
          <WatchedMoviesList watched={watched} />
        </>
      )}
    </div>
  );
}
*/

function MovieList({ movies, onMovieSelect }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie movie={movie} key={movie.imdbID} onClick={onMovieSelect} />
      ))}
    </ul>
  );
}

function Movie({ movie, onClick }) {
  return (
    <li onClick={(e) => onClick(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const allRunTime = watched.reduce((acc, item) => item.runtime + acc, 0);

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{allRunTime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMoviesList({ watched, onDelete }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie movie={movie} key={movie.imdbID} deleteMovie={onDelete} />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, deleteMovie }) {
  return (
    <li>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button
          className="btn-delete"
          onClick={(e) => deleteMovie(movie.imdbID)}
        >
          X
        </button>
      </div>
    </li>
  );
}
