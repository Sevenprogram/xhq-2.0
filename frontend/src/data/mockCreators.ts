export type CreatorProfile = {
  id: string;
  nickname: string;
  platform: string;
  followers: number;
  exposure30d: number;
  interactions30d: number;
  engagementRate: number;
  tracks: string[];
  city: string;
  audience: string;
  quoteRange: [number, number];
  suggestedQuote: number;
  keywordMatch: number;
  audienceMatch: number;
  recommendationScore: number;
  recommendationReason: string;
};

export const mockCreators: CreatorProfile[] = [
  {
    id: "creator-xiaolin",
    nickname: "深圳校园生活小林",
    platform: "小红书",
    followers: 18600,
    exposure30d: 428000,
    interactions30d: 32400,
    engagementRate: 7.6,
    tracks: ["校园生活", "深圳探店", "本地消费"],
    city: "深圳",
    audience: "深圳高校女生、大学生、本地年轻白领",
    quoteRange: [1200, 1800],
    suggestedQuote: 1500,
    keywordMatch: 91,
    audienceMatch: 88,
    recommendationScore: 92,
    recommendationReason: "粉丝集中在深圳高校女生，与品牌周末到店目标高度一致。"
  },
  {
    id: "creator-ayou",
    nickname: "南山周末探店阿柚",
    platform: "小红书",
    followers: 32500,
    exposure30d: 512000,
    interactions30d: 38600,
    engagementRate: 7.5,
    tracks: ["南山探店", "咖啡甜品", "周末约会"],
    city: "深圳",
    audience: "南山科技园白领、情侣、轻餐饮消费人群",
    quoteRange: [1800, 2600],
    suggestedQuote: 2200,
    keywordMatch: 86,
    audienceMatch: 82,
    recommendationScore: 88,
    recommendationReason: "内容长期覆盖南山咖啡和约会场景，适合带动周末门店打卡。"
  },
  {
    id: "creator-nora",
    nickname: "福田下午茶Nora",
    platform: "小红书",
    followers: 24100,
    exposure30d: 366000,
    interactions30d: 25900,
    engagementRate: 7.1,
    tracks: ["福田下午茶", "白领生活", "精致消费"],
    city: "深圳",
    audience: "福田白领女性、都市通勤人群",
    quoteRange: [1500, 2300],
    suggestedQuote: 1900,
    keywordMatch: 78,
    audienceMatch: 84,
    recommendationScore: 84,
    recommendationReason: "粉丝画像偏白领女性，对午休和下午茶消费场景转化友好。"
  },
  {
    id: "creator-sam",
    nickname: "深圳吃喝玩乐Sam",
    platform: "抖音",
    followers: 46800,
    exposure30d: 890000,
    interactions30d: 53100,
    engagementRate: 6.0,
    tracks: ["本地生活", "短视频探店", "城市周末"],
    city: "深圳",
    audience: "18-30岁深圳本地生活用户",
    quoteRange: [2600, 3600],
    suggestedQuote: 3200,
    keywordMatch: 74,
    audienceMatch: 76,
    recommendationScore: 80,
    recommendationReason: "视频曝光能力强，适合作为品牌扩散补充，但校园咖啡垂直度略低。"
  }
];

export const featuredCreator = mockCreators[0];

export const creatorPricingBreakdown = [
  { label: "粉丝基础价", value: 600 },
  { label: "流量加成", value: 450, prefix: "+" },
  { label: "互动率加成", value: 300, prefix: "+" },
  { label: "关键词匹配加成", value: 150, prefix: "+" }
];
