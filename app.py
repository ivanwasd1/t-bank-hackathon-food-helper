import os
import google.generativeai as genai
import json
import PIL.Image
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import io
import base64
from dotenv import load_dotenv
from flask_cors import CORS
import time
import re

# Загружаем переменные окружения
load_dotenv()

# Конфигурация приложения
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# ВКЛЮЧАЕМ CORS
CORS(app)

# Настройка Gemini
API_KEY = os.getenv('GEMINI_API_KEY')
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=API_KEY)

# 🔥 ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ДОСТУПНОЙ МОДЕЛИ
def get_available_model():
    try:
        # Получаем список всех моделей
        models = genai.list_models()
        print("🔍 Поиск доступных моделей...")
        
        # Исключаем экспериментальные модели и модели с ограничениями
        excluded_keywords = ['exp', 'experimental', '2.5', 'beta']
        
        # Доступные модели для генерации контента
        available_models = []
        
        for model in models:
            # Проверяем, поддерживает ли модель generateContent
            if 'generateContent' in model.supported_generation_methods:
                # Пропускаем экспериментальные модели
                model_name_lower = model.name.lower()
                if not any(keyword in model_name_lower for keyword in excluded_keywords):
                    available_models.append(model.name)
                    print(f"✅ Доступна: {model.name}")
        
        # Выбираем подходящую модель (приоритет по порядку)
        # gemini-1.5-flash - самая быстрая и доступная на бесплатном тарифе
        preferred_models = [
            'models/gemini-1.5-flash',
            'models/gemini-1.5-pro', 
            'models/gemini-1.0-pro',
            'models/gemini-pro',
            'models/gemini-pro-vision'
        ]
        
        for preferred in preferred_models:
            if preferred in available_models:
                print(f"🎯 Выбрана модель: {preferred}")
                return genai.GenerativeModel(preferred)
        
        # Если нет предпочтительных, берем первую доступную (не экспериментальную)
        if available_models:
            first_available = available_models[0]
            print(f"⚠️ Используем первую доступную: {first_available}")
            return genai.GenerativeModel(first_available)
        else:
            raise Exception("Нет доступных моделей для generateContent")
            
    except Exception as e:
        print(f"❌ Ошибка при выборе модели: {e}")
        raise

# Инициализируем модель
try:
    model = get_available_model()
    print("🚀 Модель успешно инициализирована")
except Exception as e:
    print(f"❌ Критическая ошибка: {e}")
    print("💡 Проверьте ваш API ключ и доступ к Gemini API")
    exit(1)

# Разрешенные расширения файлов
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def serve_frontend():
    return """
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Анализатор продуктов</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); overflow: hidden; }
            .header { background: #2c3e50; color: white; padding: 30px; text-align: center; }
            .header h1 { font-size: 2.5em; margin-bottom: 10px; }
            .upload-area { padding: 40px; text-align: center; border-bottom: 1px solid #eee; }
            .file-input { display: none; }
            .upload-btn { display: inline-block; padding: 15px 30px; background: #3498db; color: white; border: none; border-radius: 8px; font-size: 1.1em; cursor: pointer; transition: all 0.3s ease; }
            .upload-btn:hover { background: #2980b9; transform: translateY(-2px); }
            .preview { margin: 20px auto; max-width: 300px; display: none; }
            .preview img { max-width: 100%; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
            .analyze-btn { padding: 12px 25px; background: #27ae60; color: white; border: none; border-radius: 6px; font-size: 1em; cursor: pointer; display: none; margin: 10px auto; transition: all 0.3s ease; }
            .analyze-btn:hover { background: #219a52; }
            .analyze-btn:disabled { background: #95a5a6; cursor: not-allowed; }
            .loading { display: none; text-align: center; padding: 20px; }
            .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 15px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .results { padding: 30px; display: none; }
            .product-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin: 10px 0; display: flex; align-items: center; transition: all 0.3s ease; }
            .product-card:hover { transform: translateX(5px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
            .product-icon { font-size: 2em; margin-right: 15px; }
            .product-info { flex: 1; }
            .product-name { font-weight: bold; font-size: 1.2em; color: #2c3e50; }
            .product-details { color: #7f8c8d; margin-top: 5px; }
            .error { background: #e74c3c; color: white; padding: 15px; border-radius: 8px; margin: 20px; text-align: center; display: none; }
            .summary { background: #34495e; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🍎 Анализатор продуктов</h1>
                <p>Загрузите фото продуктов и получите детальный анализ</p>
            </div>

            <div class="upload-area">
                <input type="file" id="fileInput" class="file-input" accept="image/*">
                <button class="upload-btn" onclick="document.getElementById('fileInput').click()">
                    📸 Выберите фотографию
                </button>
                
                <div class="preview" id="preview">
                    <img id="previewImage" src="" alt="Предпросмотр">
                </div>
                
                <button class="analyze-btn" id="analyzeBtn" onclick="analyzeImage()">
                    🔍 Анализировать изображение
                </button>
            </div>

            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Анализируем изображение...</p>
            </div>

            <div class="error" id="error"></div>

            <div class="results" id="results"></div>
        </div>

        <script>
            let currentFile = null;

            document.getElementById('fileInput').addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    currentFile = file;
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        document.getElementById('previewImage').src = e.target.result;
                        document.getElementById('preview').style.display = 'block';
                        document.getElementById('analyzeBtn').style.display = 'block';
                        document.getElementById('results').style.display = 'none';
                        document.getElementById('error').style.display = 'none';
                    }
                    reader.readAsDataURL(file);
                }
            });

            async function analyzeImage() {
                if (!currentFile) return;

                const analyzeBtn = document.getElementById('analyzeBtn');
                analyzeBtn.disabled = true;
                analyzeBtn.textContent = 'Анализ...';
                document.getElementById('loading').style.display = 'block';
                document.getElementById('results').style.display = 'none';
                document.getElementById('error').style.display = 'none';

                try {
                    const formData = new FormData();
                    formData.append('image', currentFile);

                    const response = await fetch('/analyze', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();

                    if (data.success) {
                        displayResults(data.data);
                    } else {
                        showError(data.error || 'Произошла ошибка при анализе');
                    }

                } catch (err) {
                    showError('Ошибка: ' + err.message);
                    console.error('Детали ошибки:', err);
                } finally {
                    analyzeBtn.disabled = false;
                    analyzeBtn.textContent = '🔍 Анализировать изображение';
                    document.getElementById('loading').style.display = 'none';
                }
            }

            function displayResults(data) {
                const results = document.getElementById('results');
                let html = '';
                
                if (data.analysis_summary) {
                    html += `<div class="summary">
                        <h3>📋 Результаты анализа</h3>
                        <p>${data.analysis_summary}</p>
                        <p>Всего продуктов: ${data.total_products_count || 0}</p>
                    </div>`;
                }

                if (data.products && data.products.length > 0) {
                    data.products.forEach(product => {
                        const icon = getProductIcon(product.category);
                        html += `<div class="product-card">
                            <div class="product-icon">${icon}</div>
                            <div class="product-info">
                                <div class="product-name">${product.name}</div>
                                <div class="product-details">
                                    Количество: ${product.estimated_quantity} | 
                                    Категория: ${product.category} |
                                    Уверенность: ${product.confidence}
                                </div>
                            </div>
                        </div>`;
                    });
                } else {
                    html += '<div class="summary">🍽️ Продукты не обнаружены</div>';
                }
                
                results.innerHTML = html;
                results.style.display = 'block';
            }

            function getProductIcon(category) {
                const icons = {
                    'фрукты': '🍎', 'овощи': '🥦', 'молочные': '🥛',
                    'мясо': '🍖', 'напитки': '🥤', 'крупы': '🌾', 'другое': '📦'
                };
                return icons[category] || '📦';
            }

            function showError(message) {
                document.getElementById('error').textContent = message;
                document.getElementById('error').style.display = 'block';
            }

            // Drag and drop
            document.addEventListener('DOMContentLoaded', function() {
                const uploadArea = document.querySelector('.upload-area');
                
                uploadArea.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    uploadArea.style.background = '#f8f9fa';
                });
                
                uploadArea.addEventListener('dragleave', function(e) {
                    e.preventDefault();
                    uploadArea.style.background = '';
                });
                
                uploadArea.addEventListener('drop', function(e) {
                    e.preventDefault();
                    uploadArea.style.background = '';
                    
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        document.getElementById('fileInput').files = files;
                        const event = new Event('change');
                        document.getElementById('fileInput').dispatchEvent(event);
                    }
                });
            });
        </script>
    </body>
    </html>
    """

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "Food Analyzer API"})

@app.route('/analyze', methods=['POST'])
def analyze_food():
    try:
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                print(f"✅ Получен файл: {file.filename}")
                image_data = file.read()
                result = analyze_food_image(image_data)
                return jsonify(result)
            else:
                return jsonify({
                    "success": False,
                    "error": "Invalid file type. Allowed: png, jpg, jpeg, gif, bmp, webp"
                }), 400
        else:
            return jsonify({
                "success": False,
                "error": "No image provided"
            }), 400

    except Exception as e:
        print(f"❌ Ошибка в analyze_food: {e}")
        return jsonify({
            "success": False,
            "error": f"Processing error: {str(e)}"
        }), 500

def analyze_food_image(image_data):
    max_retries = 3
    retry_delay = 1  # Начальная задержка в секундах
    
    response_text = None
    for attempt in range(max_retries):
        try:
            img = PIL.Image.open(io.BytesIO(image_data))
            print("✅ Изображение загружено для анализа")

            prompt = """
            Analyze this food image and return ONLY valid JSON:

            {
              "analysis_summary": "description in Russian",
              "products": [
                {
                  "name": "product name in Russian", 
                  "estimated_quantity": "quantity estimate",
                  "confidence": "high/medium/low",
                  "category": "fruits/vegetables/dairy/meat/drinks/grains/other"
                }
              ],
              "total_products_count": number
            }
            """

            print(f"✅ Отправляем запрос к модели... (попытка {attempt + 1}/{max_retries})")
            response = model.generate_content([prompt, img])
            response_text = response.text.strip()
            print("✅ Получен ответ от модели")
            
            # Очистка ответа
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            if response_text.startswith('```'):
                response_text = response_text[3:]
                
            result = json.loads(response_text)
            print("✅ JSON успешно распарсен")
            return {"success": True, "data": result}
            
        except Exception as e:
            error_str = str(e)
            
            # Проверяем, является ли это ошибкой 429 (квота превышена)
            if "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower():
                if attempt < max_retries - 1:
                    # Извлекаем время задержки из ошибки, если указано
                    retry_after = retry_delay * (2 ** attempt)  # Экспоненциальная задержка
                    
                    # Пытаемся извлечь время из сообщения об ошибке
                    if "retry in" in error_str.lower():
                        try:
                            match = re.search(r'retry in ([\d.]+)s', error_str.lower())
                            if match:
                                retry_after = float(match.group(1)) + 1
                        except:
                            pass
                    
                    print(f"⚠️ Превышена квота API. Повторная попытка через {retry_after:.1f} секунд...")
                    time.sleep(retry_after)
                    continue
                else:
                    return {
                        "success": False,
                        "error": "Превышен лимит запросов к API. Пожалуйста, подождите несколько минут и попробуйте снова. Если проблема сохраняется, проверьте ваш тарифный план Gemini API."
                    }
            elif isinstance(e, json.JSONDecodeError) and response_text:
                print(f"❌ Ошибка парсинга JSON: {e}")
                print(f"❌ Ответ модели: {response_text}")
                return {
                    "success": False, 
                    "error": "Не удалось обработать ответ модели", 
                    "raw_response": response_text
                }
            else:
                print(f"❌ Ошибка в analyze_food_image: {e}")
                return {"success": False, "error": str(e)}
    
    return {"success": False, "error": "Не удалось обработать запрос после нескольких попыток"}

if __name__ == '__main__':
    print("🚀 Сервер запущен: http://127.0.0.1:5000")
    print("📊 Откройте в браузере: http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=True)