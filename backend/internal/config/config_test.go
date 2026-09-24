package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDefaultB2KeyPrefixByProfile(t *testing.T) {
	t.Setenv("DEMO_MODE", "true")
	if got := defaultB2KeyPrefix(); got != "lemans/demo" {
		t.Fatalf("demo B2 prefix = %q, want lemans/demo", got)
	}
	t.Setenv("DEMO_MODE", "false")
	if got := defaultB2KeyPrefix(); got != "lemans" {
		t.Fatalf("production B2 prefix = %q, want lemans", got)
	}
}

func TestLoadB2Defaults(t *testing.T) {
	t.Setenv("B2_BUCKET_NAME", "")
	t.Setenv("B2_KEY_PREFIX", "")
	t.Setenv("DEMO_MODE", "true")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.B2BucketName != "bridge-ph" || cfg.B2KeyPrefix != "lemans/demo" {
		t.Fatalf("B2 defaults = bucket %q, prefix %q", cfg.B2BucketName, cfg.B2KeyPrefix)
	}
}

func TestLoadReadsFileSecrets(t *testing.T) {
	path := filepath.Join(t.TempDir(), "secret")
	if err := os.WriteFile(path, []byte("file-secret\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("B2_SECRET_ACCESS_KEY_FILE", path)
	t.Setenv("B2_SECRET_ACCESS_KEY", "environment-secret")

	if got, err := getEnv("B2_SECRET_ACCESS_KEY", "fallback"); err != nil || got != "file-secret" {
		t.Fatalf("file secret = %q, err = %v; want file-secret", got, err)
	}
}

func TestLoadFailsClosedForUnreadableFileSecret(t *testing.T) {
	t.Setenv("B2_SECRET_ACCESS_KEY_FILE", filepath.Join(t.TempDir(), "missing"))
	t.Setenv("B2_SECRET_ACCESS_KEY", "environment-secret")
	if _, err := Load(); err == nil {
		t.Fatal("Load succeeded with an unreadable *_FILE secret")
	}
	emptyPath := filepath.Join(t.TempDir(), "empty")
	if err := os.WriteFile(emptyPath, nil, 0o600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("B2_SECRET_ACCESS_KEY_FILE", emptyPath)
	if _, err := Load(); err == nil {
		t.Fatal("Load succeeded with an empty *_FILE secret")
	}
}
