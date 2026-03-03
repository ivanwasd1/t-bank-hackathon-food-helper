from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Модели базы данных

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    goal = db.Column(db.String(50))  # похудение / набор массы / поддержание формы
    diet_type = db.Column(db.String(50))  # обычное / вегетарианское / веганское
    cuisines = db.Column(db.JSON)  # список предпочитаемых кухонь
    weight = db.Column(db.Float)
    allergies = db.Column(db.JSON)  # список аллергий
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Связи
    recipes = db.relationship('Recipe', backref='user', lazy=True)
    menus = db.relationship('Menu', backref='user', lazy=True)
    fridge_items = db.relationship('FridgeItem', backref='user', lazy=True)
    favorite_recipes = db.relationship('FavoriteRecipe', backref='user', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'goal': self.goal,
            'diet_type': self.diet_type,
            'cuisines': self.cuisines or [],
            'weight': self.weight,
            'allergies': self.allergies or []
        }


class Recipe(db.Model):
    __tablename__ = 'recipes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(500))
    ingredients = db.Column(db.JSON, nullable=False)  # [{"name": "яйцо", "amount": "2 шт", "unit": "шт"}]
    steps = db.Column(db.JSON, nullable=False)  # ["шаг 1", "шаг 2"]
    category = db.Column(db.String(50))  # завтрак / обед / ужин
    meal_type = db.Column(db.String(50))  # завтрак / обед / ужин / перекус
    cuisine = db.Column(db.String(100))  # русская, итальянская и т.д.
    cooking_time = db.Column(db.Integer)  # в минутах
    difficulty = db.Column(db.String(20))  # легкий / средний / сложный
    servings = db.Column(db.Integer, default=1)
    season = db.Column(db.String(20))  # лето / зима / всесезонное
    budget = db.Column(db.String(20))  # эконом / премиум
    calories = db.Column(db.Float)
    protein = db.Column(db.Float)
    carbs = db.Column(db.Float)
    fat = db.Column(db.Float)
    is_custom = db.Column(db.Boolean, default=False)  # пользовательский рецепт
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'image_url': self.image_url,
            'ingredients': self.ingredients or [],
            'steps': self.steps or [],
            'category': self.category,
            'meal_type': self.meal_type,
            'cuisine': self.cuisine,
            'cooking_time': self.cooking_time,
            'difficulty': self.difficulty,
            'servings': self.servings,
            'season': self.season,
            'budget': self.budget,
            'calories': self.calories,
            'protein': self.protein,
            'carbs': self.carbs,
            'fat': self.fat,
            'is_custom': self.is_custom,
            'user_id': self.user_id
        }


class FavoriteRecipe(db.Model):
    __tablename__ = 'favorite_recipes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    recipe = db.relationship('Recipe', backref='favorites', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'recipe_id': self.recipe_id,
            'recipe': self.recipe.to_dict() if self.recipe else None
        }


class Menu(db.Model):
    __tablename__ = 'menus'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200))
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    data = db.Column(db.JSON)  # Flexible menu data structure
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    menu_items = db.relationship('MenuItem', backref='menu', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'data': self.data or {},
            'items': [item.to_dict() for item in self.menu_items],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class MenuItem(db.Model):
    __tablename__ = 'menu_items'
    
    id = db.Column(db.Integer, primary_key=True)
    menu_id = db.Column(db.Integer, db.ForeignKey('menus.id'), nullable=False)
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    meal_type = db.Column(db.String(50), nullable=False)  # завтрак / обед / ужин
    servings = db.Column(db.Integer, default=1)
    
    recipe = db.relationship('Recipe', backref='menu_items', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'menu_id': self.menu_id,
            'recipe_id': self.recipe_id,
            'recipe': self.recipe.to_dict() if self.recipe else None,
            'date': self.date.isoformat() if self.date else None,
            'meal_type': self.meal_type,
            'servings': self.servings
        }


class FridgeItem(db.Model):
    __tablename__ = 'fridge_items'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), default='шт')
    category = db.Column(db.String(100))  # овощи, молочка, мясо и т.д.
    expiry_date = db.Column(db.Date)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'amount': self.amount,
            'unit': self.unit,
            'category': self.category,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'added_at': self.added_at.isoformat() if self.added_at else None
        }


class ShoppingList(db.Model):
    __tablename__ = 'shopping_lists'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    menu_id = db.Column(db.Integer, db.ForeignKey('menus.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Связи
    items = db.relationship('ShoppingListItem', backref='shopping_list', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'menu_id': self.menu_id,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ShoppingListItem(db.Model):
    __tablename__ = 'shopping_list_items'
    
    id = db.Column(db.Integer, primary_key=True)
    shopping_list_id = db.Column(db.Integer, db.ForeignKey('shopping_lists.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), default='шт')
    category = db.Column(db.String(100))
    is_purchased = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'shopping_list_id': self.shopping_list_id,
            'name': self.name,
            'amount': self.amount,
            'unit': self.unit,
            'category': self.category,
            'is_purchased': self.is_purchased
        }

