import os
import sys
import google.generativeai as genai
import json
import PIL.Image
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import io
import base64
from dotenv import load_dotenv
from flask_cors import CORS
import time
import re
from datetime import datetime, date, timedelta
from database import db, User, Recipe, FavoriteRecipe, Menu, MenuItem, FridgeItem, ShoppingList, ShoppingListItem
from collections import defaultdict

# Исправление кодировки для Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Загружаем переменные окружения
load_dotenv()

# Конфигурация приложения
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///foodhelper.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = 'uploads'

# ВКЛЮЧАЕМ CORS
CORS(app)

# Инициализация базы данных
db.init_app(app)

# Создаем папку для загрузок
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Настройка Gemini
API_KEY = os.getenv('GEMINI_API_KEY')
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=API_KEY)

# 🔥 ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ДОСТУПНОЙ МОДЕЛИ
def get_available_model():
    try:
        models = genai.list_models()
        print("🔍 Поиск доступных моделей...")
        
        excluded_keywords = ['exp', 'experimental', '2.5', 'beta']
        available_models = []
        
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                model_name_lower = model.name.lower()
                if not any(keyword in model_name_lower for keyword in excluded_keywords):
                    available_models.append(model.name)
                    print(f"✅ Доступна: {model.name}")
        
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

# ==================== API ENDPOINTS ====================

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "FoodHelper API"})

# ==================== USER ENDPOINTS ====================

@app.route('/api/users', methods=['POST'])
def create_user():
    """Создание нового пользователя (онбординг)"""
    try:
        data = request.json
        user = User(
            name=data.get('name', 'Пользователь'),
            goal=data.get('goal'),
            diet_type=data.get('diet_type'),
            cuisines=data.get('cuisines', []),
            weight=data.get('weight'),
            allergies=data.get('allergies', [])
        )
        db.session.add(user)
        db.session.commit()
        return jsonify({"success": True, "data": user.to_dict()}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Получение пользователя"""
    user = User.query.get_or_404(user_id)
    return jsonify({"success": True, "data": user.to_dict()})

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Обновление данных пользователя"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.json
        
        if 'name' in data:
            user.name = data['name']
        if 'goal' in data:
            user.goal = data['goal']
        if 'diet_type' in data:
            user.diet_type = data['diet_type']
        if 'cuisines' in data:
            user.cuisines = data['cuisines']
        if 'weight' in data:
            user.weight = data['weight']
        if 'allergies' in data:
            user.allergies = data['allergies']
        
        db.session.commit()
        return jsonify({"success": True, "data": user.to_dict()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ==================== RECIPE ENDPOINTS ====================

@app.route('/api/recipes', methods=['GET'])
def get_recipes():
    """Получение списка рецептов с фильтрацией"""
    try:
        user_id = request.args.get('user_id', type=int)
        goal = request.args.get('goal')
        diet_type = request.args.get('diet_type')
        cuisine = request.args.get('cuisine')
        cooking_time = request.args.get('cooking_time', type=int)
        difficulty = request.args.get('difficulty')
        season = request.args.get('season')
        budget = request.args.get('budget')
        meal_type = request.args.get('meal_type')
        is_custom = request.args.get('is_custom', type=bool)
        
        query = Recipe.query
        
        if user_id and is_custom:
            query = query.filter_by(user_id=user_id, is_custom=True)
        elif is_custom is False:
            query = query.filter_by(is_custom=False)
        
        if goal:
            # Фильтрация по цели (можно расширить логику)
            pass
        if diet_type:
            # Фильтрация по типу питания
            pass
        if cuisine:
            query = query.filter_by(cuisine=cuisine)
        if cooking_time:
            query = query.filter(Recipe.cooking_time <= cooking_time)
        if difficulty:
            query = query.filter_by(difficulty=difficulty)
        if season:
            query = query.filter_by(season=season)
        if budget:
            query = query.filter_by(budget=budget)
        if meal_type:
            query = query.filter_by(meal_type=meal_type)
        
        recipes = query.all()
        return jsonify({"success": True, "data": [r.to_dict() for r in recipes]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/recipes/<int:recipe_id>', methods=['GET'])
def get_recipe(recipe_id):
    """Получение рецепта по ID"""
    recipe = Recipe.query.get_or_404(recipe_id)
    return jsonify({"success": True, "data": recipe.to_dict()})

@app.route('/api/recipes', methods=['POST'])
def create_recipe():
    """Создание пользовательского рецепта"""
    try:
        data = request.json
        recipe = Recipe(
            name=data['name'],
            description=data.get('description'),
            image_url=data.get('image_url'),
            ingredients=data.get('ingredients', []),
            steps=data.get('steps', []),
            category=data.get('category'),
            meal_type=data.get('meal_type'),
            cuisine=data.get('cuisine'),
            cooking_time=data.get('cooking_time'),
            difficulty=data.get('difficulty'),
            servings=data.get('servings', 1),
            season=data.get('season', 'всесезонное'),
            budget=data.get('budget', 'эконом'),
            calories=data.get('calories'),
            protein=data.get('protein'),
            carbs=data.get('carbs'),
            fat=data.get('fat'),
            is_custom=True,
            user_id=data.get('user_id')
        )
        db.session.add(recipe)
        db.session.commit()
        return jsonify({"success": True, "data": recipe.to_dict()}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/recipes/<int:recipe_id>', methods=['PUT'])
def update_recipe(recipe_id):
    """Обновление рецепта"""
    try:
        recipe = Recipe.query.get_or_404(recipe_id)
        data = request.json
        
        for key, value in data.items():
            if hasattr(recipe, key):
                setattr(recipe, key, value)
        
        db.session.commit()
        return jsonify({"success": True, "data": recipe.to_dict()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/recipes/<int:recipe_id>', methods=['DELETE'])
def delete_recipe(recipe_id):
    """Удаление рецепта"""
    try:
        recipe = Recipe.query.get_or_404(recipe_id)
        db.session.delete(recipe)
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ==================== FAVORITE RECIPES ENDPOINTS ====================

@app.route('/api/users/<int:user_id>/favorites', methods=['GET'])
def get_favorites(user_id):
    """Получение избранных рецептов"""
    try:
        favorites = FavoriteRecipe.query.filter_by(user_id=user_id).all()
        return jsonify({"success": True, "data": [f.to_dict() for f in favorites]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users/<int:user_id>/favorites', methods=['POST'])
def add_favorite(user_id):
    """Добавление рецепта в избранное"""
    try:
        data = request.json
        recipe_id = data['recipe_id']
        
        # Проверяем, не добавлен ли уже
        existing = FavoriteRecipe.query.filter_by(user_id=user_id, recipe_id=recipe_id).first()
        if existing:
            return jsonify({"success": True, "data": existing.to_dict()})
        
        favorite = FavoriteRecipe(user_id=user_id, recipe_id=recipe_id)
        db.session.add(favorite)
        db.session.commit()
        return jsonify({"success": True, "data": favorite.to_dict()}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users/<int:user_id>/favorites/<int:recipe_id>', methods=['DELETE'])
def remove_favorite(user_id, recipe_id):
    """Удаление из избранного"""
    try:
        favorite = FavoriteRecipe.query.filter_by(user_id=user_id, recipe_id=recipe_id).first_or_404()
        db.session.delete(favorite)
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users/<int:user_id>/favorites/available', methods=['GET'])
def get_available_favorites(user_id):
    """Получение избранных рецептов, которые можно приготовить (есть все продукты)"""
    try:
        favorites = FavoriteRecipe.query.filter_by(user_id=user_id).all()
        fridge_items = FridgeItem.query.filter_by(user_id=user_id).all()
        
        # Создаем словарь продуктов в холодильнике (нормализованные названия)
        fridge_dict = {}
        fridge_names = set()
        for item in fridge_items:
            name_lower = item.name.lower().strip()
            # Добавляем полное название
            fridge_names.add(name_lower)
            # Добавляем отдельные слова из названия
            words = name_lower.split()
            for word in words:
                if len(word) > 2:  # Игнорируем короткие слова
                    fridge_names.add(word)
            # Суммируем количество
            if name_lower not in fridge_dict:
                fridge_dict[name_lower] = 0
            fridge_dict[name_lower] += item.amount
        
        available_recipes = []
        for favorite in favorites:
            recipe = favorite.recipe
            if not recipe:
                continue
            
            can_cook = True
            missing_ingredients = []
            
            for ingredient in recipe.ingredients or []:
                ing_name = ingredient.get('name', '').lower().strip()
                if not ing_name:
                    continue
                
                # Проверяем точное совпадение
                found = False
                if ing_name in fridge_names:
                    found = True
                else:
                    # Проверяем частичное совпадение (ингредиент содержит название из холодильника или наоборот)
                    ing_words = set(ing_name.split())
                    for fridge_name in fridge_names:
                        fridge_words = set(fridge_name.split())
                        # Если есть общие значимые слова
                        common_words = ing_words.intersection(fridge_words)
                        if common_words and len(common_words) >= min(len(ing_words), len(fridge_words)) * 0.5:
                            found = True
                            break
                        # Проверяем, содержит ли одно другое
                        if ing_name in fridge_name or fridge_name in ing_name:
                            found = True
                            break
                
                if not found:
                    can_cook = False
                    missing_ingredients.append(ingredient.get('name', ''))
            
            if can_cook:
                available_recipes.append(favorite.to_dict())
        
        return jsonify({"success": True, "data": available_recipes})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ==================== MENU ENDPOINTS ====================

@app.route('/api/users/<int:user_id>/menus', methods=['GET'])
def get_menus(user_id):
    """Получение меню пользователя"""
    try:
        menus = Menu.query.filter_by(user_id=user_id).all()
        return jsonify({"success": True, "data": [m.to_dict() for m in menus]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users/<int:user_id>/menus', methods=['POST'])
def create_menu(user_id):
    """Создание или обновление меню"""
    try:
        data = request.json
        
        # Check if user already has a menu and update it instead of creating new one
        existing_menu = Menu.query.filter_by(user_id=user_id).order_by(Menu.updated_at.desc()).first()
        
        if existing_menu:
            # Update existing menu
            existing_menu.data = data.get('data', {})
            if 'name' in data:
                existing_menu.name = data['name']
            if 'start_date' in data:
                existing_menu.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            if 'end_date' in data:
                existing_menu.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            existing_menu.updated_at = datetime.utcnow()
            
            db.session.commit()
            return jsonify({"success": True, "data": existing_menu.to_dict()}), 200
        else:
            # Create new menu
            menu = Menu(
                user_id=user_id,
                name=data.get('name', 'Мое меню'),
                data=data.get('data', {})
            )
            
            # Set dates if provided
            if 'start_date' in data:
                menu.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            if 'end_date' in data:
                menu.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            
            db.session.add(menu)
            db.session.flush()
            
            # Добавляем элементы меню (если есть в старом формате)
            for item_data in data.get('items', []):
                menu_item = MenuItem(
                    menu_id=menu.id,
                    recipe_id=item_data['recipe_id'],
                    date=datetime.strptime(item_data['date'], '%Y-%m-%d').date(),
                    meal_type=item_data['meal_type'],
                    servings=item_data.get('servings', 1)
                )
                db.session.add(menu_item)
            
            db.session.commit()
            return jsonify({"success": True, "data": menu.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error in create_menu: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/menus/<int:menu_id>', methods=['GET'])
def get_menu(menu_id):
    """Получение меню по ID"""
    menu = Menu.query.get_or_404(menu_id)
    return jsonify({"success": True, "data": menu.to_dict()})

@app.route('/api/menus/<int:menu_id>', methods=['PUT'])
def update_menu(menu_id):
    """Обновление меню"""
    try:
        menu = Menu.query.get_or_404(menu_id)
        data = request.json
        
        if 'name' in data:
            menu.name = data['name']
        if 'start_date' in data:
            menu.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if 'end_date' in data:
            menu.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        
        # Обновляем элементы меню
        if 'items' in data:
            # Удаляем старые элементы
            MenuItem.query.filter_by(menu_id=menu_id).delete()
            
            # Добавляем новые
            for item_data in data['items']:
                menu_item = MenuItem(
                    menu_id=menu_id,
                    recipe_id=item_data['recipe_id'],
                    date=datetime.strptime(item_data['date'], '%Y-%m-%d').date(),
                    meal_type=item_data['meal_type'],
                    servings=item_data.get('servings', 1)
                )
                db.session.add(menu_item)
        
        db.session.commit()
        return jsonify({"success": True, "data": menu.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/menus/<int:menu_id>', methods=['DELETE'])
def delete_menu(menu_id):
    """Удаление меню"""
    try:
        menu = Menu.query.get_or_404(menu_id)
        db.session.delete(menu)
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/menus/generate', methods=['POST'])
def generate_menu():
    """Автоматическая генерация меню"""
    try:
        data = request.json
        user_id = data['user_id']
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        
        user = User.query.get_or_404(user_id)
        
        # Получаем рецепты с учетом предпочтений
        query = Recipe.query.filter_by(is_custom=False)
        
        if user.diet_type:
            # Фильтрация по типу питания (упрощенная)
            pass
        
        if user.cuisines:
            query = query.filter(Recipe.cuisine.in_(user.cuisines))
        
        recipes = query.limit(100).all()
        
        if not recipes:
            return jsonify({"success": False, "error": "Нет подходящих рецептов"}), 400
        
        # Генерируем меню
        menu_items = []
        current_date = start_date
        meal_types = ['завтрак', 'обед', 'ужин']
        
        import random
        while current_date <= end_date:
            for meal_type in meal_types:
                recipe = random.choice(recipes)
                menu_items.append({
                    'recipe_id': recipe.id,
                    'date': current_date.isoformat(),
                    'meal_type': meal_type,
                    'servings': data.get('servings', 1)
                })
            current_date += timedelta(days=1)
        
        menu = Menu(
            user_id=user_id,
            name=data.get('name', 'Автоматически сгенерированное меню'),
            start_date=start_date,
            end_date=end_date
        )
        db.session.add(menu)
        db.session.flush()
        
        for item_data in menu_items:
            menu_item = MenuItem(
                menu_id=menu.id,
                recipe_id=item_data['recipe_id'],
                date=datetime.strptime(item_data['date'], '%Y-%m-%d').date(),
                meal_type=item_data['meal_type'],
                servings=item_data['servings']
            )
            db.session.add(menu_item)
        
        db.session.commit()
        return jsonify({"success": True, "data": menu.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

# ==================== FRIDGE ENDPOINTS ====================

@app.route('/api/users/<int:user_id>/fridge', methods=['GET'])
def get_fridge(user_id):
    """Получение продуктов в холодильнике"""
    try:
        items = FridgeItem.query.filter_by(user_id=user_id).all()
        return jsonify({"success": True, "data": [item.to_dict() for item in items]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users/<int:user_id>/fridge', methods=['POST'])
def add_fridge_item(user_id):
    """Добавление продукта в холодильник"""
    try:
        data = request.json
        if not data.get('name'):
            return jsonify({"success": False, "error": "Название продукта обязательно"}), 400
        
        expiry_date = None
        if data.get('expiry_date'):
            try:
                expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
            except ValueError:
                pass  # Игнорируем неверный формат даты
        
        item = FridgeItem(
            user_id=user_id,
            name=data['name'].strip(),
            amount=float(data.get('amount', 1)),
            unit=data.get('unit', 'шт'),
            category=data.get('category'),
            expiry_date=expiry_date
        )
        db.session.add(item)
        db.session.commit()
        return jsonify({"success": True, "data": item.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users/<int:user_id>/fridge/<int:item_id>', methods=['PUT'])
def update_fridge_item(user_id, item_id):
    """Обновление продукта в холодильнике"""
    try:
        item = FridgeItem.query.filter_by(id=item_id, user_id=user_id).first_or_404()
        data = request.json
        
        if 'name' in data:
            item.name = data['name']
        if 'amount' in data:
            item.amount = data['amount']
        if 'unit' in data:
            item.unit = data['unit']
        if 'category' in data:
            item.category = data['category']
        if 'expiry_date' in data:
            item.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date() if data['expiry_date'] else None
        
        db.session.commit()
        return jsonify({"success": True, "data": item.to_dict()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users/<int:user_id>/fridge/<int:item_id>', methods=['DELETE'])
def delete_fridge_item(user_id, item_id):
    """Удаление продукта из холодильника"""
    try:
        item = FridgeItem.query.filter_by(id=item_id, user_id=user_id).first_or_404()
        db.session.delete(item)
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ==================== SHOPPING LIST ENDPOINTS ====================

@app.route('/api/users/<int:user_id>/shopping-lists', methods=['GET'])
def get_shopping_lists(user_id):
    """Получение списков покупок"""
    try:
        lists = ShoppingList.query.filter_by(user_id=user_id).all()
        return jsonify({"success": True, "data": [l.to_dict() for l in lists]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users/<int:user_id>/shopping-lists/generate', methods=['POST'])
def generate_shopping_list(user_id):
    """Автоматическая генерация списка покупок на основе меню"""
    try:
        data = request.json
        menu_id = data.get('menu_id')
        
        if not menu_id:
            return jsonify({"success": False, "error": "menu_id required"}), 400
        
        menu = Menu.query.get_or_404(menu_id)
        
        # Получаем все ингредиенты из меню
        ingredients_needed = defaultdict(float)
        ingredients_units = {}
        ingredients_categories = {}
        
        for menu_item in menu.menu_items:
            recipe = menu_item.recipe
            if not recipe:
                continue
            
            servings_multiplier = menu_item.servings / recipe.servings
            
            for ingredient in recipe.ingredients or []:
                name = ingredient.get('name', '')
                amount = float(ingredient.get('amount', 1))
                unit = ingredient.get('unit', 'шт')
                category = ingredient.get('category', 'другое')
                
                key = name.lower()
                ingredients_needed[key] += amount * servings_multiplier
                ingredients_units[key] = unit
                ingredients_categories[key] = category
        
        # Получаем продукты из холодильника
        fridge_items = FridgeItem.query.filter_by(user_id=user_id).all()
        fridge_dict = {}
        for item in fridge_items:
            key = item.name.lower()
            if key not in fridge_dict:
                fridge_dict[key] = 0
            fridge_dict[key] += item.amount
        
        # Вычитаем то, что есть в холодильнике
        shopping_items = []
        for name, needed_amount in ingredients_needed.items():
            available = fridge_dict.get(name, 0)
            if needed_amount > available:
                shopping_items.append({
                    'name': name,
                    'amount': needed_amount - available,
                    'unit': ingredients_units.get(name, 'шт'),
                    'category': ingredients_categories.get(name, 'другое')
                })
        
        # Группируем по категориям
        grouped_items = defaultdict(list)
        for item in shopping_items:
            grouped_items[item['category']].append(item)
        
        # Создаем список покупок
        shopping_list = ShoppingList(user_id=user_id, menu_id=menu_id)
        db.session.add(shopping_list)
        db.session.flush()
        
        for item_data in shopping_items:
            list_item = ShoppingListItem(
                shopping_list_id=shopping_list.id,
                name=item_data['name'],
                amount=item_data['amount'],
                unit=item_data['unit'],
                category=item_data['category']
            )
            db.session.add(list_item)
        
        db.session.commit()
        return jsonify({"success": True, "data": shopping_list.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/shopping-lists/<int:list_id>', methods=['GET'])
def get_shopping_list(list_id):
    """Получение списка покупок по ID"""
    shopping_list = ShoppingList.query.get_or_404(list_id)
    return jsonify({"success": True, "data": shopping_list.to_dict()})

@app.route('/api/shopping-lists/<int:list_id>/items/<int:item_id>', methods=['PUT'])
def update_shopping_list_item(list_id, item_id):
    """Обновление элемента списка покупок"""
    try:
        item = ShoppingListItem.query.filter_by(id=item_id, shopping_list_id=list_id).first_or_404()
        data = request.json
        
        if 'is_purchased' in data:
            item.is_purchased = data['is_purchased']
        if 'amount' in data:
            item.amount = data['amount']
        if 'name' in data:
            item.name = data['name']
        
        db.session.commit()
        return jsonify({"success": True, "data": item.to_dict()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ==================== AI SCANNING ENDPOINT ====================

@app.route('/api/analyze', methods=['POST'])
def analyze_food():
    """Анализ фото продуктов для добавления в холодильник"""
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
    """Анализ изображения продуктов через Gemini"""
    max_retries = 3
    retry_delay = 1
    
    response_text = None
    for attempt in range(max_retries):
        try:
            img = PIL.Image.open(io.BytesIO(image_data))
            print("✅ Изображение загружено для анализа")

            prompt = """
            Analyze this food image and return ONLY valid JSON with products that can be added to fridge:

            {
              "products": [
                {
                  "name": "product name in Russian", 
                  "amount": number,
                  "unit": "шт/kg/л/etc",
                  "category": "fruits/vegetables/dairy/meat/drinks/grains/other",
                  "expiry_date": "YYYY-MM-DD or null"
                }
              ]
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
            
            if "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower():
                if attempt < max_retries - 1:
                    retry_after = retry_delay * (2 ** attempt)
                    
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
                        "error": "Превышен лимит запросов к API. Пожалуйста, подождите несколько минут и попробуйте снова."
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

# ==================== RECIPE RECOMMENDATIONS ====================

@app.route('/api/users/<int:user_id>/recipes/recommendations', methods=['GET'])
def get_recipe_recommendations(user_id):
    """Получение рекомендаций рецептов на основе предпочтений"""
    try:
        user = User.query.get_or_404(user_id)
        
        query = Recipe.query.filter_by(is_custom=False)
        
        # Фильтрация по предпочтениям (только если указаны)
        cuisines = request.args.get('cuisine')
        if cuisines:
            query = query.filter_by(cuisine=cuisines)
        elif user.cuisines and len(user.cuisines) > 0:
            # Если в запросе нет фильтра по кухне, но у пользователя есть предпочтения - не фильтруем
            # Показываем все рецепты по умолчанию
            pass
        
        # Дополнительные фильтры из query params
        if request.args.get('cooking_time'):
            query = query.filter(Recipe.cooking_time <= int(request.args.get('cooking_time')))
        if request.args.get('difficulty'):
            query = query.filter_by(difficulty=request.args.get('difficulty'))
        if request.args.get('season'):
            query = query.filter_by(season=request.args.get('season'))
        if request.args.get('budget'):
            query = query.filter_by(budget=request.args.get('budget'))
        if request.args.get('meal_type'):
            query = query.filter_by(meal_type=request.args.get('meal_type'))
        
        recipes = query.limit(100).all()
        return jsonify({"success": True, "data": [r.to_dict() for r in recipes]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/users/<int:user_id>/recipes/available', methods=['GET'])
def get_available_recipes(user_id):
    """Получение рецептов, которые можно приготовить из имеющихся продуктов"""
    try:
        fridge_items = FridgeItem.query.filter_by(user_id=user_id).all()
        fridge_dict = {}
        for item in fridge_items:
            name_lower = item.name.lower()
            if name_lower not in fridge_dict:
                fridge_dict[name_lower] = 0
            fridge_dict[name_lower] += item.amount
        
        all_recipes = Recipe.query.filter_by(is_custom=False).all()
        available_recipes = []
        
        for recipe in all_recipes:
            can_cook = True
            for ingredient in recipe.ingredients or []:
                ing_name = ingredient.get('name', '').lower()
                if ing_name not in fridge_dict:
                    can_cook = False
                    break
            
            if can_cook:
                available_recipes.append(recipe.to_dict())
        
        return jsonify({"success": True, "data": available_recipes})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Инициализация базы данных
with app.app_context():
    db.create_all()
    print("✅ База данных инициализирована")

if __name__ == '__main__':
    print("🚀 Сервер запущен: http://127.0.0.1:5000")
    print("📊 API доступен по адресу: http://127.0.0.1:5000/api")
    app.run(host='127.0.0.1', port=5000, debug=True)

