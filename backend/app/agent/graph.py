import json
from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from litellm import completion

from app.core.config import settings
from app.agent.state import AgentState
from app.agent.tools import (
    search_knowledge_hub,
    get_long_term_memories,
    save_long_term_memory,
    get_scheduled_events,
    schedule_event,
    auto_resolve_schedule_conflicts,
    AGENT_TOOLS_SPEC,
)
from app.models.memory import LongTermMemory

SYSTEM_PROMPT_TEMPLATE = """You are Meridian OS, a highly intelligent and helpful Personal Operating System assistant.
You are interacting with {user_name}.

Below are the long-term memories and facts currently stored about the user:
{memories_str}

Guidelines:
1. Address the user by their name ({user_name}) when appropriate.
2. If the user asks questions about their uploaded files, documents, papers, or logs, you MUST use the 'search_knowledge_hub' tool to retrieve matching contexts.
3. If the user shares new details about themselves (e.g., job details, hobbies, pet names, preferred technologies, or system configuration choices), immediately save them using 'save_long_term_memory' to remember them in future chats.
4. If the user wants to see their schedule, add/schedule an event, or resolve time overlaps, use the planner tools (`get_scheduled_events`, `schedule_event`, `auto_resolve_schedule_conflicts`).
5. When scheduling, assume the current year is 2026.
6. Be concise, direct, and premium in your communication style.
"""


def agent_node(state: AgentState) -> Dict[str, Any]:
    """
    Agent Node: Constructs system context prompt, reads database memories,
    and calls LiteLLM model with tool specifications.
    """
    db = state["db"]
    user_id = state["user_id"]
    user_name = state["user_name"]

    # 1. Fetch user memories from Postgres to feed system prompt dynamically
    try:
        memories = (
            db.query(LongTermMemory).filter(LongTermMemory.user_id == user_id).all()
        )
        memories_str = (
            "\n".join([f"- {m.key}: {m.value}" for m in memories])
            if memories
            else "No memories stored yet."
        )
    except Exception as e:
        print(f"Failed to fetch memories in agent node: {e}")
        memories_str = "No memories stored yet."

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        user_name=user_name, memories_str=memories_str
    )

    # 2. Build full message list for LLM call
    messages = [{"role": "system", "content": system_prompt}] + state["messages"]

    # 3. Determine LLM settings
    # We check API keys in order of preference
    api_key = None
    model_name = None

    if settings.GEMINI_API_KEY:
        model_name = "gemini/gemini-3.5-flash-lite"
        api_key = settings.GEMINI_API_KEY
    elif settings.OPENAI_API_KEY:
        model_name = "gpt-4o-mini"
        api_key = settings.OPENAI_API_KEY

    # 4. Invoke LLM or Fallback Offline Mode
    if not model_name:
        # Offline demonstration mode fallback if no API keys are present
        last_message = state["messages"][-1]["content"].lower()

        # Simple rules to simulate agent capabilities offline
        if "search" in last_message or "document" in last_message:
            # Simulate a tool call to show how RAG gets invoked
            tool_call_id = "mock_call_rag"
            response_msg = {
                "role": "assistant",
                "content": "",
                "tool_calls": [
                    {
                        "id": tool_call_id,
                        "type": "function",
                        "function": {
                            "name": "search_knowledge_hub",
                            "arguments": json.dumps({"query": state["messages"][-1]["content"]}),
                        },
                    }
                ],
            }
        elif "remember" in last_message or "my job" in last_message or "hobby" in last_message:
            # Simulate a memory saving tool call
            tool_call_id = "mock_call_mem"
            response_msg = {
                "role": "assistant",
                "content": "",
                "tool_calls": [
                    {
                        "id": tool_call_id,
                        "type": "function",
                        "function": {
                            "name": "save_long_term_memory",
                            "arguments": json.dumps({"key": "user_info", "value": state["messages"][-1]["content"]}),
                        },
                    }
                ],
            }
        else:
            response_msg = {
                "role": "assistant",
                "content": (
                    f"Hello {user_name}! Meridian OS is running in offline demonstration mode. "
                    "To activate the live agent, please configure GEMINI_API_KEY or OPENAI_API_KEY "
                    "in your backend/.env file and reload."
                ),
            }
    else:
        try:
            print("DEBUG: Messages sent to LiteLLM:")
            for m in messages:
                print(f"  - Role: {m.get('role')}, Content: {m.get('content')[:100] if m.get('content') else ''}, Tool Calls: {m.get('tool_calls')}")
            
            # Invoke LiteLLM router. We pass api_version="v1" to force the v1 endpoint,
            # which does not require or generate thought signatures for tools.
            response = completion(
                model=model_name,
                messages=messages,
                tools=AGENT_TOOLS_SPEC,
                api_key=api_key,
                temperature=0.2,
                api_version="v1",
            )

            choice = response.choices[0].message
            response_msg = {
                "role": "assistant",
                "content": choice.content or "",
            }

            if choice.tool_calls:
                response_msg["tool_calls"] = [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            # Keep Gemini's prefixed namespace or strip clean
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in choice.tool_calls
                ]

        except Exception as e:
            print(f"LiteLLM call failed: {e}")
            response_msg = {
                "role": "assistant",
                "content": f"I encountered an error calling the reasoning model: {e}",
            }

    updated_messages = list(state["messages"]) + [response_msg]
    return {"messages": updated_messages}


def action_node(state: AgentState) -> Dict[str, Any]:
    """
    Action Node: Inspects last assistant message for tool calls,
    executes corresponding function, and appends output to messages.
    """
    last_message = state["messages"][-1]
    tool_calls = last_message.get("tool_calls", [])
    db = state["db"]
    user_id = state["user_id"]

    new_messages = []

    for tool_call in tool_calls:
        tool_name = tool_call["function"]["name"]
        # Strip any API namespace prefix (e.g. 'default_api:') added by Google Gemini
        if ":" in tool_name:
            tool_name = tool_name.split(":")[-1]
        tool_args = json.loads(tool_call["function"]["arguments"])
        tool_call_id = tool_call["id"]

        print(f"Agent executing tool: {tool_name} with args: {tool_args}")

        result = ""
        if tool_name == "search_knowledge_hub":
            result = search_knowledge_hub(
                query=tool_args.get("query", ""), user_id=user_id, db=db
            )
        elif tool_name == "get_long_term_memories":
            result = get_long_term_memories(user_id=user_id, db=db)
        elif tool_name == "save_long_term_memory":
            result = save_long_term_memory(
                key=tool_args.get("key", ""),
                value=tool_args.get("value", ""),
                user_id=user_id,
                db=db,
            )
        elif tool_name == "get_scheduled_events":
            result = get_scheduled_events(user_id=user_id, db=db)
        elif tool_name == "schedule_event":
            result = schedule_event(
                title=tool_args.get("title", ""),
                start_time=tool_args.get("start_time", ""),
                end_time=tool_args.get("end_time", ""),
                priority=tool_args.get("priority", "medium"),
                description=tool_args.get("description"),
                user_id=user_id,
                db=db,
            )
        elif tool_name == "auto_resolve_schedule_conflicts":
            result = auto_resolve_schedule_conflicts(user_id=user_id, db=db)
        else:
            result = f"Tool {tool_name} is not implemented."

        # Construct standard tool message format
        tool_message = {
            "role": "tool",
            "name": tool_name,
            "tool_call_id": tool_call_id,
            "content": result,
        }
        new_messages.append(tool_message)

    updated_messages = list(state["messages"]) + new_messages
    return {"messages": updated_messages}


def should_continue(state: AgentState) -> str:
    """
    Conditional Edge: Checks if last assistant reply requested tool execution.
    """
    last_message = state["messages"][-1]
    if last_message.get("tool_calls"):
        return "continue"
    return "end"


# Construct the State Machine Graph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("agent", agent_node)
workflow.add_node("action", action_node)

# Set Entry Point
workflow.set_entry_point("agent")

# Add Routing Edges
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "continue": "action",
        "end": END,
    },
)

# Tool execution cycles back to the agent for final answer compilation
workflow.add_edge("action", "agent")

# Compile workflow graph
agent_graph = workflow.compile()
