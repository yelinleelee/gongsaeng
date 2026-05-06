package db

import (
	"errors"
	"fmt"
	"log"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/hierolabs/gongsaeng/backend/internal/auth"
	"github.com/hierolabs/gongsaeng/backend/internal/model"
)

func Open() (*gorm.DB, error) {
	dsn := os.Getenv("DATABASE_DSN")
	if dsn == "" {
		return nil, fmt.Errorf("DATABASE_DSN is not set")
	}
	return gorm.Open(mysql.Open(dsn), &gorm.Config{})
}

// Models lists every GORM model that should be auto-migrated on startup.
// Add new models here — `Migrate` will pick them up automatically.
var Models = []any{
	&model.User{},
	&model.AdminUser{},
	&model.Property{},
	&model.Booking{},
	&model.Review{},
	&model.Message{},
}

func Migrate(db *gorm.DB) error {
	if err := db.AutoMigrate(Models...); err != nil {
		return err
	}
	log.Printf("auto-migrated %d models", len(Models))
	return nil
}

// SeedAdmin inserts the initial admin/admin account when no admin users exist.
func SeedAdmin(db *gorm.DB) error {
	var count int64
	if err := db.Model(&model.AdminUser{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	hash, err := auth.HashPassword("admin")
	if err != nil {
		return err
	}
	admin := model.AdminUser{Username: "admin", PasswordHash: hash, IsSuperAdmin: true}
	if err := db.Create(&admin).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil
		}
		return err
	}
	log.Println("seeded initial admin user (admin / admin)")
	return nil
}
