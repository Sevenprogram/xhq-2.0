export type Project = {
  id: number;
  name: string;
  description?: string | null;
  sensitive_level: number;
  created_at: string;
  updated_at: string;
};

export type Keyword = {
  id: number;
  project_id: number;
  keyword: string;
  platform: string;
  priority_level: string;
  collect_limit: number;
  collect_frequency: string;
  collect_comments: boolean;
  track_creators: boolean;
  status: string;
  last_checked_at?: string | null;
};

export type Creator = {
  id: number;
  platform: string;
  platform_creator_id: string;
  nickname?: string | null;
  profile_url?: string | null;
  follower_count: number;
  total_likes: number;
  content_count: number;
  creator_score: number;
};

export type Post = {
  id: number;
  platform: string;
  platform_post_id: string;
  title?: string | null;
  content_text?: string | null;
  url?: string | null;
  publish_time?: string | null;
  like_count: number;
  comment_count: number;
  collect_count: number;
  share_count: number;
  relevance_score: number;
  is_ad_suspected: boolean;
  tags: string[];
  creator?: Creator | null;
  hot_score?: number;
  like_growth_24h?: number;
  comment_growth_24h?: number;
};

export type Job = {
  id: number;
  project_id?: number | null;
  keyword_id?: number | null;
  platform: string;
  job_type: string;
  status: string;
  source_type?: string | null;
  raw_result_count: number;
  inserted_count: number;
  updated_count: number;
  started_at?: string | null;
  finished_at?: string | null;
  error_message?: string | null;
};

export type DashboardSummary = {
  project_count: number;
  keyword_count: number;
  post_count: number;
  creator_count: number;
  today_new_posts: number;
  today_hot_posts: number;
  seven_day_growth: { date: string; count: number }[];
  platform_distribution: { platform: string; count: number }[];
  hot_posts: Post[];
  top_creators: Creator[];
};

export type XhsCreatorProfile = {
  source?: string;
  user_id: string;
  nickname?: string | null;
  avatar_url?: string | null;
  red_id?: string | null;
  bio?: string | null;
  location?: string | null;
  gender?: string | null;
  ip_location?: string | null;
  account_status?: string | null;
  account_status_type?: number | null;
  follower_count: number;
  follower_count_display?: string | null;
  following_count: number;
  following_count_display?: string | null;
  liked_count: number;
  collected_count: number;
  like_and_collect_display?: string | null;
  note_count: number;
  note_count_display?: string | null;
  engagement_rate: number;
  category_tags: string[];
  raw: unknown;
};

export type XhsTrackAnalysis = {
  user_id: string;
  tracks: string[];
  source: string;
  confidence: number;
  evidence: string[];
  note_count: number;
  message?: string | null;
  raw_code?: number | null;
};

export type PgyCreator = {
  id: string;
  name: string;
  location: string;
  followers: number;
  content_count: number;
  interactions: number;
  estimated_exposure: number;
  quote: number;
  trend: "快速上升" | "上升" | "稳定" | string;
  raw: unknown;
};
