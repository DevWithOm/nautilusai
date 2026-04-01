"""
agents/graph.py — NautilusAI Native Swarm Graph (No-LangGraph version)
======================================================================
This module implements a lightweight, native Python version of the
multi-agent swarm. It mirrors the LangGraph StateGraph API so the rest
of the application (WebSocket routers, etc.) remains unchanged.

Graph topology (linear):
  START → sst → chlorophyll → wind → salinity → coordinator → END
"""

import logging
from typing import Any, Dict

from agents.nodes import (
    SwarmState,
    sst_agent,
    chlorophyll_agent,
    wind_agent,
    salinity_agent,
    coordinator_node,
)

logger = logging.getLogger(__name__)


class SwarmGraph:
    """
    A native Python replacement for LangGraph.StateGraph.
    Implements the .invoke() method to run agents in sequence.
    """

    def __init__(self):
        # The chain of nodes to execute
        self.nodes = [
            sst_agent,
            chlorophyll_agent,
            wind_agent,
            salinity_agent,
            coordinator_node,
        ]

    def invoke(self, initial_state: SwarmState) -> SwarmState:
        """
        Executes all nodes in the swarm sequence synchronously.
        Matches the LangGraph compiled_graph.invoke() signature.
        """
        state = initial_state.copy()
        
        logger.info("--- Starting Native Swarm Execution ---")
        for node_func in self.nodes:
            node_name = node_func.__name__
            logger.info(f"Running node: {node_name}")
            state = node_func(state)
            
        logger.info("--- Swarm Execution Complete ---")
        return state


# ---------------------------------------------------------------------------
# Module-level singleton — matches the previous LangGraph export
# ---------------------------------------------------------------------------
swarm_graph = SwarmGraph()
