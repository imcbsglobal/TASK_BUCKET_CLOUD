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
    """
    Validate if a client ID exists in the remote list of valid IDs.
    
    Args:
        client_id (str): The client ID to validate
        
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if not client_id:
        return False, "Client ID is required"
    
    valid_ids = fetch_valid_client_ids()
    
    if not valid_ids:
        # If we can't fetch valid IDs, log error but allow upload to avoid blocking
        logger.warning("Could not fetch valid client IDs, allowing upload")
        return True, None
    
    if client_id.upper() in [vid.upper() for vid in valid_ids]:
        return True, None
    
    return False, f"Invalid client ID. Client ID '{client_id}' is not registered in the system."


def clear_client_id_cache():
    """Clear the cached client ID list to force a refresh."""
    fetch_valid_client_ids.cache_clear()
