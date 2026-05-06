package handler

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/hierolabs/gongsaeng/backend/internal/auth"
	"github.com/hierolabs/gongsaeng/backend/internal/model"
)

func conversationID(a, b uint) string {
	if a > b {
		a, b = b, a
	}
	return fmt.Sprintf("%d-%d", a, b)
}

type sendMessageRequest struct {
	ReceiverID uint   `json:"receiver_id" binding:"required"`
	Content    string `json:"content" binding:"required"`
}

func SendMessage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req sendMessageRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		senderID := auth.UserID(c)
		if req.ReceiverID == senderID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cannot message yourself"})
			return
		}

		var receiver model.User
		if err := db.First(&receiver, req.ReceiverID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "receiver not found"})
			return
		}

		msg := model.Message{
			ConversationID: conversationID(senderID, req.ReceiverID),
			SenderID:       senderID,
			ReceiverID:     req.ReceiverID,
			Content:        req.Content,
		}
		if err := db.Create(&msg).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		db.Preload("Sender").Preload("Receiver").First(&msg, msg.ID)
		c.JSON(http.StatusCreated, msg)
	}
}

type conversationSummary struct {
	ConversationID string       `json:"conversation_id"`
	Peer           userResponse `json:"peer"`
	LastMessage    string       `json:"last_message"`
	LastAt         string       `json:"last_at"`
	UnreadCount    int          `json:"unread_count"`
}

// ListConversations groups messages by conversation_id, returns the latest
// message and unread count per conversation involving the current user.
func ListConversations(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid := auth.UserID(c)

		var messages []model.Message
		if err := db.Preload("Sender").Preload("Receiver").
			Where("sender_id = ? OR receiver_id = ?", uid, uid).
			Order("created_at DESC").Find(&messages).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		seen := map[string]*conversationSummary{}
		order := []string{}
		for _, m := range messages {
			s, ok := seen[m.ConversationID]
			if !ok {
				peer := m.Sender
				if m.SenderID == uid {
					peer = m.Receiver
				}
				s = &conversationSummary{
					ConversationID: m.ConversationID,
					Peer:           toUserResponse(peer),
					LastMessage:    m.Content,
					LastAt:         m.CreatedAt.Format("2006-01-02T15:04:05Z"),
				}
				seen[m.ConversationID] = s
				order = append(order, m.ConversationID)
			}
			if m.ReceiverID == uid && !m.IsRead {
				s.UnreadCount++
			}
		}

		out := make([]conversationSummary, 0, len(order))
		for _, id := range order {
			out = append(out, *seen[id])
		}
		c.JSON(http.StatusOK, out)
	}
}

func GetConversation(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		peerID, err := strconv.ParseUint(c.Param("userId"), 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid userId"})
			return
		}
		uid := auth.UserID(c)
		convID := conversationID(uid, uint(peerID))

		var messages []model.Message
		if err := db.Preload("Sender").Preload("Receiver").
			Where("conversation_id = ?", convID).
			Order("created_at ASC").Find(&messages).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Mark unread messages addressed to me as read.
		db.Model(&model.Message{}).
			Where("conversation_id = ? AND receiver_id = ? AND is_read = ?", convID, uid, false).
			Update("is_read", true)

		c.JSON(http.StatusOK, messages)
	}
}

func MarkMessageRead(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		if err := db.Model(&model.Message{}).
			Where("id = ? AND receiver_id = ?", uint(id), auth.UserID(c)).
			Update("is_read", true).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}
