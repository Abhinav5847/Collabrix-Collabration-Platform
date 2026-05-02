from fastapi import Request, HTTPException, status

async def get_current_user(request: Request):
   
    user_id = request.cookies.get("user_id") 
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    class User:
        def __init__(self, id):
            self.id = id
            
    return User(id=user_id)