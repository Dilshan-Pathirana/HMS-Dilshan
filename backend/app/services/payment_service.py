"""PayHere Payment Service — Patch 5.6"""

import hashlib
from typing import Optional
from app.core.config import settings


class PayHereService:

    @staticmethod
    def get_config() -> dict:
        """Return PayHere configuration from settings."""
        sandbox = bool(settings.PAYHERE_SANDBOX)
        return {
            "merchant_id": settings.PAYHERE_MERCHANT_ID,
            "sandbox": sandbox,
            "base_url": (
                "https://sandbox.payhere.lk/pay/checkout"
                if sandbox
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
        merchant_secret = settings.PAYHERE_MERCHANT_SECRET
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
        merchant_secret = settings.PAYHERE_MERCHANT_SECRET
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
        customer_address: str = "",
        custom_1: str = "",
    ) -> dict:
        """Build PayHere checkout payload.

        Returns ``{action, fields}`` — *action* is the PayHere checkout URL and
        *fields* contains **only** the hidden-input values that PayHere expects.
        No extra keys (sandbox, checkout_url …) are included in *fields* so the
        frontend can blindly iterate over them.
        """
        cfg = PayHereService.get_config()
        merchant_id = cfg["merchant_id"]

        # Format amount exactly as PayHere requires: fixed 2-decimal, no commas
        amount_formatted = f"{amount:.2f}"

        payment_hash = PayHereService.generate_hash(
            merchant_id, order_id, amount, currency
        )

        names = customer_name.split() if customer_name else []
        first_name = names[0] if names else ""
        last_name = " ".join(names[1:]) if len(names) > 1 else ""

        fields: dict = {
            "merchant_id": merchant_id,
            "return_url": return_url,
            "cancel_url": cancel_url,
            "notify_url": notify_url,
            "order_id": order_id,
            "items": item_name,
            "currency": currency,
            "amount": amount_formatted,
            "first_name": first_name,
            "last_name": last_name,
            "email": customer_email or "noreply@hospital.lk",
            "phone": customer_phone or "0771234567",
            "address": customer_address or "No Address",
            "city": "Colombo",
            "country": "Sri Lanka",
            "hash": payment_hash,
        }

        if custom_1:
            fields["custom_1"] = custom_1

        return {
            "action": cfg["base_url"],
            "fields": fields,
        }
