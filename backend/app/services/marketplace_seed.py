from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import MarketplaceDeal


SEED_DEALS = [
    {
        "external_id": "deal-growth-camp-summer",
        "brand_name": "青柠成长营",
        "title": "暑期成长营体验官招募",
        "city": "全国",
        "budget_min": 900,
        "budget_max": 2200,
        "target_tracks": ["青少年成长", "家庭教育", "本地生活"],
        "target_audience": "小初高学生家长、关注成长营和体验课的家庭",
        "deliverable": "小红书图文 1 条 + 评论区答疑 1 条",
        "brief": "围绕暑期成长营真实体验，突出孩子独立性、社交能力和家长反馈。内容需包含报名引导和体验课亮点。",
        "contact_wechat": "xiaohuangque",
        "reason_tags": ["教育赛道", "家长人群", "体验课线索"],
        "min_followers": 500,
        "max_followers": 120000,
        "match_score": 91,
        "suggested_payout": 1500,
        "source": "seed",
    },
    {
        "external_id": "deal-shenzhen-study-room",
        "brand_name": "灯塔自习室",
        "title": "深圳中学生周末自习空间探店",
        "city": "深圳",
        "budget_min": 600,
        "budget_max": 1800,
        "target_tracks": ["校园生活", "教育成长", "深圳探店", "本地生活"],
        "target_audience": "深圳初高中学生、备考家庭、本地校园人群",
        "deliverable": "小红书图文 1 条 + 门店定位",
        "brief": "展示自习室环境、座位、安静程度、交通位置和周末学习氛围。适合深圳本地校园/家长类账号。",
        "contact_wechat": "xiaohuangque",
        "reason_tags": ["深圳同城", "校园生活", "低决策成本"],
        "min_followers": 300,
        "max_followers": 80000,
        "match_score": 88,
        "suggested_payout": 1200,
        "source": "seed",
    },
    {
        "external_id": "deal-parenting-lesson",
        "brand_name": "心芽家庭课堂",
        "title": "青春期亲子沟通公开课种草",
        "city": "全国",
        "budget_min": 1000,
        "budget_max": 2600,
        "target_tracks": ["家庭教育", "青少年成长", "教育成长"],
        "target_audience": "小学高年级、初高中学生家长",
        "deliverable": "小红书图文 1 条 + 课程领取口令",
        "brief": "从亲子冲突、青春期沟通和家长焦虑切入，引导领取公开课资料。内容需自然、有家长视角。",
        "contact_wechat": "xiaohuangque",
        "reason_tags": ["家长需求", "课程线索", "成长话题"],
        "min_followers": 1000,
        "max_followers": 200000,
        "match_score": 86,
        "suggested_payout": 1800,
        "source": "seed",
    },
    {
        "external_id": "deal-mellow-campus",
        "brand_name": "Mellow Coffee",
        "title": "深圳大学生咖啡探店",
        "city": "深圳",
        "budget_min": 900,
        "budget_max": 2200,
        "target_tracks": ["校园生活", "深圳探店", "咖啡甜品", "本地消费"],
        "target_audience": "深圳高校学生、年轻白领、咖啡消费人群",
        "deliverable": "小红书图文或视频 1 条",
        "brief": "围绕校园周边咖啡、平价约会和自习场景拍摄。需要露出门店环境、主推产品和到店路线。",
        "contact_wechat": "xiaohuangque",
        "reason_tags": ["同城探店", "校园人群", "到店转化"],
        "min_followers": 1000,
        "max_followers": 160000,
        "match_score": 81,
        "suggested_payout": 1500,
        "source": "seed",
    },
    {
        "external_id": "deal-yoga-trial",
        "brand_name": "轻氧普拉提",
        "title": "白领女性普拉提体验课",
        "city": "深圳",
        "budget_min": 1000,
        "budget_max": 2600,
        "target_tracks": ["健康健身", "精致消费", "本地生活"],
        "target_audience": "年轻白领女性、运动健身入门用户",
        "deliverable": "小红书图文 1 条 + 门店环境露出",
        "brief": "突出门店环境、教练体验、初学者友好和白领下班运动场景。适合女性生活方式/健身类账号。",
        "contact_wechat": "xiaohuangque",
        "reason_tags": ["白领女性", "体验课", "门店转化"],
        "min_followers": 1200,
        "max_followers": 180000,
        "match_score": 70,
        "suggested_payout": 1800,
        "source": "seed",
    },
    {
        "external_id": "deal-library-card",
        "brand_name": "城市图书馆计划",
        "title": "亲子阅读打卡活动招募",
        "city": "全国",
        "budget_min": 500,
        "budget_max": 1500,
        "target_tracks": ["母婴亲子", "低龄启蒙", "本地生活"],
        "target_audience": "亲子阅读家庭、公益活动关注者",
        "deliverable": "小红书图文 1 条 + 活动报名入口",
        "brief": "分享亲子阅读打卡体验、活动玩法和报名入口。预算友好，适合低粉但垂直的亲子/阅读账号。",
        "contact_wechat": "xiaohuangque",
        "reason_tags": ["公益活动", "亲子阅读", "低预算可接"],
        "min_followers": 300,
        "max_followers": 100000,
        "match_score": 67,
        "suggested_payout": 900,
        "source": "seed",
    },
]


def seed_marketplace_deals(db: Session) -> int:
    inserted = 0
    existing_ids = set(db.scalars(select(MarketplaceDeal.external_id)).all())
    for payload in SEED_DEALS:
        if payload["external_id"] in existing_ids:
            continue
        db.add(MarketplaceDeal(status="published", **payload))
        inserted += 1
    if inserted:
        db.commit()
    return inserted
