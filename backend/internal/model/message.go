package model

import "gorm.io/gorm"

type Message struct {
	gorm.Model

	ConversationID string `gorm:"size:64;not null;index" json:"conversation_id"`

	SenderID uint `gorm:"index;not null" json:"sender_id"`
	Sender   User `gorm:"foreignKey:SenderID" json:"sender"`

	ReceiverID uint `gorm:"index;not null" json:"receiver_id"`
	Receiver   User `gorm:"foreignKey:ReceiverID" json:"receiver"`

	Content string `gorm:"type:text;not null" json:"content"`
	IsRead  bool   `gorm:"not null;default:false" json:"is_read"`
}
