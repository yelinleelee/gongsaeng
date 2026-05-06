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

// New initializes the Firebase Admin SDK.
// It prefers FIREBASE_CREDENTIALS_JSON (raw service-account JSON, suited for
// Railway / Heroku env vars) and falls back to FIREBASE_CREDENTIALS_FILE
// (a local file path). It is safe to call multiple times.
func New(ctx context.Context) (*Verifier, error) {
	once.Do(func() {
		var opt option.ClientOption

		if raw := os.Getenv("FIREBASE_CREDENTIALS_JSON"); raw != "" {
			opt = option.WithCredentialsJSON([]byte(raw))
		} else if path := os.Getenv("FIREBASE_CREDENTIALS_FILE"); path != "" {
			opt = option.WithCredentialsFile(path)
		} else {
			initErr = errors.New("set FIREBASE_CREDENTIALS_JSON or FIREBASE_CREDENTIALS_FILE")
			return
		}

		app, err := firebase.NewApp(ctx, nil, opt)
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
