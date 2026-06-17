# 小红书 & 抖音关键词流量监控系统

本仓库是一个本地运行的关键词流量监控 MVP。第一版不做平台绕过、账号池、验证码处理或全量抓取，只支持 CSV/JSON 导入、mock connector、标准化、去重、互动快照、相关度评分、Dashboard、内容列表、达人列表和任务日志。

## 技术栈

- Backend: FastAPI, SQLAlchemy 2.x
- Database: SQLite by default, PostgreSQL migration files retained
- Frontend: Next.js, TypeScript, Tailwind CSS, Recharts
- Runtime: Docker Compose

## 本地启动

如需使用“小黄雀达人商单匹配 Demo”的小红书达人主页链接搜索，先配置 `backend/.env`：

```powershell
DATAFLOW_BASE_URL=https://你的-dataflow-api-域名
DATAFLOW_API_KEY=你的-api-key
DATAFLOW_AUTH_SCHEME=
```

接口使用 Dataflow 文档中的“小红书V2 / APP用户详情 V2”，后端会请求：

```text
GET /api/xhs/v2/appuserinfo?userId=达人UID
Authorization: DATAFLOW_API_KEY
```

如果改用 TikHub 的“小红书 / 获取用户信息”接口获取真实粉丝数，配置：

```powershell
TIKHUB_API_BASE_URL=https://api.tikhub.io
TIKHUB_API_TOKEN=你的-tikhub-api-token
TIKHUB_API_TIMEOUT=60
```

对应接口：

```text
GET /api/v1/xiaohongshu/web_v3/fetch_user_info?user_id=达人user_id
Authorization: Bearer TIKHUB_API_TOKEN
```

```powershell
docker compose up --build
```

当前默认使用 SQLite，本地数据保存在 Docker volume `sqlite_data` 中，不需要拉取 PostgreSQL 或 Redis 镜像。

启动后访问：

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health
- OpenAPI: http://localhost:8000/docs

## 手动验证流程

1. 创建项目：

```powershell
curl -X POST http://localhost:8000/api/projects `
  -H "Content-Type: application/json" `
  -d "{\"name\":\"青少年心理监控\",\"description\":\"监控小红书和抖音相关内容\",\"sensitive_level\":3}"
```

2. 创建关键词，假设项目 ID 是 1：

```powershell
curl -X POST http://localhost:8000/api/projects/1/keywords `
  -H "Content-Type: application/json" `
  -d "{\"keyword\":\"青少年心理健康\",\"platform\":\"xiaohongshu\",\"priority_level\":\"A\",\"collect_limit\":100,\"collect_frequency\":\"daily\",\"collect_comments\":false,\"track_creators\":true,\"status\":\"active\"}"
```

3. 导入样例 CSV：

```powershell
curl -X POST http://localhost:8000/api/import/csv `
  -F "project_id=1" `
  -F "file=@sample_data/sample_posts.csv"
```

4. 重复导入同一 CSV，验证不会重复创建帖子，但会增加快照：

```powershell
curl -X POST http://localhost:8000/api/import/csv `
  -F "project_id=1" `
  -F "file=@sample_data/sample_posts.csv"
```

5. 查询内容、达人、Dashboard 和任务日志：

```powershell
curl "http://localhost:8000/api/posts?project_id=1&sort_by=relevance_score"
curl "http://localhost:8000/api/creators"
curl "http://localhost:8000/api/analytics/dashboard-summary"
curl "http://localhost:8000/api/jobs"
```

6. 通过前端验证：

- http://localhost:3000/projects 创建项目
- http://localhost:3000/keywords 创建关键词并运行 mock 任务
- http://localhost:3000/posts 上传 `sample_data/sample_posts.csv`
- http://localhost:3000/creators 查看达人
- http://localhost:3000/demo 在“达人视角”粘贴小红书达人主页链接，系统会提取 user_id 并查询实时达人数据
- http://localhost:3000/jobs 查看任务日志

## 测试

容器环境推荐：

```powershell
docker compose run --rm backend python -m pytest tests -q
```

无 Docker 但已安装依赖时：

```powershell
cd backend
python -m pytest tests -q
```

前端构建：

```powershell
cd frontend
npm install
npm run build
```

## 目录

```text
backend/      FastAPI 后端、SQLAlchemy 模型、服务层、connector
frontend/     Next.js 前端
sample_data/  CSV/JSON 样例数据
```

## 后续 TODO

- 增加帖子与多个关键词的多对多关联表，避免同一内容跨关键词时只能归属一个关键词。
- 增加 API 级集成测试，覆盖 SQLite/PostgreSQL 去重、快照数量和任务日志。
- 增加评论采样导入、品牌词库和广告线索评分。
- 增加 pgvector 相似内容检索。
- 增加周报/月报自动生成。
