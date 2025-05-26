Responses API
Requires langchain-openai>=0.3.9
OpenAI supports a Responses API that is oriented toward building agentic applications. It includes a suite of built-in tools, including web and file search. It also supports management of conversation state, allowing you to continue a conversational thread without explicitly passing in previous messages, as well as the output from reasoning processes.

ChatOpenAI will route to the Responses API if one of these features is used. You can also specify use_responses_api=True when instantiating ChatOpenAI.

Built-in tools
Equipping ChatOpenAI with built-in tools will ground its responses with outside information, such as via context in files or the web. The AIMessage generated from the model will include information about the built-in tool invocation.

Web search
To trigger a web search, pass {"type": "web_search_preview"} to the model as you would another tool.

tip
You can also pass built-in tools as invocation params:

llm.invoke("...", tools=[{"type": "web_search_preview"}])

from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini")

tool = {"type": "web_search_preview"}
llm_with_tools = llm.bind_tools([tool])

response = llm_with_tools.invoke("What was a positive news story from today?")

API Reference:ChatOpenAI
Note that the response includes structured content blocks that include both the text of the response and OpenAI annotations citing its sources:

response.content

[{'type': 'text',
  'text': 'Today, a heartwarming story emerged from Minnesota, where a group of high school robotics students built a custom motorized wheelchair for a 2-year-old boy named Cillian Jackson. Born with a genetic condition that limited his mobility, Cillian\'s family couldn\'t afford the $20,000 wheelchair he needed. The students at Farmington High School\'s Rogue Robotics team took it upon themselves to modify a Power Wheels toy car into a functional motorized wheelchair for Cillian, complete with a joystick, safety bumpers, and a harness. One team member remarked, "I think we won here more than we do in our competitions. Instead of completing a task, we\'re helping change someone\'s life." ([boredpanda.com](https://www.boredpanda.com/wholesome-global-positive-news/?utm_source=openai))\n\nThis act of kindness highlights the profound impact that community support and innovation can have on individuals facing challenges. ',
  'annotations': [{'end_index': 778,
    'start_index': 682,
    'title': '“Global Positive News”: 40 Posts To Remind Us There’s Good In The World',
    'type': 'url_citation',
    'url': 'https://www.boredpanda.com/wholesome-global-positive-news/?utm_source=openai'}]}]


tip
You can recover just the text content of the response as a string by using response.text(). For example, to stream response text:

for token in llm_with_tools.stream("..."):
    print(token.text(), end="|")

See the streaming guide for more detail.

The output message will also contain information from any tool invocations:

response.additional_kwargs

{'tool_outputs': [{'id': 'ws_67d192aeb6cc81918e736ad4a57937570d6f8507990d9d71',
   'status': 'completed',
   'type': 'web_search_call'}]}

File search
To trigger a file search, pass a file search tool to the model as you would another tool. You will need to populate an OpenAI-managed vector store and include the vector store ID in the tool definition. See OpenAI documentation for more detail.

llm = ChatOpenAI(model="gpt-4o-mini")

openai_vector_store_ids = [
    "vs_...",  # your IDs here
]

tool = {
    "type": "file_search",
    "vector_store_ids": openai_vector_store_ids,
}
llm_with_tools = llm.bind_tools([tool])

response = llm_with_tools.invoke("What is deep research by OpenAI?")
print(response.text())

Deep Research by OpenAI is a new capability integrated into ChatGPT that allows for the execution of multi-step research tasks independently. It can synthesize extensive amounts of online information and produce comprehensive reports similar to what a research analyst would do, significantly speeding up processes that would typically take hours for a human.

### Key Features:
- **Independent Research**: Users simply provide a prompt, and the model can find, analyze, and synthesize information from hundreds of online sources.
- **Multi-Modal Capabilities**: The model is also able to browse user-uploaded files, plot graphs using Python, and embed visualizations in its outputs.
- **Training**: Deep Research has been trained using reinforcement learning on real-world tasks that require extensive browsing and reasoning.

### Applications:
- Useful for professionals in sectors like finance, science, policy, and engineering, enabling them to obtain accurate and thorough research quickly.
- It can also be beneficial for consumers seeking personalized recommendations on complex purchases.

### Limitations:
Although Deep Research presents significant advancements, it has some limitations, such as the potential to hallucinate facts or struggle with authoritative information. 

Deep Research aims to facilitate access to thorough and documented information, marking a significant step toward the broader goal of developing artificial general intelligence (AGI).


As with web search, the response will include content blocks with citations:

response.content[0]["annotations"][:2]

[{'file_id': 'file-3UzgX7jcC8Dt9ZAFzywg5k',
  'index': 346,
  'type': 'file_citation',
  'filename': 'deep_research_blog.pdf'},
 {'file_id': 'file-3UzgX7jcC8Dt9ZAFzywg5k',
  'index': 575,
  'type': 'file_citation',
  'filename': 'deep_research_blog.pdf'}]

It will also include information from the built-in tool invocations:

response.additional_kwargs

{'tool_outputs': [{'id': 'fs_67d196fbb83c8191ba20586175331687089228ce932eceb1',
   'queries': ['What is deep research by OpenAI?'],
   'status': 'completed',
   'type': 'file_search_call'}]}

Computer use
ChatOpenAI supports the "computer-use-preview" model, which is a specialized model for the built-in computer use tool. To enable, pass a computer use tool as you would pass another tool.

Currently, tool outputs for computer use are present in AIMessage.additional_kwargs["tool_outputs"]. To reply to the computer use tool call, construct a ToolMessage with {"type": "computer_call_output"} in its additional_kwargs. The content of the message will be a screenshot. Below, we demonstrate a simple example.

First, load two screenshots:

import base64


def load_png_as_base64(file_path):
    with open(file_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read())
        return encoded_string.decode("utf-8")


screenshot_1_base64 = load_png_as_base64(
    "/path/to/screenshot_1.png"
)  # perhaps a screenshot of an application
screenshot_2_base64 = load_png_as_base64(
    "/path/to/screenshot_2.png"
)  # perhaps a screenshot of the Desktop

from langchain_openai import ChatOpenAI

# Initialize model
llm = ChatOpenAI(
    model="computer-use-preview",
    model_kwargs={"truncation": "auto"},
)

# Bind computer-use tool
tool = {
    "type": "computer_use_preview",
    "display_width": 1024,
    "display_height": 768,
    "environment": "browser",
}
llm_with_tools = llm.bind_tools([tool])

# Construct input message
input_message = {
    "role": "user",
    "content": [
        {
            "type": "text",
            "text": (
                "Click the red X to close and reveal my Desktop. "
                "Proceed, no confirmation needed."
            ),
        },
        {
            "type": "input_image",
            "image_url": f"data:image/png;base64,{screenshot_1_base64}",
        },
    ],
}

# Invoke model
response = llm_with_tools.invoke(
    [input_message],
    reasoning={
        "generate_summary": "concise",
    },
)

API Reference:ChatOpenAI
The response will include a call to the computer-use tool in its additional_kwargs:

response.additional_kwargs

{'reasoning': {'id': 'rs_67ddb381c85081919c46e3e544a161e8051ff325ba1bad35',
  'summary': [{'text': 'Closing Visual Studio Code application',
    'type': 'summary_text'}],
  'type': 'reasoning'},
 'tool_outputs': [{'id': 'cu_67ddb385358c8191bf1a127b71bcf1ea051ff325ba1bad35',
   'action': {'button': 'left', 'type': 'click', 'x': 17, 'y': 38},
   'call_id': 'call_Ae3Ghz8xdqZQ01mosYhXXMho',
   'pending_safety_checks': [],
   'status': 'completed',
   'type': 'computer_call'}]}

We next construct a ToolMessage with these properties:

It has a tool_call_id matching the call_id from the computer-call.
It has {"type": "computer_call_output"} in its additional_kwargs.
Its content is either an image_url or an input_image output block (see OpenAI docs for formatting).
from langchain_core.messages import ToolMessage

tool_call_id = response.additional_kwargs["tool_outputs"][0]["call_id"]

tool_message = ToolMessage(
    content=[
        {
            "type": "input_image",
            "image_url": f"data:image/png;base64,{screenshot_2_base64}",
        }
    ],
    # content=f"data:image/png;base64,{screenshot_2_base64}",  # <-- also acceptable
    tool_call_id=tool_call_id,
    additional_kwargs={"type": "computer_call_output"},
)

API Reference:ToolMessage
We can now invoke the model again using the message history:

messages = [
    input_message,
    response,
    tool_message,
]

response_2 = llm_with_tools.invoke(
    messages,
    reasoning={
        "generate_summary": "concise",
    },
)

response_2.text()

'Done! The Desktop is now visible.'

Instead of passing back the entire sequence, we can also use the previous_response_id:

previous_response_id = response.response_metadata["id"]

response_2 = llm_with_tools.invoke(
    [tool_message],
    previous_response_id=previous_response_id,
    reasoning={
        "generate_summary": "concise",
    },
)

response_2.text()

'The Visual Studio Code terminal has been closed and your desktop is now visible.'

Code interpreter
OpenAI implements a code interpreter tool to support the sandboxed generation and execution of code.

Example use:

from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="o4-mini", use_responses_api=True)

llm_with_tools = llm.bind_tools(
    [
        {
            "type": "code_interpreter",
            # Create a new container
            "container": {"type": "auto"},
        }
    ]
)
response = llm_with_tools.invoke(
    "Write and run code to answer the question: what is 3^3?"
)

API Reference:ChatOpenAI
Note that the above command created a new container. We can also specify an existing container ID:

tool_outputs = response.additional_kwargs["tool_outputs"]
assert len(tool_outputs) == 1
container_id = tool_outputs[0]["container_id"]

llm_with_tools = llm.bind_tools(
    [
        {
            "type": "code_interpreter",
            # Use an existing container
            "container": container_id,
        }
    ]
)

Remote MCP
OpenAI implements a remote MCP tool that allows for model-generated calls to MCP servers.

Example use:

from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="o4-mini", use_responses_api=True)

llm_with_tools = llm.bind_tools(
    [
        {
            "type": "mcp",
            "server_label": "deepwiki",
            "server_url": "https://mcp.deepwiki.com/mcp",
            "require_approval": "never",
        }
    ]
)
response = llm_with_tools.invoke(
    "What transport protocols does the 2025-03-26 version of the MCP "
    "spec (modelcontextprotocol/modelcontextprotocol) support?"
)

API Reference:ChatOpenAI
MCP Approvals
Managing conversation state
The Responses API supports management of conversation state.

Manually manage state
You can manage the state manually or using LangGraph, as with other chat models:

from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini")

tool = {"type": "web_search_preview"}
llm_with_tools = llm.bind_tools([tool])

first_query = "What was a positive news story from today?"
messages = [{"role": "user", "content": first_query}]

response = llm_with_tools.invoke(messages)
response_text = response.text()
print(f"{response_text[:100]}... {response_text[-100:]}")

API Reference:ChatOpenAI
As of March 12, 2025, here are some positive news stories that highlight recent uplifting events:

*...  exemplify positive developments in health, environmental sustainability, and community well-being.


second_query = (
    "Repeat my question back to me, as well as the last sentence of your answer."
)

messages.extend(
    [
        response,
        {"role": "user", "content": second_query},
    ]
)
second_response = llm_with_tools.invoke(messages)
print(second_response.text())

Your question was: "What was a positive news story from today?"

The last sentence of my answer was: "These stories exemplify positive developments in health, environmental sustainability, and community well-being."


tip
You can use LangGraph to manage conversational threads for you in a variety of backends, including in-memory and Postgres. See this tutorial to get started.

Passing previous_response_id
When using the Responses API, LangChain messages will include an "id" field in its metadata. Passing this ID to subsequent invocations will continue the conversation. Note that this is equivalent to manually passing in messages from a billing perspective.

from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-4o-mini",
    use_responses_api=True,
)
response = llm.invoke("Hi, I'm Bob.")
print(response.text())

API Reference:ChatOpenAI
Hi Bob! How can I assist you today?

second_response = llm.invoke(
    "What is my name?",
    previous_response_id=response.response_metadata["id"],
)
print(second_response.text())

Your name is Bob. How can I help you today, Bob?

Reasoning output
Some OpenAI models will generate separate text content illustrating their reasoning process. See OpenAI's reasoning documentation for details.

OpenAI can return a summary of the model's reasoning (although it doesn't expose the raw reasoning tokens). To configure ChatOpenAI to return this summary, specify the reasoning parameter:

from langchain_openai import ChatOpenAI

reasoning = {
    "effort": "medium",  # 'low', 'medium', or 'high'
    "summary": "auto",  # 'detailed', 'auto', or None
}

llm = ChatOpenAI(
    model="o4-mini",
    use_responses_api=True,
    model_kwargs={"reasoning": reasoning},
)
response = llm.invoke("What is 3^3?")

# Output
response.text()

API Reference:ChatOpenAI
'3^3 = 3 × 3 × 3 = 27.'

# Reasoning
reasoning = response.additional_kwargs["reasoning"]
for block in reasoning["summary"]:
    print(block["text"])

**Calculating power of three**

The user is asking for the result of 3 to the power of 3, which I know is 27. It's a straightforward question, so I’ll keep my answer concise: 27. I could explain that this is the same as multiplying 3 by itself twice: 3 × 3 × 3 equals 27. However, since the user likely just needs the answer, I’ll simply respond with 27.


