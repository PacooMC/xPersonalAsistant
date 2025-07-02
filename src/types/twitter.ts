export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id?: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count?: number;
    bookmark_count?: number;
    impression_count?: number;
  };
  entities?: {
    urls?: Array<{
      start: number;
      end: number;
      url: string;
      expanded_url: string;
      display_url: string;
    }>;
    hashtags?: Array<{
      start: number;
      end: number;
      tag: string;
    }>;
    mentions?: Array<{
      start: number;
      end: number;
      username: string;
      id: string;
    }>;
  };
  context_annotations?: Array<{
    domain: {
      id: string;
      name: string;
      description: string;
    };
    entity: {
      id: string;
      name: string;
      description: string;
    };
  }>;
  referenced_tweets?: Array<{
    type: 'retweeted' | 'quoted' | 'replied_to';
    id: string;
  }>;
  lang?: string;
  source?: string;
  possibly_sensitive?: boolean;
}

export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  description?: string;
  profile_image_url?: string;
  profile_banner_url?: string;
  protected?: boolean;
  verified?: boolean;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count?: number;
    like_count?: number;
  };
  created_at?: string;
  location?: string;
  url?: string;
  pinned_tweet_id?: string;
}

export interface TwitterAPIResponse<T> {
  data?: T[];
  includes?: {
    users?: TwitterUser[];
    tweets?: Tweet[];
    media?: Array<{
      media_key: string;
      type: string;
      url?: string;
      preview_image_url?: string;
      width?: number;
      height?: number;
    }>;
  };
  meta?: {
    oldest_id?: string;
    newest_id?: string;
    result_count?: number;
    next_token?: string;
  };
  errors?: Array<{
    detail: string;
    status: number;
    title: string;
    type: string;
  }>;
}

export class APIError extends Error {
  status?: number;
  code?: string;

  constructor(params: { message: string; status?: number; code?: string }) {
    super(params.message);
    this.status = params.status;
    this.code = params.code;
    this.name = 'APIError';
  }
} 