package auth

import (
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	contextAdminIDKey           = "adminID"
	contextAdminUsernameKey     = "adminUsername"
	contextAdminIsSuperAdminKey = "adminIsSuperAdmin"

	contextUserIDKey    = "userID"
	contextUserEmailKey = "userEmail"
	contextUserRoleKey  = "userRole"

	tokenTTL = 24 * time.Hour
)

func secret() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "dev-only-insecure-secret-change-me"
	}
	return []byte(s)
}

func HashPassword(plain string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func CheckPassword(hash, plain string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}

// ---------- admin tokens ----------

type AdminClaims struct {
	AdminID      uint   `json:"aid"`
	Username     string `json:"sub"`
	IsSuperAdmin bool   `json:"super"`
	jwt.RegisteredClaims
}

func IssueAdminToken(adminID uint, username string, isSuperAdmin bool) (string, error) {
	claims := AdminClaims{
		AdminID:      adminID,
		Username:     username,
		IsSuperAdmin: isSuperAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(secret())
}

func parseAdminToken(tokenStr string) (*AdminClaims, error) {
	tok, err := jwt.ParseWithClaims(tokenStr, &AdminClaims{}, keyFunc)
	if err != nil {
		return nil, err
	}
	claims, ok := tok.Claims.(*AdminClaims)
	if !ok || !tok.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

// RequireAdmin rejects requests without a valid admin JWT.
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr, ok := bearer(c)
		if !ok {
			return
		}
		claims, err := parseAdminToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		c.Set(contextAdminIDKey, claims.AdminID)
		c.Set(contextAdminUsernameKey, claims.Username)
		c.Set(contextAdminIsSuperAdminKey, claims.IsSuperAdmin)
		c.Next()
	}
}

// RequireSuperAdmin rejects requests from non-super-admin accounts.
// Must be used after RequireAdmin.
func RequireSuperAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !AdminIsSuperAdmin(c) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "super admin required"})
			return
		}
		c.Next()
	}
}

func AdminUsername(c *gin.Context) string {
	v, _ := c.Get(contextAdminUsernameKey)
	s, _ := v.(string)
	return s
}

func AdminIsSuperAdmin(c *gin.Context) bool {
	v, _ := c.Get(contextAdminIsSuperAdminKey)
	b, _ := v.(bool)
	return b
}

func AdminID(c *gin.Context) uint {
	v, _ := c.Get(contextAdminIDKey)
	id, _ := v.(uint)
	return id
}

// ---------- user tokens ----------

type UserClaims struct {
	UserID uint   `json:"uid"`
	Email  string `json:"sub"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func IssueUserToken(userID uint, email, role string) (string, error) {
	claims := UserClaims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(secret())
}

func parseUserToken(tokenStr string) (*UserClaims, error) {
	tok, err := jwt.ParseWithClaims(tokenStr, &UserClaims{}, keyFunc)
	if err != nil {
		return nil, err
	}
	claims, ok := tok.Claims.(*UserClaims)
	if !ok || !tok.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

// RequireUser rejects requests without a valid user JWT.
func RequireUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr, ok := bearer(c)
		if !ok {
			return
		}
		claims, err := parseUserToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		c.Set(contextUserIDKey, claims.UserID)
		c.Set(contextUserEmailKey, claims.Email)
		c.Set(contextUserRoleKey, claims.Role)
		c.Next()
	}
}

// RequireHost rejects requests from non-host users. Must be used after RequireUser.
func RequireHost() gin.HandlerFunc {
	return func(c *gin.Context) {
		if UserRole(c) != "host" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "host required"})
			return
		}
		c.Next()
	}
}

func UserID(c *gin.Context) uint {
	v, _ := c.Get(contextUserIDKey)
	id, _ := v.(uint)
	return id
}

func UserEmail(c *gin.Context) string {
	v, _ := c.Get(contextUserEmailKey)
	s, _ := v.(string)
	return s
}

func UserRole(c *gin.Context) string {
	v, _ := c.Get(contextUserRoleKey)
	s, _ := v.(string)
	return s
}

// ---------- shared ----------

func keyFunc(t *jwt.Token) (any, error) {
	if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
		return nil, errors.New("unexpected signing method")
	}
	return secret(), nil
}

func bearer(c *gin.Context) (string, bool) {
	header := c.GetHeader("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
		return "", false
	}
	return strings.TrimPrefix(header, "Bearer "), true
}
