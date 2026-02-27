import google.generativeai as genai

# 1. 替换你的 API Key
# API_KEY = "AIzaSyDQ6HVL4cAzizkqFN7GyADf3dVkSpf1ZjU"
API_KEY = "sk-fa2832d938184d41ab28de10b9eb688a"

genai.configure(api_key=API_KEY)

def diagnostic():
    print("📡 正在获取可用模型列表...")
    try:
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        
        if not available_models:
            print("❌ 未发现可用模型。请检查 API Key 权限。")
            return

        print(f"✅ 发现可用模型: {available_models}")
        
        # 尝试使用列表中的第一个模型（动态适配）
        target_model = available_models[0]
        print(f"🤖 正在尝试调用: {target_model} ...")
        
        model = genai.GenerativeModel(target_model)
        response = model.generate_content("你好，请确认连接。")
        
        print(f"\n✨ 成功！回复内容: {response.text}")
        
    except Exception as e:
        print(f"\n❌ 错误详情: {e}")
        print("💡 提示: 如果报 404，请确认你的 API Key 是否是在 AI Studio 刚生成的。")

if __name__ == "__main__":
    diagnostic()