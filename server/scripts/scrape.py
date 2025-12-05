#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "requests>=2.28.0",
# ]
# ///
"""
OpenSky Network Flight Data Scraper

Fetches flight data for small/general aviation aircraft in the US region.
Handles API authentication and respects rate limits.

Usage:
    export OPENSKY_USERNAME="your_username"
    export OPENSKY_PASSWORD="your_password"
    python opensky_scraper.py

WARNING: The free open-sky API is finicky and prone to rate-limiting.
"""

# The original version of this script is on my old laptop, which has
# unfortunately quit.
# I forgot to commit the script I used to generate the data
# in data/real_flight_data.json. This is a new version of the script.

# Note: both scripts were AI generated.
# Empirically, the data looks good.

# The original had a prompt similar to what follows:
# Ultrathink. You're a skilled senior developer.
# Write a script to scrape the opensky-networking.org API
# for flight data from small aircraft in Southern California.

# I later prompted it again:

# Add rate limits. Increase the bounding box size to the entire
# United States.


# I used the following prompt to create the new version:

# Take real_flight_data.json. Write a script that generates
# this data from the opensky-networking.org API.

# Filter the data to be from flights within the U.S
# and to only consider flights from small aircrafts.
# Make sure to rate limit.

import os
import json
import time
import logging
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# =============================================================================
# Configuration
# =============================================================================


@dataclass
class OpenSkyConfig:
    """Configuration for OpenSky API access."""

    base_url: str = "https://opensky-network.org/api"
    username: Optional[str] = None
    password: Optional[str] = None

    # Rate limiting (requests per time window)
    anonymous_limit: int = 100  # per day
    authenticated_limit: int = 1000  # per day
    min_request_interval: float = 1.0  # seconds between requests

    # US bounding box (lat_min, lat_max, lon_min, lon_max)
    us_bounds: tuple = (24.396308, 49.384358, -125.0, -66.93457)

    @classmethod
    def from_env(cls) -> "OpenSkyConfig":
        """Load configuration from environment variables."""
        return cls(
            username=os.environ.get("OPENSKY_USERNAME"),
            password=os.environ.get("OPENSKY_PASSWORD"),
        )

    @property
    def is_authenticated(self) -> bool:
        return self.username is not None and self.password is not None

    @property
    def daily_limit(self) -> int:
        return (
            self.authenticated_limit if self.is_authenticated else self.anonymous_limit
        )


# =============================================================================
# Data Models
# =============================================================================


@dataclass
class Flight:
    """Represents a single flight record."""

    tail_number: Optional[str]
    aircraft_model: Optional[str]
    manufacturer: Optional[str]
    origin_airport_icao: Optional[str]
    destination_airport_icao: Optional[str]
    departure_time: Optional[str]
    arrival_time: Optional[str]
    icao24: str  # Aircraft transponder address
    callsign: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


# =============================================================================
# Rate Limiter
# =============================================================================


class RateLimiter:
    """Simple rate limiter with daily quota tracking."""

    def __init__(self, daily_limit: int, min_interval: float):
        self.daily_limit = daily_limit
        self.min_interval = min_interval
        self.request_count = 0
        self.last_request_time: Optional[float] = None
        self.reset_date = datetime.now().date()

    def _maybe_reset_daily(self):
        """Reset counter if it's a new day."""
        today = datetime.now().date()
        if today > self.reset_date:
            logger.info("Daily rate limit reset")
            self.request_count = 0
            self.reset_date = today

    def acquire(self) -> bool:
        """
        Acquire permission to make a request.
        Returns True if allowed, False if daily limit exceeded.
        Blocks if minimum interval hasn't passed.
        """
        self._maybe_reset_daily()

        if self.request_count >= self.daily_limit:
            logger.warning(f"Daily rate limit ({self.daily_limit}) exceeded")
            return False

        # Enforce minimum interval between requests
        if self.last_request_time is not None:
            elapsed = time.time() - self.last_request_time
            if elapsed < self.min_interval:
                sleep_time = self.min_interval - elapsed
                logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s")
                time.sleep(sleep_time)

        self.request_count += 1
        self.last_request_time = time.time()
        return True

    @property
    def remaining(self) -> int:
        self._maybe_reset_daily()
        return max(0, self.daily_limit - self.request_count)


# =============================================================================
# OpenSky API Client
# =============================================================================


class OpenSkyClient:
    """Client for the OpenSky Network REST API."""

    # Known small/GA aircraft type codes (partial list)
    SMALL_AIRCRAFT_TYPES = {
        "C172",
        "C182",
        "C152",
        "C150",
        "C206",
        "C210",  # Cessna
        "PA28",
        "PA32",
        "PA34",
        "PA44",
        "PA46",  # Piper
        "BE35",
        "BE36",
        "BE58",
        "BE33",
        "BE55",  # Beechcraft
        "SR20",
        "SR22",  # Cirrus
        "DA40",
        "DA42",
        "DA20",  # Diamond
        "M20P",
        "M20J",
        "M20K",
        "M20R",
        "M20T",  # Mooney
        "RV6",
        "RV7",
        "RV8",
        "RV10",  # Van's RV series
    }

    def __init__(self, config: Optional[OpenSkyConfig] = None):
        self.config = config or OpenSkyConfig.from_env()
        self.rate_limiter = RateLimiter(
            daily_limit=self.config.daily_limit,
            min_interval=self.config.min_request_interval,
        )
        self.session = self._create_session()

        if self.config.is_authenticated:
            logger.info("Using authenticated API access")
        else:
            logger.warning("Using anonymous API access (limited to 100 requests/day)")

    def _create_session(self) -> requests.Session:
        """Create a requests session with retry logic."""
        session = requests.Session()

        if self.config.is_authenticated:
            session.auth = (self.config.username, self.config.password)

        # Configure retries for transient failures
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET"],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("https://", adapter)
        session.mount("http://", adapter)

        return session

    def _request(self, endpoint: str, params: Optional[dict] = None) -> Optional[dict]:
        """Make a rate-limited request to the API."""
        if not self.rate_limiter.acquire():
            raise RateLimitExceeded(
                f"Daily limit of {self.config.daily_limit} requests exceeded"
            )

        url = f"{self.config.base_url}{endpoint}"
        logger.debug(f"GET {url} params={params}")

        try:
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                logger.error("Rate limited by server (429)")
                raise RateLimitExceeded("Server returned 429 Too Many Requests")
            logger.error(f"HTTP error: {e}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            raise

    def get_current_states(
        self, bounds: Optional[tuple] = None, icao24_filter: Optional[list[str]] = None
    ) -> list[dict]:
        """
        Get current state vectors for aircraft.

        Args:
            bounds: (lat_min, lat_max, lon_min, lon_max) bounding box
            icao24_filter: List of ICAO24 addresses to filter

        Returns:
            List of state vector dictionaries
        """
        params = {}

        if bounds:
            lat_min, lat_max, lon_min, lon_max = bounds
            params.update(
                {
                    "lamin": lat_min,
                    "lamax": lat_max,
                    "lomin": lon_min,
                    "lomax": lon_max,
                }
            )

        if icao24_filter:
            params["icao24"] = ",".join(icao24_filter)

        data = self._request("/states/all", params)

        if not data or "states" not in data or data["states"] is None:
            return []

        # Parse state vectors into dictionaries
        keys = [
            "icao24",
            "callsign",
            "origin_country",
            "time_position",
            "last_contact",
            "longitude",
            "latitude",
            "baro_altitude",
            "on_ground",
            "velocity",
            "true_track",
            "vertical_rate",
            "sensors",
            "geo_altitude",
            "squawk",
            "spi",
            "position_source",
        ]

        states = []
        for state in data["states"]:
            state_dict = dict(zip(keys, state))
            states.append(state_dict)

        return states

    def get_flights_by_aircraft(self, icao24: str, begin: int, end: int) -> list[dict]:
        """
        Get flights for a specific aircraft within a time range.

        Args:
            icao24: Aircraft ICAO24 transponder address
            begin: Start time as Unix timestamp
            end: End time as Unix timestamp (max 30 days from begin)

        Returns:
            List of flight dictionaries
        """
        params = {"icao24": icao24.lower(), "begin": begin, "end": end}

        data = self._request("/flights/aircraft", params)
        if not data:
            return []
        # The API returns a list directly for this endpoint
        return data if isinstance(data, list) else []

    def get_flights_in_range(self, begin: int, end: int) -> list[dict]:
        """
        Get all flights within a time range.

        Args:
            begin: Start time as Unix timestamp
            end: End time as Unix timestamp (max 2 hours from begin)

        Returns:
            List of flight dictionaries
        """
        params = {"begin": begin, "end": end}

        data = self._request("/flights/all", params)
        if not data:
            return []
        # The API returns a list directly for this endpoint
        return data if isinstance(data, list) else []

    def get_departures(self, airport_icao: str, begin: int, end: int) -> list[dict]:
        """Get departures from an airport within a time range."""
        params = {"airport": airport_icao, "begin": begin, "end": end}

        data = self._request("/flights/departure", params)
        if not data:
            return []
        # The API returns a list directly for this endpoint
        return data if isinstance(data, list) else []

    def get_arrivals(self, airport_icao: str, begin: int, end: int) -> list[dict]:
        """Get arrivals at an airport within a time range."""
        params = {"airport": airport_icao, "begin": begin, "end": end}

        data = self._request("/flights/arrival", params)
        if not data:
            return []
        # The API returns a list directly for this endpoint
        return data if isinstance(data, list) else []


# =============================================================================
# Small Aircraft Filter
# =============================================================================


class SmallAircraftFilter:
    """Filters flights to identify small/general aviation aircraft."""

    def __init__(self, aircraft_db_path: Optional[Path] = None):
        """
        Initialize filter, optionally loading an aircraft database.

        The database can be obtained from:
        https://opensky-network.org/datasets/metadata/
        """
        self.aircraft_db: dict[str, dict] = {}
        if aircraft_db_path and aircraft_db_path.exists():
            self._load_database(aircraft_db_path)

    def _load_database(self, path: Path):
        """Load aircraft metadata database."""
        logger.info(f"Loading aircraft database from {path}")
        try:
            with open(path) as f:
                for line in f:
                    record = json.loads(line)
                    icao24 = record.get("icao24", "").lower()
                    if icao24:
                        self.aircraft_db[icao24] = record
            logger.info(f"Loaded {len(self.aircraft_db)} aircraft records")
        except Exception as e:
            logger.warning(f"Failed to load aircraft database: {e}")

    def get_aircraft_info(self, icao24: str) -> dict:
        """Look up aircraft info by ICAO24 address."""
        return self.aircraft_db.get(icao24.lower(), {})

    def is_small_aircraft(self, icao24: str, callsign: Optional[str] = None) -> bool:
        """
        Determine if an aircraft is likely a small/GA aircraft.

        Uses heuristics when database info is unavailable:
        - N-number registration pattern (US GA aircraft)
        - Known small aircraft type codes
        - Absence of airline callsign patterns
        """
        info = self.get_aircraft_info(icao24)

        # Check database if available
        if info:
            type_code = info.get("typecode", "")
            if type_code in OpenSkyClient.SMALL_AIRCRAFT_TYPES:
                return True

            # Check for owner patterns suggesting GA
            owner = info.get("owner", "").upper()
            if any(
                term in owner for term in ["FLYING CLUB", "FLIGHT SCHOOL", "AERO CLUB"]
            ):
                return True

        # Heuristic: US N-number registrations are often GA
        if callsign:
            callsign = callsign.strip()
            # N-numbers: N followed by 1-5 alphanumeric
            if (
                callsign.startswith("N")
                and len(callsign) <= 6
                and callsign[1:].isalnum()
            ):
                return True

            # Exclude obvious airline patterns (3-letter code + flight number)
            if len(callsign) >= 4 and callsign[:3].isalpha() and callsign[3:].isdigit():
                return False

        return False


# =============================================================================
# Flight Data Scraper
# =============================================================================


class FlightScraper:
    """
    High-level scraper for collecting small aircraft flight data.
    """

    def __init__(
        self,
        config: Optional[OpenSkyConfig] = None,
        aircraft_db_path: Optional[Path] = None,
    ):
        self.client = OpenSkyClient(config)
        self.filter = SmallAircraftFilter(aircraft_db_path)

    def scrape_current_us_ga_flights(self) -> list[dict]:
        """
        Get current small aircraft flying in the US.

        Returns:
            List of state vectors for small/GA aircraft
        """
        logger.info("Fetching current US airspace state vectors...")

        states = self.client.get_current_states(bounds=self.client.config.us_bounds)

        logger.info(f"Retrieved {len(states)} aircraft in US airspace")

        # Filter for small aircraft
        ga_aircraft = []
        for state in states:
            icao24 = state.get("icao24", "")
            callsign = state.get("callsign")

            if self.filter.is_small_aircraft(icao24, callsign):
                ga_aircraft.append(state)

        logger.info(f"Identified {len(ga_aircraft)} small/GA aircraft")
        return ga_aircraft

    def scrape_flights_for_period(
        self, start_time: datetime, end_time: datetime, small_only: bool = True
    ) -> list[Flight]:
        """
        Scrape flights within a time period.

        Note: OpenSky limits the /flights/all endpoint to 2-hour windows,
        so this method makes multiple requests for longer periods.

        Args:
            start_time: Start of period
            end_time: End of period
            small_only: Filter for small/GA aircraft only

        Returns:
            List of Flight objects
        """
        flights = []
        current = start_time
        window = timedelta(hours=2)

        while current < end_time:
            window_end = min(current + window, end_time)

            begin_ts = int(current.timestamp())
            end_ts = int(window_end.timestamp())

            logger.info(
                f"Fetching flights from {current.isoformat()} "
                f"to {window_end.isoformat()}"
            )

            try:
                raw_flights = self.client.get_flights_in_range(begin_ts, end_ts)

                for f in raw_flights:
                    icao24 = f.get("icao24", "")
                    callsign = f.get("callsign")

                    if small_only and not self.filter.is_small_aircraft(
                        icao24, callsign
                    ):
                        continue

                    # Get additional aircraft info if available
                    info = self.filter.get_aircraft_info(icao24)

                    flight = Flight(
                        tail_number=callsign.strip() if callsign else None,
                        aircraft_model=info.get("model") or info.get("typecode"),
                        manufacturer=info.get("manufacturername"),
                        origin_airport_icao=f.get("estDepartureAirport"),
                        destination_airport_icao=f.get("estArrivalAirport"),
                        departure_time=self._format_timestamp(f.get("firstSeen")),
                        arrival_time=self._format_timestamp(f.get("lastSeen")),
                        icao24=icao24,
                        callsign=callsign,
                    )
                    flights.append(flight)

            except RateLimitExceeded:
                logger.warning("Rate limit reached, stopping scrape")
                break
            except Exception as e:
                logger.error(f"Error fetching flights: {e}")

            current = window_end

        logger.info(f"Scraped {len(flights)} flights total")
        return flights

    def scrape_aircraft_history(self, icao24: str, days_back: int = 7) -> list[Flight]:
        """
        Get flight history for a specific aircraft.

        Args:
            icao24: Aircraft ICAO24 address
            days_back: Number of days of history (max 30)

        Returns:
            List of Flight objects
        """
        end_time = datetime.now()
        start_time = end_time - timedelta(days=min(days_back, 30))

        begin_ts = int(start_time.timestamp())
        end_ts = int(end_time.timestamp())

        logger.info(f"Fetching {days_back}-day history for {icao24}")

        raw_flights = self.client.get_flights_by_aircraft(icao24, begin_ts, end_ts)
        info = self.filter.get_aircraft_info(icao24)

        flights = []
        for f in raw_flights:
            callsign = f.get("callsign")
            flight = Flight(
                tail_number=callsign.strip() if callsign else None,
                aircraft_model=info.get("model") or info.get("typecode"),
                manufacturer=info.get("manufacturername"),
                origin_airport_icao=f.get("estDepartureAirport"),
                destination_airport_icao=f.get("estArrivalAirport"),
                departure_time=self._format_timestamp(f.get("firstSeen")),
                arrival_time=self._format_timestamp(f.get("lastSeen")),
                icao24=icao24,
                callsign=callsign,
            )
            flights.append(flight)

        logger.info(f"Found {len(flights)} flights for {icao24}")
        return flights

    @staticmethod
    def _format_timestamp(ts: Optional[int]) -> Optional[str]:
        """Convert Unix timestamp to ISO format string."""
        if ts is None:
            return None
        return datetime.fromtimestamp(ts).isoformat()


# =============================================================================
# Exceptions
# =============================================================================


class RateLimitExceeded(Exception):
    """Raised when rate limit is exceeded."""

    pass


# =============================================================================
# CLI Entry Point
# =============================================================================


def main():
    """Example usage of the scraper."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Scrape small aircraft flight data from OpenSky Network"
    )
    parser.add_argument(
        "--mode",
        choices=["current", "history", "aircraft"],
        default="current",
        help="Scraping mode",
    )
    parser.add_argument(
        "--hours",
        type=int,
        default=2,
        help="Hours of history to fetch (for 'history' mode)",
    )
    parser.add_argument(
        "--icao24", help="Aircraft ICAO24 address (for 'aircraft' mode)"
    )
    parser.add_argument("--output", default="flights.json", help="Output JSON file")
    parser.add_argument("--aircraft-db", help="Path to OpenSky aircraft database file")
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Enable debug logging"
    )

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Initialize scraper
    config = OpenSkyConfig.from_env()
    aircraft_db = Path(args.aircraft_db) if args.aircraft_db else None
    scraper = FlightScraper(config, aircraft_db)

    # Run selected mode
    try:
        if args.mode == "current":
            results = scraper.scrape_current_us_ga_flights()

        elif args.mode == "history":
            end_time = datetime.now()
            start_time = end_time - timedelta(hours=args.hours)
            flights = scraper.scrape_flights_for_period(start_time, end_time)
            results = [f.to_dict() for f in flights]

        elif args.mode == "aircraft":
            if not args.icao24:
                parser.error("--icao24 required for 'aircraft' mode")
            flights = scraper.scrape_aircraft_history(args.icao24)
            results = [f.to_dict() for f in flights]

    except RateLimitExceeded as e:
        logger.error(f"Rate limit exceeded: {e}")
        print(f"\nError: {e}")
        print(
            "Please wait before making more requests or upgrade your API credentials."
        )
        return 1
    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP error from API: {e}")
        if hasattr(e, "response") and e.response is not None:
            print(f"\nAPI Error: HTTP {e.response.status_code}")
            print(f"The API may be temporarily unavailable. Please try again later.")
        else:
            print(f"\nAPI Error: {e}")
        return 1
    except requests.exceptions.RequestException as e:
        logger.error(f"Network/API error: {e}")
        print(f"\nNetwork Error: Unable to connect to OpenSky API")
        print(f"Details: {e}")
        print("The service may be temporarily unavailable. Please try again later.")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error during scraping: {e}", exc_info=True)
        print(f"\nUnexpected error: {e}")
        return 1

    # Save results
    try:
        output_path = Path(args.output)
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)

        logger.info(f"Saved {len(results)} records to {output_path}")
        print(f"\nResults saved to {output_path}")
        print(f"Records collected: {len(results)}")
        print(f"Remaining API quota: {scraper.client.rate_limiter.remaining}")
        return 0
    except IOError as e:
        logger.error(f"Failed to write output file: {e}")
        print(f"\nError: Could not write to {args.output}: {e}")
        return 1


if __name__ == "__main__":
    import sys

    sys.exit(main())
