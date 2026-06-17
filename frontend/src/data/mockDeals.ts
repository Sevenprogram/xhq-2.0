export type Deal = {
  id: string;
  brandName: string;
  theme: string;
  budget: number;
  deliverable: string;
  keywordMatch: number;
  creatorPayout: number;
  creatorId: string;
};

export const mockDeals: Deal[] = [
  {
    id: "deal-mellow-campus",
    brandName: "Mellow Coffee",
    theme: "深圳大学生咖啡探店",
    budget: 1500,
    deliverable: "小红书图文或视频 1 条",
    keywordMatch: 91,
    creatorPayout: 1500,
    creatorId: "creator-xiaolin"
  },
  {
    id: "deal-weekend-date",
    brandName: "Mellow Coffee",
    theme: "周末平价约会咖啡清单",
    budget: 1600,
    deliverable: "小红书图文 1 条 + 评论区置顶 1 条",
    keywordMatch: 87,
    creatorPayout: 1600,
    creatorId: "creator-xiaolin"
  },
  {
    id: "deal-campus-coupon",
    brandName: "Mellow Coffee",
    theme: "深圳高校女生下午茶优惠",
    budget: 1400,
    deliverable: "小红书视频 1 条，露出门店券码",
    keywordMatch: 83,
    creatorPayout: 1400,
    creatorId: "creator-xiaolin"
  }
];

export const defaultDeal = mockDeals[0];
