export type IndustryOverview = {
  track: string;
  period: string;
  themeCount: number;
  accountCount: number;
  noteCount: number;
  highInteractionPosts: number;
};

export type ContentThemeInsight = {
  themeName: string;
  noteCount30d: number;
  accountCount: number;
  estimatedExposure: number;
  interactions: number;
  trend: "快速上升" | "上升" | "稳定";
};

export type KeywordTrend = {
  keyword: string;
  growth: number;
};

export const industryTracks = ["学科提分", "升学择校", "素质能力", "研学营地", "家庭教育", "低龄启蒙", "青少年成长"] as const;

export type IndustryTrack = (typeof industryTracks)[number];

export type IndustryDataset = {
  overview: IndustryOverview;
  contentThemes: ContentThemeInsight[];
  keywordTrends: KeywordTrend[];
};

export const industryDataByTrack: Record<IndustryTrack, IndustryDataset> = {
  学科提分: {
    overview: {
      track: "学科提分",
      period: "近30天",
      themeCount: 286,
      accountCount: 12860,
      noteCount: 48620,
      highInteractionPosts: 1268
    },
    contentThemes: [
      {
        themeName: "考前冲刺提分",
        noteCount30d: 2860,
        accountCount: 1124,
        estimatedExposure: 14920000,
        interactions: 682960,
        trend: "上升"
      },
      {
        themeName: "错题诊断与薄弱项突破",
        noteCount30d: 2480,
        accountCount: 980,
        estimatedExposure: 18560000,
        interactions: 1296400,
        trend: "快速上升"
      },
      {
        themeName: "中高考压轴题方法",
        noteCount30d: 2210,
        accountCount: 842,
        estimatedExposure: 12840000,
        interactions: 984300,
        trend: "上升"
      }
    ],
    keywordTrends: [
      { keyword: "中考数学压轴题", growth: 136 },
      { keyword: "初三数学提分", growth: 124 },
      { keyword: "小学奥数思维训练", growth: 112 },
      { keyword: "高考英语提分", growth: 98 },
      { keyword: "期末考试冲刺", growth: 86 }
    ]
  },
  升学择校: {
    overview: {
      track: "升学择校",
      period: "近30天",
      themeCount: 244,
      accountCount: 9360,
      noteCount: 38640,
      highInteractionPosts: 1124
    },
    contentThemes: [
      {
        themeName: "国际学校择校路径",
        noteCount30d: 2640,
        accountCount: 1058,
        estimatedExposure: 15680000,
        interactions: 936400,
        trend: "快速上升"
      },
      {
        themeName: "小升初与中考政策解读",
        noteCount30d: 1960,
        accountCount: 724,
        estimatedExposure: 11240000,
        interactions: 753200,
        trend: "上升"
      },
      {
        themeName: "升学规划时间表",
        noteCount30d: 1740,
        accountCount: 682,
        estimatedExposure: 8860000,
        interactions: 596300,
        trend: "上升"
      }
    ],
    keywordTrends: [
      { keyword: "小升初择校", growth: 118 },
      { keyword: "国际学校开放日", growth: 91 },
      { keyword: "中考志愿填报", growth: 84 },
      { keyword: "深圳民办学校", growth: 76 },
      { keyword: "国际课程怎么选", growth: 68 }
    ]
  },
  素质能力: {
    overview: {
      track: "素质能力",
      period: "近30天",
      themeCount: 268,
      accountCount: 10240,
      noteCount: 42880,
      highInteractionPosts: 1186
    },
    contentThemes: [
      {
        themeName: "项目式学习成果展示",
        noteCount30d: 3260,
        accountCount: 1260,
        estimatedExposure: 16480000,
        interactions: 861500,
        trend: "快速上升"
      },
      {
        themeName: "科学探索与自然观察",
        noteCount30d: 2380,
        accountCount: 924,
        estimatedExposure: 12860000,
        interactions: 604900,
        trend: "上升"
      },
      {
        themeName: "表达力与公众展示训练",
        noteCount30d: 1860,
        accountCount: 716,
        estimatedExposure: 9360000,
        interactions: 512400,
        trend: "上升"
      }
    ],
    keywordTrends: [
      { keyword: "少儿编程课", growth: 126 },
      { keyword: "儿童科学实验课", growth: 104 },
      { keyword: "小主持人口才", growth: 93 },
      { keyword: "少儿美术素描", growth: 81 },
      { keyword: "项目式学习PBL", growth: 72 }
    ]
  },
  研学营地: {
    overview: {
      track: "研学营地",
      period: "近30天",
      themeCount: 418,
      accountCount: 15680,
      noteCount: 68420,
      highInteractionPosts: 1842
    },
    contentThemes: [
      {
        themeName: "城市周边自然研学",
        noteCount30d: 4620,
        accountCount: 1760,
        estimatedExposure: 24860000,
        interactions: 1146200,
        trend: "快速上升"
      },
      {
        themeName: "营地生存与团队协作",
        noteCount30d: 3980,
        accountCount: 1540,
        estimatedExposure: 28640000,
        interactions: 1487200,
        trend: "快速上升"
      },
      {
        themeName: "暑期过夜营体验",
        noteCount30d: 3540,
        accountCount: 1288,
        estimatedExposure: 19680000,
        interactions: 942600,
        trend: "快速上升"
      }
    ],
    keywordTrends: [
      { keyword: "暑假研学营", growth: 146 },
      { keyword: "自然研学路线", growth: 128 },
      { keyword: "过夜夏令营", growth: 117 },
      { keyword: "周末亲子营", growth: 95 },
      { keyword: "北京研学一日营", growth: 88 }
    ]
  },
  家庭教育: {
    overview: {
      track: "家庭教育",
      period: "近30天",
      themeCount: 232,
      accountCount: 8240,
      noteCount: 31260,
      highInteractionPosts: 806
    },
    contentThemes: [
      {
        themeName: "亲子陪伴式成长营",
        noteCount30d: 2140,
        accountCount: 820,
        estimatedExposure: 10680000,
        interactions: 428600,
        trend: "快速上升"
      },
      {
        themeName: "青春期亲子沟通",
        noteCount30d: 1980,
        accountCount: 760,
        estimatedExposure: 14240000,
        interactions: 836400,
        trend: "快速上升"
      },
      {
        themeName: "家长情绪与学习陪跑",
        noteCount30d: 1540,
        accountCount: 612,
        estimatedExposure: 7460000,
        interactions: 304800,
        trend: "上升"
      }
    ],
    keywordTrends: [
      { keyword: "青春期孩子沟通", growth: 122 },
      { keyword: "孩子厌学怎么办", growth: 109 },
      { keyword: "亲子关系修复", growth: 96 },
      { keyword: "家长情绪管理", growth: 82 },
      { keyword: "如何陪孩子写作业", growth: 64 }
    ]
  },
  低龄启蒙: {
    overview: {
      track: "低龄启蒙",
      period: "近30天",
      themeCount: 198,
      accountCount: 6420,
      noteCount: 24860,
      highInteractionPosts: 684
    },
    contentThemes: [
      {
        themeName: "幼小衔接学习力",
        noteCount30d: 1860,
        accountCount: 760,
        estimatedExposure: 8680000,
        interactions: 372500,
        trend: "上升"
      },
      {
        themeName: "低龄阅读与表达启蒙",
        noteCount30d: 1620,
        accountCount: 628,
        estimatedExposure: 7420000,
        interactions: 286700,
        trend: "上升"
      },
      {
        themeName: "儿童自然探索课堂",
        noteCount30d: 1280,
        accountCount: 496,
        estimatedExposure: 12640000,
        interactions: 925800,
        trend: "快速上升"
      }
    ],
    keywordTrends: [
      { keyword: "幼小衔接", growth: 132 },
      { keyword: "英语启蒙绘本", growth: 97 },
      { keyword: "数学思维启蒙", growth: 79 },
      { keyword: "儿童专注力训练", growth: 61 },
      { keyword: "大语文启蒙", growth: 54 }
    ]
  },
  青少年成长: {
    overview: {
      track: "青少年成长",
      period: "近30天",
      themeCount: 214,
      accountCount: 7340,
      noteCount: 28680,
      highInteractionPosts: 762
    },
    contentThemes: [
      {
        themeName: "青春期自驱力训练",
        noteCount30d: 2260,
        accountCount: 874,
        estimatedExposure: 11480000,
        interactions: 486200,
        trend: "快速上升"
      },
      {
        themeName: "青少年情绪与社交成长",
        noteCount30d: 1780,
        accountCount: 690,
        estimatedExposure: 8360000,
        interactions: 318400,
        trend: "上升"
      },
      {
        themeName: "假期成长营与独立生活",
        noteCount30d: 1540,
        accountCount: 588,
        estimatedExposure: 7920000,
        interactions: 276900,
        trend: "上升"
      }
    ],
    keywordTrends: [
      { keyword: "青少年自驱力", growth: 124 },
      { keyword: "青春期情绪管理", growth: 106 },
      { keyword: "初中生叛逆期", growth: 94 },
      { keyword: "青少年社交能力", growth: 78 },
      { keyword: "暑假成长营", growth: 66 }
    ]
  }
};

export const industryOverview = industryDataByTrack["学科提分"].overview;
export const contentThemeInsights = industryDataByTrack["学科提分"].contentThemes;
export const keywordTrends = industryDataByTrack["学科提分"].keywordTrends;
