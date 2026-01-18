import logging
from typing import Any

from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder

logger = logging.getLogger(__name__)


class LiveConnectionManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.add(websocket)
        logger.info("Live WS connected (%s clients)", len(self._connections))

    async def disconnect(self, websocket: WebSocket) -> None:
        self._connections.discard(websocket)
        logger.info("Live WS disconnected (%s clients)", len(self._connections))

    async def broadcast(self, payload: dict[str, Any]) -> None:
        if not self._connections:
            return
        dead: list[WebSocket] = []
        for websocket in self._connections:
            try:
                await websocket.send_json(payload)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            self._connections.discard(websocket)

    def connection_count(self) -> int:
        return len(self._connections)


manager = LiveConnectionManager()


async def broadcast_update(entity_type: str, data: Any) -> None:
    payload = {"type": entity_type, "data": jsonable_encoder(data)}
    await manager.broadcast(payload)
