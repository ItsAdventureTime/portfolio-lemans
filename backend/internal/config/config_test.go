package config

import "testing"

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
	cfg := Load()
	if cfg.B2BucketName != "bridge-ph" || cfg.B2KeyPrefix != "lemans/demo" {
		t.Fatalf("B2 defaults = bucket %q, prefix %q", cfg.B2BucketName, cfg.B2KeyPrefix)
	}
}
