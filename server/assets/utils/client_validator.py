"""
Client ID validation utility.
Fetches valid client IDs from remote API and validates against them.
"""
import requests
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

CLIENT_ID_API_URL = "https://activate.imcbs.com/client-id-list/get-client-ids/"
CACHE_TIMEOUT = 300  # 5 minutes in seconds


@lru_cache(maxsize=1)
def fetch_valid_client_ids():
    """
    Fetch valid client IDs from remote API.
    Results are cached to reduce API calls.
    
    Returns:
        list: List of valid client ID strings, or empty list on error
    """
    try:
        response = requests.get(CLIENT_ID_API_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        client_ids = data.get('client_ids', [])
        logger.info(f"Fetched {len(client_ids)} valid client IDs from remote API")
        return client_ids
    except requests.RequestException as e:
        logger.error(f"Failed to fetch client IDs from remote API: {e}")
        return []
    except (ValueError, KeyError) as e:
        logger.error(f"Invalid response format from client ID API: {e}")
        return []


def validate_client_id(client_id):
    if not client_id:
        return False, "Client ID is required"

    valid_ids = fetch_valid_client_ids()

    if not valid_ids:
        logger.warning("Could not fetch valid client IDs, allowing upload")
        return True, None

    def normalize(cid):
        return str(cid).strip().upper()

    valid_ids_set = {normalize(vid) for vid in valid_ids}

    if normalize(client_id) in valid_ids_set:
        return True, None

    return False, f"Invalid client ID. Client ID '{client_id}' is not registered."

