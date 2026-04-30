from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str = "4b630672229cccda68232d9db902e17bc41a82158fe4329d125fbc394678a2bb"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    OTP_DEV_BYPASS: str = "1234"

    class Config:
        env_file = ".env"

settings = Settings()