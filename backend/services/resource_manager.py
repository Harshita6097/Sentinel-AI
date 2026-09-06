"""In-memory rescue resource inventory.

Loads resources.json on first access. Supports status transitions:
Available → Assigned → Busy → Available | Maintenance
"""
import json
import os
from dataclasses import dataclass, field
from typing import Literal

_RESOURCES_PATH = os.path.join(os.path.dirname(__file__), "..", "simulation", "resources.json")

ResourceStatus = Literal["Available", "Assigned", "Busy", "Maintenance"]

VALID_STATUSES: set[str] = {"Available", "Assigned", "Busy", "Maintenance"}


@dataclass
class Resource:
    id: str
    type: str
    status: ResourceStatus
    location: str
    capacity: int
    speed_kmh: float
    assigned_to: str | None = None      # destination node when assigned


class ResourceManager:
    def __init__(self) -> None:
        self._resources: dict[str, Resource] = {}
        self._load()

    # ── public API ───────────────────────────────────────────────────────────

    def list_all(self) -> list[Resource]:
        return list(self._resources.values())

    def get(self, resource_id: str) -> Resource | None:
        return self._resources.get(resource_id)

    def available(self, resource_type: str | None = None) -> list[Resource]:
        return [
            r for r in self._resources.values()
            if r.status == "Available"
            and (resource_type is None or r.type == resource_type)
        ]

    def assign(self, resource_id: str, destination: str) -> Resource | None:
        r = self._resources.get(resource_id)
        if r and r.status == "Available":
            r.status = "Assigned"
            r.assigned_to = destination
            return r
        return None

    def set_status(self, resource_id: str, status: ResourceStatus) -> Resource | None:
        r = self._resources.get(resource_id)
        if r and status in VALID_STATUSES:
            r.status = status
            if status == "Available":
                r.assigned_to = None
            return r
        return None

    def nearest_available(self, destination: str, resource_type: str | None = None,
                          graph_nodes: dict | None = None) -> Resource | None:
        """Return the closest available resource by straight-line distance (or first found)."""
        candidates = self.available(resource_type)
        if not candidates:
            return None
        if graph_nodes is None:
            return candidates[0]

        dest_node = graph_nodes.get(destination)
        if not dest_node:
            return candidates[0]

        def dist(r: Resource) -> float:
            node = graph_nodes.get(r.location)
            if not node:
                return float("inf")
            dlat = node["lat"] - dest_node["lat"]
            dlng = node["lng"] - dest_node["lng"]
            return dlat ** 2 + dlng ** 2

        return min(candidates, key=dist)

    def reset(self) -> None:
        """Reload resources from file (used on simulation reset)."""
        self._resources.clear()
        self._load()

    # ── internals ────────────────────────────────────────────────────────────

    def _load(self) -> None:
        with open(_RESOURCES_PATH, encoding="utf-8") as f:
            data = json.load(f)
        for item in data:
            r = Resource(
                id=item["id"],
                type=item["type"],
                status=item["status"],
                location=item["location"],
                capacity=item["capacity"],
                speed_kmh=item["speed_kmh"],
            )
            self._resources[r.id] = r
