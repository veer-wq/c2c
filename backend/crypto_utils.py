from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey
)


def generate_keys():
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    return private_key, public_key

def sign_data(private_key, data: bytes):
    return private_key.sign(data)

def verify_signature(public_key, data: bytes, signature: bytes):
    try:
        public_key.verify(signature, data)
        return True
    except Exception:
        return False