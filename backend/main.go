package main

import (
	"context"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/hierolabs/gongsaeng/backend/internal/auth"
	"github.com/hierolabs/gongsaeng/backend/internal/cloudinary"
	"github.com/hierolabs/gongsaeng/backend/internal/db"
	"github.com/hierolabs/gongsaeng/backend/internal/firebase"
	"github.com/hierolabs/gongsaeng/backend/internal/handler"
)

func main() {
	_ = godotenv.Load()

	gormDB, err := db.Open()
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	if err := db.Migrate(gormDB); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	if err := db.SeedAdmin(gormDB); err != nil {
		log.Fatalf("seed admin: %v", err)
	}

	verifier, err := firebase.New(context.Background())
	if err != nil {
		log.Fatalf("firebase: %v", err)
	}

	cldClient, err := cloudinary.New()
	if err != nil {
		log.Fatalf("cloudinary: %v", err)
	}

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5180", "http://localhost:5181", "https://gongsaeng.vercel.app"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Public routes (consumed by frontend)
	r.GET("/health", handler.Health(gormDB))
	r.GET("/users", handler.ListUsers(gormDB))
	r.GET("/properties", handler.ListProperties(gormDB))
	r.GET("/properties/:id", handler.GetProperty(gormDB))
	r.GET("/properties/:id/booked-dates", handler.PropertyBookedDates(gormDB))
	r.GET("/properties/:id/reviews", handler.ListPropertyReviews(gormDB))

	// User auth (consumed by frontend)
	r.POST("/auth/google", handler.GoogleLogin(gormDB, verifier))

	user := r.Group("")
	user.Use(auth.RequireUser())
	{
		user.GET("/auth/me", handler.UserMe(gormDB))
		user.PATCH("/auth/me", handler.UpdateMe(gormDB))
		user.POST("/auth/become-host", handler.BecomeHost(gormDB))

		user.POST("/bookings", handler.CreateBooking(gormDB))
		user.GET("/bookings/my", handler.MyBookings(gormDB))
		user.GET("/bookings/:id", handler.GetBooking(gormDB))
		user.PATCH("/bookings/:id/cancel", handler.CancelBooking(gormDB))

		user.POST("/reviews", handler.CreateReview(gormDB))

		user.GET("/messages/conversations", handler.ListConversations(gormDB))
		user.GET("/messages/with/:userId", handler.GetConversation(gormDB))
		user.POST("/messages", handler.SendMessage(gormDB))
		user.PATCH("/messages/:id/read", handler.MarkMessageRead(gormDB))

		user.POST("/upload/image", handler.UploadImage(cldClient))
		user.POST("/upload/images", handler.UploadImages(cldClient))
		user.DELETE("/upload/image", handler.DestroyImage(cldClient))
	}

	host := r.Group("")
	host.Use(auth.RequireUser(), auth.RequireHost())
	{
		host.GET("/host/properties", handler.MyProperties(gormDB))
		host.POST("/properties", handler.CreateProperty(gormDB))
		host.PATCH("/properties/:id", handler.UpdateProperty(gormDB))
		host.DELETE("/properties/:id", handler.DeleteProperty(gormDB))

		host.GET("/host/bookings", handler.HostBookings(gormDB))
		host.PATCH("/bookings/:id/approve", handler.ApproveBooking(gormDB))
	}

	// Admin routes (consumed by admin app)
	adminGroup := r.Group("/admin")
	{
		// public admin endpoints (no token required)
		adminGroup.GET("/health", handler.AdminHealth(gormDB))
		adminGroup.POST("/auth/login", handler.AdminLogin(gormDB))

		// protected admin endpoints (any authenticated admin)
		protected := adminGroup.Group("")
		protected.Use(auth.RequireAdmin())
		{
			protected.GET("/auth/me", handler.AdminMe())
			protected.GET("/users", handler.ListUsers(gormDB))
			protected.GET("/admins", handler.ListAdmins(gormDB))
		}

		// super-admin-only endpoints
		superAdmin := adminGroup.Group("")
		superAdmin.Use(auth.RequireAdmin(), auth.RequireSuperAdmin())
		{
			superAdmin.POST("/admins", handler.CreateAdmin(gormDB))
			superAdmin.PATCH("/admins/:id", handler.UpdateAdmin(gormDB))
			superAdmin.DELETE("/admins/:id", handler.DeleteAdmin(gormDB))
			superAdmin.POST("/admins/:id/reset-password", handler.ResetAdminPassword(gormDB))
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := ":" + port
	log.Printf("gongsaeng backend listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}
