export type BrandBrief = {
  id: string;
  name: string;
  industry: string;
  audience: string;
  goal: string;
  budget: number;
  city: string;
};

export const mockBrands: BrandBrief[] = [
  {
    id: "brand-mellow-coffee",
    name: "Mellow Coffee",
    industry: "深圳本地咖啡",
    audience: "18-28岁年轻女性 / 大学生 / 白领",
    goal: "提升周末到店量",
    budget: 30000,
    city: "深圳"
  }
];

export const primaryBrand = mockBrands[0];
