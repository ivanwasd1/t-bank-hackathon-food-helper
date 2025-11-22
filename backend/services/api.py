from fastapi import APIRouter

router = APIRouter()

@router.get("/test")
async def test_endpoint():
    return {"message": "API endpoint is working!"}

# Для импорта в main.py
app = router