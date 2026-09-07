from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization
import os
from pathlib import Path

KEY_FILE = Path(__file__).resolve().parent / "issuer_private_key.pem"


if os.path.exists(KEY_FILE):
    with open(KEY_FILE, "rb") as f:
        ISSUER_PRIVATE_KEY = serialization.load_pem_private_key(
            f.read(),
            password=None
        )
else:
    ISSUER_PRIVATE_KEY = Ed25519PrivateKey.generate()

    with open(KEY_FILE, "wb") as f:
        f.write(
            ISSUER_PRIVATE_KEY.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
        )


ISSUER_PUBLIC_KEY = ISSUER_PRIVATE_KEY.public_key()
print("KEY FILE:", KEY_FILE)
print("PUBLIC KEY:", ISSUER_PUBLIC_KEY.public_bytes_raw().hex())