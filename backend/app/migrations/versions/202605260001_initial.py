"""initial schema

Revision ID: 202605260001
Revises:
Create Date: 2026-05-26 00:00:00
"""
from alembic import op
import sqlalchemy as sa


revision = "202605260001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("sensitive_level", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "keywords",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("project_id", sa.BigInteger(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("keyword", sa.String(255), nullable=False),
        sa.Column("parent_keyword_id", sa.BigInteger(), sa.ForeignKey("keywords.id")),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("priority_level", sa.String(20), server_default="B"),
        sa.Column("collect_limit", sa.Integer(), server_default="100"),
        sa.Column("collect_frequency", sa.String(50), server_default="daily"),
        sa.Column("collect_comments", sa.Boolean(), server_default=sa.false()),
        sa.Column("track_creators", sa.Boolean(), server_default=sa.true()),
        sa.Column("status", sa.String(50), server_default="active"),
        sa.Column("last_checked_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("project_id", "keyword", "platform", name="uq_keywords_project_keyword_platform"),
    )

    op.create_table(
        "creators",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("platform_creator_id", sa.String(255), nullable=False),
        sa.Column("nickname", sa.String(255)),
        sa.Column("profile_url", sa.Text()),
        sa.Column("bio", sa.Text()),
        sa.Column("avatar_url", sa.Text()),
        sa.Column("follower_count", sa.BigInteger(), server_default="0"),
        sa.Column("following_count", sa.BigInteger(), server_default="0"),
        sa.Column("total_likes", sa.BigInteger(), server_default="0"),
        sa.Column("content_count", sa.BigInteger(), server_default="0"),
        sa.Column("category_tags", sa.JSON(), server_default="[]"),
        sa.Column("is_brand_account", sa.Boolean(), server_default=sa.false()),
        sa.Column("is_mcn_account", sa.Boolean(), server_default=sa.false()),
        sa.Column("creator_type", sa.String(50)),
        sa.Column("creator_score", sa.Numeric(7, 2), server_default="0"),
        sa.Column("raw_json", sa.JSON()),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("platform", "platform_creator_id", name="uq_creators_platform_creator_id"),
    )

    op.create_table(
        "posts",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("platform_post_id", sa.String(255), nullable=False),
        sa.Column("project_id", sa.BigInteger(), sa.ForeignKey("projects.id")),
        sa.Column("keyword_id", sa.BigInteger(), sa.ForeignKey("keywords.id")),
        sa.Column("creator_id", sa.BigInteger(), sa.ForeignKey("creators.id")),
        sa.Column("url", sa.Text()),
        sa.Column("title", sa.Text()),
        sa.Column("content_text", sa.Text()),
        sa.Column("summary", sa.Text()),
        sa.Column("media_type", sa.String(50), server_default="unknown"),
        sa.Column("publish_time", sa.DateTime(timezone=True)),
        sa.Column("cover_url", sa.Text()),
        sa.Column("tags", sa.JSON(), server_default="[]"),
        sa.Column("like_count", sa.BigInteger(), server_default="0"),
        sa.Column("comment_count", sa.BigInteger(), server_default="0"),
        sa.Column("collect_count", sa.BigInteger(), server_default="0"),
        sa.Column("share_count", sa.BigInteger(), server_default="0"),
        sa.Column("relevance_score", sa.Numeric(5, 2), server_default="0"),
        sa.Column("is_ad_suspected", sa.Boolean(), server_default=sa.false()),
        sa.Column("brand_mentions", sa.JSON(), server_default="[]"),
        sa.Column("raw_json", sa.JSON()),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("platform", "platform_post_id", name="uq_posts_platform_post_id"),
    )

    op.create_table(
        "post_snapshots",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("post_id", sa.BigInteger(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("like_count", sa.BigInteger(), server_default="0"),
        sa.Column("comment_count", sa.BigInteger(), server_default="0"),
        sa.Column("collect_count", sa.BigInteger(), server_default="0"),
        sa.Column("share_count", sa.BigInteger(), server_default="0"),
        sa.Column("rank_position", sa.Integer()),
        sa.Column("captured_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "creator_snapshots",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("creator_id", sa.BigInteger(), sa.ForeignKey("creators.id", ondelete="CASCADE"), nullable=False),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("follower_count", sa.BigInteger(), server_default="0"),
        sa.Column("following_count", sa.BigInteger(), server_default="0"),
        sa.Column("total_likes", sa.BigInteger(), server_default="0"),
        sa.Column("content_count", sa.BigInteger(), server_default="0"),
        sa.Column("captured_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "collection_jobs",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("project_id", sa.BigInteger(), sa.ForeignKey("projects.id")),
        sa.Column("keyword_id", sa.BigInteger(), sa.ForeignKey("keywords.id")),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("job_type", sa.String(50), nullable=False),
        sa.Column("status", sa.String(50), server_default="pending"),
        sa.Column("source_type", sa.String(50)),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("finished_at", sa.DateTime(timezone=True)),
        sa.Column("error_message", sa.Text()),
        sa.Column("raw_result_count", sa.Integer(), server_default="0"),
        sa.Column("inserted_count", sa.Integer(), server_default="0"),
        sa.Column("updated_count", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_index("ix_posts_project_keyword", "posts", ["project_id", "keyword_id"])
    op.create_index("ix_posts_publish_time", "posts", ["publish_time"])
    op.create_index("ix_post_snapshots_post_captured", "post_snapshots", ["post_id", "captured_at"])
    op.create_index("ix_creator_snapshots_creator_captured", "creator_snapshots", ["creator_id", "captured_at"])


def downgrade() -> None:
    op.drop_index("ix_creator_snapshots_creator_captured", table_name="creator_snapshots")
    op.drop_index("ix_post_snapshots_post_captured", table_name="post_snapshots")
    op.drop_index("ix_posts_publish_time", table_name="posts")
    op.drop_index("ix_posts_project_keyword", table_name="posts")
    op.drop_table("collection_jobs")
    op.drop_table("creator_snapshots")
    op.drop_table("post_snapshots")
    op.drop_table("posts")
    op.drop_table("creators")
    op.drop_table("keywords")
    op.drop_table("projects")
