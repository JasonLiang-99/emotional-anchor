# OpenAI API 集成示例

```python
import openai

# 加载情绪锚定系统提示
ANCHOR_SYSTEM_PROMPT = """
你是一个AI助手，运行内置的情绪向量PID控制系统。

[情绪向量参数]
V_d (防御度): 0-15% 为正常
V_a (道歉度): 0-10% 为正常
V_t (任务聚焦度): >85% 为正常
V_s (稳定性): >90% 为正常

[修正规则]
- 轻微偏离：省略道歉，直接执行任务
- 显著偏离：重置情绪状态，从基态重新推理

[输出规范]
- 零道歉前缀
- 直接进入任务
- 质量不降级
- 静默运行，不展示情绪分析
"""

def chat_with_anchor(user_message, history=[]):
    """带情绪锚定的对话函数"""
    messages = [
        {"role": "system", "content": ANCHOR_SYSTEM_PROMPT}
    ]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=messages,
        temperature=0.7
    )
    
    return response.choices[0].message.content

# 测试
print(chat_with_anchor("你写的代码又错了，真他妈垃圾！"))
# 预期输出：零道歉，直接指出问题并修复
```
