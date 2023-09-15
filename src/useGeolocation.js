import { useState } from "react";

function useGeolocation(callback) {
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({});
  const [error, setError] = useState(null);

  if (!navigator.geolocation)
    return setError("Your browser does not support geolocation");

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setIsLoading(true);
      setPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
      setIsLoading(false);
    },
    (error) => {
      setError(error.message);
      setIsLoading(false);
    }
  );
  callback?.();
  return [position, isLoading, error];
}

export default function App() {
  const [countClicks, setCountClicks] = useState(0);
  const [position, isLoading, error] = useGeolocation(getPosition);
  const { lat, lng } = position;

  function getPosition() {
    setCountClicks((count) => count + 1);
  }

  return (
    <div>
      <button onClick={getPosition} disabled={isLoading}>
        Get my position
      </button>

      {isLoading && <p>Loading position...</p>}
      {error && <p>{error}</p>}
      {!isLoading && !error && lat && lng && (
        <p>
          Your GPS position:{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href={`https://www.openstreetmap.org/#map=16/${lat}/${lng}`}
          >
            {lat}, {lng}
          </a>
        </p>
      )}

      <p>You requested position {countClicks} times</p>
    </div>
  );
}
