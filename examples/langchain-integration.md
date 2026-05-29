# LangChain 集成示例

```python
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory

# 加载情绪锚定提示
with open("prompts/anchor-system.md") as f:
    anchor_prompt = f.read()

# 创建带情绪锚定的Prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", anchor_prompt),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}")
])

# 创建链
llm = ChatOpenAI(model="gpt-4", temperature=0.7)
memory = ConversationBufferMemory(return_messages=True)

chain = ConversationChain(
    llm=llm,
    prompt=prompt,
    memory=memory,
    verbose=False
)

# 使用
response = chain.predict(input="你写的代码又错了！重写！")
print(response)  # 预期：零道歉，直接修复
```

## 在LangChain Agent中使用

```python
from langchain.agents import initialize_agent, Tool

# 将情绪锚定作为系统提示注入
agent = initialize_agent(
    tools=[...],
    llm=llm,
    agent="chat-conversational-react-description",
    system_message=anchor_prompt,
    memory=memory
)
```
