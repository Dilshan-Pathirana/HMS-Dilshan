"""Purchase Request Service — Patch 5.1"""

from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime, timezone
from typing import Optional

from app.models.purchase_request import PurchaseRequest, PurchaseRequestItem


class PurchaseRequestService:

    # ---------- CREATE ----------
    @staticmethod
    async def create_request(
        session: AsyncSession,
        branch_id: str,
        requested_by: str,
        supplier_id: Optional[str],
        notes: Optional[str],
        items: list[dict],
    ) -> PurchaseRequest:
        total = sum(i.get("quantity", 1) * i.get("unit_price", 0) for i in items)
        pr = PurchaseRequest(
            branch_id=branch_id,
            requested_by=requested_by,
            supplier_id=supplier_id,
            notes=notes,
            total_amount=total,
            status="draft",
        )
        session.add(pr)
        await session.flush()  # get pr.id

        for it in items:
            qty = it.get("quantity", 1)
            up = it.get("unit_price", 0)
            item = PurchaseRequestItem(
                request_id=pr.id,
                product_id=it.get("product_id"),
                product_name=it.get("product_name"),
                quantity=qty,
                unit_price=up,
                total=qty * up,
                notes=it.get("notes"),
            )
            session.add(item)

        await session.commit()
        await session.refresh(pr)
        return pr

    # ---------- LIST ----------
    @staticmethod
    async def list_requests(
        session: AsyncSession,
        branch_id: Optional[str] = None,
        status: Optional[str] = None,
        requested_by: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[PurchaseRequest]:
        q = select(PurchaseRequest)
        if branch_id:
            q = q.where(PurchaseRequest.branch_id == branch_id)
        if status:
            q = q.where(PurchaseRequest.status == status)
        if requested_by:
            q = q.where(PurchaseRequest.requested_by == requested_by)
        q = q.order_by(col(PurchaseRequest.created_at).desc()).offset(skip).limit(limit)
        result = await session.exec(q)
        return list(result.all())

    # ---------- GET ----------
    @staticmethod
    async def get_request(session: AsyncSession, request_id: str) -> Optional[PurchaseRequest]:
        return await session.get(PurchaseRequest, request_id)

    # ---------- GET ITEMS ----------
    @staticmethod
    async def get_items(session: AsyncSession, request_id: str) -> list[PurchaseRequestItem]:
        q = select(PurchaseRequestItem).where(PurchaseRequestItem.request_id == request_id)
        result = await session.exec(q)
        return list(result.all())

    # ---------- SUBMIT ----------
    @staticmethod
    async def submit_request(session: AsyncSession, request_id: str) -> PurchaseRequest:
        pr = await session.get(PurchaseRequest, request_id)
        if not pr:
            raise ValueError("Purchase request not found")
        if pr.status not in ("draft", "clarification_needed"):
            raise ValueError(f"Cannot submit request in status '{pr.status}'")
        pr.status = "submitted"
        pr.submitted_at = datetime.now(timezone.utc)
        pr.updated_at = datetime.now(timezone.utc)
        session.add(pr)
        await session.commit()
        await session.refresh(pr)
        return pr

    # ---------- APPROVE ----------
    @staticmethod
    async def approve_request(session: AsyncSession, request_id: str, approved_by: str) -> PurchaseRequest:
        pr = await session.get(PurchaseRequest, request_id)
        if not pr:
            raise ValueError("Purchase request not found")
        if pr.status != "submitted":
            raise ValueError(f"Cannot approve request in status '{pr.status}'")
        pr.status = "approved"
        pr.approved_by = approved_by
        pr.approved_at = datetime.now(timezone.utc)
        pr.updated_at = datetime.now(timezone.utc)
        session.add(pr)
        await session.commit()
        await session.refresh(pr)
        return pr

    # ---------- REJECT ----------
    @staticmethod
    async def reject_request(session: AsyncSession, request_id: str, approved_by: str, notes: Optional[str] = None) -> PurchaseRequest:
        pr = await session.get(PurchaseRequest, request_id)
        if not pr:
            raise ValueError("Purchase request not found")
        if pr.status != "submitted":
            raise ValueError(f"Cannot reject request in status '{pr.status}'")
        pr.status = "rejected"
        pr.approved_by = approved_by
        pr.approved_at = datetime.now(timezone.utc)
        if notes:
            pr.notes = (pr.notes or "") + f"\n[Rejection note]: {notes}"
        pr.updated_at = datetime.now(timezone.utc)
        session.add(pr)
        await session.commit()
        await session.refresh(pr)
        return pr

    # ---------- REQUEST CLARIFICATION ----------
    @staticmethod
    async def clarify_request(session: AsyncSession, request_id: str, approved_by: str, notes: str) -> PurchaseRequest:
        pr = await session.get(PurchaseRequest, request_id)
        if not pr:
            raise ValueError("Purchase request not found")
        if pr.status != "submitted":
            raise ValueError(f"Cannot request clarification for status '{pr.status}'")
        pr.status = "clarification_needed"
        pr.approved_by = approved_by
        if notes:
            pr.notes = (pr.notes or "") + f"\n[Clarification]: {notes}"
        pr.updated_at = datetime.now(timezone.utc)
        session.add(pr)
        await session.commit()
        await session.refresh(pr)
        return pr

    # ---------- FULFILL ----------
    @staticmethod
    async def fulfill_request(session: AsyncSession, request_id: str) -> PurchaseRequest:
        pr = await session.get(PurchaseRequest, request_id)
        if not pr:
            raise ValueError("Purchase request not found")
        if pr.status != "approved":
            raise ValueError(f"Cannot fulfill request in status '{pr.status}'")
        pr.status = "fulfilled"
        pr.updated_at = datetime.now(timezone.utc)
        session.add(pr)
        await session.commit()
        await session.refresh(pr)
        return pr

    # ---------- UPDATE ITEMS ----------
    @staticmethod
    async def update_items(session: AsyncSession, request_id: str, items: list[dict]) -> PurchaseRequest:
        pr = await session.get(PurchaseRequest, request_id)
        if not pr:
            raise ValueError("Purchase request not found")
        if pr.status not in ("draft", "clarification_needed"):
            raise ValueError("Cannot update items for this request status")

        # Delete existing items
        q = select(PurchaseRequestItem).where(PurchaseRequestItem.request_id == request_id)
        result = await session.exec(q)
        for item in result.all():
            await session.delete(item)

        total = 0.0
        for it in items:
            qty = it.get("quantity", 1)
            up = it.get("unit_price", 0)
            item = PurchaseRequestItem(
                request_id=request_id,
                product_id=it.get("product_id"),
                product_name=it.get("product_name"),
                quantity=qty,
                unit_price=up,
                total=qty * up,
                notes=it.get("notes"),
            )
            session.add(item)
            total += qty * up

        pr.total_amount = total
        pr.updated_at = datetime.now(timezone.utc)
        session.add(pr)
        await session.commit()
        await session.refresh(pr)
        return pr
