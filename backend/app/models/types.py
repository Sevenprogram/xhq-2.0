from sqlalchemy import BigInteger, Integer


def id_type():
    return BigInteger().with_variant(Integer, "sqlite")
