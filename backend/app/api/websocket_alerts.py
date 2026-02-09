"""WebSocket Real-Time Alerts — Patch 5.8

Channels:
  - low-stock-alerts: broadcast to branch-admin + super-admin when product stock < reorder_level
  - queue-updates: broadcast to receptionist when queue status changes

Native WebSocket replaces Pusher dependency.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Optional
import json
import asyncio
from datetime import datetime, timezone

router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections grouped by channel."""

    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = {}  # channel -> [ws]

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self._connections:
            self._connections[channel] = []
        self._connections[channel].append(websocket)

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self._connections:
            self._connections[channel] = [
                ws for ws in self._connections[channel] if ws != websocket
            ]

    async def broadcast(self, channel: str, data: dict):
        """Broadcast a message to all connections on a channel."""
        if channel not in self._connections:
            return
        dead = []
        for ws in self._connections[channel]:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._connections[channel] = [
                w for w in self._connections[channel] if w != ws
            ]

    async def send_personal(self, websocket: WebSocket, data: dict):
        try:
            await websocket.send_json(data)
        except Exception:
            pass

    def get_connection_count(self, channel: Optional[str] = None) -> int:
        if channel:
            return len(self._connections.get(channel, []))
        return sum(len(conns) for conns in self._connections.values())


# Global manager instance
manager = ConnectionManager()


@router.websocket("/ws/alerts")
async def websocket_alerts(
    websocket: WebSocket,
    channel: str = Query("general"),
    token: Optional[str] = Query(None),
):
    """WebSocket endpoint for real-time alerts.

    Channels: low-stock-alerts, queue-updates, general
    Auth: pass JWT as ?token=xxx query param (optional for now)
    """
    await manager.connect(websocket, channel)
    try:
        # Send welcome message
        await manager.send_personal(websocket, {
            "type": "connected",
            "channel": channel,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # Keep connection alive and listen for client messages
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Client can send ping/pong to keep alive
                msg = json.loads(data) if data else {}
                if msg.get("type") == "ping":
                    await manager.send_personal(websocket, {"type": "pong"})
            except asyncio.TimeoutError:
                # Send heartbeat
                await manager.send_personal(websocket, {"type": "heartbeat"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
    except Exception:
        manager.disconnect(websocket, channel)


# ---- Helper functions for other modules to broadcast ----

async def broadcast_low_stock_alert(product_name: str, current_stock: int, reorder_level: int, branch_id: str):
    """Called by pharmacy/inventory service when stock drops below reorder level."""
    await manager.broadcast("low-stock-alerts", {
        "type": "low-stock",
        "product_name": product_name,
        "current_stock": current_stock,
        "reorder_level": reorder_level,
        "branch_id": branch_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


async def broadcast_queue_update(queue_number: int, patient_name: str, status: str, branch_id: str):
    """Called by receptionist/queue service when queue status changes."""
    await manager.broadcast("queue-updates", {
        "type": "queue-update",
        "queue_number": queue_number,
        "patient_name": patient_name,
        "status": status,
        "branch_id": branch_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


# ---- REST endpoint for status ----

@router.get("/ws/status")
async def websocket_status():
    """Get WebSocket connection statistics."""
    return {
        "total_connections": manager.get_connection_count(),
        "channels": {
            "low-stock-alerts": manager.get_connection_count("low-stock-alerts"),
            "queue-updates": manager.get_connection_count("queue-updates"),
            "general": manager.get_connection_count("general"),
        }
    }
