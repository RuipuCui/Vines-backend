```
curl -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDg8DiKi46LJXkT6wDXT6pGtRgtFHk_tkU" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "StrongPassword123",
    "returnSecureToken": true
  }'
```

```
curl -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDg8DiKi46LJXkT6wDXT6pGtRgtFHk_tkU" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "StrongPassword123",
    "returnSecureToken": true
  }'

```
