import boto3
from botocore.config import Config
from app.core.config import settings

def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )

def generate_presigned_upload(key: str, content_type: str, expires_in: int = 300) -> str:
    """Returns a presigned PUT URL for uploading directly to R2."""
    client = get_r2_client()
    return client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.R2_BUCKET_NAME,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in,
    )

def public_url(key: str) -> str:
    """Returns the public URL for a stored object."""
    return f"{settings.R2_PUBLIC_URL.rstrip('/')}/{key}"