import os
import importlib
import inspect
import logging
from typing import Dict, Type
from app.agents.base import BaseAgent

logger = logging.getLogger("nextfolio.plugins")

class PluginManager:
    def __init__(self, plugin_dir: str = None):
        if plugin_dir is None:
            plugin_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "plugins"))
        self.plugin_dir = plugin_dir
        self.discovered_agents: Dict[str, BaseAgent] = {}

    def discover_plugins(self) -> Dict[str, BaseAgent]:
        """Scans the plugins directory and dynamically imports and instantiates any subclasses of BaseAgent."""
        if not os.path.exists(self.plugin_dir):
            logger.warning(f"Plugin directory does not exist: {self.plugin_dir}")
            return {}

        logger.info(f"Scanning for plugins in {self.plugin_dir}...")
        
        for filename in os.listdir(self.plugin_dir):
            if filename.endswith(".py") and filename != "__init__.py" and filename != "manager.py":
                module_name = f"app.plugins.{filename[:-3]}"
                try:
                    module = importlib.import_module(module_name)
                    # Find all classes in the module that subclass BaseAgent
                    for name, cls in inspect.getmembers(module, inspect.isclass):
                        if issubclass(cls, BaseAgent) and cls is not BaseAgent:
                            # Instantiate the agent
                            agent_instance = cls()
                            self.discovered_agents[name] = agent_instance
                            logger.info(f"Successfully discovered and registered plugin agent: {name}")
                except Exception as e:
                    logger.error(f"Failed to load plugin module {module_name}: {e}")

        return self.discovered_agents

plugin_manager = PluginManager()
plugin_manager.discover_plugins()
