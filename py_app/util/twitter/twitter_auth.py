from dataclasses import dataclass
from re import S
from urllib.parse import parse_qs, urlparse

import aiohttp
from Jam_Twitter_API.account_sync import TwitterAccountSync
from Jam_Twitter_API.errors import *
from loguru import logger

from exception.error import BlankException, TwitterError

@dataclass
class TwitterAuthConfig:
    BEARER_TOKEN: str = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"
    API_DOMAIN: str = "twitter.com"
    OAUTH2_PATH: str = "/i/api/2/oauth2/authorize"


class TwitterAuthParams:
    CODE_CHALLENGE: str = "challenge123"
    CODE_CHALLENGE_METHOD: str = "plain"
    CLIENT_ID: str = ""
    REDIRECT_URI: str = ""
    RESPONSE_TYPE: str = "code"
    SCOPE: str = "users.read follows.write tweet.write like.write tweet.read"
    STATE: str = "eyJ0eXBlIjoiQ09OTkVDVF9UV0lUVEVSIn0="

    @property
    def param(self) -> dict[str, str]:
        return {
            "code_challenge": self.CODE_CHALLENGE,
            "code_challenge_method": self.CODE_CHALLENGE_METHOD,
            "client_id": self.CLIENT_ID,
            "redirect_uri": self.REDIRECT_URI,
            "response_type": self.RESPONSE_TYPE,
            "scope": self.SCOPE,
            "state": self.STATE
        }
class TwitterAuth():
    def __init__(self, token: str, proxy: str = None):
        self.token = token
        self.proxy = proxy
        self.twitter_client = None
        self.config = TwitterAuthConfig()

    def _build_headers(self, ct0_token: str) -> dict[str, str]:
        return {
            'authority': self.config.API_DOMAIN,
            'accept': '*/*',
            'accept-language': 'ru,en-US;q=0.9,en;q=0.8',
            'authorization': f'Bearer {self.config.BEARER_TOKEN}',
            'cookie': f'auth_token={self.tokenr}; ct0={ct0_token}',
            'x-csrf-token': ct0_token,
        }

    @staticmethod
    def _extract_code_from_redirect(redirect_uri: str) -> str:
        parsed = urlparse(redirect_uri)
        query_params = parse_qs(parsed.query)
        return query_params.get('code', [''])[0]

    async def get_account(self) -> TwitterAccountSync | None:
        try:
            self.twitter_client = TwitterAccountSync.run(
                auth_token=self.token,
                proxy=str(self.proxy),
                setup_session=True
            )
            return self.twitter_client
        except TwitterAccountSuspended as error:
            logger.error(f"get_account: Account suspended: {error}")
            await check_twitter_error_for_invalid_token(error)
        except TwitterError as error:
            logger.error(f"Twitter error: {error.error_message} | {error.error_code}")
            if hasattr(error, 'error_code') and error.error_code in (32, 89, 215, 326):
                await check_twitter_error_for_invalid_token(error)
        except IncorrectData as error:
            logger.error(f"Invalid data: {error}")
            await check_twitter_error_for_invalid_token(error)
        except Exception as error:
            logger.error(f"Unexpected error: {error}")
            await check_twitter_error_for_invalid_token(error)
            
        return None

    async def connect_twitter(self, auth_param: TwitterAuthParams) -> str | None:
        try:
            twitter_client = await self.get_account()
            if not twitter_client:
                logger.error(f"Failed to get Twitter account | auth_token: {self.token[:5]}***")
                return None

            headers = self._build_headers(twitter_client.ct0)
            
            async with aiohttp.ClientSession(headers=headers) as session:
                auth_url = f"https://{self.config.API_DOMAIN}{self.config.OAUTH2_PATH}"
                async with session.get(auth_url, params=auth_param.param) as auth_response:
                    if auth_response.status != 200:
                        logger.error(f"Auth response error: {auth_response.status}")
                        return None
                    auth_data = await auth_response.json()
                    auth_code = auth_data['auth_code']
                
                async with session.post(
                    auth_url,
                    params={"approval": "true", "code": auth_code}
                ) as approve_response:
                    if approve_response.status != 200:
                        
                        logger.error(f"Approval response error: {approve_response.status}")
                        return None
                    approve_data = await approve_response.json()
                    redirect_uri = approve_data['redirect_uri']
                    return self._extract_code_from_redirect(redirect_uri)

        except aiohttp.ClientError as error:
            logger.error(f"Twitter HTTP error: {error}")
        except BlankException:
            raise
        except Exception as error:
            
            logger.error(f"Twitter connection error: {error}")
        return None
    
    
    
async def check_twitter_error_for_invalid_token(error_message: str) -> bool:
    if isinstance(error_message, dict):
        if error_message.get('error_code') == 32 and error_message.get('error_message') == 'Could not authenticate you.':
            logger.error(f"check_twitter_error_for_invalid_token Detected invalid Twitter token (error code 32): {error_message}")
            raise BlankException

    error_str = str(error_message).lower()
    auth_error_keywords = [
        "invalid token",  "401", "403", "could not authenticate you"
    ]
    
    if any(keyword in error_str for keyword in auth_error_keywords):
        logger.error(f"check_twitter_error_for_invalid_token Detected invalid Twitter token: {error_str}")
        raise BlankException
    
    return False