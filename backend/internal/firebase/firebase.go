package firebase

import (
	"context"
	"errors"
	"fmt"
	"os"
	"sync"

	firebase "firebase.google.com/go/v4"
	firebaseauth "firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

type Verifier struct {
	client *firebaseauth.Client
}

type GoogleIdentity struct {
	UID     string
	Email   string
	Name    string
	Picture string
}

var (
	once     sync.Once
	instance *Verifier
	initErr  error
)

// New initializes the Firebase Admin SDK using FIREBASE_CREDENTIALS_FILE
// (path to a service account JSON). It is safe to call multiple times.
func New(ctx context.Context) (*Verifier, error) {
	once.Do(func() {
		path := os.Getenv("FIREBASE_CREDENTIALS_FILE")
		if path == "" {
			initErr = errors.New("FIREBASE_CREDENTIALS_FILE is not set")
			return
		}
		app, err := firebase.NewApp(ctx, nil, option.WithCredentialsFile(path))
		if err != nil {
			initErr = fmt.Errorf("firebase init: %w", err)
			return
		}
		client, err := app.Auth(ctx)
		if err != nil {
			initErr = fmt.Errorf("firebase auth client: %w", err)
			return
		}
		instance = &Verifier{client: client}
	})
	return instance, initErr
}

// Verify validates a Firebase ID token and returns the underlying Google
// identity carried in its claims.
func (v *Verifier) Verify(ctx context.Context, idToken string) (*GoogleIdentity, error) {
	tok, err := v.client.VerifyIDToken(ctx, idToken)
	if err != nil {
		return nil, err
	}

	id := &GoogleIdentity{UID: tok.UID}
	if email, ok := tok.Claims["email"].(string); ok {
		id.Email = email
	}
	if name, ok := tok.Claims["name"].(string); ok {
		id.Name = name
	}
	if pic, ok := tok.Claims["picture"].(string); ok {
		id.Picture = pic
	}
	return id, nil
}
