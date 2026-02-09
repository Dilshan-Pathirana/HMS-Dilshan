"""PayHere Payment Service — Patch 5.6"""

import hashlib
from typing import Optional
from app.core.config import settings


class PayHereService:

    @staticmethod
    def get_config() -> dict:
        """Return PayHere configuration from settings."""
        return {
            "merchant_id": getattr(settings, "PAYHERE_MERCHANT_ID", ""),
            "sandbox": getattr(settings, "PAYHERE_SANDBOX", True),
            "base_url": (
                "https://sandbox.payhere.lk/pay/checkout"
                if getattr(settings, "PAYHERE_SANDBOX", True)
                else "https://www.payhere.lk/pay/checkout"
            ),
        }

    @staticmethod
    def generate_hash(
        merchant_id: str,
        order_id: str,
        amount: float,
        currency: str = "LKR",
    ) -> str:
        """Generate MD5 hash for PayHere payment form."""
        merchant_secret = getattr(settings, "PAYHERE_MERCHANT_SECRET", "")
        # PayHere hash = MD5(merchant_id + order_id + amount_formatted + currency + MD5(merchant_secret))
        secret_hash = hashlib.md5(merchant_secret.encode()).hexdigest().upper()
        amount_formatted = f"{amount:.2f}"
        raw = merchant_id + order_id + amount_formatted + currency + secret_hash
        return hashlib.md5(raw.encode()).hexdigest().upper()

    @staticmethod
    def verify_notification(
        merchant_id: str,
        order_id: str,
        payhere_amount: str,
        payhere_currency: str,
        status_code: str,
        md5sig: str,
    ) -> bool:
        """Verify PayHere webhook notification signature."""
        merchant_secret = getattr(settings, "PAYHERE_MERCHANT_SECRET", "")
        secret_hash = hashlib.md5(merchant_secret.encode()).hexdigest().upper()
        local_sig = hashlib.md5(
            f"{merchant_id}{order_id}{payhere_amount}{payhere_currency}{status_code}{secret_hash}".encode()
        ).hexdigest().upper()
        return local_sig == md5sig

    @staticmethod
    def build_payment_form_data(
        order_id: str,
        amount: float,
        item_name: str,
        customer_name: str,
        customer_email: str,
        customer_phone: str,
        return_url: str,
        cancel_url: str,
        notify_url: str,
        currency: str = "LKR",
    ) -> dict:
        """Build PayHere checkout form data."""
        cfg = PayHereService.get_config()
        merchant_id = cfg["merchant_id"]
        payment_hash = PayHereService.generate_hash(merchant_id, order_id, amount, currency)

        return {
            "merchant_id": merchant_id,
            "return_url": return_url,
            "cancel_url": cancel_url,
            "notify_url": notify_url,
            "order_id": order_id,
            "items": item_name,
            "currency": currency,
            "amount": f"{amount:.2f}",
            "first_name": customer_name.split()[0] if customer_name else "",
            "last_name": " ".join(customer_name.split()[1:]) if customer_name and len(customer_name.split()) > 1 else "",
            "email": customer_email,
            "phone": customer_phone,
            "hash": payment_hash,
            "sandbox": cfg["sandbox"],
            "checkout_url": cfg["base_url"],
        }
