import re

import requests
from loguru import logger

from py_app.exception.error import BlankException


class TwitterAPI:
    def __init__(self, token, ip):
        self.token = token
        self.headers = {
            'authority': 'x.com',
            'cookie': f'auth_token={token}',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'x-twitter-auth-type': 'OAuth2Session',
            'x-twitter-active-user': 'yes',
            "Referer": "https://x.com/",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Connection": "keep-alive",
            'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA' # 固定值
        }
        self.proxies = {"http": ip, "https": ip} if ip else None

    def Sign(self):
        url = 'https://x.com/home'
        response = requests.get(url=url, headers=self.headers, timeout=5, proxies=self.proxies)
        # print(response.status_code)
        cookie = f'auth_token={self.token};'
        for k, v in response.cookies.items():
            cookie += f'{k}={v};'
        self.headers['cookie'] = cookie
        ct0 = response.cookies.get('ct0')
        self.headers['x-csrf-token'] = ct0
        # print(self.headers)

    def CreateRetweet(self, tweet_id):
        """
        转贴
        :param tweet_id:
        :return:
        """
        url = 'https://x.com/i/api/graphql/ojPdsZsimiJrUGLR1sjUtA/CreateRetweet'
        data = {"variables": {"tweet_id": tweet_id, "dark_request": False}, "queryId": "ojPdsZsimiJrUGLR1sjUtA"}
        try:
            response = requests.post(url=url, headers=self.headers, json=data, timeout=5, proxies=self.proxies).text
            if 'You have already retweeted this Tweet' in response:
                return True
            elif 'retweet_results' in response:
                return True
        except Exception as e:
            return False

    def follow(self, follow_id) -> bool:
        url = 'https://x.com/i/api/1.1/friendships/create.json'
        data = f'include_profile_interstitial_type=1&include_blocking=1&include_blocked_by=1&include_followed_by=1&include_want_retweets=1&include_mute_edge=1&include_can_dm=1&include_can_media_tag=1&include_ext_is_blue_verified=1&include_ext_verified_type=1&include_ext_profile_image_shape=1&skip_status=1&user_id={follow_id}'
        for _ in range(5):
            try:
                response = requests.post(url=url, params=data, timeout=5, headers=self.headers,proxies=self.proxies).json()
                print(self.token, response)
                if response.get('id_str') == str(follow_id):
                    return True

                errors = response.get("errors", [])
                for error in errors:
                    if "Could not authenticate you" in error.get("message", ""):
                        raise BlankException

                return  False
            except BlankException :
                raise
            except requests.RequestException as e:
                print(f"Request failed: {e}")

        return False

    def CreateTweet_hui(self, text: str, tweet_id  ):
        """
        回复
        :param address:
        :return:
        """
        url = 'https://x.com/i/api/graphql/oB-5XsHNAbjvARJEc8CZFw/CreateTweet'
        data = {"variables": {"tweet_text": text,
                              "reply": {"in_reply_to_tweet_id": tweet_id, "exclude_reply_user_ids": []},
                              "dark_request": False, "media": {"media_entities": [], "possibly_sensitive": False},
                              "semantic_annotation_ids": []},
                "features": {"communities_web_enable_tweet_community_results_fetch": True,
                             "c9s_tweet_anatomy_moderator_badge_enabled": True,
                             "tweetypie_unmention_optimization_enabled": True,
                             "responsive_web_edit_tweet_api_enabled": True,
                             "graphql_is_translatable_rweb_tweet_is_translatable_enabled": True,
                             "view_counts_everywhere_api_enabled": True,
                             "longform_notetweets_consumption_enabled": True,
                             "responsive_web_twitter_article_tweet_consumption_enabled": True,
                             "tweet_awards_web_tipping_enabled": False,
                             "creator_subscriptions_quote_tweet_preview_enabled": False,
                             "longform_notetweets_rich_text_read_enabled": True,
                             "longform_notetweets_inline_media_enabled": True, "articles_preview_enabled": True,
                             "rweb_video_timestamps_enabled": True, "rweb_tipjar_consumption_enabled": True,
                             "responsive_web_graphql_exclude_directive_enabled": True,
                             "verified_phone_label_enabled": False, "freedom_of_speech_not_reach_fetch_enabled": True,
                             "standardized_nudges_misinfo": True,
                             "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": True,
                             "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
                             "responsive_web_graphql_timeline_navigation_enabled": True,
                             "responsive_web_enhance_cards_enabled": False}, "queryId": "oB-5XsHNAbjvARJEc8CZFw"}
        response = requests.post(url=url, headers=self.headers, json=data, timeout=5, proxies=self.proxies)
        if response.status_code == 200:
            logger.info(response.text)
            return True
        else:
            return False

    def CreateTweet_fa(self, tweet_text):
        """
        发帖
        :param address:
        :return:
        """
        url = 'https://x.com/i/api/graphql/oB-5XsHNAbjvARJEc8CZFw/CreateTweet'
        data = {"variables": {
            "tweet_text": tweet_text,
            "dark_request": False, "media": {"media_entities": [], "possibly_sensitive": False},
            "semantic_annotation_ids": []}, "features": {"communities_web_enable_tweet_community_results_fetch": True,
                                                         "c9s_tweet_anatomy_moderator_badge_enabled": True,
                                                         "tweetypie_unmention_optimization_enabled": True,
                                                         "responsive_web_edit_tweet_api_enabled": True,
                                                         "graphql_is_translatable_rweb_tweet_is_translatable_enabled": True,
                                                         "view_counts_everywhere_api_enabled": True,
                                                         "longform_notetweets_consumption_enabled": True,
                                                         "responsive_web_twitter_article_tweet_consumption_enabled": True,
                                                         "tweet_awards_web_tipping_enabled": False,
                                                         "creator_subscriptions_quote_tweet_preview_enabled": False,
                                                         "longform_notetweets_rich_text_read_enabled": True,
                                                         "longform_notetweets_inline_media_enabled": True,
                                                         "articles_preview_enabled": True,
                                                         "rweb_video_timestamps_enabled": True,
                                                         "rweb_tipjar_consumption_enabled": True,
                                                         "responsive_web_graphql_exclude_directive_enabled": True,
                                                         "verified_phone_label_enabled": False,
                                                         "freedom_of_speech_not_reach_fetch_enabled": True,
                                                         "standardized_nudges_misinfo": True,
                                                         "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": True,
                                                         "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
                                                         "responsive_web_graphql_timeline_navigation_enabled": True,
                                                         "responsive_web_enhance_cards_enabled": False},
                "queryId": "oB-5XsHNAbjvARJEc8CZFw"}
        response = requests.post(url=url, headers=self.headers, json=data, timeout=5, proxies=self.proxies)
        # print(response.json())
        logger.info(f"{response.text}")
        if response.status_code == 200 and "errors" not in response.text:
            return True
        else:
            return False

    def badge_count(self):
        """
        推特是否存活
        :return:
        """
        url = 'https://x.com/i/api/1.1/dm/inbox_initial_state.json?nsfw_filtering_enabled=false&include_profile_interstitial_type=1&include_blocking=1&include_blocked_by=1&include_followed_by=1&include_want_retweets=1&include_mute_edge=1&include_can_dm=1&include_can_media_tag=1&include_ext_is_blue_verified=1&include_ext_verified_type=1&include_ext_profile_image_shape=1&skip_status=1&dm_secret_conversations_enabled=false&krs_registration_enabled=true&cards_platform=Web-12&include_cards=1&include_ext_alt_text=true&include_ext_limited_action_results=true&include_quote_count=true&include_reply_count=1&tweet_mode=extended&include_ext_views=true&dm_users=true&include_groups=true&include_inbox_timelines=true&include_ext_media_color=true&supports_reactions=true&include_ext_edit_control=true&include_ext_business_affiliations_label=true&ext=mediaColor%2CaltText%2CmediaStats%2ChighlightedLabel%2CvoiceInfo%2CbirdwatchPivot%2CsuperFollowMetadata%2CunmentionInfo%2CeditControl%2Carticle'
        response = requests.get(url=url, headers=self.headers, timeout=5, proxies=self.proxies)
        # print(response.status_code)
        if response.status_code == 200:
            return True
        else:
            return False

    def info(self, username: str):
        url = f'https://x.com/i/api/graphql/QGIw94L0abhuohrr76cSbw/UserByScreenName?variables=%7B%22screen_name%22%3A%22{username}%22%7D&features=%7B%22hidden_profile_subscriptions_enabled%22%3Atrue%2C%22profile_label_improvements_pcf_label_in_post_enabled%22%3Afalse%2C%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22subscriptions_verification_info_is_identity_verified_enabled%22%3Atrue%2C%22subscriptions_verification_info_verified_since_enabled%22%3Atrue%2C%22highlights_tweets_tab_ui_enabled%22%3Atrue%2C%22responsive_web_twitter_article_notes_tab_enabled%22%3Atrue%2C%22subscriptions_feature_can_gift_premium%22%3Atrue%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%7D&fieldToggles=%7B%22withAuxiliaryUserLabels%22%3Afalse%7D'
        response = requests.get(url=url, headers=self.headers, timeout=5, proxies=self.proxies)
        # print(response.status_code)
        if response.status_code != 200:
            return False

        return response.json().get('data', {}).get("user", {}).get("result", {})


    # 获取twid
    def gettwid(self):
        url = "https://x.com/home?precache=1"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Cookie': f'auth_token={self.token}'
        }

        response = requests.get(url, headers=headers, proxies=self.proxies)
        if response.status_code != 200:
            logger.error("获取推特twid值失败")
            return None
        match = re.search(r'"user_id"\s*:\s*"(\d+)"', response.text)
        if match:
            user_id = match.group(1)
            return user_id
        return False
