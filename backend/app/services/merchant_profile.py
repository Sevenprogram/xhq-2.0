from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import MerchantProfile
from app.services.merchant_defaults import DEFAULT_MERCHANT_DISPLAY_NAME, DEFAULT_MERCHANT_KEY


def get_or_create_merchant_profile(
    db: Session,
    merchant_key: str = DEFAULT_MERCHANT_KEY,
    default_display_name: str = DEFAULT_MERCHANT_DISPLAY_NAME,
) -> MerchantProfile:
    profile = db.scalar(select(MerchantProfile).where(MerchantProfile.merchant_key == merchant_key))
    if profile:
        return profile

    profile = MerchantProfile(merchant_key=merchant_key, display_name=default_display_name)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile
