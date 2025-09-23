// Operation.ts

export type OperationDef = {
  variables?: Record<string, string | number | object | any>;
  hash: string;
  operation: string;
};

export class Operation {
  // Timeline & User Operations
  static SearchTimeline: OperationDef = {
    variables: { rawQuery: "string", product: "string" },
    hash: "nK1dw4oV3k4w5TdtcAdSww",
    operation: "SearchTimeline",
  };

  static AudioSpaceById: OperationDef = {
    variables: { id: "string" },
    hash: "fYAuJHiY3TmYdBmrRtIKhA",
    operation: "AudioSpaceById",
  };

  static AudioSpaceSearch: OperationDef = {
    variables: { filter: "string", query: "string" },
    hash: "NTq79TuSz6fHj8lQaferJw",
    operation: "AudioSpaceSearch",
  };

  static UserByScreenName: OperationDef = {
    variables: { screen_name: "string" },
    hash: "sLVLhk0bGj3MVFEKTdax1w",
    operation: "UserByScreenName",
  };

  static UserTweets: OperationDef = {
    hash: "HuTx74BxAnezK1gWvYY7zg",
    operation: "UserTweets",
  };

  static ProfileSpotlightsQuery: OperationDef = {
    variables: { screen_name: "string" },
    hash: "9zwVLJ48lmVUk8u_Gh9DmA",
    operation: "ProfileSpotlightsQuery",
  };

  static UserByRestId: OperationDef = {
    variables: { userId: "number" },
    hash: "GazOglcBvgLigl3ywt6b3Q",
    operation: "UserByRestId",
  };

  static UsersByRestIds: OperationDef = {
    variables: { userIds: "array" },
    hash: "OJBgJQIrij6e3cjqQ3Zu1Q",
    operation: "UsersByRestIds",
  };

  static UserMedia: OperationDef = {
    variables: { userId: "number" },
    hash: "YqiE3JL1KNgf9nSljYdxaA",
    operation: "UserMedia",
  };

  static UserTweetsAndReplies: OperationDef = {
    variables: { userId: "number" },
    hash: "RIWc55YCNyUJ-U3HHGYkdg",
    operation: "UserTweetsAndReplies",
  };

  static TweetResultByRestId: OperationDef = {
    variables: { tweetId: "number" },
    hash: "D_jNhjWZeRZT5NURzfJZSQ",
    operation: "TweetResultByRestId",
  };

  static TweetDetail: OperationDef = {
    hash: "zXaXQgfyR4GxE21uwYQSyA",
    operation: "TweetDetail",
  };

  static TweetStats: OperationDef = {
    variables: { rest_id: "number" },
    hash: "EvbTkPDT-xQCfupPu0rWMA",
    operation: "TweetStats",
  };

  static Likes: OperationDef = {
    variables: { userId: "number" },
    hash: "nXEl0lfN_XSznVMlprThgQ",
    operation: "Likes",
  };

  static Followers: OperationDef = {
    variables: { userId: "number" },
    hash: "pd8Tt1qUz1YWrICegqZ8cw",
    operation: "Followers",
  };

  static Following: OperationDef = {
    variables: { userId: "number" },
    hash: "wjvx62Hye2dGVvnvVco0xA",
    operation: "Following",
  };

  static Retweeters: OperationDef = {
    hash: "0BoJlKAxoNPQUHRftlwZ2w",
    operation: "Retweeters",
  };

  static Favoriters: OperationDef = {
    hash: "XRRjv1-uj1HZn3o324etOQ",
    operation: "Favoriters",
  };

  static ConnectTabTimeline: OperationDef = {
    variables: { context: "object" },
    hash: "lq02A-gEzbLefqTgD_PFzQ",
    operation: "ConnectTabTimeline",
  };

  // Account Operations
  static useSendMessageMutation: OperationDef = {
    hash: "MaxK2PKX1F9Z-9SwqwavTw",
    operation: "useSendMessageMutation",
  };

  static CreateTweet: OperationDef = {
    hash: "7TKRKCPuAGsmYde0CudbVg",
    operation: "CreateTweet",
  };

  static DeleteTweet: OperationDef = {
    hash: "VaenaVgh5q5ih7kvyVjgtg",
    operation: "DeleteTweet",
  };

  static CreateScheduledTweet: OperationDef = {
    hash: "LCVzRQGxOaGnOnYH01NQXg",
    operation: "CreateScheduledTweet",
  };

  static DeleteScheduledTweet: OperationDef = {
    hash: "CTOVqej0JBXAZSwkp1US0g",
    operation: "DeleteScheduledTweet",
  };

  static CreateRetweet: OperationDef = {
    hash: "ojPdsZsimiJrUGLR1sjUtA",
    operation: "CreateRetweet",
  };

  static DeleteRetweet: OperationDef = {
    hash: "iQtK4dl5hBmXewYZuEOKVw",
    operation: "DeleteRetweet",
  };

  static FavoriteTweet: OperationDef = {
    hash: "lI07N6Otwv1PhnEgXILM7A",
    operation: "FavoriteTweet",
  };

  static UnfavoriteTweet: OperationDef = {
    hash: "ZYKSe-w7KEslx3JhSIk5LA",
    operation: "UnfavoriteTweet",
  };

  static CreateBookmark: OperationDef = {
    hash: "aoDbu3RHznuiSkQ9aNM67Q",
    operation: "CreateBookmark",
  };

  static DeleteBookmark: OperationDef = {
    hash: "Wlmlj2-xzyS1GN3a6cj-mQ",
    operation: "DeleteBookmark",
  };

  static CreateList: OperationDef = {
    hash: "hQAsnViq2BrMLbPuQ9umDA",
    operation: "CreateList",
  };

  static UpdateList: OperationDef = {
    hash: "4dCEFWtxEbhnSLcJdJ6PNg",
    operation: "UpdateList",
  };

  static ListsPinMany: OperationDef = {
    hash: "2X4Vqu6XLneR-XZnGK5MAw",
    operation: "ListsPinMany",
  };

  static ListPinOne: OperationDef = {
    hash: "2pYlo-kjdXoNOZJoLzI6KA",
    operation: "ListPinOne",
  };

  static ListUnpinOne: OperationDef = {
    hash: "c4ce-hzx6V4heV5IzdeBkA",
    operation: "ListUnpinOne",
  };

  static ListAddMember: OperationDef = {
    hash: "P8tyfv2_0HzofrB5f6_ugw",
    operation: "ListAddMember",
  };

  static ListRemoveMember: OperationDef = {
    hash: "DBZowzFN492FFkBPBptCwg",
    operation: "ListRemoveMember",
  };

  static DeleteList: OperationDef = {
    hash: "UnN9Th1BDbeLjpgjGSpL3Q",
    operation: "DeleteList",
  };

  static EditListBanner: OperationDef = {
    hash: "Uk0ZwKSMYng56aQdeJD1yw",
    operation: "EditListBanner",
  };

  static DeleteListBanner: OperationDef = {
    hash: "-bOKetDVCMl20qXn7YDXIA",
    operation: "DeleteListBanner",
  };

  static TopicFollow: OperationDef = {
    hash: "ElqSLWFmsPL4NlZI5e1Grg",
    operation: "TopicFollow",
  };

  static TopicUnfollow: OperationDef = {
    hash: "srwjU6JM_ZKTj_QMfUGNcw",
    operation: "TopicUnfollow",
  };

  static HomeLatestTimeline: OperationDef = {
    hash: "zhX91JE87mWvfprhYE97xA",
    operation: "HomeLatestTimeline",
  };

  static HomeTimeline: OperationDef = {
    hash: "HCosKfLNW1AcOo3la3mMgg",
    operation: "HomeTimeline",
  };

  static Bookmarks: OperationDef = {
    hash: "tmd4ifV8RHltzn8ymGg1aw",
    operation: "Bookmarks",
  };

  // Misc / Not Implemented
  static AdAccounts: OperationDef = {
    hash: "a8KxGfFQAmm3WxqemuqSRA",
    operation: "AdAccounts",
  };

  static ArticleTimeline: OperationDef = {
    hash: "o9FyvnC-xg8mVBXqL4g-rg",
    operation: "ArticleTimeline",
  };

  static ArticleTweetsTimeline: OperationDef = {
    hash: "x4ywSpvg6BesoDszkfbFQg",
    operation: "ArticleTweetsTimeline",
  };

  static AudienceEstimate: OperationDef = {
    hash: "1LYVUabJBYkPlUAWRabB3g",
    operation: "AudienceEstimate",
  };

  static AuthenticatedUserTFLists: OperationDef = {
    hash: "QjN8ZdavFDqxUjNn3r9cig",
    operation: "AuthenticatedUserTFLists",
  };

  static BirdwatchAliasSelect: OperationDef = {
    hash: "3ss48WFwGokBH_gj8t_8aQ",
    operation: "BirdwatchAliasSelect",
  };

  static BirdwatchCreateAppeal: OperationDef = {
    hash: "TKdL0YFsX4DMOpMKeneLvA",
    operation: "BirdwatchCreateAppeal",
  };

  static BirdwatchCreateNote: OperationDef = {
    hash: "36EUZZyaciVmNrq4CRZcmw",
    operation: "BirdwatchCreateNote",
  };

  static BirdwatchCreateRating: OperationDef = {
    hash: "bD3AEK9BMCSpRods_ng2fA",
    operation: "BirdwatchCreateRating",
  };

  static BirdwatchDeleteNote: OperationDef = {
    hash: "IKS_qrShkDyor6Ri1ahd9g",
    operation: "BirdwatchDeleteNote",
  };

  static BirdwatchDeleteRating: OperationDef = {
    hash: "OpvCOyOoQClUND66zDzrnA",
    operation: "BirdwatchDeleteRating",
  };

  static BirdwatchEditNotificationSettings: OperationDef = {
    hash: "FLgLReVIssXjB_ui3wcrRQ",
    operation: "BirdwatchEditNotificationSettings",
  };

  static BirdwatchFetchAliasSelfSelectOptions: OperationDef = {
    hash: "szoXMke8AZOErso908iglw",
    operation: "BirdwatchFetchAliasSelfSelectOptions",
  };

  static BirdwatchFetchAliasSelfSelectStatus: OperationDef = {
    hash: "LUEdtkcpBlGktUtms4BvwA",
    operation: "BirdwatchFetchAliasSelfSelectStatus",
  };

  static BirdwatchFetchAuthenticatedUserProfile: OperationDef = {
    hash: "pMbW6Y4LuS5MzlSOEqERJQ",
    operation: "BirdwatchFetchAuthenticatedUserProfile",
  };

  static BirdwatchFetchBirdwatchProfile: OperationDef = {
    hash: "btgGtchypc3D491MJ7XXWA",
    operation: "BirdwatchFetchBirdwatchProfile",
  };

  static BirdwatchFetchContributorNotesSlice: OperationDef = {
    hash: "t6r3Wq7wripUW9gB3FQNBw",
    operation: "BirdwatchFetchContributorNotesSlice",
  };

  static BirdwatchFetchGlobalTimeline: OperationDef = {
    hash: "L3LftPt6fhYqoQ5Vnxm7UQ",
    operation: "BirdwatchFetchGlobalTimeline",
  };

  static BirdwatchFetchNotes: OperationDef = {
    hash: "ZGMhf1M7kPKMOhEk1nz0Yw",
    operation: "BirdwatchFetchNotes",
  };

  static BirdwatchFetchOneNote: OperationDef = {
    hash: "GO8BR2MM2WZB63cdOoC7lw",
    operation: "BirdwatchFetchOneNote",
  };

  static BirdwatchFetchPublicData: OperationDef = {
    hash: "9bDdJ6AL26RLkcUShEcF-A",
    operation: "BirdwatchFetchPublicData",
  };

  static BirdwatchProfileAcknowledgeEarnOut: OperationDef = {
    hash: "cED9wJy8Nd1kZCCYuIq9zQ",
    operation: "BirdwatchProfileAcknowledgeEarnOut",
  };

  static BizProfileFetchUser: OperationDef = {
    hash: "6OFpJ3TH3p8JpwOSgfgyhg",
    operation: "BizProfileFetchUser",
  };

  static BlockedAccountsAll: OperationDef = {
    hash: "h52d1F7dumWGE1tJAhQBpg",
    operation: "BlockedAccountsAll",
  };

  static BlockedAccountsAutoBlock: OperationDef = {
    hash: "8w-D2OhT0jmGzXaNY--UQA",
    operation: "BlockedAccountsAutoBlock",
  };

  static BlockedAccountsImported: OperationDef = {
    hash: "8LDNeOEm0kA98uoDsqXvMg",
    operation: "BlockedAccountsImported",
  };

  static BookmarkFolderTimeline: OperationDef = {
    hash: "13H7EUATwethsj-XxX5ohw",
    operation: "BookmarkFolderTimeline",
  };

  static BookmarkFoldersSlice: OperationDef = {
    hash: "i78YDd0Tza-dV4SYs58kRg",
    operation: "BookmarkFoldersSlice",
  };

  static BookmarksAllDelete: OperationDef = {
    hash: "skiACZKC1GDYli-M8RzEPQ",
    operation: "BookmarksAllDelete",
  };

  static Budgets: OperationDef = {
    hash: "mbK3oSQotwcJXyQIBE3uYw",
    operation: "Budgets",
  };

  static CardPreviewByTweetText: OperationDef = {
    hash: "jnwTSDR-Eo_HWlSkXPcMGA",
    operation: "CardPreviewByTweetText",
  };

  static CheckTweetForNudge: OperationDef = {
    hash: "C2dcvh7H69JALtomErxWlA",
    operation: "CheckTweetForNudge",
  };

  static CombinedLists: OperationDef = {
    hash: "rIxum3avpCu7APi7mxTNjw",
    operation: "CombinedLists",
  };

  static CommunitiesMainDiscoveryModule: OperationDef = {
    hash: "8UB2fhB8TiYIW2M6vbBFXg",
    operation: "CommunitiesMainDiscoveryModule",
  };

  static CommunitiesMainPageTimeline: OperationDef = {
    hash: "DzcxPzkGYVQk-BD0pqAcZw",
    operation: "CommunitiesMainPageTimeline",
  };

  static CommunitiesMembershipsSlice: OperationDef = {
    hash: "s8-oxdVsoJ3w2CFD0nFt9g",
    operation: "CommunitiesMembershipsSlice",
  };

  static CommunitiesMembershipsTimeline: OperationDef = {
    hash: "QXo-eKTsvhpCyFotNz2u6g",
    operation: "CommunitiesMembershipsTimeline",
  };

  static CommunityAboutTimeline: OperationDef = {
    hash: "plOgdpBzpVVQbTOEVuRc_A",
    operation: "CommunityAboutTimeline",
  };

  static CommunityByRestId: OperationDef = {
    hash: "bCVwRBDPi15jrdJQ7NCENQ",
    operation: "CommunityByRestId",
  };

  static CommunityCreateRule: OperationDef = {
    hash: "dShPoN6voXRusgxC1uvGog",
    operation: "CommunityCreateRule",
  };

  static CommunityDiscoveryTimeline: OperationDef = {
    hash: "b3rceNUXWRyo5mSwVZF74Q",
    operation: "CommunityDiscoveryTimeline",
  };

  static CommunityEditBannerMedia: OperationDef = {
    hash: "KVkZwp8Q6xy6iyhlQE5d7Q",
    operation: "CommunityEditBannerMedia",
  };

  static CommunityEditName: OperationDef = {
    hash: "SKToKhvm3Z4Rir8ENCJ3YQ",
    operation: "CommunityEditName",
  };

  static CommunityEditPurpose: OperationDef = {
    hash: "eMat-u2kx6KocreGTAt-hA",
    operation: "CommunityEditPurpose",
  };

  static CommunityEditRule: OperationDef = {
    hash: "9nEl5bNcdteuPGbGCdvEFA",
    operation: "CommunityEditRule",
  };

  static CommunityEditTheme: OperationDef = {
    hash: "4OhW6gWJwiu-JTAgBPsU1w",
    operation: "CommunityEditTheme",
  };

  static CommunityHashtagsTimeline: OperationDef = {
    hash: "hril1TsnshopHbmnjdUmhQ",
    operation: "CommunityHashtagsTimeline",
  };

  static CommunityMemberRelationshipTypeahead: OperationDef = {
    hash: "NEwac2-8ONgf0756ne8oXA",
    operation: "CommunityMemberRelationshipTypeahead",
  };

  static CommunityModerationKeepTweet: OperationDef = {
    hash: "f_YqrHSCc1mPlG-aB7pFRw",
    operation: "CommunityModerationKeepTweet",
  };

  static CommunityModerationTweetCasesSlice: OperationDef = {
    hash: "V-iC7tjWOlzBJ44SanqGzw",
    operation: "CommunityModerationTweetCasesSlice",
  };

  static CommunityRemoveBannerMedia: OperationDef = {
    hash: "lSdK1v30qVhm37rDTgHq0Q",
    operation: "CommunityRemoveBannerMedia",
  };

  static CommunityRemoveRule: OperationDef = {
    hash: "EI_g43Ss_Ixg0EC4K7nzlQ",
    operation: "CommunityRemoveRule",
  };

  static CommunityReorderRules: OperationDef = {
    hash: "VwluNMGnl5uaNZ3LnlCQ_A",
    operation: "CommunityReorderRules",
  };

  static CommunityTweetsRankedTimeline: OperationDef = {
    hash: "P38EspBBPhAfSKPP74-s2Q",
    operation: "CommunityTweetsRankedTimeline",
  };

  static CommunityTweetsTimeline: OperationDef = {
    hash: "2JgHOlqfeLusxAT0yGQJjg",
    operation: "CommunityTweetsTimeline",
  };

  static CommunityUpdateRole: OperationDef = {
    hash: "5eq76kkUqfdCzInCtcxQOA",
    operation: "CommunityUpdateRole",
  };

  static CommunityUserInvite: OperationDef = {
    hash: "x8hUNaBCOV2tSalqB9cwWQ",
    operation: "CommunityUserInvite",
  };

  static CommunityUserRelationshipTypeahead: OperationDef = {
    hash: "gi_UGcUurYp6N6p2BaLJqQ",
    operation: "CommunityUserRelationshipTypeahead",
  };

  static ConversationControlChange: OperationDef = {
    hash: "hb1elGcj6769uT8qVYqtjw",
    operation: "ConversationControlChange",
  };

  static ConversationControlDelete: OperationDef = {
    hash: "OoMO_aSZ1ZXjegeamF9QmA",
    operation: "ConversationControlDelete",
  };

  static ConvertRitoSuggestedActions: OperationDef = {
    hash: "2njnYoE69O2jdUM7KMEnDw",
    operation: "ConvertRitoSuggestedActions",
  };

  static Coupons: OperationDef = {
    hash: "R1h43jnAl2bsDoUkgZb7NQ",
    operation: "Coupons",
  };

  static CreateCommunity: OperationDef = {
    hash: "lRjZKTRcWuqwtYwCWGy9_w",
    operation: "CreateCommunity",
  };

  static CreateCustomerPortalSession: OperationDef = {
    hash: "2LHXrd1uYeaMWhciZgPZFw",
    operation: "CreateCustomerPortalSession",
  };
  static CreateDraftTweet: OperationDef = {
    hash: "cH9HZWz_EW9gnswvA4ZRiQ",
    operation: "CreateDraftTweet",
  };

  static CreateNoteTweet: OperationDef = {
    hash: "Pyx6nga4XtTVhfTh1gtX1A",
    operation: "CreateNoteTweet",
  };

  static CreateQuickPromotion: OperationDef = {
    hash: "oDSoVgHhJxnd5IkckgPZdg",
    operation: "CreateQuickPromotion",
  };

  static CreateTrustedFriendsList: OperationDef = {
    hash: "2tP8XUYeLHKjq5RHvuvpZw",
    operation: "CreateTrustedFriendsList",
  };

  static CreateTweetDownvote: OperationDef = {
    hash: "Eo65jl-gww30avDgrXvhUA",
    operation: "CreateTweetDownvote",
  };

  static CreateTweetReaction: OperationDef = {
    hash: "D7M6X3h4-mJE8UB1Ap3_dQ",
    operation: "CreateTweetReaction",
  };

  static DataSaverMode: OperationDef = {
    hash: "xF6sXnKJfS2AOylzxRjf6A",
    operation: "DataSaverMode",
  };

  static DeleteBookmarkFolder: OperationDef = {
    hash: "2UTTsO-6zs93XqlEUZPsSg",
    operation: "DeleteBookmarkFolder",
  };

  static DeleteDraftTweet: OperationDef = {
    hash: "bkh9G3FGgTldS9iTKWWYYw",
    operation: "DeleteDraftTweet",
  };

  static DeletePaymentMethod: OperationDef = {
    hash: "VaaLGwK5KNLoc7wsOmp4uw",
    operation: "DeletePaymentMethod",
  };

  static DeleteTweetDownvote: OperationDef = {
    hash: "VNEvEGXaUAMfiExP8Tbezw",
    operation: "DeleteTweetDownvote",
  };

  static DeleteTweetReaction: OperationDef = {
    hash: "GKwK0Rj4EdkfwdHQMZTpuw",
    operation: "DeleteTweetReaction",
  };

  static DisableUserAccountLabel: OperationDef = {
    hash: "_ckHEj05gan2VfNHG6thBA",
    operation: "DisableUserAccountLabel",
  };

  static DisableVerifiedPhoneLabel: OperationDef = {
    hash: "g2m0pAOamawNtVIfjXNMJg",
    operation: "DisableVerifiedPhoneLabel",
  };

  static DismissRitoSuggestedAction: OperationDef = {
    hash: "jYvwa61cv3NwNP24iUru6g",
    operation: "DismissRitoSuggestedAction",
  };

  static DmAllSearchSlice: OperationDef = {
    hash: "U-QXVRZ6iddb1QuZweh5DQ",
    operation: "DmAllSearchSlice",
  };

  static DmGroupSearchSlice: OperationDef = {
    hash: "5zpY1dCR-8NyxQJS_CFJoQ",
    operation: "DmGroupSearchSlice",
  };

  static DmMutedTimeline: OperationDef = {
    hash: "lrcWa13oyrQc7L33wRdLAQ",
    operation: "DmMutedTimeline",
  };

  static DMMessageDeleteMutation: OperationDef = {
    hash: "BJ6DtxA2llfjnRoRjaiIiw",
    operation: "DMMessageDeleteMutation",
  };

  static DmNsfwMediaFilterUpdate: OperationDef = {
    hash: "of_N6O33zfyD4qsFJMYFxA",
    operation: "DmNsfwMediaFilterUpdate",
  };

  static DmPeopleSearchSlice: OperationDef = {
    hash: "xYSm8m5kJnzm_gFCn5GH-w",
    operation: "DmPeopleSearchSlice",
  };

  static EditBookmarkFolder: OperationDef = {
    hash: "a6kPp1cS1Dgbsjhapz1PNw",
    operation: "EditBookmarkFolder",
  };

  static EditDraftTweet: OperationDef = {
    hash: "JIeXE-I6BZXHfxsgOkyHYQ",
    operation: "EditDraftTweet",
  };

  static EditScheduledTweet: OperationDef = {
    hash: "_mHkQ5LHpRRjSXKOcG6eZw",
    operation: "EditScheduledTweet",
  };

  static EnableLoggedOutWebNotifications: OperationDef = {
    hash: "BqIHKmwZKtiUBPi07jKctg",
    operation: "EnableLoggedOutWebNotifications",
  };

  static EnableVerifiedPhoneLabel: OperationDef = {
    hash: "C3RJFfMsb_KcEytpKmRRkw",
    operation: "EnableVerifiedPhoneLabel",
  };

  static EnrollCoupon: OperationDef = {
    hash: "SOyGmNGaEXcvk15s5bqDrA",
    operation: "EnrollCoupon",
  };

  static ExplorePage: OperationDef = {
    hash: "fkypGKlR9Xz9kLvUZDLoXw",
    operation: "ExplorePage",
  };

  static FeatureSettingsUpdate: OperationDef = {
    hash: "-btar_vkBwWA7s3YWfp_9g",
    operation: "FeatureSettingsUpdate",
  };

  static FetchDraftTweets: OperationDef = {
    hash: "ZkqIq_xRhiUme0PBJNpRtg",
    operation: "FetchDraftTweets",
  };

  static FetchScheduledTweets: OperationDef = {
    hash: "ITtjAzvlZni2wWXwf295Qg",
    operation: "FetchScheduledTweets",
  };

  static FollowersYouKnow: OperationDef = {
    hash: "RvojYJJB90VwJ0rdVhbjMQ",
    operation: "FollowersYouKnow",
  };

  static ForYouExplore: OperationDef = {
    hash: "wVEXnyTWzQlEsIuLq_D3tw",
    operation: "ForYouExplore",
  };

  static GenericTimelineById: OperationDef = {
    hash: "LZfAdxTdNolKXw6ZkoY_kA",
    operation: "GenericTimelineById",
  };

  static GetSafetyModeSettings: OperationDef = {
    hash: "AhxTX0lkbIos4WG53xwzSA",
    operation: "GetSafetyModeSettings",
  };

  static GetTweetReactionTimeline: OperationDef = {
    hash: "ihIcULrtrtPGlCuprduRrA",
    operation: "GetTweetReactionTimeline",
  };

  static GetUserClaims: OperationDef = {
    hash: "lFi3xnx0auUUnyG4YwpCNw",
    operation: "GetUserClaims",
  };

  static GraphQLError: OperationDef = {
    hash: "2V2W3HIBuMW83vEMtfo_Rg",
    operation: "GraphQLError",
  };

  static ImmersiveMedia: OperationDef = {
    hash: "UGQD_VslAJBJ4XzigsBYAA",
    operation: "ImmersiveMedia",
  };

  static JoinCommunity: OperationDef = {
    hash: "PXO-mA1KfmLqB9I6R-lOng",
    operation: "JoinCommunity",
  };

  static LeaveCommunity: OperationDef = {
    hash: "AtiTdhEyRN8ruNFW069ewQ",
    operation: "LeaveCommunity",
  };

  static ListByRestId: OperationDef = {
    hash: "wXzyA5vM_aVkBL9G8Vp3kw",
    operation: "ListByRestId",
  };

  static ListBySlug: OperationDef = {
    hash: "3-E3eSWorCv24kYkK3CCiQ",
    operation: "ListBySlug",
  };

  static ListCreationRecommendedUsers: OperationDef = {
    hash: "Zf8ZwG57EKtss-rPlryIqg",
    operation: "ListCreationRecommendedUsers",
  };

  static ListEditRecommendedUsers: OperationDef = {
    hash: "-F4wsOirYNXjjg-ZjccQpQ",
    operation: "ListEditRecommendedUsers",
  };

  static ListLatestTweetsTimeline: OperationDef = {
    hash: "2TemLyqrMpTeAmysdbnVqw",
    operation: "ListLatestTweetsTimeline",
  };

  static ListMembers: OperationDef = {
    hash: "vA952kfgGw6hh8KatWnbqw",
    operation: "ListMembers",
  };

  static ListMemberships: OperationDef = {
    hash: "BlEXXdARdSeL_0KyKHHvvg",
    operation: "ListMemberships",
  };

  static ListOwnerships: OperationDef = {
    hash: "wQcOSjSQ8NtgxIwvYl1lMg",
    operation: "ListOwnerships",
  };

  static ListPins: OperationDef = {
    hash: "J0JOhmi8HSsle8LfSWv0cw",
    operation: "ListPins",
  };

  static ListProductSubscriptions: OperationDef = {
    hash: "wwdBYgScze0_Jnan79jEUw",
    operation: "ListProductSubscriptions",
  };

  static ListRankedTweetsTimeline: OperationDef = {
    hash: "07lytXX9oG9uCld1RY4b0w",
    operation: "ListRankedTweetsTimeline",
  };

  static ListSubscribe: OperationDef = {
    hash: "FjvrQI3k-97JIUbEE6Gxcw",
    operation: "ListSubscribe",
  };

  static ListSubscribers: OperationDef = {
    hash: "e57wIELAAe0fYt4Hmqsk6g",
    operation: "ListSubscribers",
  };

  static ListUnsubscribe: OperationDef = {
    hash: "bXyvW9HoS_Omy4ADhexj8A",
    operation: "ListUnsubscribe",
  };

  static ListsDiscovery: OperationDef = {
    hash: "ehnzbxPHA69pyaV2EydN1g",
    operation: "ListsDiscovery",
  };

  static ListsManagementPageTimeline: OperationDef = {
    hash: "nhYp4n09Hi5n2hQWseQztg",
    operation: "ListsManagementPageTimeline",
  };

  static LiveCommerceItemsSlice: OperationDef = {
    hash: "-lnNX56S2YrZYrLzbccFAQ",
    operation: "LiveCommerceItemsSlice",
  };

  static ModerateTweet: OperationDef = {
    hash: "pjFnHGVqCjTcZol0xcBJjw",
    operation: "ModerateTweet",
  };

  static ModeratedTimeline: OperationDef = {
    hash: "hnaqw2Vok5OETdBVa_uexw",
    operation: "ModeratedTimeline",
  };

  static MuteList: OperationDef = {
    hash: "ZYyanJsskNUcltu9bliMLA",
    operation: "MuteList",
  };

  static MutedAccounts: OperationDef = {
    hash: "-G9eXTmseyiSenbqjrEG6w",
    operation: "MutedAccounts",
  };

  static NoteworthyAccountsPage: OperationDef = {
    hash: "3fOJzEwYMnVyzwgLTLIBkw",
    operation: "NoteworthyAccountsPage",
  };

  static PaymentMethods: OperationDef = {
    hash: "mPF_G9okpbZuLcD6mN8K9g",
    operation: "PaymentMethods",
  };

  static PinReply: OperationDef = {
    hash: "GA2_1uKP9b_GyR4MVAQXAw",
    operation: "PinReply",
  };

  static ProfileUserPhoneState: OperationDef = {
    hash: "5kUWP8C1hcd6omvg6HXXTQ",
    operation: "ProfileUserPhoneState",
  };

  static PutClientEducationFlag: OperationDef = {
    hash: "IjQ-egg0uPkY11NyPMfRMQ",
    operation: "PutClientEducationFlag",
  };

  static QuickPromoteEligibility: OperationDef = {
    hash: "LtpCXh66W-uXh7u7XSRA8Q",
    operation: "QuickPromoteEligibility",
  };

  static RemoveFollower: OperationDef = {
    hash: "QpNfg0kpPRfjROQ_9eOLXA",
    operation: "RemoveFollower",
  };

  static RemoveTweetFromBookmarkFolder: OperationDef = {
    hash: "2Qbj9XZvtUvyJB4gFwWfaA",
    operation: "RemoveTweetFromBookmarkFolder",
  };

  static RequestToJoinCommunity: OperationDef = {
    hash: "6G66cW5zuxPXmHOeBOjF2w",
    operation: "RequestToJoinCommunity",
  };

  static RitoActionedTweetsTimeline: OperationDef = {
    hash: "px9Zbs48D-YdQPEROK6-nA",
    operation: "RitoActionedTweetsTimeline",
  };

  static RitoFlaggedAccountsTimeline: OperationDef = {
    hash: "lMzaBZHIbD6GuPqJJQubMg",
    operation: "RitoFlaggedAccountsTimeline",
  };

  static RitoFlaggedTweetsTimeline: OperationDef = {
    hash: "iCuXMibh6yj9AelyjKXDeA",
    operation: "RitoFlaggedTweetsTimeline",
  };

  static RitoSuggestedActionsFacePile: OperationDef = {
    hash: "GnQKeEdL1LyeK3dTQCS1yw",
    operation: "RitoSuggestedActionsFacePile",
  };

  static SetDefault: OperationDef = {
    hash: "QEMLEzEMzoPNbeauKCCLbg",
    operation: "SetDefault",
  };

  static SetSafetyModeSettings: OperationDef = {
    hash: "qSJIPIpf4gA7Wn21bT3D4w",
    operation: "SetSafetyModeSettings",
  };

  static SharingAudiospacesListeningDataWithFollowersUpdate: OperationDef = {
    hash: "5h0kNbk3ii97rmfY6CdgAA",
    operation: "SharingAudiospacesListeningDataWithFollowersUpdate",
  };

  static SubscribeToScheduledSpace: OperationDef = {
    hash: "Sxn4YOlaAwEKjnjWV0h7Mw",
    operation: "SubscribeToScheduledSpace",
  };

  static SubscriptionCheckoutUrlWithEligibility: OperationDef = {
    hash: "hKfOOObQr5JmfmxW0YtPvg",
    operation: "SubscriptionCheckoutUrlWithEligibility",
  };

  static SubscriptionProductDetails: OperationDef = {
    hash: "f0dExZDmFWFSWMCPQSAemQ",
    operation: "SubscriptionProductDetails",
  };

  static SubscriptionProductFeaturesFetch: OperationDef = {
    hash: "Me2CVcAXxvK2WMr-Nh_Qqg",
    operation: "SubscriptionProductFeaturesFetch",
  };

  static SuperFollowers: OperationDef = {
    hash: "o0YtPFnd4Lk_pOQb9alCvA",
    operation: "SuperFollowers",
  };

  static TopicByRestId: OperationDef = {
    hash: "4OUZZOonV2h60I0wdlQb_w",
    operation: "TopicByRestId",
  };

  static TopicLandingPage: OperationDef = {
    hash: "mAKQjs1kyTS75VLZzuIXXw",
    operation: "TopicLandingPage",
  };

  static TopicNotInterested: OperationDef = {
    hash: "cPCFdDAaqRjlMRYInZzoDA",
    operation: "TopicNotInterested",
  };

  static TopicToFollowSidebar: OperationDef = {
    hash: "RPWVYYupHVZkJOnokbt2cw",
    operation: "TopicToFollowSidebar",
  };

  static TopicUndoNotInterested: OperationDef = {
    hash: "4tVnt6FoSxaX8L-mDDJo4Q",
    operation: "TopicUndoNotInterested",
  };

  static TopicsManagementPage: OperationDef = {
    hash: "Jvdjpe8qzsJD84BpK3qdkQ",
    operation: "TopicsManagementPage",
  };

  static TopicsPickerPage: OperationDef = {
    hash: "UvG-XXtWNcJN1LzF0u3ByA",
    operation: "TopicsPickerPage",
  };

  static TopicsPickerPageById: OperationDef = {
    hash: "t6kH4v2c_VzWKljc2yNwHA",
    operation: "TopicsPickerPageById",
  };

  static TrustedFriendsTypeahead: OperationDef = {
    hash: "RRnOwHttRGscWKC1zY9VRA",
    operation: "TrustedFriendsTypeahead",
  };

  static TweetEditHistory: OperationDef = {
    hash: "8eaWKjHszkS-G_hprUd9AA",
    operation: "TweetEditHistory",
  };

  static TwitterArticleByRestId: OperationDef = {
    hash: "hwrvh-Qt24lcprL-BDfqRA",
    operation: "TwitterArticleByRestId",
  };

  static TwitterArticleCreate: OperationDef = {
    hash: "aV-sm-IkvwplcxdYDoLZHQ",
    operation: "TwitterArticleCreate",
  };

  static TwitterArticleDelete: OperationDef = {
    hash: "6st-stMDc7KBqLT8KvWhHg",
    operation: "TwitterArticleDelete",
  };

  static TwitterArticleUpdateCoverImage: OperationDef = {
    hash: "fpcVRSAsjvkwmCiN1HheqQ",
    operation: "TwitterArticleUpdateCoverImage",
  };

  static TwitterArticleUpdateData: OperationDef = {
    hash: "XpBTYp_QXwyZ0XT0JXCBJw",
    operation: "TwitterArticleUpdateData",
  };

  static TwitterArticleUpdateMedia: OperationDef = {
    hash: "3ojmmegfBC_oHyrmPhxj-g",
    operation: "TwitterArticleUpdateMedia",
  };

  static TwitterArticleUpdateTitle: OperationDef = {
    hash: "dvH6Ql989I4e5jWEV7HfaQ",
    operation: "TwitterArticleUpdateTitle",
  };

  static TwitterArticleUpdateVisibility: OperationDef = {
    hash: "8M35gHyfpcy3S4UXejUGfA",
    operation: "TwitterArticleUpdateVisibility",
  };

  static TwitterArticlesSlice: OperationDef = {
    hash: "UUPSi_aS8_kHDFTWqSBPUA",
    operation: "TwitterArticlesSlice",
  };

  static UnmentionUserFromConversation: OperationDef = {
    hash: "xVW9j3OqoBRY9d6_2OONEg",
    operation: "UnmentionUserFromConversation",
  };

  static UnmoderateTweet: OperationDef = {
    hash: "pVSyu6PA57TLvIE4nN2tsA",
    operation: "UnmoderateTweet",
  };

  static UnmuteList: OperationDef = {
    hash: "pMZrHRNsmEkXgbn3tOyr7Q",
    operation: "UnmuteList",
  };

  static UnpinReply: OperationDef = {
    hash: "iRe6ig5OV1EzOtldNIuGDQ",
    operation: "UnpinReply",
  };

  static UnsubscribeFromScheduledSpace: OperationDef = {
    hash: "Zevhh76Msw574ZSs2NQHGQ",
    operation: "UnsubscribeFromScheduledSpace",
  };

  static UrtFixtures: OperationDef = {
    hash: "I_0j1mjMwv94SdS66S4pqw",
    operation: "UrtFixtures",
  };

  static UserAboutTimeline: OperationDef = {
    hash: "dm7ReTFJoeU0qkiZCO1E1g",
    operation: "UserAboutTimeline",
  };

  static UserAccountLabel: OperationDef = {
    hash: "rD5gLxVmMvtdtYU1UHWlFQ",
    operation: "UserAccountLabel",
  };

  static UserBusinessProfileTeamTimeline: OperationDef = {
    hash: "dq1eUCn3N8v0BywlP4nT7A",
    operation: "UserBusinessProfileTeamTimeline",
  };

  static UserPromotableTweets: OperationDef = {
    hash: "jF-OgMv-9vAym3JaCPUnhQ",
    operation: "UserPromotableTweets",
  };

  static UserSessionsList: OperationDef = {
    hash: "vJ-XatpmQSG8bDch8-t9Jw",
    operation: "UserSessionsList",
  };

  static UserSuperFollowTweets: OperationDef = {
    hash: "1by3q8-AJWdNYhtltjlPTQ",
    operation: "UserSuperFollowTweets",
  };

  static Viewer: OperationDef = {
    hash: "okNaf-6AQWu2DD2H_MAoVw",
    operation: "Viewer",
  };

  static ViewerEmailSettings: OperationDef = {
    hash: "JpjlNgn4sLGvS6tgpTzYBg",
    operation: "ViewerEmailSettings",
  };

  static ViewerTeams: OperationDef = {
    hash: "D8mVcJSVv66_3NcR7fOf6g",
    operation: "ViewerTeams",
  };

  static ViewingOtherUsersTopicsPage: OperationDef = {
    hash: "tYXo6h_rpnHXbdLUFMatZA",
    operation: "ViewingOtherUsersTopicsPage",
  };

  static WriteDataSaverPreferences: OperationDef = {
    hash: "H03etWvZGz41YASxAU2YPg",
    operation: "WriteDataSaverPreferences",
  };

  static WriteEmailNotificationSettings: OperationDef = {
    hash: "2qKKYFQift8p5-J1k6kqxQ",
    operation: "WriteEmailNotificationSettings",
  };

  static adFreeArticleDomains: OperationDef = {
    hash: "zwTrX9CtnMvWlBXjsx95RQ",
    operation: "adFreeArticleDomains",
  };

  static articleNudgeDomains: OperationDef = {
    hash: "88Bu08U2ddaVVjKmmXjVYg",
    operation: "articleNudgeDomains",
  };

  static bookmarkTweetToFolder: OperationDef = {
    hash: "4KHZvvNbHNf07bsgnL9gWA",
    operation: "bookmarkTweetToFolder",
  };

  static createBookmarkFolder: OperationDef = {
    hash: "6Xxqpq8TM_CREYiuof_h5w",
    operation: "createBookmarkFolder",
  };

  static getAltTextPromptPreference: OperationDef = {
    hash: "PFIxTk8owMoZgiMccP0r4g",
    operation: "getAltTextPromptPreference",
  };

  static getCaptionsAlwaysDisplayPreference: OperationDef = {
    hash: "BwgMOGpOViDS0ri7VUgglg",
    operation: "getCaptionsAlwaysDisplayPreference",
  };

  static timelinesFeedback: OperationDef = {
    hash: "vfVbgvTPTQ-dF_PQ5lD1WQ",
    operation: "timelinesFeedback",
  };

  static updateAltTextPromptPreference: OperationDef = {
    hash: "aQKrduk_DA46XfOQDkcEng",
    operation: "updateAltTextPromptPreference",
  };

  static updateCaptionsAlwaysDisplayPreference: OperationDef = {
    hash: "uCUQhvZ5sJ9qHinRp6CFlQ",
    operation: "updateCaptionsAlwaysDisplayPreference",
  };

  static default_variables = {
    count: 1000,
    withSafetyModeUserFields: true,
    includePromotedContent: true,
    withQuickPromoteEligibilityTweetFields: true,
    withVoice: true,
    withV2Timeline: true,
    withDownvotePerspective: false,
    withBirdwatchNotes: true,
    withCommunity: true,
    withSuperFollowsUserFields: true,
    withReactionsMetadata: false,
    withReactionsPerspective: false,
    withSuperFollowsTweetFields: true,
    isMetatagsQuery: false,
    withReplays: true,
    withClientEventToken: false,
    withAttachments: true,
    withConversationQueryHighlights: true,
    withMessageQueryHighlights: true,
    withMessages: true,
  };
  static default_features = {
    blue_business_profile_image_shape_enabled: true,
    creator_subscriptions_tweet_preview_api_enabled: true,
    freedom_of_speech_not_reach_fetch_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    graphql_timeline_v2_bookmark_timeline: true,
    hidden_profile_likes_enabled: true,
    highlights_tweets_tab_ui_enabled: true,
    interactive_text_enabled: true,
    longform_notetweets_consumption_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_richtext_consumption_enabled: true,
    profile_foundations_tweet_stats_enabled: true,
    profile_foundations_tweet_stats_tweet_frequency: true,
    responsive_web_birdwatch_note_limit_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    responsive_web_enhance_cards_enabled: false,
    responsive_web_graphql_exclude_directive_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_media_download_video_enabled: false,
    responsive_web_text_conversations_enabled: false,
    responsive_web_twitter_article_data_v2_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: false,
    responsive_web_twitter_blue_verified_badge_is_enabled: true,
    rweb_lists_timeline_redesign_enabled: true,
    spaces_2022_h2_clipping: true,
    spaces_2022_h2_spaces_communities: true,
    standardized_nudges_misinfo: true,
    subscriptions_verification_info_verified_since_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    tweetypie_unmention_optimization_enabled: true,
    verified_phone_label_enabled: false,
    vibe_api_enabled: true,
    view_counts_everywhere_api_enabled: true,
  };
}
// trending_params
export const trending_params = {
  include_profile_interstitial_type: "1",
  include_blocking: "1",
  include_blocked_by: "1",
  include_followed_by: "1",
  include_want_retweets: "1",
  include_mute_edge: "1",
  include_can_dm: "1",
  include_can_media_tag: "1",
  include_ext_has_nft_avatar: "1",
  include_ext_is_blue_verified: "1",
  include_ext_verified_type: "1",
  skip_status: "1",
  cards_platform: "Web-12",
  include_cards: "1",
  include_ext_alt_text: "true",
  include_ext_limited_action_results: "false",
  include_quote_count: "true",
  include_reply_count: "1",
  tweet_mode: "extended",
  include_ext_views: "true",
  include_entities: "true",
  include_user_entities: "true",
  include_ext_media_color: "true",
  include_ext_media_availability: "true",
  include_ext_sensitive_media_warning: "true",
  include_ext_trusted_friends_metadata: "true",
  send_error_codes: "true",
  simple_quoted_tweet: "true",
  count: 1000,
  requestContext: "launch",
  include_page_configuration: "true",
  initial_tab_id: "trending",
  entity_tokens: "false",
  ext: "mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,birdwatchPivot,enrichments,superFollowMetadata,unmentionInfo,editControl,vibe",
} as const;

// account_settings
export const account_settings = {
  address_book_live_sync_enabled: false,
  allow_ads_personalization: false,
  allow_authenticated_periscope_requests: true,
  allow_dm_groups_from: "following",
  allow_dms_from: "following",
  allow_location_history_personalization: false,
  allow_logged_out_device_personalization: false,
  allow_media_tagging: "none",
  allow_sharing_data_for_third_party_personalization: false,
  alt_text_compose_enabled: null as any,
  always_use_https: true,
  autoplay_disabled: false,
  country_code: "us",
  discoverable_by_email: false,
  discoverable_by_mobile_phone: false,
  display_sensitive_media: true,
  dm_quality_filter: "enabled",
  dm_receipt_setting: "all_disabled",
  geo_enabled: false,
  include_alt_text_compose: true,
  include_mention_filter: true,
  include_nsfw_admin_flag: true,
  include_nsfw_user_flag: true,
  include_ranked_timeline: true,
  language: "en",
  mention_filter: "unfiltered",
  nsfw_admin: false,
  nsfw_user: false,
  personalized_trends: true,
  protected: false,
  ranked_timeline_eligible: null as any,
  ranked_timeline_setting: null as any,
  require_password_login: false,
  requires_login_verification: false,
  settings_metadata: {},
  sleep_time: {
    enabled: false,
    end_time: null as any,
    start_time: null as any,
  },
  translator_type: "none",
  universal_quality_filtering_enabled: "enabled",
  use_cookie_personalization: false,
} as const;

// follower_notification_settings
export const follower_notification_settings = {
  cursor: "-1",
  include_profile_interstitial_type: "1",
  include_blocking: "1",
  include_blocked_by: "1",
  include_followed_by: "1",
  include_want_retweets: "1",
  include_mute_edge: "1",
  include_can_dm: "1",
  include_can_media_tag: "1",
  include_ext_has_nft_avatar: "1",
  include_ext_is_blue_verified: "1",
  include_ext_verified_type: "1",
  skip_status: "1",
} as const;

// follow_settings
export const follow_settings = {
  include_profile_interstitial_type: "1",
  include_blocking: "1",
  include_blocked_by: "1",
  include_followed_by: "1",
  include_want_retweets: "1",
  include_mute_edge: "1",
  include_can_dm: "1",
  include_can_media_tag: "1",
  include_ext_has_nft_avatar: "1",
  include_ext_is_blue_verified: "1",
  include_ext_verified_type: "1",
  skip_status: "1",
} as const;

// account_search_settings
export const account_search_settings = {
  optInFiltering: true,
  optInBlocking: true,
} as const;

// profile_settings
export const profile_settings = {
  birthdate_day: Number,
  birthdate_month: Number,
  birthdate_year: Number,
  birthdate_visibility: String,
  birthdate_year_visibility: String,
  displayNameMaxLength: Number,
  url: String,
  name: String,
  description: String,
  location: String,
} as const;

// search_config
export const search_config = {
  include_profile_interstitial_type: 1,
  include_blocking: 1,
  include_blocked_by: 1,
  include_followed_by: 1,
  include_want_retweets: 1,
  include_mute_edge: 1,
  include_can_dm: 1,
  include_can_media_tag: 1,
  include_ext_has_nft_avatar: 1,
  include_ext_is_blue_verified: 1,
  include_ext_verified_type: 1,
  skip_status: 1,
  cards_platform: "Web-12",
  include_cards: 1,
  include_ext_alt_text: "true",
  include_ext_limited_action_results: "false",
  include_quote_count: "true",
  include_reply_count: 1,
  tweet_mode: "extended",
  include_ext_collab_control: "true",
  include_ext_views: "true",
  include_entities: "true",
  include_user_entities: "true",
  include_ext_media_color: "true",
  include_ext_media_availability: "true",
  include_ext_sensitive_media_warning: "true",
  include_ext_trusted_friends_metadata: "true",
  send_error_codes: "true",
  simple_quoted_tweet: "true",
  query_source: "typed_query",
  count: 1000,
  q: "",
  requestContext: "launch",
  pc: 1,
  spelling_corrections: 1,
  include_ext_edit_control: "true",
  ext: "mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,birdwatchPivot,enrichments,superFollowMetadata,unmentionInfo,editControl,collab_control,vibe",
} as const;

// dm_params
export const dm_params = {
  context: "FETCH_DM_CONVERSATION",
  include_profile_interstitial_type: "1",
  include_blocking: "1",
  include_blocked_by: "1",
  include_followed_by: "1",
  include_want_retweets: "1",
  include_mute_edge: "1",
  include_can_dm: "1",
  include_can_media_tag: "1",
  include_ext_has_nft_avatar: "1",
  include_ext_is_blue_verified: "1",
  include_ext_verified_type: "1",
  include_ext_profile_image_shape: "1",
  skip_status: "1",
  dm_secret_conversations_enabled: "false",
  krs_registration_enabled: "true",
  cards_platform: "Web-12",
  include_cards: "1",
  include_ext_alt_text: "true",
  include_ext_limited_action_results: "false",
  include_quote_count: "true",
  include_reply_count: "1",
  tweet_mode: "extended",
  include_ext_views: "true",
  dm_users: "false",
  include_groups: "true",
  include_inbox_timelines: "true",
  include_ext_media_color: "true",
  supports_reactions: "true",
  include_conversation_info: "true",
  ext: "mediaColor,altText,mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,birdwatchPivot,superFollowMetadata,unmentionInfo,editControl",
} as const;

// live_notification_params
export const live_notification_params = {
  cards_platform: "Web-12",
  count: "50",
  ext: "mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,birdwatchPivot,superFollowMetadata,unmentionInfo,editControl",
  include_blocked_by: "1",
  include_blocking: "1",
  include_can_dm: "1",
  include_can_media_tag: "1",
  include_cards: "1",
  include_entities: "true",
  include_ext_alt_text: "true",
  include_ext_has_nft_avatar: "1",
  include_ext_is_blue_verified: "1",
  include_ext_limited_action_results: "true",
  include_ext_media_availability: "true",
  include_ext_media_color: "true",
  include_ext_profile_image_shape: "1",
  include_ext_sensitive_media_warning: "true",
  include_ext_trusted_friends_metadata: "true",
  include_ext_verified_type: "1",
  include_ext_views: "true",
  include_followed_by: "1",
  include_mute_edge: "1",
  include_profile_interstitial_type: "1",
  include_quote_count: "true",
  include_reply_count: "1",
  include_user_entities: "true",
  include_want_retweets: "1",
  send_error_codes: "true",
  simple_quoted_tweet: "true",
  skip_status: "1",
  tweet_mode: "extended",
};

// recommendations_params
export const recommendations_params = {
  include_profile_interstitial_type: "1",
  include_blocking: "1",
  include_blocked_by: "1",
  include_followed_by: "1",
  include_want_retweets: "1",
  include_mute_edge: "1",
  include_can_dm: "1",
  include_can_media_tag: "1",
  include_ext_has_nft_avatar: "1",
  include_ext_is_blue_verified: "1",
  include_ext_verified_type: "1",
  include_ext_profile_image_shape: "1",
  skip_status: "1",
  pc: "true",
  display_location: "profile_accounts_sidebar",
  limit: 100,
  ext: "mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,birdwatchPivot,superFollowMetadata,unmentionInfo,editControl",
};
